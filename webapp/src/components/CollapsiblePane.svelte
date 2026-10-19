<script lang="ts">
  import { Pane } from 'paneforge';
  import type { PaneAPI } from 'paneforge';

  export let title: string;
  export let defaultSize = 30;
  export let minSize = 15;
  export let maxSize = 100;
  export let collapsedSize = 4;
  export let defaultCollapsed = false;

  let pane: PaneAPI | undefined;
  let collapsed = false;
  let appliedDefaultCollapsed = false;

  // Pane doesn't have a "start collapsed" prop, so collapse it ourselves
  // as soon as the imperative API is bound. Runs once.
  $: if (pane && defaultCollapsed && !appliedDefaultCollapsed) {
    appliedDefaultCollapsed = true;
    pane.collapse();
  }
</script>

<Pane
  bind:pane
  {defaultSize}
  {minSize}
  {maxSize}
  {collapsedSize}
  collapsible={true}
  onCollapse={() => (collapsed = true)}
  onExpand={() => (collapsed = false)}
  class="pf__pane"
>
  {#if collapsed}
    <button
      type="button"
      class="collapsedbar"
      on:click={() => pane?.expand()}
      aria-label={`Expand ${title} panel`}
      title={`Expand ${title} panel`}
    >
      <span class="collapsedbar__label">{title}</span>
    </button>
  {:else}
    <div class="pane">
      <div class="pane__bar">
        <p>{title}</p>
        <div class="pane__bar-actions">
          <slot name="actions" />
          <button
            type="button"
            class="pane__collapsebt"
            on:click={() => pane?.collapse()}
            aria-label={`Collapse ${title} panel`}
            title={`Collapse ${title} panel`}
          >
            <span aria-hidden="true">&minus;</span>
          </button>
        </div>
      </div>
      <div class="pane__content">
        <slot />
      </div>
    </div>
  {/if}
</Pane>
