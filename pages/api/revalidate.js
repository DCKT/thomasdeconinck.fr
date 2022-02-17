export default async function handler(req, res) {
  if (req.headers.secret !== process.env.NEXT_REVALIDATE_TOKEN) {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    const {
      entity: {
        attributes: { slug },
      },
    } = req.body;

    await res.unstable_revalidate(`/blog`);
    await res.unstable_revalidate(`/blog/${slug.fr}`);

    return res.json({ revalidated: true });
  } catch (err) {
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    console.log(err);
    return res.status(500).send("Error revalidating");
  }
}
