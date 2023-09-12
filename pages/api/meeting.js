let busy = false;

export default async function handler(req, res) {
  if (req.query.secret !== process.env.NEXT_ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid token" });
  }

  if (req.query.busy) {
    busy = true;
    return res.end();
  }

  if (req.query.notBusy) {
    busy = false;
    return res.end();
  }

  return res.send({ busy: busy });
}
