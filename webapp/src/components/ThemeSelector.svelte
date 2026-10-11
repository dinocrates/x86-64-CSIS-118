<script lang="ts">
  import { themeMode, type ThemeMode } from '../core/displayPreferences';

  function changeTheme(event: Event) {
    themeMode.set((event.target as HTMLSelectElement).value as ThemeMode);
  }
</script>

<label class="theme-selector">
  Theme
  <select aria-label="Color theme" value={$themeMode} on:change={changeTheme}>
    <option value="dark">Dark</option>
    <option value="light">Light</option>
    <option value="high-contrast">High Contrast</option>
  </select>
</label>

<style>
  .theme-selector {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--color-gray-150);
    font-size: 0.8rem;
  }
  select {
    height: 2rem;
    padding: 0 0.3rem;
    border: 1px solid var(--color-gray-t);
    border-radius: 4px;
    background: var(--theme-bg);
    color: var(--color-gray-100);
    font: inherit;
    cursor: pointer;
  }
</style>
