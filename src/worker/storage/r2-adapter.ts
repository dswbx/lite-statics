import type { R2Bucket, R2ObjectBody } from "@cloudflare/workers-types";

export interface ObjectMetadata {
  cacheControl: string;
  contentLength: number;
  size: number;
  mimetype: string;
  lastModified?: Date;
  eTag: string;
  contentRange?: string;
  httpStatusCode?: number;
}

export interface BrowserCacheHeaders {
  ifModifiedSince?: string;
  ifNoneMatch?: string;
  range?: string;
}

export interface ObjectResponse {
  metadata: ObjectMetadata;
  httpStatusCode: number;
  body?: ReadableStream;
}

type UploadBody = ReadableStream | ArrayBuffer | Uint8Array;

function r2Key(_bucketName: string, key: string): string {
  return key;
}

function metadataFromObject(object: R2ObjectBody, contentType: string, cacheControl: string): ObjectMetadata {
  return {
    cacheControl: object.httpMetadata?.cacheControl ?? cacheControl,
    contentLength: object.size,
    size: object.size,
    mimetype: object.httpMetadata?.contentType ?? contentType,
    lastModified: object.uploaded,
    eTag: object.httpEtag,
    httpStatusCode: 200,
  };
}

async function bodyToArrayBuffer(body: UploadBody): Promise<ArrayBuffer | Uint8Array> {
  if (body instanceof ArrayBuffer) return body;
  if (body instanceof Uint8Array) return body;
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

export class R2StorageAdapter {
  driver: R2Bucket;

  constructor(bucket: R2Bucket) {
    this.driver = bucket;
  }

  async readBytes(key: string): Promise<ArrayBuffer | null> {
    const object = await this.driver.get(key);
    return object ? object.arrayBuffer() : null;
  }

  async getObject(
    bucketName: string,
    key: string,
    _version: string | undefined,
    headers?: BrowserCacheHeaders,
  ): Promise<ObjectResponse> {
    const object = await this.driver.get(r2Key(bucketName, key));
    if (!object) {
      return {
        httpStatusCode: 404,
        metadata: {
          cacheControl: "no-cache",
          contentLength: 0,
          size: 0,
          mimetype: "application/octet-stream",
          eTag: "",
          httpStatusCode: 404,
        },
      };
    }

    const metadata = metadataFromObject(
      object,
      object.httpMetadata?.contentType ?? "application/octet-stream",
      object.httpMetadata?.cacheControl ?? "no-cache",
    );

    if (headers?.ifNoneMatch && headers.ifNoneMatch === metadata.eTag) {
      return { httpStatusCode: 304, metadata };
    }

    if (headers?.ifModifiedSince && metadata.lastModified) {
      const since = new Date(headers.ifModifiedSince);
      if (metadata.lastModified <= since) {
        return { httpStatusCode: 304, metadata };
      }
    }

    return {
      httpStatusCode: 200,
      metadata,
      body: object.body ?? undefined,
    };
  }

  async uploadObject(
    bucketName: string,
    key: string,
    _version: string | undefined,
    body: UploadBody,
    contentType: string,
    cacheControl: string,
  ): Promise<ObjectMetadata> {
    const uploadBody = await bodyToArrayBuffer(body);
    const object = await this.driver.put(r2Key(bucketName, key), uploadBody, {
      httpMetadata: { contentType, cacheControl },
    });

    return {
      cacheControl,
      contentLength: uploadBody.byteLength,
      size: uploadBody.byteLength,
      mimetype: contentType,
      lastModified: object.uploaded,
      eTag: object.httpEtag,
      httpStatusCode: 200,
    };
  }

  async deleteObject(bucketName: string, key: string, _version: string | undefined): Promise<void> {
    await this.driver.delete(r2Key(bucketName, key));
  }

  async deleteObjects(bucketName: string, prefixes: string[]): Promise<void> {
    await Promise.all(prefixes.map((key) => this.deleteObject(bucketName, key, undefined)));
  }

  async copyObject(
    bucketName: string,
    source: string,
    _version: string | undefined,
    destination: string,
    _destinationVersion: string | undefined,
  ): Promise<Pick<ObjectMetadata, "httpStatusCode" | "eTag" | "lastModified">> {
    const object = await this.driver.get(r2Key(bucketName, source));
    if (!object) {
      throw new Error(`R2 copy failed: source object not found (${source})`);
    }

    const contentType = object.httpMetadata?.contentType ?? "application/octet-stream";
    const cacheControl = object.httpMetadata?.cacheControl ?? "no-cache";
    const body = object.body ? await bodyToArrayBuffer(object.body) : await object.arrayBuffer();
    const copied = await this.driver.put(r2Key(bucketName, destination), body, {
      httpMetadata: { contentType, cacheControl },
    });

    return {
      httpStatusCode: 200,
      eTag: copied.httpEtag,
      lastModified: copied.uploaded,
    };
  }

  async headObject(
    bucketName: string,
    key: string,
    _version: string | undefined,
  ): Promise<ObjectMetadata> {
    const object = await this.driver.head(r2Key(bucketName, key));
    if (!object) {
      throw new Error(`R2 HEAD failed: object not found (${key})`);
    }

    return {
      cacheControl: object.httpMetadata?.cacheControl ?? "no-cache",
      contentLength: object.size,
      size: object.size,
      mimetype: object.httpMetadata?.contentType ?? "application/octet-stream",
      lastModified: object.uploaded,
      eTag: object.httpEtag,
      httpStatusCode: 200,
    };
  }

  async privateAssetUrl(
    _bucketName: string,
    _key: string,
    _version: string | undefined,
  ): Promise<string> {
    throw new Error("privateAssetUrl is not supported for the R2 binding adapter");
  }
}
