import { v4 as uuidv4 } from "uuid";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "claude_auth_session";

export function createOrGetSession(res) {
  const sessionId = uuidv4();
  res.cookie(COOKIE_NAME, sessionId, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 7 * 24 * 3600 * 1000 });
  return sessionId;
}

export function getUserIdFromReq(req) {
  const sid = req.cookies[COOKIE_NAME];
  return sid || null;
}
