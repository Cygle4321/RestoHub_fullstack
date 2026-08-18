import { useCallback, useEffect, useState } from "react";

/**
 * Hook générique pour charger des données API.
 * @param {() => Promise<any>} fetcher
 * @param {{ immediate?: boolean, deps?: any[] }} options
 */
export function useApi(fetcher, options = {}) {
  const { immediate = true, deps = [] } = options;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(immediate);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      return result;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!immediate) return;
    reload().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps]);

  return { data, error, loading, reload, setData };
}
