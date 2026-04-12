<script lang="ts">
  import { saveStatus } from '../core/store';

  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

{#if $saveStatus.dirty}
  <span class="status status--unsaved">Unsaved changes</span>
{:else if $saveStatus.savedAt}
  <span class="status status--saved">Auto-saved at {formatTime($saveStatus.savedAt)}</span>
{/if}

<style>
  .status {
    font-size: 0.72rem;
    white-space: nowrap;
    user-select: none;
  }
  .status--unsaved {
    color: var(--color-gold-50);
  }
  .status--saved {
    color: var(--color-gray-200);
  }
</style>
