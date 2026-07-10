import { getAuthSchemaSql, type SqliteConnection } from "@supabase/lite";
import { createConnection } from "@supabase/lite/sqlite";
import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(root, "supabase", "migrations");
const outputDir = join(root, ".wrangler", "migrations");
const schemaPath = join(root, "supabase", "schemas", "schema.sql");
const deparseOutputPath = join(root, "src", "worker", "deparse.generated.json");

function translatePostgresToSqlite(sql: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("bun", ["lite", "db", "translate"], {
      cwd: root,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (exitCode) => {
      if (exitCode !== 0) {
        reject(
          new Error(
            stderr.trim() || `lite db translate failed with exit code ${exitCode}`,
          ),
        );
        return;
      }

      resolve(stdout.trimEnd() + "\n");
    });

    proc.stdin.end(sql);
  });
}

let translatedAuthSchema: string | undefined;

async function getTranslatedAuthSchema(): Promise<string> {
  if (translatedAuthSchema === undefined) {
    translatedAuthSchema = await translatePostgresToSqlite(getAuthSchemaSql());
  }

  return translatedAuthSchema;
}

const files = (await readdir(sourceDir))
  .filter((name) => name.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.log("no supabase migrations found in supabase/migrations");
  process.exit(0);
}

await mkdir(outputDir, { recursive: true });

for (const [index, file] of files.entries()) {
  const sourcePath = join(sourceDir, file);
  const sql = await readFile(sourcePath, "utf8");
  let translated = await translatePostgresToSqlite(sql);

  if (index === 0) {
    const authSchema = await getTranslatedAuthSchema();
    translated = `${authSchema}\n${translated}`;
  }

  translated = translated.replace(
    /CREATE TABLE "_[a-z_]+_migrate_new"[\s\S]*?ALTER TABLE "_[a-z_]+_migrate_new" RENAME TO "[^"]+";;?\n?/gi,
    "",
  );

  const outputPath = join(outputDir, file);

  await writeFile(outputPath, translated, "utf8");
  console.log(`generated .wrangler/migrations/${file}`);
}

// supalite enforces RLS from a policy registry that is only populated when it
// processes the Postgres DDL. On D1, migrations are applied out-of-band by
// wrangler (as pre-translated SQLite, with RLS stripped), so the worker's App
// never sees the policies. Extract the registry here and hand it to the
// connection at runtime (see src/worker/supalite.ts).
const schemaSql = await readFile(schemaPath, "utf8");
// createConnection's type varies by export condition (bun/node/workerd); pin it
// to the base connection so `translateDdl` resolves regardless of resolver.
const conn = createConnection() as unknown as SqliteConnection;
const { rls } = await conn.translateDdl(schemaSql);

// Persist supalite's own deparse payload rather than reshaping it: the worker
// hands this straight back to the connection, which re-parses it (Set / Policy
// reconstruction) via parseDeparseInfo. We only make it JSON-safe — Policy
// instances already serialize through their toJSON; Sets/Maps need coercing.
const toJsonSafe = (_key: string, value: unknown) =>
  value instanceof Set ? [...value] : value instanceof Map ? Object.fromEntries(value) : value;

await writeFile(deparseOutputPath, `${JSON.stringify({ rls }, toJsonSafe, 2)}\n`, "utf8");
console.log(`generated src/worker/deparse.generated.json (${rls?.policies.length ?? 0} policies)`);
