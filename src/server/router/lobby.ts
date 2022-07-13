import { createRouter } from "./context";
import { z } from "zod";
import { nanoid } from "nanoid";

export enum GameStatus {
  InLobby = "inLobby",
  InGame = "inGame",
  Ended = "ended",
}
export const lobbyRouter = createRouter()
  .query("get-by-code", {
    input: z.object({ lobbyCode: z.string() }),
    async resolve({ ctx, input }) {
      const lobby = await ctx.prisma.lobby.findFirst({
        where: {
          lobbyCode: input.lobbyCode,
        },
        include: {
          players: {
            select: {
              name: true,
            },
          },
        },
      });

      return lobby;
    },
  })
  .mutation("create", {
    async resolve({ ctx, input }) {
      const name = ctx.req?.cookies["name"];
      if (!ctx.token || !name) throw new Error("Unauthorized");

      return await ctx.prisma.lobby.create({
        data: {
          lobbyCode: nanoid(5),
          status: GameStatus.InLobby,
          roundLength: 13,
          players: {
            create: [
              {
                name: name,
                token: ctx.token,
              }, // Populates authorId with user's id
            ],
          },
        },
      });
    },
  })
  .mutation("join", {
    input: z.object({ lobbyCode: z.string() }),
    async resolve({ ctx, input }) {
      const name = ctx.req?.cookies["name"];
      if (!ctx.token || !name) throw new Error("Unauthorized");

      const lobby = await ctx.prisma.lobby.update({
        where: {
          lobbyCode: input.lobbyCode,
        },
        data: {
          players: {
            create: [
              { name: name, token: ctx.token }, // Populates authorId with user's id
            ],
          },
        },
      });

      ctx.events.emitJoinedLobby(input.lobbyCode, name);
      return lobby;
    },
  });
