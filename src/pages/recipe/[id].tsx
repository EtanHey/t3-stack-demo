/* eslint-disable @next/next/no-img-element */
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/PageLayout";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import RecipeView from "~/components/RecipeView";

const RecipePage: NextPage<{ id: string }> = ({ id }) => {
  const { data } = api.recipes.getById.useQuery({
    id,
  });
  if (!data || !data.recipe.id) return <div>404</div>;
  return (
    <>
      <Head>
        <title>{`${data.recipe.description} - ${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <RecipeView {...data} />
      </PageLayout>
    </>
  );
};
export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();
  const id = context.params?.id;

  if (typeof id !== "string") throw new Error("no id");

  await ssg.recipes.getById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default RecipePage;
