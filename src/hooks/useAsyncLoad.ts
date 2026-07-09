import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
} from "react";
import { dedupeInflight } from "../lib/dedupe-inflight";

export interface AsyncLoadOptions<T, E> {
  enabled?: boolean;
  initialData: T;
  initialError?: E;
  initialLoading?: boolean;
  // dedupe in-flight requests with the same key across hook instances and strict-mode remounts
  cacheKey?: string;
}

export interface AsyncLoadResult<T, E> {
  data: T;
  loading: boolean;
  error: E;
  reload: () => Promise<boolean>;
  setData: Dispatch<SetStateAction<T>>;
}

function isLoadSuccess<E>(error: E): boolean {
  if (typeof error === "boolean") return !error;
  return error === null || error === undefined;
}

export function useAsyncLoad<T, E = boolean>(
  load: () => Promise<{ data: T; error: E }>,
  deps: DependencyList,
  options: AsyncLoadOptions<T, E>,
): AsyncLoadResult<T, E> {
  const enabled = options.enabled ?? true;
  const initialError = (options.initialError ?? false) as E;

  const [data, setData] = useState<T>(options.initialData);
  const [loading, setLoading] = useState(options.initialLoading ?? enabled);
  const [error, setError] = useState<E>(initialError);

  const fetching = useRef(false);
  const generation = useRef(0);
  const loadRef = useRef(load);
  loadRef.current = load;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const reload = useCallback(async () => {
    const { initialData, cacheKey, enabled: optEnabled = true, initialError: optInitialError = false as E } =
      optionsRef.current;
    if (!optEnabled) {
      setData(initialData);
      setLoading(false);
      setError(optInitialError);
      return false;
    }
    if (fetching.current) return false;

    fetching.current = true;
    const gen = ++generation.current;
    setLoading(true);
    setError(optInitialError);

    const result = await dedupeInflight(cacheKey, () => loadRef.current());
    if (gen !== generation.current) return false;

    setData(result.data);
    setError(result.error);
    setLoading(false);
    fetching.current = false;
    return isLoadSuccess(result.error);
  }, []);

  useEffect(() => {
    if (!enabled) {
      generation.current += 1;
      fetching.current = false;
      setData(optionsRef.current.initialData);
      setLoading(false);
      setError(initialError);
      return;
    }

    fetching.current = false;
    void reload();

    return () => {
      generation.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller-owned query deps
  }, [enabled, reload, ...deps]);

  return { data, loading, error, reload, setData };
}
