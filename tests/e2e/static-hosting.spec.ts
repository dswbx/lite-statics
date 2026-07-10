import { expect, test } from "@playwright/test";
import JSZip from "jszip";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("uploads HTML through the dashboard and opens the hosted static site", async ({ page, context }, testInfo) => {
  const unique = `${Date.now()}-${testInfo.workerIndex}`;
  const slug = `static-harbor-${unique}`;
  const email = `e2e-${unique}@example.com`;
  const password = `password-${unique}`;
  const uploadedHeading = `Uploaded static content ${unique}`;
  const uploadPath = join(tmpdir(), `static-harbor-${unique}.zip`);
  const pageErrors: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") pageErrors.push(message.text());
  });

  const zip = new JSZip();
  zip.file("index.html", `<!doctype html><title>E2E Upload</title><h1>${uploadedHeading}</h1><link rel="stylesheet" href="/styles/site.css">`);
  zip.file("styles/site.css", "body { font-family: sans-serif; }");
  zip.file("scripts/app.js", "console.log('uploaded app');");
  zip.file("assets/logo.svg", "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 10 10\"><circle cx=\"5\" cy=\"5\" r=\"5\"/></svg>");
  await writeFile(uploadPath, Buffer.from(await zip.generateAsync({ type: "uint8array" })));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Upload HTML. Share a public URL." })).toBeVisible();
  await expect(page.getByText("You need an account before uploading")).toBeVisible();
  await page.getByRole("button", { name: /sign up to upload/i }).click();
  await expect(page).toHaveURL(/\/auth$/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Deployments" })).toBeVisible();

  await page.getByLabel("Dashboard").getByRole("button", { name: /new site/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/sites\/new$/);
  await expect(page.getByRole("heading", { name: "Access and expiry" })).toBeVisible();
  await page.locator('input[name="file"]').setInputFiles(uploadPath);
  await expect(page.getByText(`${uploadPath.split("/").at(-1)} is ready.`)).toBeVisible();
  await expect(page.getByText("4 files found. Review the list, then publish.")).toBeVisible();
  await expect(page.getByText("Files to publish")).toBeVisible();
  await expect(page.getByText("/index.html")).toBeVisible();
  await expect(page.getByText("/assets/logo.svg")).toBeVisible();
  await page.getByLabel(/name optional/i).fill("E2E Static Site");
  await expect(page.getByLabel("Slug")).toHaveValue(slug);
  await page.getByRole("button", { name: /create site and upload/i }).click();
  await expect(page.getByRole("heading", { name: "E2E Static Site" })).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/sites\/[0-9a-f-]{36}$/);
  const managementUrl = page.url();
  await expect(page.getByText("Live upload")).toBeVisible();
  await expect(page.getByText("4 assets")).toBeVisible();
  await expect(page.getByText("/index.html")).toBeVisible();
  await expect(page.getByRole("button", { name: /show 1 more/i })).toBeVisible();
  await page.getByRole("button", { name: /show 1 more/i }).click();
  await expect(page.getByText("/styles/site.css")).toBeVisible();
  await expect(page.getByRole("link", { name: /open site/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /copy public link/i })).toBeVisible();
  await expect(page.getByText("Access and expiry")).toBeVisible();
  await expect(page.getByText("No expiry set")).toBeVisible();
  await expect(page.getByRole("button", { name: /edit access settings/i })).toBeVisible();
  await expect(page.getByText("Replace with HTML or ZIP")).toHaveCount(0);
  await page.getByRole("button", { name: /replace upload/i }).click();
  await expect(page.getByText("Replace with HTML or ZIP")).toBeVisible();

  const publicLink = page.getByRole("link", { name: new RegExp(`/s/${slug}/`) }).first();
  await expect(publicLink).toBeVisible();

  const [hostedPage] = await Promise.all([context.waitForEvent("page"), publicLink.click()]);
  await hostedPage.waitForLoadState("networkidle");
  await expect(hostedPage.getByRole("heading", { name: uploadedHeading })).toBeVisible();
  await expect(hostedPage.getByText("Statics")).toHaveCount(0);

  await page.goto(`/s/${slug}/`);
  await expect(page.getByRole("heading", { name: uploadedHeading })).toBeVisible();
  await expect(page.getByText("Statics")).toHaveCount(0);

  await page.goto(managementUrl);
  await page.reload();
  await expect(page.getByRole("heading", { name: "E2E Static Site" })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(`/s/${slug}/`) })).toBeVisible();

  await page.getByRole("button", { name: /edit access settings/i }).click();
  await page.getByLabel("Disable now").check();
  await page.getByRole("button", { name: /save settings/i }).click();
  await expect(page.getByRole("heading", { name: "E2E Static Site" }).locator("+ *")).toHaveText("Disabled");
  await expect(page.getByText(/This site is disabled/)).toBeVisible();
  await expect(page.getByRole("link", { name: /open site/i })).toHaveAttribute("aria-disabled", "true");

  await page.getByRole("button", { name: "Sites" }).click();
  const disabledCard = page.getByRole("button", { name: /E2E Static Site/ });
  await expect(disabledCard.getByText("Disabled", { exact: true })).toBeVisible();
  await expect(disabledCard).toContainText("Public, disabled");

  await page.getByLabel("Dashboard").getByRole("button", { name: "New site" }).click();
  await page.locator('input[name="file"]').setInputFiles(uploadPath);
  await expect(page.getByLabel("Slug")).toHaveValue(`${slug}-2`);

  await page.goto(managementUrl);
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Delete E2E Static Site?");
    await dialog.accept();
  });
  await page.getByRole("button", { name: /^delete site$/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("E2E Static Site was deleted.")).toBeVisible();
  await expect(page.getByRole("button", { name: /E2E Static Site/ })).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});
