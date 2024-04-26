import { createRouter } from "./context";
import { z } from "zod";
import _ from "lodash";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { GameStatus } from "./lobby";
import { GameEvent } from "../../utils/enums";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const scoreRouter = createRouter()
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
        numberOfRounds: lobby.maxRounds,
        roundLength: lobby.roundLength - 1,
      };
    },
  })
  .mutation("create-new-lobby", {
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
              token: true,
              presence: true,
            },
          },
        },
      });
      if (!lobby) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      if (lobby.status !== GameStatus.Ended) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game not over yet",
        });
      }

      const player = lobby.players.find((player) => player.token == ctx.token);
      if (!player) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      const count = await ctx.prisma.lobby.count({
        where: {
          lobbyCode: lobby.nextLobbyCode,
        },
      });

      // Check if the next lobby code is already in use
      if (count > 0) {
        return lobby.nextLobbyCode;
      }

      try {
        const newLobby = await ctx.prisma.lobby.create({
          data: {
            lobbyCode: lobby.nextLobbyCode,
            nextLobbyCode: nanoid(6),
            lobbyType: lobby.lobbyType,
            status: GameStatus.InLobby,
            roundLength: lobby.roundLength,
            maxRounds: lobby.maxRounds,
            totalRounds: 0,
            players: {
              create: lobby.players,
            },
          },
        });

        return newLobby.lobbyCode;
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
          if (e.code === "P2002") {
            return lobby.nextLobbyCode; // Lobby already exists
          }
        }
        throw e;
      }
    },
  })
  .query("leaderboard", {
    input: z.object({ lobbyType: z.string() }),
    async resolve({ ctx, input }) {
      const scores = await ctx.prisma.answer.groupBy({
        by: ["playerId"],
        _sum: {
          score: true,
        },
        where: {
          player: {
            lobby: {
              lobbyType: input.lobbyType,
            },
          },
        },
        orderBy: {
          _sum: {
            score: "desc",
          },
        },
        take: 10,
      });

      const players = await ctx.prisma.player.findMany({
        where: {
          id: {
            in: scores.map((score) => score.playerId),
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      const idToName = new Map<number, string>();
      players.forEach((player) => {
        idToName.set(player.id, player.name);
      });

      const leaders: { name: string; score: number }[] = scores.map((score) => {
        const name = idToName.get(score.playerId) ?? "Unknown";
        return {
          name: name,
          score: score._sum.score ?? 0,
        };
      });

      return leaders;
    },
  });
