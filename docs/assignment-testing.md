# CSIS-118B Assignments & Check My Work — Instructor Guide

This guide explains how to author assignments for the CSIS-118B playground:
starter code, visible student-facing tests, Canvas deep links, and how the
pieces fit together.

**Audience:** the instructor maintaining this repository.
**Student-facing feature name:** *Check My Work* (never "grade" or
"autograde" for the practice checks themselves — see
[Why this is not grading](#why-check-my-work-is-not-official-grading)).
Submission uses a separate, explicitly-labeled **Copy Submission Link**
action — see [Submitting via the submission link](#submitting-via-the-submission-link).

---

## Unit 1 — My First Assembly Program

The former **Unit 1 - Hello Assembly** entry is the corresponding introductory
greeting exercise, using `main` and `csis118b.inc`. It is updated in place under
the permanent ID **`unit01-hello-assembly`**, preserving its deep links and
autosave key. Existing saved work is restored as-is; a student can download it
before confirming **Reset to Starter Code** to obtain the new annotated starter.
Only Unit 1 is currently registered. Units 2 and 3 are unpublished drafts:
their starter/test files are retained for future course assignments, but their
placeholder entries are removed from the registry and Assignment menu. Existing
saved work for those stable IDs is retained. Old direct links use the existing
unknown-assignment recovery; shared source still loads even when its assignment
is unavailable. Templates and free practice retain their existing behavior.

After publication, use this exact launch URL:

```text
https://dinocrates.github.io/x86-64-CSIS-118/index.html?assignment=unit01-hello-assembly
```

This is the URL supported by the implementation, not a claim that the changes
have already been published. Assignment selection, a refresh, or a deep link
restores saved work before considering the starter. V2 shared source and its
assignment ID take precedence over a conflicting `assignment` query parameter
and autosave. Legacy V1 shares keep their source and open in free practice.
The gzip/base64url format and version are unchanged.

### Canvas handoff

Use **Canvas Text Entry**, worth **30 points**. Replace the existing directions
to select free practice and paste a starter with this exact sentence:

> Open Unit 1 — My First Assembly Program from the Assignment menu and load its starter.

Students submit the tested share link, two output lines, and three short written
responses (debugger observation, program organization, workflow). The downloaded
`Lastname_Firstname_U01.asm` is their saved copy. The app retains its existing
download filename; students rename it if their browser downloads automatically.
No screenshots or separate response collection are required. The due-date text
is **See the due date shown in Canvas**.

### Checks and review boundaries

Unit 1 uses the existing full-program `assemble` and `stdout` path in the
separate practice-check emulator. The source is assembled unchanged, including
its `main` and include; it never goes through the procedure harness.
`Blink.loadASM` supplies `src/assets/csis118b.inc` directly to the emulator's
virtual filesystem. Students need no helper download or second entry point.

The `stdout` schema additionally supports `messageLines` (line count and the
identifying prefix on the last line) and `expectedExitCode`. Unit 1 requires
status zero, exactly two nonempty message lines, and a nonempty name after
`Programmer:`. Output capture excludes stderr and the emulator launch prompt,
decodes UTF-8, normalizes CRLF, and ignores only one final newline. Spaces and
extra blank lines are not collapsed. Names have no first/last-name or character
pattern requirement. Existing fixed-output checks still use `expectedStdout`.

Compilation failures block execution; the existing runtime timeout is 5 seconds
(and the emulator also has an instruction limit). Checks leave the editor and
paused debugger alone. Changes to source or assignment invalidate displayed
results, including results from a run still in progress. A run retains its lock
through assignment switches so two checks cannot overlap in the shared test
emulator. Students rerun checks after editing.

Literal source reminders flag `Your Name`, `YYYY-MM-DD`, and the starter greeting.
They are advisory and can also match a literal retained in a comment. They are
separate from the execution checks and cannot establish identity, originality,
documentation quality, or submission readiness. The unmodified starter passes
execution checks and still displays all three reminders. No practice points are
configured for Unit 1. Instructor grading is 12 + 6 + 6 + 6, with partial credit.

The RBX observation stays manual: use Debug, expand Disassembly, Step to the
first load in `main`, then execute it and observe `0x2a` (42). NASM may encode it
as `mov ebx, 0x2a`. Checking the final register after helper calls is not a
replacement for this observation. Comments, the debugging process, and the
Canvas responses remain instructor review items.

### Local validation and publication (PowerShell)

From the repository root, using the existing Node 20/npm 10 toolchain:

```powershell
Set-Location .\webapp
npm ci
npx playwright install chromium
npm run build
npm test
npx -p typescript tsc -p tsconfig.typecheck.json
npm run preview -- --host 127.0.0.1
```

Open the printed localhost origin at
`/x86-64-CSIS-118/index.html?assignment=unit01-hello-assembly`.
The test suite starts/stops its own Vite development and production-preview
servers on ports 4173 and 4174. It runs the actual bundled NASM, linker, Blink
WASM, and browser UI; it is not a native-assembler substitute or mocked runner.
An existing Chromium/Edge executable can be selected instead of downloading one:

```powershell
$env:PLAYWRIGHT_EXECUTABLE_PATH = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm test
```

When ready to publish, review and commit the intended changes, then push that
commit to `master` (or merge a reviewed branch there). The existing
**Update GitHub Pages** workflow runs `npm ci` and `npm run build` for changes
under `webapp/**`, uploads `webapp/dist`, and deploys via GitHub Pages. It also
supports **Run workflow** (`workflow_dispatch`). Keep the Vite base
`/x86-64-CSIS-118/`; no hosting configuration change is needed. After that
workflow succeeds, test the launch URL above and update the Canvas directions.
Repository implementation does not itself publish, push, or edit Canvas.

### Implementation verification

The complete eight-test Playwright suite passed using local Chromium with the
real browser NASM/linker/Blink execution path. Coverage includes the exact starter
output and status zero; personalized names (including apostrophes, hyphens, and
Unicode); assembler failures; a nonzero exit; incomplete output; stderr exclusion;
infinite-loop timeout and recovery; source-edit invalidation; paused-debugger
isolation; save/open; reset confirmation; autosave/revisit; legacy shares; other
assignment/free-practice recovery; and production assets under the Pages subpath.
Browser controls reached `mov ebx, 0x2a` in `main`; one Step displayed RBX `0x2a`
immediately afterward. This was a browser interaction check, not a source-only
assertion or final-register check. No separate native-assembler validation was
used. The starter was also compared directly with the supplied complete text:
1,666 characters / 36 lines with line endings normalized.

After the final dialog change, the four affected browser tests passed again
(`npm test -- --grep 'starter launches|edits invalidate|share source|built Pages'`).
That pass additionally exercised the check lock while switching assignments,
a share URL longer than 2,048 characters with a conflicting autosave, and the
production dialog's Escape-to-close behavior. Desktop/mobile visual inspection
and keyboard End scrolling of the instructions also passed.

`npm run build`, `tsc -p tsconfig.typecheck.json`, and `git diff --check` passed.
The existing build warnings in Registers, Hexdump, Terminal, and TerminalInput
remain. Blink emits known unsupported optional syscall warnings (`mprotect`,
`prlimit64`, `getrusage`) while the bundled NASM/linker start; these are explicitly
allowlisted in the production browser check, which fails on other console errors.
The tests stub the third-party analytics script. Compile and Share now check
whether its callback exists, so offline/blocked analytics produces no exception.
Local icon/manifest paths now respect the Pages base, and the manifest's missing
comma is repaired; the deployment workflow and Vite base are unchanged.

---

## How the system works (one-minute version)

- Each assignment is an `AssignmentConfig` object: an id, title,
  description, starter code, and a list of visible tests.
- Students open a Canvas assignment containing an iframe or link like
  `index.html?assignment=unit01-hello-assembly`. The playground
  selects that assignment automatically, restoring the student's saved
  work for it (or the starter code on first open).
- Students write code, click **Check My Work**, read the feedback, fix,
  repeat — then click **Copy Submission Link** and paste it into Canvas
  as their submission.
- All checks run inside a second, dedicated copy of the in-browser
  emulator, so the student's editor/debugger state is never disturbed.
  Nothing ever leaves the browser — the submission link itself is just
  the code, gzip-compressed and base64-encoded into the URL; opening it
  requires no server either.

---

## Adding a new assignment

Three steps, all under `webapp/src/assignments/`:

### 1. Create the starter code

Add `webapp/src/assignments/starters/unit04_loops.asm.ts`:

```ts
export const unit04LoopsStarter = `; ============================================
; CSIS-118B | x86-64 Assembly
; Unit 4 - Loops
; Student: [Your Name]
; ============================================

section .text
    global sum_array

; ------------------------------------------------
; sum_array
; Inputs:
;   rdi = address of qword array
;   rsi = number of elements
; Output:
;   rax = sum of the elements
; ------------------------------------------------
sum_array:
    ; TODO: write your code here

    ret
`;
```

### 2. Create the tests

Add `webapp/src/assignments/tests/unit04_loops.tests.ts` (see the
[test type reference](#test-type-reference) below):

```ts
import type { AssignmentTest } from "../types";

export const unit04LoopsTests: AssignmentTest[] = [
  { id: "assemble", type: "assemble", name: "Code assembles successfully",
    visible: true, points: 1 },
  { id: "required-label", type: "source-check",
    name: "Required procedure exists: sum_array",
    visible: true, requiredLabels: ["sum_array"], points: 1,
    hint: "Do not rename the sum_array procedure." },
  { id: "sums-four", type: "procedure-register",
    name: "Sums a four-element array",
    visible: true, procedure: "sum_array",
    setupRegisters: { rdi: "&test_array", rsi: 4 },
    memorySetup: [
      { label: "test_array", kind: "qword-array", values: [10, 20, 30, 40] },
    ],
    expectedRegisters: { rax: 100 },
    points: 1,
    hint: "Add each qword to a running total; advance the pointer by 8." },
];
```

### 3. Register the assignment

In `webapp/src/assignments/assignments.ts`, add an `AssignmentConfig`
and append it to the `assignments` array:

```ts
export const unit04LoopsAssignment: AssignmentConfig = {
  id: "unit04-loops",             // permanent! see warning below
  title: "Unit 4 - Loops",
  unit: "Unit 4",
  description: "Write a procedure that sums a qword array.",
  starterCode: unit04LoopsStarter,
  tests: unit04LoopsTests,
};
```

> **The `id` is permanent.** It is used in Canvas deep links, students'
> browser autosave keys (`csis118b.autosave.<id>`), download filenames,
> and test reports. Changing it breaks existing Canvas links and orphans
> student autosaves. Pick it once: lowercase, hyphenated,
> `unitNN-short-name`.

Optionally, typecheck your edits before pushing
(`cd webapp && npx -p typescript tsc -p tsconfig.typecheck.json`) — it
catches typos in test configurations. Then `npm run build` and push to
`master` to deploy.

---

## Designing testable assignments: contracts

Assembly is tested with **contracts**, not unit-tested objects. A
contract states what the student procedure promises:

```asm
global add_numbers

; Inputs:
;   rdi = first integer
;   rsi = second integer
; Output:
;   rax = sum
add_numbers:
    ; student code here
    ret
```

The best assignment pattern:

> Write this procedure. Use these registers as inputs. Return the result
> in this register. Do not rename the label. Do not print inside the
> procedure unless instructed. Click Check My Work before submitting.

Two kinds of assignments work well:

| Kind | Starter defines | Test types |
|---|---|---|
| **Full program** ("print X") | `main` + `%include "csis118b.inc"` | `assemble`, `stdout` |
| **Procedure contract** ("write `add_numbers`") | only the procedure label — **no `main`** | `assemble`, `source-check`, `procedure-register`, `procedure-memory`, `abi-preservation` |

For procedure assignments, the checks generate a hidden test program
that calls the student's procedure directly, so the starter must not
define `main` or `_start`. (Students *may* `%include "csis118b.inc"` to
use `print_int` etc. for their own debugging — the checks handle that —
but if they also define `main` while including the library, Check My
Work asks them to comment out their `main` first, with a clear message.)

---

## Test type reference

Every test shares these `BaseTest` fields:

```ts
{
  id: string;        // unique within the assignment
  name: string;      // student-facing, e.g. "Adds two positive numbers"
  visible: boolean;  // browser runs only visible tests; keep true
  points?: number;   // optional progress display — never call it a grade
  hint?: string;     // shown on failure; write it for a confused beginner
  timeoutMs?: number // per-test runtime limit (default 5000 ms)
}
```

### `assemble`

Passes if the student code assembles (NASM) and links on its own.
When it fails, students see "The assembler found a syntax problem."
plus the NASM diagnostics, and **all runtime tests are blocked** (shown
as skipped, not failed). Include one in every assignment, first.

```ts
{ id: "assemble", type: "assemble", name: "Code assembles successfully",
  visible: true, points: 1 }
```

### `source-check`

Static checks on the source text. Use sparingly — reject renamed labels
and banned instructions, not valid alternate solutions.

```ts
{
  id: "required-label", type: "source-check",
  name: "Required procedure exists", visible: true,
  requiredLabels: ["add_numbers"],   // NASM labels that must be defined
  bannedPatterns: ["\\bsyscall\\b"], // regexes that must NOT appear
  requiredPatterns: [],              // regexes that MUST appear
}
```

Notes:
- `requiredLabels` looks for a real `name:` label (comments stripped).
- `bannedPatterns` are matched against de-commented source, so
  commented-out code is not flagged.
- `requiredPatterns` are matched against the raw source, so you can
  require a header comment.
- Patterns are case-insensitive multiline regexes; invalid regexes fall
  back to literal substring matching.

### `stdout`

Runs the **full student program** and compares captured output.

```ts
{
  id: "prints-message", type: "stdout", name: "Prints the greeting",
  visible: true,
  stdin: "42",                    // optional; one line per read
  expectedStdout: "Hello, Assembly!",
  compareMode: "normalized",      // "exact" | "trimmed" | "normalized"
}
```

- `stdin` is fed one line per read syscall, exactly as if the student
  typed each line into the terminal input box (no trailing newline is
  appended). If the program asks for more input than provided, the test
  fails with a friendly message.
- Prefer `compareMode: "normalized"` (normalizes line endings, trims
  trailing spaces, collapses repeated blank lines, ignores surrounding
  blank space) unless exact formatting is the point of the assignment.

### `procedure-register`

The workhorse. Calls the student procedure with given register values
and checks registers after it returns.

```ts
{
  id: "positive-values", type: "procedure-register",
  name: "Adds two positive numbers", visible: true,
  procedure: "add_numbers",
  setupRegisters: { rdi: 5, rsi: 7 },
  expectedRegisters: { rax: 12 },
  points: 1,
  hint: "The result should be returned in rax.",
}
```

- Values may be numbers (`-8`), decimal strings, hex strings (`"0x1F"`),
  or `"&label"` to pass the **address** of a memory fixture (declare the
  fixture in an optional `memorySetup` array — same shape as in
  `procedure-memory` below).
- All comparisons are 64-bit two's complement, so `-5` works naturally.
- Before the call, the harness zeroes all general-purpose registers and
  aligns the stack per the System V ABI, so results are deterministic
  (uninitialized-register bugs fail consistently instead of randomly).
- `rsp` cannot be set.

### `procedure-memory`

Calls the student procedure and checks **memory** afterwards. Fixture
data is generated in the test program's `.data` section; point a
register at it with `"&label"`.

```ts
{
  id: "double-array-basic", type: "procedure-memory",
  name: "Doubles a four-element array", visible: true,
  procedure: "double_array",
  setupRegisters: { rdi: "&test_array", rsi: 4 },
  memorySetup: [
    { label: "test_array", kind: "qword-array", values: [1, 2, 3, 4] },
  ],
  expectedMemory: [
    { label: "test_array", kind: "qword-array", values: [2, 4, 6, 8] },
  ],
  points: 1,
  hint: "Advance the pointer by 8 bytes for each qword.",
}
```

- `kind`: `byte-array` | `word-array` | `dword-array` | `qword-array` |
  `string`.
- For `string`, `values` is the text; a null terminator is appended to
  the fixture automatically and is *not* part of the expectation.
- `expectedMemory` labels usually name a fixture, but may also name a
  label defined in the *student's* code (e.g. a buffer the assignment
  tells them to define).
- An optional `expectedRegisters` can additionally check a return value.

### `abi-preservation`

Verifies callee-saved registers survive the call, per the System V ABI.
The harness plants sentinel values in the preserved registers, calls the
procedure, and checks them afterwards — plus a stack-balance check
(`rsp` must return to its pre-call value).

```ts
{
  id: "preserve-callee-saved", type: "abi-preservation",
  name: "Preserves callee-saved registers", visible: true,
  procedure: "sum_array",
  setupRegisters: { rdi: "&test_array", rsi: 4 },   // give it valid inputs!
  memorySetup: [
    { label: "test_array", kind: "qword-array", values: [1, 2, 3, 4] },
  ],
  // preservedRegisters defaults to ["rbx","rbp","r12","r13","r14","r15"]
  hint: "If you use rbx, rbp, or r12-r15, push them first and pop them before ret.",
}
```

For early units this can be advisory (`points` omitted); for the
procedures/stack unit make it a normal visible check.

---

## Writing good hints

The `hint` appears under the failure details. Students see it exactly
when they are stuck, so:

- Name the register or concept, not the answer: *"The result should be
  returned in rax"*, not *"use add rax, rsi"*.
- Anticipate the classic bug for that test: hardcoding
  (*"…not hardcoding a result"*), unsigned vs signed jumps
  (*"use jg/jl, not ja/jb"*), pointer stride (*"advance by 8 bytes per
  qword"*), stack balance (*"every push needs a matching pop"*).
- One sentence. If it needs three, split the test into smaller tests.

The runner adds its own beginner-friendly messages for the common
mechanical failures: assembly errors, crashes (with a stack-imbalance
hint), infinite loops/timeouts, procedures that never `ret`, procedures
that read stdin, and procedures that print (their stray output is shown
back to them under the failure).

---

## Canvas deep links and embeds

Each assignment has a stable URL:

```text
https://dinocrates.github.io/x86-64-CSIS-118/index.html?assignment=unit01-hello-assembly
```

Embed it in a Canvas page or assignment:

```html
<iframe
  src="https://dinocrates.github.io/x86-64-CSIS-118/index.html?assignment=unit01-hello-assembly"
  width="100%"
  height="900"
  style="border: 0;"
  allowfullscreen>
</iframe>
```

Practical notes:

- Also give students a plain **"open in a new tab" link** next to the
  iframe. Some browsers partition or block storage inside third-party
  iframes, which can disable autosave; the direct link always works and
  is nicer on Chromebooks anyway.
- File downloads from inside an iframe require the iframe to allow them;
  if a student's browser blocks the `.asm` download inside Canvas, the
  new-tab link is the fallback.
- An unknown assignment id never breaks the app — students see a small
  "The requested assignment could not be found" notice and the normal
  playground.
- Selecting a different assignment in the dropdown updates the URL with
  `history.replaceState` (no page reload, no history spam), so students
  can bookmark exactly what they see.

---

## Submitting via the submission link

Students submit an assignment by clicking **Copy Submission Link** (next
to Check My Work, visible whenever an assignment is selected) and
pasting the copied URL into Canvas.

### How it works

The button copies the same link the **Share** button produces — the
current editor content, the assembler mode, and the selected assignment
id, gzip-compressed and base64url-encoded straight into the URL
(`?appstate=<blob>`, schema v2 — see `core/appState.ts`). Nothing is
uploaded anywhere to generate it. Opening that link, whether by a
classmate, a TA, or you in SpeedGrader:

1. resolves the assignment id and selects it,
2. loads the **exact** code from the link — not the opener's local
   autosave for that assignment, not the starter code,
3. arms that assignment's Check My Work tests, so you can re-run them
   immediately if you want to.

Because a `?appstate=` link with an assignment id is treated as an
explicit "show me exactly this" request, it takes priority over both a
bare `?assignment=` Canvas deep link and any locally saved work — see
the priority order documented at the top of `createBlinkStore()` in
`core/store.ts`.

### Setting up the Canvas assignment

For **Unit 1 — My First Assembly Program**, choose **Online** → **Text Entry**
so students can include the share link, output, and three written responses
together, as specified in the Unit 1 handoff above.

For assignments whose instructions request a URL alone, choose **Online** →
**Website URL**. Students paste the copied link into that field and
submit normally. To grade, open the submitted URL from SpeedGrader — it
reopens the exact code the student had when they copied the link.

### Limitations

- **Link length.** Some browsers/servers cap URL length around 8,192
  characters. The button checks the encoded length and, for programs
  that would exceed the safe limit (`SHARE_LINK_MAX_LEN` in
  `core/shareLink.ts`), refuses to copy and tells the student to
  download their `.asm` file and submit that instead. This is very
  unlikely for typical assignment-sized programs but can happen on
  large, later-unit assignments — consider also accepting a file upload
  as a fallback submission type for those.
- **The link reflects whatever was in the editor when it was copied.**
  If a student keeps editing after copying the link, the link does not
  update — that is the point (it is a snapshot), but remind students to
  copy the link *last*, after they are done.
- **It is still not a grade.** A submission link proves what code was
  submitted; it says nothing about correctness beyond whatever Check My
  Work checks exist for that assignment. Grade the code as you would a
  file upload.

---

## How assignment-aware autosave works

Every assignment saves to its own browser localStorage key:

```text
csis118b.autosave.default                      ← free practice
csis118b.autosave.unit01-hello-assembly
csis118b.autosave.unit02-register-arithmetic
```

- Edits autosave ~1.5 s after the last keystroke, to the key of the
  currently selected assignment. Work on one assignment can never
  overwrite another.
- Opening a deep link (or picking from the dropdown) loads that
  assignment's saved work if it exists, otherwise its starter code.
  Switching assignments first flushes the current editor to its own key,
  so switching is always lossless.
- **Reset to Starter Code** (next to the dropdown) restores the original
  starter after an explicit confirmation, and updates that assignment's
  autosave.
- localStorage is per-browser, per-device. Students who move between
  machines should download their `.asm` (Ctrl+S) and re-open it later —
  same advice as before this feature existed.

---

## Downloads

- **`.asm` file:** Ctrl+S or *File → Save .asm file*. Named
  `<assignment-id>.asm` when an assignment is selected (e.g.
  `unit02-register-arithmetic.asm`), else `program.asm`. The primary
  submission path is the [submission link](#submitting-via-the-submission-link);
  this download is the fallback for programs too large to link, and for
  a student's own backup/records across devices.
- **Test report:** after running checks, *Download Test Report* saves
  `csis118b-<assignment-id>-test-report.txt` — assignment, timestamp,
  summary, per-test results, and a `sha256` hash of the exact source
  that was checked, so you can tell whether a report matches the code a
  student submitted. No student name is collected or included.

---

## Why Check My Work is not official grading

Everything in this app is a **static site running in the student's
browser**. That means:

1. Visible tests, expected values, and hints ship to the client — a
   curious student can read them. That is fine (they are practice), but
   it means nothing here can be a *secure* grade.
2. Passing visible checks proves the contract cases pass, not that the
   solution meets every requirement (style, comments, techniques).
3. The student-facing note says exactly this: *"Check My Work runs
   practice tests in your browser. Passing these tests does not
   guarantee full credit."*

This is a separate concern from *how* work reaches you (the
[submission link](#submitting-via-the-submission-link) or a `.asm`
upload both work fine as a submission mechanism) — it's about what
passing the visible checks does and doesn't prove. Grade the submitted
code as you would a file upload. If you later want private/hidden
tests, run them **locally**: the same `AssignmentConfig`/test shapes
are designed so a future instructor-only batch grader can reuse them
against downloaded submissions — keep hidden tests out of this
repository's deployed code.

---

## Under the hood (for maintenance)

- `webapp/src/assignments/` — assignment configs, starters, tests
  (`types.ts` documents every test interface).
- `webapp/src/testing/` — the Check My Work engine:
  - `AssignmentTestRunner.ts` orchestrates: source checks → assemble →
    runtime tests, blocking runtime tests when assembly fails.
  - `TestHarnessBuilder.ts` generates the procedure-test programs. The
    harness is appended *after* student code (so assembler line numbers
    still point at student lines), uses `__csis118b_test_`-prefixed
    labels to avoid collisions, calls the procedure with the ABI's
    16-byte stack alignment, captures every register to memory, and
    prints `__CSIS_TEST_*` sentinel lines that the runner parses.
    Sentinels are internal — students never see them.
  - `testMachine.ts` owns a second, dedicated emulator instance so
    checks never disturb the student's editor/debugger session, with
    timeouts that stop infinite loops.
- `webapp/src/core/assignmentUrl.ts` / `assignmentAutosave.ts` — deep
  link and per-assignment storage helpers; `core/store.ts` wires them
  into app startup and the assignment dropdown.
- `webapp/src/core/appState.ts` — the serialization envelope shared by
  autosave and share/submission links (`{editorContent, mode,
  assignmentId}`, gzip+base64url via `compression.ts`). Versioned:
  `deserializers[1]` reads links from before the assignment system
  existed (no `assignmentId`) so old bookmarks keep working;
  `deserializers[2]` adds the optional `assignmentId`. Bump
  `APPSTATE_VERSION` and add a new numbered deserializer if the shape
  changes again — never edit an existing deserializer in place.
- `webapp/src/core/shareLink.ts` — the submission-link builder and the
  `SHARE_LINK_DANGEROUS_LEN` / `SHARE_LINK_MAX_LEN` length thresholds,
  shared by `ControlsShareDialog.svelte` (generic Share) and
  `CopySubmissionLinkButton.svelte` (assignment submission — same link
  format, different entry point and copy).
- Entry-point rules for procedure tests: if the student file includes
  `csis118b.inc` (which provides `_start` → `main`), the harness is
  `main`; otherwise the harness provides `_start`. Conflicts (student
  defines `main` while including the library, or defines `_start`)
  produce a clear student-facing message instead of a mystery error.
- Type-check assignment edits with
  `cd webapp && npx -p typescript tsc -p tsconfig.typecheck.json`.
