import { createRouter } from "./context";
import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

export enum LobbyType {
  Taylor = "taylor",
  Flags = "flags",
}

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
              id: true,
              name: true,
              token: true,
            },
          },
        },
      });

      if (lobby == null) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const players = lobby.players.map((player) => {
        return {
          id: player.id,
          name: player.name,
          isMe: player.token === ctx.token,
        };
      });

      const joined = players.some((player) => player.isMe);

      return {
        ...lobby,
        players,
        joined,
      };
    },
  })
  .mutation("create", {
    input: z.object({
      name: z.string(),
      lobbyType: z.enum(["taylor", "flags"]).optional(),
    }),
    async resolve({ ctx, input }) {
      if (!ctx.token || !input.name) throw new Error("Unauthorized");

      return ctx.prisma.lobby.create({
        data: {
          lobbyCode: nanoid(5),
          lobbyType: input.lobbyType ?? LobbyType.Taylor,
          status: GameStatus.InLobby,
          roundLength: 13 + 1,
          totalRounds: 0,
          maxRounds: 13,
          players: {
            create: [
              {
                name: input.name,
                token: ctx.token,
              }, // Populates authorId with user's id
            ],
          },
        },
      });
    },
  })
  .mutation("join", {
    input: z.object({ lobbyCode: z.string(), name: z.string() }),
    async resolve({ ctx, input }) {
      const name = input.name;
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

      ctx.events.emitJoinedLobby(input.lobbyCode);
      return lobby;
    },
  })
  .mutation("remove-player-by-id", {
    input: z.object({ lobbyCode: z.string(), playerId: z.number() }),
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

      if (lobby.players.length == 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Lobby can't be empty",
        });
      }

      await ctx.prisma.player.delete({
        where: {
          id: input.playerId,
        },
      });

      ctx.events.emitJoinedLobby(input.lobbyCode);
      return;
    },
  });
