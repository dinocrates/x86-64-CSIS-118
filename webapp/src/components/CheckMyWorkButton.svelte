<script lang="ts">
  import { selectedAssignment } from '../core/store';
  import { checkRun, startCheckMyWork } from '../testing/reportStore';

  $: running = $checkRun.status === 'running';
</script>

<button
  type="button"
  class="button checkbt"
  disabled={!$selectedAssignment || running}
  aria-busy={running}
  title={$selectedAssignment
    ? 'Run the practice checks for this assignment'
    : 'Select an assignment to run its practice checks'}
  on:click={() => startCheckMyWork()}
>
  {#if running}
    <span class="checkbt__spinner" aria-hidden="true"></span>
    Checking…
  {:else}
    Check My Work
  {/if}
</button>

<style>
  .checkbt {
    border-color: var(--theme-primary);
    font-weight: 600;
    gap: 0.4rem;
  }
  .checkbt:disabled {
    border-color: var(--color-gray-t);
  }
  .checkbt__spinner {
    width: 0.9rem;
    height: 0.9rem;
    flex-shrink: 0;
    border-radius: 50%;
    border: 2px solid var(--color-gray-t);
    border-top-color: var(--theme-primary);
    animation: checkbt-spin 0.8s linear infinite;
  }
  @keyframes checkbt-spin {
    to { transform: rotate(360deg); }
  }
</style>
