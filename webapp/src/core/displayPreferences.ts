import { writable } from 'svelte/store';

// 12px up to 72px, even (72 so a 4K-monitor recording can go large and
// still stay readable once a video gets scaled down for viewers).
export const editorFontSizes = Array.from({ length: 31 }, (_, index) => 12 + index * 2);

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

// Shared across Registers/Disassembly/Stack memory/Terminal - one size for
// all of them, separate from the code editor's own size, so bumping it up
// for a recording doesn't require adjusting four controls individually.
export const debugPanelFontSize = preference(
  'csis118b.display.debugPanelFontSize', 16,
  (value) => typeof value === 'number' && editorFontSizes.includes(value),
);

export type ThemeMode = 'dark' | 'light' | 'high-contrast';

export const themeMode = preference<ThemeMode>(
  'csis118b.display.theme', 'dark',
  (value) => value === 'dark' || value === 'light' || value === 'high-contrast',
);
