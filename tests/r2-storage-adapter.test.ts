import { describe, expect, it } from "vitest";
import { R2StorageAdapter } from "../src/worker/storage/r2-adapter";

type StoredObject = {
  body: ArrayBuffer;
  contentType: string;
  cacheControl: string;
  uploaded: Date;
  etag: string;
};

function createMockR2Bucket(store = new Map<string, StoredObject>()): R2Bucket {
  return {
    async get(key: string) {
      const object = store.get(key);
      if (!object) return null;
      return {
        key,
        size: object.body.byteLength,
        uploaded: object.uploaded,
        httpEtag: object.etag,
        httpMetadata: {
          contentType: object.contentType,
          cacheControl: object.cacheControl,
        },
        async arrayBuffer() {
          return object.body.slice(0);
        },
        get body() {
          return new ReadableStream({
            start(controller) {
              controller.enqueue(new Uint8Array(object.body));
              controller.close();
            },
          });
        },
      };
    },
    async head(key: string) {
      const object = store.get(key);
      if (!object) return null;
      return {
        key,
        size: object.body.byteLength,
        uploaded: object.uploaded,
        httpEtag: object.etag,
        httpMetadata: {
          contentType: object.contentType,
          cacheControl: object.cacheControl,
        },
      };
    },
    async put(key: string, value: ArrayBuffer | Uint8Array, options?: R2PutOptions) {
      const bytes = value instanceof ArrayBuffer ? value : value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
      const etag = `"mock-${key}"`;
      store.set(key, {
        body: bytes,
        contentType: options?.httpMetadata?.contentType ?? "application/octet-stream",
        cacheControl: options?.httpMetadata?.cacheControl ?? "no-cache",
        uploaded: new Date(),
        etag,
      });
      return {
        key,
        size: bytes.byteLength,
        uploaded: new Date(),
        httpEtag: etag,
        httpMetadata: options?.httpMetadata,
      };
    },
    async delete(key: string) {
      store.delete(key);
    },
  } as R2Bucket;
}

describe("R2StorageAdapter", () => {
  it("uploads and reads object bytes", async () => {
    const adapter = new R2StorageAdapter(createMockR2Bucket());
    const body = new TextEncoder().encode("<html></html>");

    await adapter.uploadObject("site-assets", "site-1/index.html", undefined, body, "text/html", "no-cache");
    const bytes = await adapter.readBytes("site-1/index.html");

    expect(bytes).not.toBeNull();
    expect(new TextDecoder().decode(bytes!)).toBe("<html></html>");
  });

  it("deletes objects by key", async () => {
    const store = new Map<string, StoredObject>();
    const adapter = new R2StorageAdapter(createMockR2Bucket(store));
    const body = new TextEncoder().encode("delete-me");

    await adapter.uploadObject("site-assets", "site-1/old.css", undefined, body, "text/css", "no-cache");
    await adapter.deleteObject("site-assets", "site-1/old.css", undefined);

    expect(await adapter.readBytes("site-1/old.css")).toBeNull();
  });

  it("copies objects within the bucket", async () => {
    const adapter = new R2StorageAdapter(createMockR2Bucket());
    const body = new TextEncoder().encode("copy-me");

    await adapter.uploadObject("site-assets", "site-1/source.txt", undefined, body, "text/plain", "no-cache");
    await adapter.copyObject("site-assets", "site-1/source.txt", undefined, "site-1/dest.txt", undefined);

    expect(await adapter.readBytes("site-1/dest.txt")).not.toBeNull();
  });

  it("returns 304 when If-None-Match matches", async () => {
    const adapter = new R2StorageAdapter(createMockR2Bucket());
    const body = new TextEncoder().encode("cached");

    const uploaded = await adapter.uploadObject(
      "site-assets",
      "site-1/index.html",
      undefined,
      body,
      "text/html",
      "no-cache",
    );

    const response = await adapter.getObject("site-assets", "site-1/index.html", undefined, {
      ifNoneMatch: uploaded.eTag,
    });

    expect(response.httpStatusCode).toBe(304);
    expect(response.body).toBeUndefined();
  });
});
