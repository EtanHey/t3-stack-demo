import { clerkClient } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  };
};

// Create a new ratelimiter, that allows 3 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

export const recipesRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const recipes = await ctx.prisma.recipe.findMany({
      take: 100,
      orderBy: {
        createdAt: "desc",
      },
    });

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
  }),
  create: privateProcedure
    .input(
      z.object({

        content: z
          .string()
          .min(1)
          .max(280),
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
