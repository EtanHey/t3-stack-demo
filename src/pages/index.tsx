/* eslint-disable @next/next/no-img-element */
import { SignInButton, useUser } from "@clerk/nextjs";
import type { NextPage } from "next";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import Image from "next/image";
import LoadingPage, { LoadingSpinner } from "~/components/loadingComps";
import { BaseSyntheticEvent, useState } from "react";
import { NewRecipeSVG } from "~/components/NewRecipeSVG";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { PageLayout } from "~/components/PageLayout";

dayjs.extend(relativeTime);

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

type RecipeWithUser = RouterOutputs["recipes"]["getAll"][number];

const RecipeView = (props: RecipeWithUser) => {
  const { recipe, author } = props;
  return (
    <div key={recipe.id} className="flex gap-3 border-b border-slate-500 p-4 ">
      <Link href={`/@${author.username}`}>
        <Image
          src={author.profileImageUrl}
          alt={`${author.username} profile image`}
          width={32}
          height={32}
          className="w-h-8 h-8 rounded-full"
        />
      </Link>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 text-slate-300">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          <Link className="flex gap-2" href={`/recipe/${recipe.id}`}>
            <span>·</span>
            <span className="font-thin">
              {dayjs(recipe.createdAt).fromNow()}
            </span>
          </Link>
        </div>
        <span className="text-2xl">{recipe.description}</span>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: recipesLoading } = api.recipes.getAll.useQuery();
  if (recipesLoading) return <LoadingPage />;
  if (!data) return <div>Something went wrong</div>;
  return (
    <div className="flex flex-col">
      {data.map((RecipeInfo) => (
        <RecipeView key={RecipeInfo.recipe.id} {...RecipeInfo} />
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
          <h1>
            {!isSignedIn && (
              <div className="flex justify-center">
                <SignInButton />
              </div>
            )}
          </h1>

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
