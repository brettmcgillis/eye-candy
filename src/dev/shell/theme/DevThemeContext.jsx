import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { CLASSIC_THEME_TOKENS, generateThemeTokens } from './generateDevTheme';

const GRADIENTS_ENDPOINT = '/dev-api/gradients';
const STORAGE_KEY = 'eyeCandy.devTheme';
const CLASSIC_THEME_ID = 'classic';

const DevThemeContext = createContext(null);

function readStoredThemeId() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? CLASSIC_THEME_ID;
  } catch {
    return CLASSIC_THEME_ID;
  }
}

function writeStoredThemeId(themeId) {
  try {
    window.localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // Storage unavailable (private mode, disabled cookies, etc). Ignore.
  }
}

export function DevThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(readStoredThemeId);
  const [gradients, setGradients] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadGradients() {
      try {
        const response = await fetch(GRADIENTS_ENDPOINT);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || cancelled) return;
        setGradients(Array.isArray(payload.gradients) ? payload.gradients : []);
      } catch {
        // Theme palette source unavailable; classic tokens stay in effect.
      }
    }

    loadGradients();
    return () => {
      cancelled = true;
    };
  }, []);

  const themeOptions = useMemo(
    () => [
      { colors: null, id: CLASSIC_THEME_ID, label: 'Dev Classic' },
      ...gradients.map((gradient) => ({
        colors: gradient.colors,
        id: gradient.name,
        label: gradient.name,
      })),
    ],
    [gradients]
  );

  const activeOption =
    themeOptions.find((option) => option.id === themeId) ?? themeOptions[0];

  const tokens = useMemo(() => {
    if (!activeOption || activeOption.id === CLASSIC_THEME_ID) {
      return CLASSIC_THEME_TOKENS;
    }
    return generateThemeTokens(activeOption.colors) ?? CLASSIC_THEME_TOKENS;
  }, [activeOption]);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(tokens).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [tokens]);

  const setTheme = useCallback((nextThemeId) => {
    setThemeId(nextThemeId);
    writeStoredThemeId(nextThemeId);
  }, []);

  const value = useMemo(
    () => ({
      setTheme,
      themeId: activeOption?.id ?? CLASSIC_THEME_ID,
      themeOptions,
    }),
    [activeOption, themeOptions]
  );

  return (
    <DevThemeContext.Provider value={value}>
      {children}
    </DevThemeContext.Provider>
  );
}

export function useDevTheme() {
  const context = useContext(DevThemeContext);
  if (!context) {
    throw new Error('useDevTheme must be used within a DevThemeProvider');
  }
  return context;
}
