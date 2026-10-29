'use client';

import { useCallback, useEffect, useState } from 'react';

export default function useSupervisorData(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    // Effect cleanup also runs during development effect replay. Ignore obsolete
    // results without aborting the request while the next render starts loading.
    let active = true;
    setLoading(true);
    setError('');

    async function load() {
      try {
        const response = await fetch(endpoint, { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load this information. Please try again.');
        if (active) setData(result);
      } catch (err) {
        if (active) setError(err instanceof SyntaxError ? 'The server returned an unexpected response. Please try again.' : err?.message || 'Unable to connect. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [endpoint, version]);

  return { data, loading, error, reload };
}
