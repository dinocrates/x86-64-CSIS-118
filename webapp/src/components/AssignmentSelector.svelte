<script lang="ts">
  import { assignments } from '../assignments/assignments';
  import {
    assignmentId,
    blinkStore,
    selectedAssignment,
    urlAssignmentNotFound,
  } from '../core/store';
  import { dismissCheckResults } from '../testing/reportStore';
  import CheckMyWorkButton from './CheckMyWorkButton.svelte';
  import CopySubmissionLinkButton from './CopySubmissionLinkButton.svelte';

  function handleSelect(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    blinkStore.selectAssignment(value === '' ? null : value);
    // results from the previous assignment no longer apply
    dismissCheckResults();
  }

  function handleReset() {
    if (!$selectedAssignment) return;
    const confirmed = window.confirm(
      'This will replace your current code with the original starter code ' +
        'for this assignment. Download your current code first if you want ' +
        'to keep it. Continue?'
    );
    if (!confirmed) return;
    blinkStore.resetToStarterCode();
  }
</script>

<div class="assignment">
  {#if $urlAssignmentNotFound}
    <p class="assignment__warning" role="status">
      The requested assignment could not be found. The playground opened normally.
      <button
        type="button"
        class="assignment__dismiss"
        on:click={() => urlAssignmentNotFound.set(false)}
      >Dismiss</button>
    </p>
  {/if}

  <div class="assignment__row">
    <label class="assignment__label" for="assignment-select">Assignment</label>
    <select
      id="assignment-select"
      class="assignment__select"
      value={$assignmentId ?? ''}
      on:change={handleSelect}
    >
      <option value="">Free practice — no assignment</option>
      {#each assignments as assignment (assignment.id)}
        <option value={assignment.id}>{assignment.title}</option>
      {/each}
    </select>
  </div>

  {#if $selectedAssignment}
    <p class="assignment__description">{$selectedAssignment.description}</p>
    <div class="assignment__row assignment__actions">
      <CheckMyWorkButton />
      <CopySubmissionLinkButton />
      <button
        type="button"
        class="button button--secondary"
        on:click={handleReset}
      >
        Reset to Starter Code
      </button>
    </div>
    <p class="assignment__submitnote">
      When you're finished, click <strong>Copy Submission Link</strong> and
      paste it into Canvas.
    </p>
  {/if}
</div>

<style>
  .assignment {
    padding: 0.5rem 1rem;
    background-color: var(--theme-panel-controls-bg);
    border-bottom: 1px solid var(--theme-panel-border);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .assignment__row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .assignment__label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-gray-150);
    flex-shrink: 0;
  }
  .assignment__select {
    flex: 1;
    min-width: 12rem;
    height: 2rem;
    font-size: 0.9rem;
    color: white;
    background-color: var(--theme-bg);
    border: 1px solid var(--color-gray-t);
    border-radius: 4px;
    padding: 0 0.4rem;
    cursor: pointer;
  }
  .assignment__description {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.4;
    color: var(--color-gray-150);
  }
  .assignment__actions {
    margin-top: 0.1rem;
  }
  .assignment__submitnote {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-gray-200);
  }
  .assignment__warning {
    margin: 0;
    padding: 0.3rem 0.6rem;
    font-size: 0.85rem;
    background-color: var(--theme-exitcodeinfo-bg);
    color: var(--theme-exitcodeinfo-fg);
    border: 1px solid var(--theme-exitcodeinfo-border);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .assignment__dismiss {
    background: transparent;
    border: 1px solid var(--color-gray-t);
    border-radius: 4px;
    color: inherit;
    cursor: pointer;
    font-size: 0.75rem;
    padding: 0.1rem 0.5rem;
    flex-shrink: 0;
  }
</style>
