import crypto from "crypto";
import fetch from "node-fetch";
import { readTokens, writeTokens } from "./db.js";
import { v4 as uuidv4 } from "uuid";

const OAUTH_AUTH_URL = process.env.OAUTH_AUTH_URL;
const OAUTH_TOKEN_URL = process.env.OAUTH_TOKEN_URL;
const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI;
const SCOPE = process.env.OAUTH_SCOPE || "openid profile";

function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function startAuth({ sessionId }) {
  const code_verifier = base64url(crypto.randomBytes(32));
  const code_challenge = base64url(crypto.createHash("sha256").update(code_verifier).digest());
  const state = uuidv4();
  const url = `${OAUTH_AUTH_URL}?response_type=code&client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(code_challenge)}&code_challenge_method=S256`;
  return { url, code_verifier, state };
}

export async function handleAuthCallback(req, sessionId) {
  const { code } = req.query;
  const code_verifier = req.cookies.pkce_verifier;
  if (!code || !code_verifier) throw new Error("Missing code or PKCE verifier");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier
  });

  const tokenResp = await fetch(OAUTH_TOKEN_URL, { method: "POST", body });
  if (!tokenResp.ok) {
    const text = await tokenResp.text();
    throw new Error("Token exchange failed: " + text);
  }
  const tokens = await tokenResp.json();
  await writeTokens(sessionId, tokens);
  return tokens;
}

export async function getUserTokens(sessionId) {
  return readTokens(sessionId);
}

export async function refreshIfNeeded(sessionId) {
  const tokens = await readTokens(sessionId);
  if (!tokens) return;
  if (tokens.refresh_token) {
    try {
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token,
        client_id: CLIENT_ID
      });
      const tokenResp = await fetch(OAUTH_TOKEN_URL, { method: "POST", body });
      if (tokenResp.ok) {
        const newTokens = await tokenResp.json();
        await writeTokens(sessionId, { ...tokens, ...newTokens });
      } else {
        console.warn("refresh failed:", tokenResp.status);
      }
    } catch (err) {
      console.error("refreshIfNeeded error:", err);
    }
  }
}
