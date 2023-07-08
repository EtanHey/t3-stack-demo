/* eslint-disable @next/next/no-img-element */
import type { NextPage } from "next";
import Head from "next/head";

const SinglePostPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Recipe</title>
      </Head>
      <main className="flex h-screen justify-center">Post view</main>
    </>
  );
};

export default SinglePostPage;
