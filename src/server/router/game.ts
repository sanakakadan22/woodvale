import { createRouter } from "./context";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { makeFlagQuestion, makeQuestion } from "../lyrics/questionMaker";
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
          players: true, // include all players
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

      if (lobby.status === GameStatus.Ended) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game has ended already",
        });
      }

      const [question, selected, answerIndex] = makeQuestion();

      const choices = selected.map((choice) => {
        return {
          choice: choice,
        };
      });

      const round = {
        question: question,
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
          status: GameStatus.InGame,
          rounds: {
            create: [round],
          },
        },
      });
      ctx.events.newRound(input.lobbyCode);
      return newRound;
    },
  })
  .mutation("sendAnswer", {
    input: z.object({ lobbyCode: z.string(), answer: z.number() }),
    async resolve({ ctx, input }) {
      const lobby = await ctx.prisma.lobby.findFirst({
        where: {
          lobbyCode: input.lobbyCode,
        },
        include: {
          players: true,
          rounds: {
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

      const elapsedSeconds = (Date.now() - round.createdAt.getTime()) / 1000;
      if (elapsedSeconds > lobby.roundLength) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Out of time",
        });
      }

      const correct = input.answer === round.answer;
      let score = 0;
      if (correct) {
        score = Math.round((1 - elapsedSeconds / lobby.roundLength) * 10);
        console.log(score);
      }

      const answer = await ctx.prisma.answer.create({
        data: {
          answer: input.answer,
          roundId: round.id,
          playerId: player.id,
          score: score,
        },
      });

      return {
        correct: correct,
        correctAnswer: round.answer,
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

      if (
        (Date.now() - round.createdAt.getTime()) / 1000 <=
        lobby.roundLength
      ) {
        round.answer = -1;
      }

      const players = lobby.players
        .map((player) => {
          return {
            id: player.id,
            name: player.name,
            score: _.sum(player.answers.map((answer) => answer.score)) || 0,
          };
        })
        .sort((a, b) => (a.score > b.score ? -1 : 1));

      return {
        ...lobby,
        players: players,
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

      ctx.events.endGame(input.lobbyCode);

      return updatedLobby;
    },
  });
