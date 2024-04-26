import { createRouter } from "./context";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { makeQuestion } from "../lyrics/questionMaker";
import { GameStatus } from "./lobby";
import _ from "lodash";

export const gameRouter = createRouter()
  .mutation("newRound", {
    input: z.object({ lobbyCode: z.string() }),
    async resolve({ ctx, input }) {
      // make sure input comes from the host?
      // make sure rounds < 13?

      const lobby = await ctx.prisma.lobby.findFirst({
        where: {
          lobbyCode: input.lobbyCode,
        },
        include: {
          players: true,
          rounds: {
            include: {
              answers: {
                select: {
                  id: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      });

      if (lobby == null) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const round = lobby.rounds[0];
      if (round) {
        const elapsedSeconds = (Date.now() - round.createdAt.getTime()) / 1000;
        const everyoneAnswered = round.answers.length === lobby.players.length;
        if (!everyoneAnswered && elapsedSeconds < lobby.roundLength) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Too soon",
          });
        }
      }

      const player = lobby.players.find((player) => player.token == ctx.token);
      if (!player) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      if (lobby.status === GameStatus.Ended) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game has ended already",
        });
      }

      if (lobby.totalRounds === lobby.maxRounds) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game has ended already",
        });
      }

      const [question, selected, answerIndex] = makeQuestion(lobby.lobbyType);
      const choices = selected.map((choice) => {
        return {
          choice: choice,
        };
      });

      const answer = selected[answerIndex] ?? "";
      const regEx = new RegExp(answer, "igu");
      const roundData = {
        question: question.replace(regEx, answer.replace(/[A-z]/g, "_")),
        answer: answerIndex,
        choices: {
          create: choices,
        },
      };

      const newRound = await ctx.prisma.lobby.update({
        where: {
          lobbyCode: input.lobbyCode,
        },
        data: {
          totalRounds: lobby.totalRounds + 1,
          status: GameStatus.InGame,
          rounds: {
            create: [roundData],
          },
        },
      });
      await ctx.events.newRound(input.lobbyCode);
      return newRound;
    },
  })
  .mutation("sendAnswer", {
    input: z.object({ lobbyCode: z.string(), answer: z.number() }),
    async resolve({ ctx, input }) {
      const now = Date.now();
      const lobby = await ctx.prisma.lobby.findFirst({
        where: {
          lobbyCode: input.lobbyCode,
        },
        include: {
          players: true,
          rounds: {
            include: {
              answers: {
                select: {
                  id: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      }); // does this work? Improve later by only selecting player we need

      if (lobby == null) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const player = lobby.players.find((player) => player.token == ctx.token);
      if (!player) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const round = lobby.rounds[0];
      if (!round) {
        throw new TRPCError({
          code: "BAD_REQUEST",
        });
      }

      const elapsedSeconds = (now - round.createdAt.getTime()) / 1000;
      if (elapsedSeconds > lobby.roundLength) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Out of time",
        });
      }

      const correct = input.answer === round.answer;
      let score = 0;
      if (correct) {
        score = Math.ceil(lobby.roundLength - elapsedSeconds);
      }

      await ctx.prisma.answer.create({
        data: {
          answer: input.answer,
          roundId: round.id,
          playerId: player.id,
          score: score,
        },
      });

      await ctx.events.playerAnswered(input.lobbyCode);

      return {
        correct: correct,
      };
    },
  })
  .query("get-round-by-code", {
    input: z.object({ lobbyCode: z.string() }),
    async resolve({ ctx, input }) {
      const lobby = await ctx.prisma.lobby.findFirst({
        where: {
          lobbyCode: input.lobbyCode,
        },
        include: {
          rounds: {
            select: {
              createdAt: true,
              question: true,
              choices: true,
              answer: true,
              answers: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
          players: {
            select: {
              id: true,
              name: true,
              answers: true,
              token: true,
              presence: true,
            },
          },
        },
      });

      if (lobby == null) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const round = lobby.rounds[0];
      if (!round) {
        throw new TRPCError({
          code: "BAD_REQUEST",
        });
      }

      const secondsLeft =
        lobby.roundLength - (Date.now() - round.createdAt.getTime()) / 1000;
      const everyoneAnswered = round.answers.length === lobby.players.length;

      const roundOver = secondsLeft <= 0 || everyoneAnswered;
      const players = lobby.players
        .map((player) => {
          return {
            id: player.id,
            name: player.name,
            isMe: player.token === ctx.token,
            presence: player.presence,
            score: _.sum(player.answers.map((answer) => answer.score)) || 0,
          };
        })
        .sort((a, b) => (a.score > b.score ? -1 : 1));

      const me = players.find((p) => p.isMe);
      const myAnswer = me
        ? round.answers.find((a) => a.playerId === me.id)
        : undefined;

      const correct = myAnswer?.answer === round.answer;
      if (!roundOver) {
        round.answer = -1;
      }

      return {
        totalRounds: lobby.totalRounds,
        maxRounds: lobby.maxRounds,
        currentRound: round,
        players: players,
        secondsLeft: secondsLeft,
        joined: me !== undefined,
        me: me,
        selected: myAnswer?.answer ?? -1,
        correct: correct,
        roundOver: roundOver,
      };
    },
  })
  .mutation("endTheGame", {
    input: z.object({ lobbyCode: z.string() }),
    async resolve({ ctx, input }) {
      const lobby = await ctx.prisma.lobby.findFirst({
        where: {
          lobbyCode: input.lobbyCode,
        },
        include: {
          players: true,
        },
      });

      if (lobby == null) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const player = lobby.players.find((player) => player.token == ctx.token);
      if (!player) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      if (lobby.status !== GameStatus.InGame) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game Not In Progress",
        });
      }

      const updatedLobby = await ctx.prisma.lobby.update({
        where: {
          lobbyCode: input.lobbyCode,
        },
        data: {
          status: GameStatus.Ended,
        },
      });

      await ctx.events.endGame(input.lobbyCode);

      return updatedLobby;
    },
  });
