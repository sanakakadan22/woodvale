// src/server/router/context.ts
import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { prisma } from "../db/client";
import { events } from "../events/client";
import { type Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../pages/api/auth/[...nextauth]";

export const createContext = async (
  opts?: trpcNext.CreateNextContextOptions
) => {
  const req = opts?.req;
  const res = opts?.res;

  const session =
    req && res ? await getServerSession(req, res, authOptions) : null;

  const token = opts?.req.cookies["user-token"];
  const presence = opts?.req.cookies["presence-token"];

  return {
    req,
    res,
    prisma,
    events,
    token,
    presence,
    session,
  };
};

type Context = trpc.inferAsyncReturnType<typeof createContext>;

export const createRouter = () => trpc.router<Context>();
