import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { startAuth, handleAuthCallback, getUserTokens, refreshIfNeeded } from "./authHelper.js";
import { callClaude } from "./claudeClient.js";
import { createOrGetSession, getUserIdFromReq } from "./sessionHelper.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static("public"));

// Health
app.get("/status", (req, res) => res.json({ ok: true }));

// Start OAuth (PKCE)
app.get("/auth/start", (req, res) => {
  const sessionId = createOrGetSession(res);
  const { url, code_verifier } = startAuth({ sessionId });
  // Save PKCE verifier in a short-lived httpOnly cookie
  res.cookie("pkce_verifier", code_verifier, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 5 * 60 * 1000 });
  res.redirect(url);
});

// OAuth callback
app.get("/auth/callback", async (req, res) => {
  try {
    const sessionId = getUserIdFromReq(req);
    await handleAuthCallback(req, sessionId);
    // After successful auth, redirect to front page
    res.redirect("/");
  } catch (err) {
    console.error("auth callback error:", err);
    res.status(500).send("Authentication failed. Check server logs.");
  }
});

// Simple logout (clears session)
app.post("/auth/logout", (req, res) => {
  res.clearCookie(process.env.SESSION_COOKIE_NAME || "claude_auth_session");
  res.json({ ok: true });
});

// Endpoint that the frontend calls to ask Claude to process something.
app.post("/api/claude", async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: "not_authenticated" });

    // Optionally refresh tokens if needed (example helper)
    await refreshIfNeeded(userId);

    const userTokens = await getUserTokens(userId);
    // For demo, we just forward the user's prompt to Claude with minimal context.
    const prompt = req.body.prompt || "";
    if (!prompt) return res.status(400).json({ error: "missing_prompt" });

    const claudePrompt = `You are an assistant. The user asks: ${prompt}\nRespond concisely in JSON: {"answer":"<text>"}`;

    const claudeResp = await callClaude({ prompt: claudePrompt });
    res.json({ ok: true, claude: claudeResp });
  } catch (err) {
    console.error("/api/claude error:", err);
    res.status(500).json({ error: "server_error", detail: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
