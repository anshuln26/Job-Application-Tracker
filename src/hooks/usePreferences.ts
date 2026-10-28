import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark' | 'system';
interface Prefs {
  theme: Theme;
  currency: string;
}

const KEYS = { theme: 'applytrack:theme', currency: 'applytrack:currency' } as const;
const listeners = new Set<() => void>();

function read(): Prefs {
  try {
    return {
      theme: (localStorage.getItem(KEYS.theme) as Theme) || 'system',
      currency: localStorage.getItem(KEYS.currency) || 'INR',
    };
  } catch {
    return { theme: 'system', currency: 'INR' };
  }
}

let snapshot = read();

export function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

function write<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  try {
    localStorage.setItem(KEYS[key], value);
  } catch {
    // preference just won't persist
  }
  snapshot = { ...snapshot, [key]: value };
  if (key === 'theme') applyTheme(value as Theme);
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function usePreferences() {
  const prefs = useSyncExternalStore(subscribe, () => snapshot);
  return {
    ...prefs,
    setTheme: (t: Theme) => write('theme', t),
    setCurrency: (c: string) => write('currency', c),
  };
}
