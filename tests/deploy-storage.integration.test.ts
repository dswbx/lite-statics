import { createTestHarness } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signUpAndConfirm } from "./helpers/auth";
import { SITE_ASSETS_BUCKET } from "../src/worker/storage/constants";

const apikey = "local-dev-key";
const testWorker = {
  configPath: "./wrangler.test.jsonc",
  vars: { EMAIL_FROM_ADDRESS: "", JWT_SECRET: "test-jwt-secret" },
};

function multipartDeployBody(filename: string, contentType: string, contents: string) {
  const boundary = `vitest-${crypto.randomUUID()}`;
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    `Content-Type: ${contentType}`,
    "",
    contents,
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return {
    body,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

describe("deploy storage integration", () => {
  const server = createTestHarness({
    workers: [testWorker],
  });

  beforeAll(async () => {
    await server.listen();
    await server.getWorker().applyD1Migrations("DB");
  });

  afterAll(async () => {
    await server.close();
  });

  async function signUp() {
    const email = `deploy-storage-${crypto.randomUUID()}@example.com`;
    const env = await server.getWorker().getEnv();
    const { confirm } = await signUpAndConfirm(
      env.DB,
      server.fetch.bind(server),
      email,
      "password12345",
    );
    return confirm.body;
  }

  async function createSite(session: { access_token: string; user: { id: string } }, slug: string) {
    const response = await server.fetch("http://example.com/rest/v1/sites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey,
        authorization: `Bearer ${session.access_token}`,
        prefer: "return=representation",
      },
      body: JSON.stringify({
        owner_id: session.user.id,
        name: "Storage test site",
        slug,
        access_mode: "public",
      }),
    });
    expect(response.status).toBe(201);
    const rows = (await response.json()) as Array<{ id: string; slug: string }>;
    return rows[0]!;
  }

  it("deploys assets through SupaLite storage and serves them publicly", async () => {
    const session = await signUp();
    const slug = `storage-site-${crypto.randomUUID().slice(0, 8)}`;
    const site = await createSite(session, slug);
    const html = `<!doctype html><title>Storage deploy</title><h1>SupaLite storage works</h1>`;
    const upload = multipartDeployBody("index.html", "text/html", html);

    const deployResponse = await server.fetch(`http://example.com/api/sites/${site.id}/deploy`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "content-type": upload.contentType,
      },
      body: upload.body,
    });

    if (deployResponse.status !== 201) {
      throw new Error(`deploy failed: ${deployResponse.status} ${await deployResponse.text()}`);
    }

    expect(deployResponse.status).toBe(201);
    const deployBody = (await deployResponse.json()) as {
      site: { assetCount: number | null; assets: Array<{ pathname: string }> };
      publicUrl: string;
    };
    expect(deployBody.site.assetCount).toBe(1);
    expect(deployBody.site.assets[0]?.pathname).toBe("/index.html");
    expect(deployBody.publicUrl).toBe(`/s/${slug}/`);

    const bucketResponse = await server.fetch("http://example.com/storage/v1/bucket", {
      headers: {
        apikey,
        authorization: `Bearer ${session.access_token}`,
      },
    });
    expect(bucketResponse.status).toBe(200);
    const buckets = (await bucketResponse.json()) as Array<{ id: string }>;
    expect(buckets.some((bucket) => bucket.id === SITE_ASSETS_BUCKET)).toBe(true);

    const listResponse = await server.fetch(`http://example.com/storage/v1/object/list/${SITE_ASSETS_BUCKET}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey,
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ prefix: `${site.id}/`, limit: 100, offset: 0 }),
    });
    expect(listResponse.status).toBe(200);
    const objects = (await listResponse.json()) as Array<{ name: string }>;
    expect(objects.some((object) => object.name === `${site.id}/index.html`)).toBe(true);

    const publicResponse = await server.fetch(`http://example.com/s/${slug}/`);
    expect(publicResponse.status).toBe(200);
    expect(await publicResponse.text()).toContain("SupaLite storage works");
  });

  it("blocks internal storage tables over rest/v1", async () => {
    const response = await server.fetch("http://example.com/rest/v1/storage.objects?select=*", {
      headers: { apikey },
    });
    expect(response.status).toBe(404);
  });
});
