import { createRouter } from "./context";
import { z } from "zod";
import is from "@sindresorhus/is";
import integer = is.integer;
import { TRPCError } from "@trpc/server";
import { allLyrics } from "../lyrics/allLyrics";
import { makeQuestion } from "../lyrics/questionMaker";

export const gameRouter = createRouter()
  .mutation("newRound", {
    input: z.object({ lobbyCode: z.string() }),
    async resolve({ ctx, input }) {
      // make sure input comes from the host?
      // make sure rounds < 13?
      // make sure game status is InGame
      // emit new round event
      // question generator

      // const lobby = await ctx.prisma.lobby.findFirst({
      //   where: {
      //     lobbyCode: input.lobbyCode,
      //   },
      //   include: {
      //     players: true, // include all players
      //   },
      // });

      // const choices = [
      //   {
      //     choice: "Lover",
      //   },
      //   {
      //     choice: "Cardigan",
      //   },
      //   {
      //     choice: "All Too Well",
      //   },
      //   {
      //     choice: "willow",
      //   },
      // ];
      const [question, selected, answerIndex] = makeQuestion()

      const choices = selected.map(
        choice => {
          return {
            choice: choice,
          }
        }
      )



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
          rounds: {
            create: [round],
          },
        },
      });
      ctx.events.newRound(input.lobbyCode)
      return newRound
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

      const correct = input.answer == round.answer
      let score = 0
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
        correct: correct
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

      return lobby;
    },
  });
