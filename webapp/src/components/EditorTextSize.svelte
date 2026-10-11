<script lang="ts">
  import { editorFontSize, editorFontSizes } from '../core/displayPreferences';

  function changeSize(event: Event) {
    editorFontSize.set(Number((event.target as HTMLSelectElement).value));
  }
</script>

<div class="text-size" role="group" aria-label="Code editor text size">
  <button
    type="button"
    aria-label="Decrease editor text size"
    title="Decrease editor text size"
    disabled={$editorFontSize === editorFontSizes[0]}
    on:click={() => editorFontSize.update((size) => size - 2)}
  >A−</button>
  <select aria-label="Editor text size" value={$editorFontSize} on:change={changeSize}>
    {#each editorFontSizes as size}
      <option value={size}>{size} px</option>
    {/each}
  </select>
  <button
    type="button"
    aria-label="Increase editor text size"
    title="Increase editor text size"
    disabled={$editorFontSize === editorFontSizes[editorFontSizes.length - 1]}
    on:click={() => editorFontSize.update((size) => size + 2)}
  >A+</button>
</div>

<style>
  .text-size { display: flex; align-items: center; gap: 0.2rem; }
  button, select {
    height: 2rem;
    border: 1px solid var(--color-gray-t);
    border-radius: 4px;
    background: var(--theme-bg);
    color: var(--color-gray-100);
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }
  button { min-width: 2rem; padding: 0 0.3rem; }
  select { padding: 0 0.2rem; }
  button:hover:not(:disabled) { background: var(--color-gray-400); color: white; }
  button:disabled { opacity: 0.4; cursor: default; }
</style>
