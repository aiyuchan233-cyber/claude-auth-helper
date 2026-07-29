import fetch from "node-fetch";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = process.env.ANTHROPIC_API_URL || "https://api.anthropic.com/v1/complete";

export async function callClaude({ prompt, model = "claude-2", max_tokens = 512 }) {
  if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");
  const payload = {
    model,
    prompt,
    max_tokens_to_sample: max_tokens
  };
  const r = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY
    },
    body: JSON.stringify(payload)
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Claude API error: ${r.status} ${text}`);
  }
  const json = await r.json();
  return json;
}
