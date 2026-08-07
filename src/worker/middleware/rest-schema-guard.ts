import type { Context, Next } from "hono";
import type { AppEnv } from "../client";

// supalite exposes the `storage.*` tables through PostgREST under the default
// `public` profile (addressable as the dotted table name `storage.objects`),
// and RLS fails open for any table it has no policy for. `auth.*` is already
// blocked by the core library (LITE-285); until storage gets the same
// treatment, block any request that targets the `storage` schema so the
// internal storage tables stay unreachable over `/rest/v1`.

const BLOCKED_SCHEMA = "storage";

function notFound(): Response {
  // Mimic PostgREST's "table not found" so we don't confirm the table exists.
  return Response.json(
    {
      code: "PGRST205",
      details: null,
      hint: null,
      message: "Could not find the table in the schema cache",
    },
    { status: 404 },
  );
}

function isBlockedProfile(header: string | undefined): boolean {
  if (!header) return false;
  return header.trim().toLowerCase() === BLOCKED_SCHEMA;
}

export async function restSchemaGuard(c: Context<AppEnv>, next: Next): Promise<Response | void> {
  // A `storage` Accept-Profile / Content-Profile selects the schema explicitly.
  if (
    isBlockedProfile(c.req.header("Accept-Profile")) ||
    isBlockedProfile(c.req.header("Content-Profile"))
  ) {
    return notFound();
  }

  const pathname = new URL(c.req.url).pathname;
  const rest = pathname.replace(/^\/rest\/v1\/?/, "");
  const resource = decodeURIComponent(rest.split("/")[0] ?? "");

  // A `storage.` prefix means a schema-qualified internal table such as
  // `storage.objects`.
  if (resource.toLowerCase().startsWith(`${BLOCKED_SCHEMA}.`)) {
    return notFound();
  }

  await next();
}
