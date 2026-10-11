<script lang="ts">
  import type { AssignmentConfig } from '../assignments/types';
  import { createDialog } from '@melt-ui/svelte';
  export let assignment: AssignmentConfig;
  $: instructions = assignment.instructions;
  const {
    elements: { trigger, portalled, overlay, content, title, description, close },
    states: { open },
  } = createDialog();
</script>

{#if instructions}
  <button type="button" class="button button--secondary instructions__trigger" {...$trigger} use:trigger>
    Instructions, submission, and grading · {instructions.points} points
  </button>
  {#if $open}
    <div {...$portalled} use:portalled>
      <div {...$overlay} use:overlay />
      <div {...$content} use:content class="instructions">
        <button {...$close} use:close aria-label="Close assignment instructions">✕</button>
        <h2 {...$title} use:title>{assignment.title}</h2>
        <p {...$description} use:description class="visually-hidden">Assignment objectives, instructions, submission checklist, and instructor grading criteria.</p>
        <!-- The scrollable region needs keyboard focus for Page Down/End. -->
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <div class="instructions__body" tabindex="0" role="region" aria-label="Assignment instructions">
          <p>{instructions.points} points · Graded by your instructor</p>
          <p>See the due date shown in Canvas</p>
          <h3>Learning objectives</h3>
          <ol>{#each instructions.objectives as objective}<li>{objective}</li>{/each}</ol>
          <h3>Instructions</h3>
          <ol>
            {#each instructions.steps as step}
              <li><strong>{step.title}</strong>
                {#each step.items as item}<p>{item}</p>{/each}
              </li>
            {/each}
          </ol>
          <h3>Submission in Canvas Text Entry</h3>
          <ul>{#each instructions.submission as item}<li>{item}</li>{/each}</ul>
          <p>The last three items are written responses in Canvas. Your downloaded .asm file is your saved copy. Screenshots are not required.</p>
          <h3>Grading criteria · {instructions.points} points</h3>
          <p>Your instructor awards credit, including partial credit, using these criteria. Practice checks give feedback and do not award a numerical grade or guarantee full credit.</p>
          <ul>
            {#each instructions.rubric as row}
              <li><strong>{row.criterion}: {row.points} points.</strong> {row.description}</li>
            {/each}
          </ul>
          <h3>Manual completion checklist</h3>
          <ul>{#each instructions.completionChecklist as item}<li>{item}</li>{/each}</ul>
          <p>Comment originality and accuracy, your debugging process, and written explanations are reviewed by your instructor.</p>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .instructions__trigger { align-self: flex-start; white-space: normal; text-align: left; height: auto; }
  :global(.instructions[data-melt-dialog-content]) {
    max-width: 760px; width: 92vw; max-height: 85vh;
    padding: 0; overflow: hidden; font-size: 0.9rem; line-height: 1.6;
  }
  .instructions__body { overflow-y: auto; padding: 0.5rem 1.5rem 1.5rem; }
  .instructions__body:focus-visible { outline: 2px solid var(--theme-focus); outline-offset: -3px; }
  h2 { font-size: 1.05rem; margin: 0; padding: 1rem 3rem 1rem 1.5rem; flex-shrink: 0; border-bottom: 1px solid var(--theme-panel-border); }
  h3 { font-size: 0.95rem; margin: 1rem 0 0.4rem; }
  p { margin: 0.4rem 0; }
  ul, ol { padding-left: 1.4rem; }
  li { margin-bottom: 0.5rem; }
</style>
