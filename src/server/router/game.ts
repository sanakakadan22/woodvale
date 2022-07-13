import { createRouter } from "./context";
import { z } from "zod";

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
      const choices = [
        {
          choice: "Lover",
        },
        {
          choice: "Cardigan",
        },
        {
          choice: "All Too Well",
        },
        {
          choice: "willow",
        },
      ];

      const round = {
        question: "I remember it all too wall",
        answer: 2,
        choices: {
          create: choices,
        },
      };

      return await ctx.prisma.lobby.update({
        where: {
          lobbyCode: input.lobbyCode,
        },
        data: {
          rounds: {
            create: [round],
          },
        },
      });
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
        throw new Error("No lobby");
      }

      const player = lobby.players.filter(
        (player) => player.token == ctx.token
      )[0];

      if (!player) {
        throw new Error("No player");
      }

      const round = lobby.rounds[0];
      if (!round) {
        throw new Error("No round");
      }

      if ((Date.now() - round.createdAt.getTime()) / 1000 > lobby.roundLength) {
        throw new Error("Out of time");
      }

      const answer = await ctx.prisma.answer.create({
        data: {
          answer: input.answer,
          roundId: round.id,
          playerId: player.id,
        },
      });

      return {
        correct: answer.answer == round.answer,
      };
    },
  });
