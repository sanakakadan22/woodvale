import { createRouter } from "./context";
import { z } from "zod";
import _ from "lodash";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { GameStatus } from "./lobby";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { makeQuestion } from "../lyrics/questionMaker";
import { LeaderType } from "../../utils/enums";

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
    input: z.object({
      lobbyCode: z.string(),
      lobbyType: z.enum(["taylor", "flags", "ttpd"]).optional(),
      quickPlay: z.boolean().optional().default(false),
    }),
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

      if (!input.quickPlay && lobby.status !== GameStatus.Ended) {
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

      let roundData: any | undefined;
      if (input.quickPlay) {
        const [question, selected, answerIndex] = makeQuestion(lobby.lobbyType);
        const choices = selected.map((choice) => {
          return {
            choice: choice,
          };
        });

        const answer = selected[answerIndex] ?? "";
        const regEx = new RegExp(answer, "igu");
        roundData = {
          question: question.replace(regEx, answer.replace(/[A-z]/g, "_")),
          answer: answerIndex,
          choices: {
            create: choices,
          },
        };
      }

      try {
        const newLobby = await ctx.prisma.lobby.create({
          data: {
            lobbyCode: lobby.nextLobbyCode,
            nextLobbyCode: nanoid(6),
            lobbyType: input.lobbyType ?? lobby.lobbyType,
            status: input.quickPlay ? GameStatus.InGame : GameStatus.InLobby,
            roundLength: lobby.roundLength,
            maxRounds: lobby.maxRounds,
            totalRounds: input.quickPlay ? 1 : 0,
            rounds: input.quickPlay
              ? {
                  create: [roundData],
                }
              : undefined,
            players: {
              create: input.quickPlay ? [player] : lobby.players,
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
    input: z.object({
      lobbyType: z.string(),
      type: z.nativeEnum(LeaderType).default(LeaderType.AllTime),
    }),
    async resolve({ ctx, input }) {
      return await ctx.prisma.leaderboard.findMany({
        select: {
          createdAt: true,
          name: true,
          score: true,
          presence: true,
        },
        where: {
          lobbyType: input.lobbyType,
          createdAt: {
            gte: new Date(
              input.type === LeaderType.Daily
                ? new Date().setHours(0, 0, 0, 0)
                : input.type === LeaderType.Monthly
                ? new Date().setDate(0)
                : 0
            ),
          },
        },
        orderBy: {
          score: "desc",
        },
        take: 10,
      });
    },
  });
