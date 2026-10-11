import { writable } from 'svelte/store';

export const editorFontSizes = Array.from({ length: 15 }, (_, index) => 12 + index * 2);

// Display preferences belong to this browser, separate from source autosaves
// and submission links. Storage may be unavailable in an embedded playground.
function preference<T>(key: string, fallback: T, valid: (value: unknown) => boolean) {
  let initial = fallback;
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (valid(saved)) initial = saved as T;
  } catch { /* Use the default when storage is unavailable or invalid. */ }

  const store = writable(initial);
  store.subscribe((value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* Controls still work for the current session. */ }
  });
  return store;
}

export const assignmentDetailsCollapsed = preference(
  'csis118b.display.assignmentDetailsCollapsed', false,
  (value) => typeof value === 'boolean',
);

export const editorFontSize = preference(
  'csis118b.display.editorFontSize', 16,
  (value) => typeof value === 'number' && editorFontSizes.includes(value),
);

export type ThemeMode = 'dark' | 'light' | 'high-contrast';

export const themeMode = preference<ThemeMode>(
  'csis118b.display.theme', 'dark',
  (value) => value === 'dark' || value === 'light' || value === 'high-contrast',
);
