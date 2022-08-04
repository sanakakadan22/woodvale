// src/server/router/index.ts
import { createRouter } from "./context";
import superjson from "superjson";

import { lobbyRouter } from "./lobby";
import { gameRouter } from "./game";
import { scoreRouter } from "./scores";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("lobby.", lobbyRouter)
  .merge("game.", gameRouter)
  .merge("scores.", scoreRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
