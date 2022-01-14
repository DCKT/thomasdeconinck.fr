import { NextResponse } from "next/server";

export default function restrictAccessToAdmin(req) {
  const auth = req.headers.get("authorization")?.split(" ")[1];

  if (auth) {
    const [login, password] = Buffer.from(auth, "base64")
      .toString("ascii")
      .split(":");

    console.log(process.env.NEXT_ADMIN_LOGIN);

    if (
      login === process.env.NEXT_ADMIN_LOGIN &&
      password === process.env.NEXT_ADMIN_PASSWORD
    ) {
      return NextResponse.next();
    }
  }

  return new Response("Auth required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}
