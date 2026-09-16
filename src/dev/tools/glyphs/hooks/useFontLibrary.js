import { useCallback, useEffect, useState } from 'react';

const FONTS_ENDPOINT = '/dev-api/glyphs/fonts';

async function readJson(response) {
  const body = await response.json();
  if (!response.ok || !body.ok) {
    throw new Error(body.message || `Request failed (${response.status}).`);
  }
  return body;
}

export default function useFontLibrary() {
  const [state, setState] = useState({ entries: [], error: '', loading: true });

  const refresh = useCallback(async () => {
    try {
      const { fonts } = await readJson(await fetch(FONTS_ENDPOINT));
      setState({ entries: fonts, error: '', loading: false });
      return fonts;
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.message,
        loading: false,
      }));
      return [];
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (font) => {
      const body = await readJson(
        await fetch(FONTS_ENDPOINT, {
          body: JSON.stringify({ font }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
      );
      await refresh();
      return body;
    },
    [refresh]
  );

  return { ...state, refresh, save };
}
