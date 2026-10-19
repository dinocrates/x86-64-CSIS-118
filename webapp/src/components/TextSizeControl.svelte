<script lang="ts">
  import type { Writable } from 'svelte/store';

  export let value: Writable<number>;
  export let sizes: number[];
  export let groupLabel: string;
  export let selectLabel: string;
  export let decreaseLabel: string;
  export let increaseLabel: string;

  function changeSize(event: Event) {
    value.set(Number((event.target as HTMLSelectElement).value));
  }
</script>

<div class="text-size" role="group" aria-label={groupLabel}>
  <button
    type="button"
    aria-label={decreaseLabel}
    title={decreaseLabel}
    disabled={$value === sizes[0]}
    on:click={() => value.update((size) => size - 2)}
  >A−</button>
  <select aria-label={selectLabel} value={$value} on:change={changeSize}>
    {#each sizes as size}
      <option value={size}>{size} px</option>
    {/each}
  </select>
  <button
    type="button"
    aria-label={increaseLabel}
    title={increaseLabel}
    disabled={$value === sizes[sizes.length - 1]}
    on:click={() => value.update((size) => size + 2)}
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
  button:hover:not(:disabled) { background: var(--color-gray-400); color: var(--color-gray-0); }
  button:disabled { opacity: 0.4; cursor: default; }
</style>
