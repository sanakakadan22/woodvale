import { createRouter } from "./context";
import { z } from "zod";
import _ from "lodash";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { GameStatus } from "./lobby";
import { GameEvent } from "../../utils/enums";

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

      const newLobby = await ctx.prisma.lobby.create({
        data: {
          lobbyCode: nanoid(5),
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

      ctx.events.newLobbyCreated(input.lobbyCode, newLobby.lobbyCode);

      return newLobby.lobbyCode;
    },
  });
