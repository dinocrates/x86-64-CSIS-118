<script>
export let mobile;
export let showEditor;

import ArrowBack from "./icons/ArrowBack.svelte";
import SaveStatus from "./SaveStatus.svelte";
import ControlsFileMenu from "./ControlsFileMenu.svelte";
import ControlsAboutDialog from "./ControlsAboutDialog.svelte";
import AssignmentSelector from "./AssignmentSelector.svelte";
import TestResultsPanel from "./TestResultsPanel.svelte";
import EditorTextSize from "./EditorTextSize.svelte";
import ThemeSelector from "./ThemeSelector.svelte";
import { assignmentDetailsCollapsed } from "../core/displayPreferences";
import { blinkStore, state } from "../core/store";
import ControlsCompilebt from "./ControlsCompilebt.svelte";

let blink = blinkStore.getInstance();

//-------------------
//render conditionals
//-------------------
let showControls = false;
let canstart = false;
let canstep = false;
let cancompile = false;

$: showControls = !mobile || !showEditor;

$: canstart =
	$blinkStore.state === blink.states.PROGRAM_LOADED ||
	$blinkStore.state === blink.states.PROGRAM_STOPPED;

$: canstep = $blinkStore.state === blink.states.PROGRAM_RUNNING;

$: cancompile =
	$blinkStore.state !== blink.states.NOT_READY &&
	$blinkStore.state !== blink.states.ASSEMBLING &&
	$blinkStore.state !== blink.states.LINKING;

$: showLoadingBar =
	$blinkStore.state === blink.states.NOT_READY ||
	$blinkStore.state === blink.states.ASSEMBLING ||
	$blinkStore.state === blink.states.LINKING;

//-------------------
//control handlers
//-------------------
function handle_back() {
	blink.setready();
	blinkStore.setUploadedElfName("");
}
</script>


<header>
  <div class="branding">
    <span class="branding__course">CSIS-118B</span>
    <span class="branding__subtitle">x86-64 Assembly | Mt. San Jacinto College</span>
  </div>
  <div class="header-right">
    <SaveStatus />
    <ControlsAboutDialog />
  </div>
</header>

<!--
   Controls are organized in two rows. Debugger row and Editor row.
   Their visibility and position changes with program state and window size,
   which makes everything pretty messsy to follow. Take this map, it will
   be useful:

   MOBILE:
   ----------
   Top row     (editor row is here. Always visible)
   ----------
   Bottom row  (debugger row is here. only visible when debugger is active)
   ----------

   DESKTOP:
   ----------
   Top row     (Debugger row is here. Always visible)
   ----------
   Bottom row  (Editor row is here. Always visible)
   ----------
 -->
<div class="controls" class:controls-inverted={!mobile} >

  <!-- Editor row -->
    <section class="controls__row controls__row-top">
      {#if (showEditor || !mobile) && !$blinkStore.uploadedElf}
      <ControlsCompilebt cancompile={cancompile} />
      <ControlsFileMenu />
      <EditorTextSize />

      {:else}
        <button on:click={handle_back} class="button" >
          <ArrowBack aria-hidden="true" focusable="false" width="16px" height="16px"/>
          Back to editor
        </button>
      {/if}

      <ThemeSelector />

    </section>
  <!-- /Editor row -->

  {#if showControls}
  <!-- Debugger row -->
    <section class="controls__row controls__row-bottom">

      <div class="btgroup">
        <button class="btgroup__button"
          on:click={()=>blink.starti()}
          disabled={!canstart} >
          Debug
        </button>
        <button class="btgroup__button"
          on:click={()=>blink.run()}
          disabled={!canstart} >
          Run
        </button>
      </div>

      <button class="button m-left-1" on:click={()=>blink.stepi()}
        disabled={!canstep}
      > Step </button>
      <button class="button m-left-1" on:click={()=>blink.continue()}
        disabled={!canstep}
      > Continue </button>

    </section>
  <!-- /Debugger row -->
  {/if}

  <div class="loadingbar">
    <div class="loadingbar__content"
      class:active={showLoadingBar}
    ></div>
  </div>


</div>

{#if (showEditor || !mobile) && !$blinkStore.uploadedElf}
  <AssignmentSelector />
  <div id="assignment-results" hidden={$assignmentDetailsCollapsed}>
    <TestResultsPanel />
  </div>
{/if}


{#if mobile && !showEditor && $state == blink.states.PROGRAM_STOPPED}
  <p class="exitcodeinfo">{blink.stopReason.details}</p>
{/if}
{#if $state == blink.states.PROGRAM_READLINE_PAUSE}
  <p class="lineinputinfo">Program is paused, waiting for user input</p>
{/if}


<style>

  /* -------------------- */
  /*        Header        */
  /* -------------------- */
  header {
    padding: .5rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--theme-panel-controls-bg);
  }
  .branding {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }
  .branding__course {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--theme-primary);
  }
  .branding__subtitle {
    font-size: 0.72rem;
    color: var(--color-gray-200);
    letter-spacing: 0.03em;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }


  /* -------------------- */
  /*      Controls        */
  /* -------------------- */
  .controls{
    background-color: var(--theme-panel-controls-bg);
    border-top: 1px solid var(--theme-panel-border);
    border-bottom: 1px solid var(--theme-panel-border);
    display: flex;
    flex-direction: column;
  }
  .controls-inverted{
    flex-direction: column-reverse;
  }
  .controls__row{
    display: flex;
    align-items: center;
    justify-content: left;
    padding: .5rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }
  .controls__row-top {
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  :not(.controls-inverted) .controls__row-bottom {
    border-top: 1px solid var(--theme-panel-border);
  }
  .controls-inverted .controls__row-bottom {
    border-bottom: 1px solid var(--theme-panel-border);
  }


  /* -------------------- */
  /*      Loading bar     */
  /* -------------------- */
  .loadingbar{
    height: 0;
    width: 100%;
  }
  .loadingbar__content{
    position:relative;
    height: 1px;
    /* background: repeating-linear-gradient(to right, black 0%, #de4f17 50%, var(--color-gold-100) 100%); */
    background: repeating-linear-gradient(to right, black 0%, var(--color-gray-100) 50%, white 100%);
    width: 100%;
    background-size: 200% auto;
    background-position: 0 100%;
    animation: gradient 2s infinite;
    animation-fill-mode: forwards;
    animation-timing-function: linear;
    display:none;
  }
  .loadingbar__content.active{
    display:block;
  }

@keyframes gradient { 
  0%   { background-position: 0 0; }
  100% { background-position: -200% 0; }
}


  /* -------------------- */
  /*        Other         */
  /* -------------------- */


  .m-left-1{
    margin-left: 1rem;
  }

 .exitcodeinfo{
    background-color: var(--theme-exitcodeinfo-bg);
    color: var(--theme-exitcodeinfo-fg);
    border: 1px solid var(--theme-exitcodeinfo-border);
    margin: 0;
    padding-left: 1rem;
  }

 .lineinputinfo{
    color: var(--theme-exitcodeinfo-fg);
    background-color: var(--theme-readline-bg);
    border: 1px solid var(--color-blue);
    margin: 0;
    padding-left: 1rem;
  }

</style>
