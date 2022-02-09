import { request } from "../../shared/datocms";
import { MORE_ARTICLES_QUERY } from "../../shared/queries";
import Cors from "cors";

function initMiddleware(middleware) {
  return (req, res) =>
    new Promise((resolve, reject) => {
      middleware(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
}

const cors = initMiddleware(
  Cors({
    origin: true,
  })
);

export default async function handler(req, res) {
  await cors(req, res);

  if (req.method === "POST") {
    const { pageIndex, locale } = req.body;

    const data = await request({
      query: MORE_ARTICLES_QUERY,
      variables: {
        locale,
        start: pageIndex * 6,
        end: pageIndex * 6 + 5,
      },
      preview: false,
    });

    res.send(data.articles);
  } else {
    res.status(401).end();
  }
}
