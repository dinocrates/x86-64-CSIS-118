<script lang="ts">
  import Clipboard from './icons/Clipboard.svelte';
  import { copyTextToClipboard } from '../core/utils';
  import { buildShareLink, classifyShareLinkLength } from '../core/shareLink';

  type Status = 'idle' | 'copied' | 'too-long';
  let status: Status = 'idle';
  let resetTimer: ReturnType<typeof setTimeout>;

  function handleClick() {
    const link = buildShareLink();
    clearTimeout(resetTimer);
    if (classifyShareLinkLength(link.length) === 'too-long') {
      status = 'too-long';
      resetTimer = setTimeout(() => (status = 'idle'), 5000);
      return;
    }
    copyTextToClipboard(link);
    status = 'copied';
    resetTimer = setTimeout(() => (status = 'idle'), 2000);
  }
</script>

<div class="submitlink">
  <button
    type="button"
    class="button button--secondary"
    on:click={handleClick}
    title="Copy a link that reopens this exact code in this assignment — paste it as your Canvas submission"
  >
    <Clipboard aria-hidden="true" focusable="false" width="16px" height="16px" />
    {#if status === 'copied'}
      Link copied!
    {:else if status === 'too-long'}
      Too large to copy
    {:else}
      Copy Submission Link
    {/if}
  </button>
  <span class="visually-hidden" role="status">
    {#if status === 'copied'}Submission link copied to clipboard.{/if}
  </span>
  {#if status === 'too-long'}
    <p class="submitlink__warning" role="alert">
      This program is too large to share as a link. Download your .asm
      file (Ctrl+S) and submit that in Canvas instead.
    </p>
  {/if}
</div>

<style>
  .submitlink {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .submitlink__warning {
    margin: 0;
    max-width: 20rem;
    font-size: 0.75rem;
    line-height: 1.4;
    color: var(--color-gold-50);
  }
</style>
