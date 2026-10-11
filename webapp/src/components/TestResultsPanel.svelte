<script lang="ts">
  import { assignmentId } from '../core/store';
  import { downloadTestReport } from '../core/download';
  import { checkRun, dismissCheckResults } from '../testing/reportStore';
  import { MESSAGES } from '../testing/TestResultTypes';

  $: report = $checkRun.report;
  // never show results (or progress) that belong to a different assignment
  $: visible =
    $checkRun.status !== 'idle' &&
    $checkRun.forAssignmentId === $assignmentId;

  const statusMeta = {
    passed: { icon: '✅', label: 'Passed' },
    failed: { icon: '❌', label: 'Not passed' },
    blocked: { icon: '⚠️', label: 'Skipped' },
  };
</script>

{#if visible}
  <section class="results" aria-label="Check My Work results">
    <header class="results__header">
      <h2 class="results__title">Check My Work Results</h2>
      <button
        type="button"
        class="results__close"
        aria-label="Close Check My Work results"
        disabled={$checkRun.status === 'running'}
        on:click={dismissCheckResults}
      >✕</button>
    </header>

    {#if $checkRun.stale}
      <p role="status">Your code or assignment changed. Run Check My Work again for current results{#if $checkRun.status === 'running'} after the previous run finishes{/if}.</p>
    {:else if $checkRun.status === 'running'}
      <p class="results__running" role="status">
        <span class="results__spinner" aria-hidden="true"></span>
        {$checkRun.progressLabel || 'Running checks…'}
      </p>
    {:else if $checkRun.status === 'error'}
      <p class="results__errorbox" role="alert">{$checkRun.error}</p>
    {:else if report}
      {#if report.total === 0}
        <p class="results__summary" role="status">
          This assignment does not have practice checks yet.
        </p>
      {:else}
        <p class="results__summary" role="status">
          <strong>{report.passed} / {report.total}</strong> checks passed
          {#if report.blocked > 0}
            <span class="results__blockednote">({report.blocked} could not run)</span>
          {/if}
        </p>
        <ul class="results__list">
          {#each report.results as result (result.id)}
            <li class="results__item results__item--{result.status}">
              {#if result.status === 'passed'}
                <p class="results__row">
                  <span class="results__icon" aria-hidden="true">{statusMeta.passed.icon}</span>
                  <span class="visually-hidden">{statusMeta.passed.label}:</span>
                  <span class="results__name">{result.name}</span>
                </p>
              {:else}
                <details class="results__details">
                  <summary class="results__row results__row--summary">
                    <span class="results__icon" aria-hidden="true">{statusMeta[result.status].icon}</span>
                    <span class="visually-hidden">{statusMeta[result.status].label}:</span>
                    <span class="results__name">{result.name}</span>
                    <span class="results__statusword">{statusMeta[result.status].label}</span>
                  </summary>
                  <div class="results__body">
                    {#if result.message}
                      <p class="results__message">{result.message}</p>
                    {/if}
                    {#if result.expected !== undefined}
                      <p class="results__blocktitle">Expected:</p>
                      <pre class="results__pre">{result.expected}</pre>
                    {/if}
                    {#if result.actual !== undefined}
                      <p class="results__blocktitle">Actual:</p>
                      <pre class="results__pre">{result.actual}</pre>
                    {/if}
                    {#if result.hint}
                      <p class="results__hint"><strong>Hint:</strong> {result.hint}</p>
                    {/if}
                    {#if result.details && result.details.length > 0}
                      <pre class="results__pre results__pre--tech">{result.details.join('\n')}</pre>
                    {/if}
                  </div>
                </details>
              {/if}
            </li>
          {/each}
        </ul>
        <div class="results__footer">
          <button
            type="button"
            class="button button--secondary"
            on:click={() => downloadTestReport(report)}
          >
            Download Test Report
          </button>
        </div>
      {/if}
      {#if report.reminders?.length}
        <p><strong>Program checks and submission preparation are separate.</strong> Personalization still needed:</p>
        <ul>{#each report.reminders as reminder}<li>{reminder}</li>{/each}</ul>
      {/if}
      <p class="results__note">{MESSAGES.checkMyWorkNote}</p>
    {/if}
  </section>
{/if}

<style>
  .results {
    background-color: var(--theme-panel-bg);
    border-bottom: 1px solid var(--theme-panel-border);
    padding: 0.5rem 1rem 0.75rem 1rem;
    max-height: 45vh;
    overflow-y: auto;
    font-size: 0.85rem;
  }
  .results__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .results__title {
    margin: 0;
    font-size: 0.95rem;
    color: var(--theme-text-fg-contrasting);
  }
  .results__close {
    background: transparent;
    border: 0;
    border-radius: 4px;
    color: var(--color-gray-150);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    padding: 0.2rem 0.4rem;
  }
  .results__close:hover {
    background-color: var(--color-gray-300);
    color: white;
  }
  .results__running {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.5rem 0 0.25rem 0;
  }
  .results__spinner {
    width: 0.9rem;
    height: 0.9rem;
    flex-shrink: 0;
    border-radius: 50%;
    border: 2px solid var(--color-gray-t);
    border-top-color: var(--theme-primary);
    animation: results-spin 0.8s linear infinite;
  }
  @keyframes results-spin {
    to { transform: rotate(360deg); }
  }
  .results__errorbox {
    margin: 0.5rem 0 0 0;
    padding: 0.4rem 0.6rem;
    background-color: var(--theme-exitcodeinfo-bg);
    color: var(--theme-exitcodeinfo-fg);
    border: 1px solid var(--theme-exitcodeinfo-border);
    border-radius: 4px;
  }
  .results__summary {
    margin: 0.4rem 0;
    font-size: 0.95rem;
  }
  .results__blockednote {
    color: var(--color-gray-150);
    font-size: 0.8rem;
  }
  .results__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .results__item {
    border: 1px solid var(--theme-panel-border);
    border-left-width: 3px;
    border-radius: 4px;
    background-color: var(--theme-panel-controls-bg);
  }
  .results__item--passed { border-left-color: var(--color-green); }
  .results__item--failed { border-left-color: var(--theme-primary); }
  .results__item--blocked { border-left-color: var(--color-gold-100); }
  .results__row {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin: 0;
    padding: 0.3rem 0.5rem;
  }
  .results__row--summary {
    cursor: pointer;
  }
  .results__row--summary:focus-visible {
    outline: 3px solid var(--theme-focus);
    border-radius: 4px;
  }
  .results__icon {
    flex-shrink: 0;
  }
  .results__name {
    flex: 1;
  }
  .results__statusword {
    flex-shrink: 0;
    font-size: 0.75rem;
    color: var(--color-gray-150);
  }
  .results__body {
    padding: 0.2rem 0.75rem 0.6rem 1.9rem;
    border-top: 1px solid var(--theme-panel-border);
  }
  .results__message {
    margin: 0.4rem 0;
    white-space: pre-line;
  }
  .results__blocktitle {
    margin: 0.5rem 0 0.15rem 0;
    font-weight: 600;
    color: var(--color-gray-150);
  }
  .results__pre {
    margin: 0;
    padding: 0.35rem 0.5rem;
    background-color: var(--theme-bg);
    border: 1px solid var(--theme-panel-border);
    border-radius: 4px;
    font-family: var(--code-font-family);
    font-size: 0.8rem;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .results__pre--tech {
    margin-top: 0.5rem;
    color: var(--color-gray-150);
  }
  .results__hint {
    margin: 0.5rem 0 0 0;
    padding: 0.35rem 0.5rem;
    background-color: rgba(255, 212, 121, 0.08);
    border: 1px solid rgba(255, 212, 121, 0.35);
    border-radius: 4px;
    color: var(--color-gold-50);
    white-space: pre-line;
  }
  .results__footer {
    margin-top: 0.6rem;
    display: flex;
  }
  .results__note {
    margin: 0.6rem 0 0 0;
    font-size: 0.75rem;
    line-height: 1.45;
    color: var(--color-gray-200);
  }
</style>
