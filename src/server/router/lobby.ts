import { createRouter } from "./context";
import { z } from "zod";
import {nanoid} from "nanoid";

export const lobbyRouter = createRouter()
    .query("get-by-code", {
        input: z.object({ lobbyCode: z.string() }),
        async resolve({ ctx , input}) {
            return await ctx.prisma.lobby.findFirst({
                    where: {
                        lobbyCode: input.lobbyCode,
                    },
            });
        },
    })
    .mutation("create", {
        async resolve({ctx}) {
            return await ctx.prisma.lobby.create({
                data: {
                    lobbyCode: nanoid(5),
                },
            });
        },
    });
