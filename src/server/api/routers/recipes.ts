import { clerkClient } from "@clerk/nextjs";
import type { Recipe } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";

const addUserDataToRecipes = async (recipes: Recipe[]) => {
  const users = (
    await clerkClient.users.getUserList({
      userId: recipes.map((recipe) => recipe.authorId),
      limit: 100,
    })
  ).map(filterUserForClient);

  return recipes.map((recipe) => {
    const author = users.find((user) => user.id === recipe.authorId);
    if (!author || !author.username)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Author for post not found",
      });
    return {
      recipe,
      author: {
        ...author,
        username: author.username,
      },
    };
  });
};

// Create a new ratelimiter, that allows 3 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

export const recipesRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const recipe = await ctx.prisma.recipe.findUnique({
        where: { id: input.id },
      });
      if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });

      return (await addUserDataToRecipes([recipe]))[0];
    }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const recipes = await ctx.prisma.recipe.findMany({
      take: 100,
      orderBy: {
        createdAt: "desc",
      },
    });

    return addUserDataToRecipes(recipes);
  }),
  getRecipesByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(({ ctx, input }) =>
      ctx.prisma.recipe
        .findMany({
          where: { authorId: input.userId },
          take: 100,
          orderBy: [{ createdAt: "desc" }],
        })
        .then(addUserDataToRecipes)
    ),
  create: privateProcedure
    .input(
      z.object({
        content: z.string().min(1).max(280),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;

      const { success } = await ratelimit.limit(authorId);

      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

      const recipe = await ctx.prisma.recipe.create({
        data: {
          authorId,
          description: input.content,
        },
      });
      return recipe;
    }),
});
