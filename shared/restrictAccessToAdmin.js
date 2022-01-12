import { NextResponse } from "next/server";

const { NEXT_ADMIN_LOGIN, NEXT_ADMIN_PASSWORD } = process.env;

export default function restrictAccessToAdmin(req) {
  const auth = req.headers.get("authorization").split(" ")[1];
  const [login, password] = Buffer.from(auth, "base64")
    .toString("ascii")
    .split(":");

  if (login === NEXT_ADMIN_LOGIN && password === NEXT_ADMIN_PASSWORD) {
    return NextResponse.next();
  }

  return new Response("Auth required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}
