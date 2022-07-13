// src/server/router/index.ts
import { createRouter } from "./context";
import superjson from "superjson";

import { lobbyRouter } from "./lobby";
import { gameRouter } from "./game";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("lobby.", lobbyRouter)
  .merge("game.", gameRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
