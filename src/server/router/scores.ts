import { createRouter } from "./context";
import { z } from "zod";

export const scoreRouter = createRouter().query("get-by-code", {
  input: z.object({ lobbyCode: z.string() }),
  async resolve({ ctx, input }) {
    const scores = await ctx.prisma.lobby.findFirst({
      where: {
        lobbyCode: input.lobbyCode,
      },
      include: {
        players: {
          select: {
            name: true,
            answers: true,
          },
        },
      },
    });

    return scores;
  },
});
