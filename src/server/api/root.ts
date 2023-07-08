import { createTRPCRouter } from "~/server/api/trpc";
import { recipesRouter } from "./routers/recipes";
import { profileRouter } from "./routers/profile";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  recipes: recipesRouter,
  profile: profileRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
