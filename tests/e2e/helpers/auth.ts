import { execFileSync } from "node:child_process";
import type { APIRequestContext } from "@playwright/test";

const apikey = "local-dev-key";
const d1Persist = ".wrangler-e2e/state";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getTokenHash(email: string, column: "confirmation_token" | "recovery_token") {
  const sql = `SELECT ${column} FROM "auth.users" WHERE email='${email.toLowerCase()}'`;
  let lastError: unknown;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const output = execFileSync(
        "bunx",
        [
          "wrangler",
          "d1",
          "execute",
          "static-host-db",
          "--local",
          "--persist-to",
          d1Persist,
          "--command",
          sql,
          "--json",
        ],
        { encoding: "utf8", cwd: process.cwd() },
      );
      const parsed = JSON.parse(output) as Array<{
        results: Array<{ [key: string]: string }>;
      }>;
      const token = parsed[0]?.results[0]?.[column];
      if (!token) {
        throw new Error(`missing ${column} for ${email}`);
      }
      return token;
    } catch (error) {
      lastError = error;
      await sleep(250 * (attempt + 1));
    }
  }

  throw lastError;
}

export async function confirmSignupEmail(request: APIRequestContext, email: string) {
  const tokenHash = await getTokenHash(email, "confirmation_token");
  const response = await request.post("/auth/v1/verify", {
    headers: {
      "content-type": "application/json",
      apikey,
    },
    data: { token_hash: tokenHash, type: "signup" },
  });
  if (!response.ok()) {
    throw new Error(`signup verify failed: ${response.status()} ${await response.text()}`);
  }
}

export async function signInThroughApi(
  request: APIRequestContext,
  email: string,
  password: string,
) {
  const response = await request.post("/auth/v1/token?grant_type=password", {
    headers: {
      "content-type": "application/json",
      apikey,
    },
    data: { email, password },
  });
  if (!response.ok()) {
    throw new Error(`sign in failed: ${response.status()} ${await response.text()}`);
  }
}
