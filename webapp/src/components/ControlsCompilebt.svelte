<script language="ts">
  export let cancompile;

  import WizardHat from './icons/WizardHat.svelte';
  import { blinkStore } from '../core/store';

  let blink = blinkStore.getInstance()

  async function handle_compile(){
    blink.loadASM($blinkStore.editorContent_read);
    //analytics
    if(typeof window.goatcounter?.count === 'function'){
      window.goatcounter.count({
          path:  function(p) { return 'click-compile-' + p },
          event: true,
      })
    }
  }
</script>


<div class="btgroup">
  <button class="btgroup__button"
    disabled={!cancompile} on:click={handle_compile}>
    <WizardHat aria-hidden="true" focusable="false" width="26px" height="26px" />
    compile</button>
</div>



