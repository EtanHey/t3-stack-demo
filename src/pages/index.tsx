/* eslint-disable @next/next/no-img-element */
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import type { NextPage } from "next";
import { api } from "~/utils/api";
import Image from "next/image";
import LoadingPage, { LoadingSpinner } from "~/components/loadingComps";
import { useState } from "react";
import { NewRecipeSVG } from "~/components/NewRecipeSVG";
import { toast } from "react-hot-toast";
import { PageLayout } from "~/components/PageLayout";
import RecipeView from "~/components/RecipeView";

const CreateRecipeWizard = () => {
  const { user } = useUser();
  const ctx = api.useContext();
  const [input, setInput] = useState<string>("");
  const { mutate, isLoading: isPosting } = api.recipes.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.recipes.getAll.invalidate();
    },
    onError: () => {
      toast.error("Failed to post recipe, please try again later!");
    },
  });
  if (!user) return null;
  return (
    <div className="flex grow gap-3">
      <Image
        src={user.imageUrl}
        width={56}
        height={56}
        className="h-14 w-14 select-none rounded-full"
        alt="your user image"
      />
      <input
        type="text"
        placeholder="type some recipe description"
        className="w-full bg-transparent outline-none"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== "") mutate({ content: input });
          }
        }}
        disabled={isPosting}
      />
      {input !== "" && (
        <button
          className="flex items-center gap-1 rounded-xl bg-slate-600 px-3 py-1"
          onClick={() => mutate({ content: input })}
          disabled={isPosting}
        >
          {isPosting ? (
            <LoadingSpinner size={20} />
          ) : (
            <>
              <p className="whitespace-nowrap text-slate-300">Post recipe</p>
              <NewRecipeSVG />
            </>
          )}
        </button>
      )}
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: recipesLoading } = api.recipes.getAll.useQuery();
  if (recipesLoading)
    return (
      <div className="flex flex-grow">
        <LoadingPage />
      </div>
    );
  if (!data) return <div>Something went wrong</div>;
  return (
    <div className="flex flex-col">
      {data.map((recipeInfo) => (
        <RecipeView key={recipeInfo.recipe.id} {...recipeInfo} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();

  api.recipes.getAll.useQuery();
  // return empty div if both aren't  loaded, since user tends to load faster
  if (!userLoaded) return <div />;

  return (
    <>
      <PageLayout>
        <div className="flex border-b border-slate-400 p-4">
            <div className="z-10 flex justify-center">
              {!isSignedIn ? <SignInButton /> : <SignOutButton />}
            </div>

          {!!isSignedIn && (
            <div className="flex w-full justify-center">
              <CreateRecipeWizard />
            </div>
          )}
        </div>
        <Feed />
      </PageLayout>
    </>
  );
};

export default Home;
