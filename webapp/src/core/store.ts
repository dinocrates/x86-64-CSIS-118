import { writable, derived, get } from "svelte/store";

/**
 * Reactive save-status store.
 * Updated by createBlinkStore() whenever the editor content changes
 * or an autosave completes. Consumed by SaveStatus.svelte.
 */
export const saveStatus = writable<{ savedAt: Date | null; dirty: boolean }>({
  savedAt: null,
  dirty: false,
});
import {Blink} from './blink'
import {assemblers} from './assemblers'
import type {Assemblers_key} from './assemblers'
import {snippetToAppState, uri_getAppState} from './appState'
import type {AppState} from './appState'
import { snippets, default_snippet } from "./example_snippets";
import { getAssignmentById } from "../assignments/assignments";
import { getAssignmentIdFromUrl, setAssignmentIdInUrl } from "./assignmentUrl";
import { autosave_save, autosave_load } from "./assignmentAutosave";

/**
 * Set once at startup when the page was opened with ?assignment=<id>
 * but no assignment with that id exists. Consumed by the assignment
 * selector to show a small non-blocking warning.
 */
export const urlAssignmentNotFound = writable(false);

function portion(parentStore, name) {
  return derived(parentStore, value => value[name]);
}

/** The free-practice content: saved work if any, else the welcome snippet */
function defaultPracticeAppState(): AppState {
  let saved = autosave_load(null)
  if(saved) return saved
  return snippetToAppState(snippets[default_snippet])
}

function createBlinkStore(){

  // Set the initial store content by inspecting the available
  // AppData sources, in order of importance:
  // 1. a ?appstate=... share link. When it carries an assignmentId (V2+
  //    links only — see appState.ts) this is an explicit "load exactly
  //    this code, for this assignment" request, e.g. a link a student
  //    shares to hand in or show their work. It wins over both a bare
  //    ?assignment= deep link and any locally saved work, since sharing
  //    a link is meaningless if opening it doesn't show that exact code.
  // 2. a bare ?assignment=<id> deep link (e.g. a Canvas iframe): saved
  //    work for that assignment if any, else its starter code.
  // 3. the free-practice autosave
  // 4. the default welcome snippet
  let initialAssignmentId: string | null = null;
  let defaultAppState: AppState = null;

  const sharedState = uri_getAppState();
  if(sharedState){
    defaultAppState = sharedState;
    if(sharedState.assignmentId){
      const sharedAssignment = getAssignmentById(sharedState.assignmentId);
      if(sharedAssignment){
        initialAssignmentId = sharedAssignment.id;
      } else {
        // the code is still worth loading — only the assignment tag is stale
        urlAssignmentNotFound.set(true);
      }
    }
  }
  if(!defaultAppState){
    const urlAssignmentId = getAssignmentIdFromUrl();
    if(urlAssignmentId){
      const urlAssignment = getAssignmentById(urlAssignmentId);
      if(urlAssignment){
        initialAssignmentId = urlAssignment.id;
        defaultAppState = autosave_load(urlAssignment.id);
        if(!defaultAppState){
          defaultAppState = {
            editorContent: urlAssignment.starterCode,
            mode: 'NASM_trunk',
          }
        }
      } else {
        urlAssignmentNotFound.set(true);
      }
    }
  }
  if(!defaultAppState){
    defaultAppState = defaultPracticeAppState()
  }
  // Always lock to NASM — assembler selector has been removed
  defaultAppState.mode = 'NASM_trunk'
  // Remove any search param from the url as soon as the page loads,
  // keeping only the assignment deep link when it is valid.
  try{
    let cleanUrl = window.location.pathname;
    if(initialAssignmentId){
      cleanUrl += `?assignment=${encodeURIComponent(initialAssignmentId)}`;
    }
    window.history.replaceState(null, '', cleanUrl);
  } catch(error){
    console.error("Could not clean the page URL:", error)
  }

  const store  = writable({
    term_buffer: "",
    state: "",
    signal: "",
    manual_render: 0,
    mode: defaultAppState.mode,
    uploadedElf: "",
    //the currently selected assignment id, or null for free practice.
    //autosave writes to a per-assignment key based on this value.
    assignmentId: initialAssignmentId,
    //change this to programmatically update the editor input box
    editorContent_write: defaultAppState.editorContent,
    //real time value of the text editor input box.
    //changing this will not cause a rerender
    //TODO: to reduce input lag, move this to a dedicated writable store
    editorContent_read: defaultAppState.editorContent,
  });
  const { subscribe, update } = store

  /*
  * Autosave, debounced, routed to the selected assignment's storage key
  */
  let autoSaveTimer:any;
  subscribe(()=>{
    clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(autoSave, 1500)
  });
  function autoSave(){
    autosave_save(get(store).assignmentId, getAppState())
    saveStatus.set({ savedAt: new Date(), dirty: false })
  }


  let stdinHander=()=>{
    return null;
  }
  let stdoutHandler=(charcode: number)=>{
    update((store) =>{
      let char = String.fromCharCode(charcode);
      store.term_buffer += char;
      return store;
    })
  }
  let stderrHander=(charcode: number)=>{
    update((store) =>{
      let char = String.fromCharCode(charcode);
      store.term_buffer += char;
      return store;
    })
  }
  let signalHander=(signal, code)=>{
    update((store) => ({ ...store, manual_render: store.manual_render+1}))
  }
  let stateChangeHander=(state, oldstate)=>{
    update((store) => ({ ...store, state:state, manual_render: store.manual_render+1}))
  }

  const blink = new Blink(
    assemblers[defaultAppState.mode],
    stdinHander,
    stdoutHandler,
    stderrHander,
    signalHander,
    stateChangeHander
  )

  update((store) => ({ ...store, state:blink.state}))

  function setAppState(state: AppState){
    update((store) => ({
      ...store,
      manual_render: store.manual_render +1,
      mode: state.mode,
      editorContent_read: state.editorContent,
      editorContent_write: state.editorContent,
    }))
    //changes to mode require manual updates to the blink object
    blink.setMode(assemblers[state.mode])
    //also save the changes in localStorage, under the selected assignment
    autosave_save(get(store).assignmentId, state)
    saveStatus.set({ savedAt: new Date(), dirty: false })
  }
  function getAppState(): AppState{
    let storeObj = get(store);
    return {
      editorContent: storeObj.editorContent_read,
      mode: storeObj.mode,
      //carried through so a Share link reopens the right assignment,
      //not just the code (see ControlsShareDialog.svelte)
      assignmentId: storeObj.assignmentId,
    };
  }

  /**
   * Select an assignment (or null for free practice).
   *
   * The current editor content is saved under the current context first,
   * so switching assignments never loses work. Then the new assignment's
   * saved work (if any) or its starter code is loaded, and the URL is
   * updated with history.replaceState.
   */
  function selectAssignment(assignmentId: string | null){
    const current = get(store).assignmentId;
    const assignment = getAssignmentById(assignmentId);
    const nextId = assignment ? assignment.id : null;
    if(current === nextId) return;

    //flush the current work to its own autosave key before switching
    autoSave();

    let nextState: AppState;
    if(assignment){
      nextState = autosave_load(assignment.id);
      if(!nextState){
        nextState = {
          editorContent: assignment.starterCode,
          mode: 'NASM_trunk',
        }
      }
    } else {
      nextState = defaultPracticeAppState();
    }
    nextState.mode = 'NASM_trunk';

    update((store) => ({ ...store, assignmentId: nextId }));
    setAppState(nextState);
    setAssignmentIdInUrl(nextId);
  }

  /**
   * Replace the editor contents with the selected assignment's original
   * starter code, and update the assignment's autosave entry.
   * The caller is responsible for asking the student to confirm first.
   */
  function resetToStarterCode(){
    const assignment = getAssignmentById(get(store).assignmentId);
    if(!assignment) return;
    setAppState({
      editorContent: assignment.starterCode,
      mode: 'NASM_trunk',
    });
  }

  return {
    subscribe,
    setAppState,
    getAppState,
    selectAssignment,
    resetToStarterCode,
    getInstance(){
      return blink;
    },
    notifyEditorContent(content:string){
      update((store) => ({...store, editorContent_read: content}))
      saveStatus.update(s => ({ ...s, dirty: true }))
    },
    setEditorContent(content:string){
      //will immediately trigger a call to notifyEditorContent
      update((store) => ({
        ...store,
        editorContent_write: content,
      }))
    },
    setUploadedElfName(uploadedElf: string|null){
      update((store) => ({...store, uploadedElf}))
    },
    setMode(mode: Assemblers_key){
      update((store) => ({...store, mode}))
      //changes to mode require manual updates to the blink object
      blink.setMode(assemblers[mode])
    },
    clearTerminal(){
      update((store) => ({...store, term_buffer: ""}))
    },
  }

}

/**
 * Singleton instance of the blink emulator,
 * wrapped in a svelte store
 */
export const blinkStore = createBlinkStore();

/**
 * individual store access to the elements in the store object.
  * Use with caution. svelte is already good at updating the dom only
  * when real changes happen.
  * Subscribe to manual_render if you want to manually render
  * the blink state only when it's required.
 */
export const manual_render = portion(blinkStore, "manual_render");
export const term_buffer = portion(blinkStore, "term_buffer");
export const state = portion(blinkStore, "state");
export const signal = portion(blinkStore, "signal");
export const mode = portion(blinkStore, "mode");
export const uploadedElf = portion(blinkStore, "uploadedElf");
export const editorContent_write = portion(blinkStore, "editorContent_write");
export const editorContent_read = portion(blinkStore, "editorContent_read");
export const assignmentId = portion(blinkStore, "assignmentId");

/** The full AssignmentConfig for the selected assignment, or null */
export const selectedAssignment = derived(assignmentId, id =>
  getAssignmentById(id as string | null)
);
