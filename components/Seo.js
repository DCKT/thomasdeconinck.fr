import Head from "next/head";
export default function Seo({ title, description, favicon, twitterImage }) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content="@DCK__" />
      <link rel="icon" href={favicon} />
      <meta name="twitter:image" content={twitterImage} />
      <meta name="description" content={description} />
      <meta property="og:site_name" content={title} />
      <meta property="og:image" content={twitterImage} />
      <meta property="og:description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:type" content="website" />
      <meta name="robots" content="follow, index" />
      <meta charSet="utf-8" />
    </Head>
  );
}
