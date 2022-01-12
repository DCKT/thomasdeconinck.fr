import restrictAccessToAdmin from "../../../shared/restrictAccessToAdmin";

export function middleware(req, ev) {
  return restrictAccessToAdmin(req);
}
