import { clerkClient } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  };
};

export const recipesRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const recipes = await ctx.prisma.recipe.findMany({
      take: 100,
    });
    const users = (
      await clerkClient.users.getUserList({
        userId: recipes.map((recipe) => recipe.authorId),
        limit: 100,
      })
    ).map(filterUserForClient);
    console.log(users);
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
});
