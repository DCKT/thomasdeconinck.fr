import restrictAccessToAdmin from "./shared/restrictAccessToAdmin";

export function middleware(req, ev) {
  if (req.nextUrl.pathname.startsWith("/internals")) {
    return restrictAccessToAdmin(req);
  }
}
