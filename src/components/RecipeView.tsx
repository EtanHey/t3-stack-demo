import type { RouterOutputs } from "~/utils/api";
import Image from "next/image";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

type RecipeWithUser = RouterOutputs["recipes"]["getAll"][number];

dayjs.extend(relativeTime);

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

export default RecipeView;
