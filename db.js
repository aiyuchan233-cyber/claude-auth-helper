import fs from "fs/promises";
const TOKENS_FILE = "tokens.json";

async function readAll() {
  try {
    const txt = await fs.readFile(TOKENS_FILE, "utf8");
    return JSON.parse(txt || "{}");
  } catch (err) {
    return {};
  }
}
async function writeAll(obj) {
  await fs.writeFile(TOKENS_FILE, JSON.stringify(obj, null, 2), "utf8");
}

export async function readTokens(sessionId) {
  const all = await readAll();
  return all[sessionId] || null;
}

export async function writeTokens(sessionId, tokens) {
  const all = await readAll();
  all[sessionId] = { ...all[sessionId], ...tokens, savedAt: Date.now() };
  await writeAll(all);
}

export async function removeTokens(sessionId) {
  const all = await readAll();
  delete all[sessionId];
  await writeAll(all);
}
