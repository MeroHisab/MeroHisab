import React, { createContext, useContext, useEffect, useState } from 'react';

export const ACCENTS = [
  { name: 'Royal Blue', value: '#2F5BEA' },
  { name: 'Emerald', value: '#12935F' },
  { name: 'Violet', value: '#7442D8' },
  { name: 'Rose', value: '#D6336C' },
  { name: 'Orange', value: '#E8590C' },
  { name: 'Teal', value: '#0E8F9E' },
  { name: 'Slate', value: '#3D4B66' },
];

const KEY = 'merohisab_theme';
const DEFAULTS = { mode: 'light', accent: ACCENTS[0].value };

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return DEFAULTS;
  }
}

function apply({ mode, accent }) {
  const root = document.documentElement;
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  root.style.setProperty('--accent', accent);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const t = load();
    apply(t);
    return t;
  });

  useEffect(() => {
    apply(theme);
    try { localStorage.setItem(KEY, JSON.stringify(theme)); } catch { /* storage unavailable */ }
    if (theme.mode !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply(theme);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const value = {
    ...theme,
    setMode: (mode) => setTheme((t) => ({ ...t, mode })),
    setAccent: (accent) => setTheme((t) => ({ ...t, accent })),
    reset: () => setTheme(DEFAULTS),
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
