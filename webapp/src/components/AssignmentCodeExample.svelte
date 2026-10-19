<script lang="ts">
  import type { AssignmentCodeExample } from '../assignments/types';
  import { highlightText } from 'prism-code-editor/prism';
  import 'prism-code-editor/prism/languages/nasm';

  export let example: AssignmentCodeExample;
  $: html = highlightText(example.code.replace(/\n+$/, ''), 'nasm');
</script>

<figure class="code-example">
  <figcaption class="code-example__title">{example.title}</figcaption>
  <pre class="code-example__block code-example__code"><code>{@html html}</code></pre>
  {#if example.sampleInput}
    <p class="code-example__label">Sample input</p>
    <pre class="code-example__block code-example__plain">{example.sampleInput}</pre>
  {/if}
  {#if example.output}
    <p class="code-example__label">Expected output</p>
    <pre class="code-example__block code-example__plain">{example.output}</pre>
  {/if}
</figure>

<style>
  /* This block intentionally renders with a fixed a11y-dark palette in
     every app theme, matching the course's Canvas code-block treatment,
     rather than the editor's theme-adaptive syntax colors. */
  .code-example { margin: 0.5rem 0 1rem; }
  .code-example__title {
    font-weight: 600;
    font-size: 0.85rem;
    margin: 0 0 0.3rem;
  }
  .code-example__label {
    font-weight: 600;
    font-size: 0.8rem;
    margin: 0.6rem 0 0.25rem;
  }
  .code-example__block {
    background: #2b2b2b;
    color: #f8f8f2;
    font-family: var(--code-font-family, Consolas, "Liberation Mono", monospace);
    font-size: 0.82rem;
    line-height: 1.55;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 0;
    white-space: pre;
    -webkit-user-select: text;
    user-select: text;
  }
  .code-example__code :global(.token) {
    text-shadow: none !important;
    box-shadow: none !important;
    filter: none !important;
    font-weight: 400 !important;
    font-family: inherit !important;
  }
  .code-example__code :global(.token.comment) { color: #d4d0ab !important; }
  .code-example__code :global(.token.keyword) { color: #ffa07a !important; }
  .code-example__code :global(.token.string) { color: #abe338 !important; }
  .code-example__code :global(.token.number) { color: #f5ab35 !important; }
  .code-example__code :global(.token.variable) { color: #ffd700 !important; }
  .code-example__code :global(.token.function) { color: #66d9ef !important; }
</style>
