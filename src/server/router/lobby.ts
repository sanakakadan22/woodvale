import { createRouter } from "./context";
import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { makeQuestion } from "../lyrics/questionMaker";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export enum LobbyType {
  Taylor = "taylor",
  Flags = "flags",
  TTPD = "ttpd",
  Debut = "debut",
  Fearless = "fearless"
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

      const players = lobby.players.map((player) => {
        return {
          id: player.id,
          name: player.name,
          isMe: player.token === ctx.token,
          presence: player.presence,
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
      lobbyType: z.enum(["taylor", "flags", "ttpd", "debut", "fearless"]).optional(),
    }),
    async resolve({ ctx, input }) {
      if (!ctx.token || !input.name || !ctx.presence)
        throw new Error("Unauthorized");

      return ctx.prisma.lobby.create({
        data: {
          lobbyCode: nanoid(6),
          nextLobbyCode: nanoid(6),
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
                presence: ctx.presence,
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
      if (!ctx.token || !name || !ctx.presence) throw new Error("Unauthorized");

      if (name.length > 32) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Name too long",
        });
      }

      const lobby = await ctx.prisma.lobby.update({
        where: {
          lobbyCode: input.lobbyCode,
        },
        data: {
          players: {
            create: [
              { name: name, token: ctx.token, presence: ctx.presence }, // Populates authorId with user's id
            ],
          },
        },
      });

      await ctx.events.emitJoinedLobby(input.lobbyCode);
      return lobby;
    },
  })
  .mutation("restart", {
    input: z.object({
      lobbyCode: z.string(),
    }),
    async resolve({ ctx, input }) {
      const lobby = await ctx.prisma.lobby.findFirst({
        where: {
          lobbyCode: input.lobbyCode,
        },
        include: {
          players: {
            select: {
              token: true,
            },
          },
        },
      });
      if (!lobby) {
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

      const player = lobby.players.find((player) => player.token == ctx.token);
      if (!player) {
        throw new TRPCError({
          code: "NOT_FOUND",
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

      await ctx.prisma.$transaction([
        ctx.prisma.round.deleteMany({
          where: {
            lobbyId: lobby.id,
          },
        }),
        ctx.prisma.lobby.update({
          where: {
            lobbyCode: input.lobbyCode,
          },
          data: {
            totalRounds: 1,
            rounds: {
              create: [roundData],
            },
          },
        }),
      ]);

      if (lobby.players.length > 1) {
        await ctx.events.newRound(input.lobbyCode);
      }

      return;
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

      await ctx.events.emitJoinedLobby(input.lobbyCode);
      return;
    },
  });
