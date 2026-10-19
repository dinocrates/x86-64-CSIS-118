<script lang="ts">
  import { blinkStore } from '../core/store';
</script>

<button
  type="button"
  class="button"
  aria-label="Clear terminal output"
  title="Clear terminal output"
  on:click={() => blinkStore.clearTerminal()}
>Clear</button>
