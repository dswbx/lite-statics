const apikey = "local-dev-key";

type SignUpBody = {
  id: string;
  email: string;
};

type SessionBody = {
  access_token: string;
  user: { id: string; email: string };
};

export async function signUpUser(
  fetch: typeof globalThis.fetch,
  email: string,
  password = "password123",
) {
  const response = await fetch("http://example.com/auth/v1/signup", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey,
    },
    body: JSON.stringify({ email, password }),
  });
  return { response, body: (await response.json()) as SignUpBody };
}

export async function confirmUserEmail(
  db: D1Database,
  fetch: typeof globalThis.fetch,
  email: string,
  type: "signup" | "recovery" = "signup",
) {
  const row = await db
    .prepare('SELECT confirmation_token, recovery_token FROM "auth.users" WHERE email = ?')
    .bind(email.toLowerCase())
    .first<{ confirmation_token: string | null; recovery_token: string | null }>();

  const tokenHash =
    type === "signup" ? row?.confirmation_token : row?.recovery_token;
  if (!tokenHash) {
    throw new Error(`missing ${type} token for ${email}`);
  }

  const response = await fetch("http://example.com/auth/v1/verify", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey,
    },
    body: JSON.stringify({ token_hash: tokenHash, type }),
  });

  return {
    response,
    body: (await response.json()) as SessionBody,
  };
}

export async function signUpAndConfirm(
  db: D1Database,
  fetch: typeof globalThis.fetch,
  email: string,
  password = "password123",
) {
  const signUp = await signUpUser(fetch, email, password);
  const confirm = await confirmUserEmail(db, fetch, email, "signup");
  return { signUp, confirm };
}
