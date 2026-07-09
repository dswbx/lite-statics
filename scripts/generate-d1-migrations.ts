import { getAuthSchemaSql } from "@supabase/lite";
import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(root, "supabase", "migrations");
const outputDir = join(root, ".wrangler", "migrations");

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

  const outputPath = join(outputDir, file);

  await writeFile(outputPath, translated, "utf8");
  console.log(`generated .wrangler/migrations/${file}`);
}
