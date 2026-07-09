import { expect, test } from "@playwright/test";
import JSZip from "jszip";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("opens a password-protected site after entering the correct password", async ({ page }, testInfo) => {
  const unique = `${Date.now()}-${testInfo.workerIndex}`;
  const slug = `private-harbor-${unique}`;
  const accountPassword = `password-${unique}`;
  const sitePassword = `site-${unique}`;
  const uploadedHeading = `Private static content ${unique}`;
  const uploadPath = join(tmpdir(), `private-harbor-${unique}.zip`);

  const zip = new JSZip();
  zip.file("index.html", `<!doctype html><title>Private E2E</title><h1>${uploadedHeading}</h1>`);
  await writeFile(uploadPath, Buffer.from(await zip.generateAsync({ type: "uint8array" })));

  await page.goto("/");
  await page.getByRole("button", { name: /sign up to upload/i }).click();
  await page.getByLabel("Email").fill(`e2e-${unique}@example.com`);
  await page.getByLabel("Password").fill(accountPassword);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("navigation", { name: "Dashboard" }).getByRole("button", { name: /new site/i }).click();
  await page.locator('input[name="file"]').setInputFiles(uploadPath);
  await page.getByLabel(/name optional/i).fill("Private E2E Site");
  await expect(page.getByLabel("Slug")).toHaveValue(slug);
  await page.getByRole("radio", { name: "Password" }).check();
  await page.getByPlaceholder("Required for password-protected sites").fill(sitePassword);
  await page.getByRole("button", { name: /create site and upload/i }).click();
  await expect(page.getByRole("heading", { name: "Private E2E Site" })).toBeVisible();
  await expect(page.getByLabel("Password protected")).toBeVisible();

  await page.goto(`/s/${slug}/`);
  await expect(page.getByRole("heading", { name: "Private site" })).toBeVisible();
  await page.locator('input[name="password"]').fill(sitePassword);
  const [unlockResponse] = await Promise.all([
    page.waitForResponse((response) => response.url().includes("/password") && response.request().method() === "POST"),
    page.getByRole("button", { name: /open site/i }).click(),
  ]);
  expect(unlockResponse.status()).toBe(303);
  const cookies = await page.context().cookies();
  expect(cookies.some((cookie) => cookie.name === "static_host_access")).toBe(true);
  await expect(page.getByRole("heading", { name: uploadedHeading })).toBeVisible();
});
