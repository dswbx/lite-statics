const inflightQueries = new Map<string, Promise<unknown>>();

export async function dedupeInflight<T>(key: string | undefined, fn: () => Promise<T>): Promise<T> {
  if (!key) return fn();
  const existing = inflightQueries.get(key);
  if (existing) return existing as Promise<T>;
  const promise = fn().finally(() => {
    inflightQueries.delete(key);
  });
  inflightQueries.set(key, promise);
  return promise;
}
