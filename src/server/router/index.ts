// src/server/router/index.ts
import { createRouter } from "./context";
import superjson from "superjson";

import {lobbyRouter} from "./lobby";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("lobby.", lobbyRouter)

// export type definition of API
export type AppRouter = typeof appRouter;
