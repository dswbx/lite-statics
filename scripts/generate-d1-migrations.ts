import { getAuthSchemaSql } from "@supabase/lite";
import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(root, "supabase", "migrations");
const outputDir = join(root, ".wrangler", "migrations");
const schemaPath = join(root, "supabase", "schemas", "schema.sql");
const deparseOutputPath = join(root, "src", "worker", "deparse.generated.json");

function runLite(args: string[], stdin?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("bun", ["lite", ...args], {
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
            stderr.trim() || `lite ${args.join(" ")} failed with exit code ${exitCode}`,
          ),
        );
        return;
      }

      resolve(stdout);
    });

    if (stdin === undefined) {
      proc.stdin.end();
    } else {
      proc.stdin.end(stdin);
    }
  });
}

function translatePostgresToSqlite(sql: string): Promise<string> {
  return runLite(["db", "translate"], sql).then((stdout) => stdout.trimEnd() + "\n");
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
await runLite(["db", "translate", "--deparse", "-o", deparseOutputPath], schemaSql);
const deparse = JSON.parse(await readFile(deparseOutputPath, "utf8")) as {
  rls?: { policies?: unknown[] };
};
console.log(
  `generated ${relative(root, deparseOutputPath)} (${deparse.rls?.policies?.length ?? 0} policies)`,
);
