<script lang="ts">
  import { onMount } from 'svelte';
  import { createDialog, melt } from '@melt-ui/svelte'
  import Close from './icons/Close.svelte';
  import Clipboard from './icons/Clipboard.svelte';
  import { copyTextToClipboard } from '../core/utils';
  import {blinkStore, selectedAssignment} from '../core/store'
  import {
    buildShareLink,
    SHARE_LINK_DANGEROUS_LEN,
    SHARE_LINK_MAX_LEN,
  } from '../core/shareLink'

  const {
    elements: { trigger, portalled, overlay, content, title, description, close },
    states: { open }
  } = createDialog()

  let inputDomnode:any;
  let uri:string = "";
  let urilen = 0;
  let dangerouslen = SHARE_LINK_DANGEROUS_LEN;
  let maxlen = SHARE_LINK_MAX_LEN;
  function updater(node){
    uri = buildShareLink()
    urilen = uri.length

    //analytics
    if(typeof window.goatcounter?.count === 'function'){
      window.goatcounter.count({
          path:  function(p) { return 'click-share-' + p },
          event: true,
      })
    }
  }

  function handleCopyClick(){
    copyTextToClipboard(uri)
  }

</script>

<button {...$trigger} use:trigger
  type="button"
  class="button button--secondary"
> Share </button>

{#if $open}
  <div {...$portalled} use:portalled>
    <div {...$overlay} use:overlay />
    <div {...$content} use:content>
      <h2 {...$title} use:title>Share</h2>
      {#if urilen >= maxlen}
        <p {...$description} use:description>
          :/
        </p>
        <p class="errorbox m-top-1"> Your playground code is too large,
          and cannot be shared. We are working hard to fix this limitation
        </p>
      {:else}
        <p {...$description} use:description>
          {#if $selectedAssignment}
            Copy this link to share your {$selectedAssignment.title} code.
            Opening it reopens this exact code in this assignment — you
            can also paste it into Canvas as your submission.
          {:else}
            Copy this link to share your playground code
            with others.
          {/if}
        </p>
          <div class="btgroup">
          <input class="btgroup__button" 
            use:updater
            value={uri}
            on:focus={e=>{ 
              setTimeout(()=>e.target.setSelectionRange(0, -1, "backward"),
              0)
            }}
            readonly type="text" placeholder="loading..." />
          <button class="btgroup__button" 
            on:click={handleCopyClick}
            >
            <Clipboard
              width="18px"
              height="18px"
              aria-hidden="true"
              focusable="false"
            />
            <span class="visually-hidden">Copy to clipboard</span>
          </button>
          </div>
        {#if urilen >= dangerouslen}
          <p class="errorbox m-top-1"> Note: This link is {urilen} characters long.
            It will still work when pasted into Canvas, but character-limited
            sites like social media may not allow you to post it in full.
          </p>
        {/if}
      {/if}
      <button {...$close} use:close> 
        <Close
          style="fill:var(--theme-primary);"
          aria-hidden="true"
          focusable="false"
        />
        <span class="visually-hidden">Close</span>
      </button>
    </div>
  </div>
{/if}


<style>
input{
  background-color: var(--theme-panel-controls-bg);
  flex-grow: 1;
  border: 1px solid var(--color-gray-t);
  overflow: hidden;
}
input:focus{
  outline: 2px solid var(--theme-focus);
}
.m-top-1{
  margin-top: 1rem;
}
</style>
