<script lang="ts">
  import { createDropdownMenu } from '@melt-ui/svelte';
  import ArrowForward from './icons/ArrowForward.svelte';
  import ArrowDropDown from './icons/ArrowDropDown.svelte';
  import { get } from 'svelte/store';
  import {blinkStore, editorContent_read} from '../core/store'

  import {snippetToAppState, uri_serializeAppState} from '../core/appState'
  import { templates } from "../core/templates";
  import { copyTextToClipboard } from '../core/utils';
  import { downloadAsm as downloadAsmFile } from '../core/download';
    import ControlsShareDialog from './ControlsShareDialog.svelte';


  let blink = blinkStore.getInstance()

  // --- ELF upload (existing: load pre-compiled binary into emulator) ---
  let fileElem:any;
  function handleLoadExec(){
    if(!fileElem) return
    fileElem.click()
  }
  export const fileToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsArrayBuffer(blob)
    })
  }
  async function handleFileUpload(e: any){
    if (fileElem && fileElem.files.length) {
      const file = fileElem.files[0]
      let filedata = await fileToArrayBuffer(file);
      blink.loadElf(filedata);
      blinkStore.setUploadedElfName(file.name)
    }
  }

  // --- .asm upload (new: open a saved .asm file into the editor) ---
  let asmFileElem: any;
  function handleOpenAsm() {
    if (!asmFileElem) return;
    asmFileElem.click();
  }
  async function handleAsmUpload(e: any) {
    if (asmFileElem && asmFileElem.files.length) {
      const file = asmFileElem.files[0];
      const text = await file.text();
      blinkStore.setEditorContent(text);
      // reset the input so the same file can be re-opened if needed
      asmFileElem.value = '';
    }
  }

  // --- .asm download (mirrors the Ctrl+S shortcut in App.svelte) ---
  // filename is assignment-aware: <assignment-id>.asm when selected
  function downloadAsm() {
    downloadAsmFile(get(editorContent_read), get(blinkStore).assignmentId);
  }


  const {
    elements: { trigger, menu, item, separator, },
    builders: { createSubmenu, },
    states: { open },
  } = createDropdownMenu({
    forceVisible: true,
    loop: true,
  });

  const {
    elements: { subMenu, subTrigger },
    states: { subOpen },
  } = createSubmenu();

  const templatesList = Object.values(templates)

  function handleTemplateClick(templateId: string){
    const confirmed = window.confirm(
      'Loading this template will replace the current editor contents. ' +
      'Download your current code first if you want to keep it. Continue?'
    )
    if(!confirmed) return
    let selected_template = templates[templateId]
    let appState = snippetToAppState(selected_template)
    blinkStore.setAppState(appState)
  }

</script>


<input
  on:change={handleFileUpload}
  type="file" class="file" bind:this={fileElem} />
<input
  on:change={handleAsmUpload}
  type="file" accept=".asm,.s,.nasm" class="file" bind:this={asmFileElem} />

<div class="custom-overlay"></div>
<div class="btcontainer">
<ControlsShareDialog />
<button
  type="button"
  class="button button--secondary p-right-0 m-left-1"
  {...$trigger} use:trigger
  aria-label="File options"
>
  File
  <ArrowDropDown aria-hidden="true" focusable="false" />
</button>
</div>

{#if $open}
  <div {...$menu} use:menu >
    <div {...$subTrigger} use:subTrigger>
      Load Template
      <div class="rightSlot">
        <ArrowForward style="" height="12px" width="12px"/>
      </div>
    </div>
    {#if $subOpen}
      <div {...$subMenu} use:subMenu >
        <div class="text">Templates</div>
          {#each templatesList as template}
            <div {...$item} use:item
              on:m-click={_ => handleTemplateClick(template.id)}
              >{template.display_name}</div>
          {/each}
      </div>
    {/if}

    <div {...$separator} use:separator />
    <div {...$item} use:item on:m-click={handleOpenAsm}>
      Open .asm file
    </div>
    <div {...$item} use:item on:m-click={downloadAsm}>
      Save .asm file
      <span class="shortcut">Ctrl+S</span>
    </div>
    <div {...$separator} use:separator />
    <div {...$item} use:item on:m-click={handleLoadExec}>
      Load executable (ELF)
    </div>

  </div>
{/if}

<style>
.btcontainer{
  display: flex;
  margin-left: 1rem;
}
.p-right-0{
  padding-right: 0;
}
.m-left-1{
  /* margin-left: 1rem; */
}

.rightSlot {
  margin-left: auto;
  padding-left: 1.25rem;
}

.text {
  padding: .1rem .5rem;
  color: var(--theme-text-fg-disabled);
  color: var(--color-orange);
}

.file{
  display: none;
}

.shortcut {
  margin-left: auto;
  padding-left: 1.5rem;
  font-size: 0.8em;
  color: var(--theme-text-fg-disabled);
}
</style>
