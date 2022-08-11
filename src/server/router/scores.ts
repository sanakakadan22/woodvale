import { createRouter } from "./context";
import { z } from "zod";
import _ from "lodash";
import { TRPCError } from "@trpc/server";

export const scoreRouter = createRouter().query("get-by-code", {
  input: z.object({ lobbyCode: z.string() }),
  async resolve({ ctx, input }) {
    const lobby = await ctx.prisma.lobby.findFirst({
      where: {
        lobbyCode: input.lobbyCode,
      },
      include: {
        rounds: {
          select: {
            id: true,
          },
        },
        players: {
          select: {
            name: true,
            answers: true,
          },
        },
      },
    });

    if (!lobby) {
      throw new TRPCError({
        code: "NOT_FOUND",
      });
    }

    const players = lobby.players;
    const numberOfRounds = lobby.rounds.length;

    const response = players
      .map((player) => {
        return {
          name: player.name,
          score: _.sum(player.answers.map((answer) => answer.score)) || 0,
        };
      })
      .sort((a, b) => (a.score > b.score ? -1 : 1));

    return {
      players: response,
      numberOfRounds: numberOfRounds,
      roundLength: lobby.roundLength - 1,
    };
  },
});
