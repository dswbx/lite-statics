import type { Context, Next } from "hono";
import type { AppEnv } from "../client";

// supalite currently exposes GoTrue's internal `auth.*` tables through PostgREST
// under the default `public` profile (addressable as the dotted table name
// `auth.users`), and RLS fails open for any table it has no policy for. Until the
// core library restricts the data API to the exposed (`public`) schema, block any
// request that targets a schema-qualified table or names a non-public profile, so
// the internal auth/storage tables stay unreachable over `/rest/v1`.

const EXPOSED_SCHEMA = "public";

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

function isNonPublicProfile(header: string | undefined): boolean {
  if (!header) return false;
  const schema = header.trim().toLowerCase();
  return schema !== "" && schema !== EXPOSED_SCHEMA;
}

export async function restSchemaGuard(c: Context<AppEnv>, next: Next): Promise<Response | void> {
  // A non-public Accept-Profile / Content-Profile selects another schema explicitly.
  if (
    isNonPublicProfile(c.req.header("Accept-Profile")) ||
    isNonPublicProfile(c.req.header("Content-Profile"))
  ) {
    return notFound();
  }

  const pathname = new URL(c.req.url).pathname;
  const rest = pathname.replace(/^\/rest\/v1\/?/, "");
  const resource = decodeURIComponent(rest.split("/")[0] ?? "");

  // Legit tables are bare names (`sites`, `profiles`, `analytics_daily`) or `rpc/*`.
  // A dot means a schema-qualified internal table such as `auth.users`.
  if (resource.includes(".")) {
    return notFound();
  }

  await next();
}
