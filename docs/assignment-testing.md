# CSIS-118B Assignments & Check My Work — Instructor Guide

This guide explains how to author assignments for the CSIS-118B playground:
starter code, visible student-facing tests, Canvas deep links, and how the
pieces fit together.

**Audience:** the instructor maintaining this repository.
**Student-facing feature name:** *Check My Work* (never "grade", "submit",
or "autograde" — see [Why this is not grading](#why-check-my-work-is-not-official-grading)).

---

## How the system works (one-minute version)

- Each assignment is an `AssignmentConfig` object: an id, title,
  description, starter code, and a list of visible tests.
- Students open a Canvas assignment containing an iframe or link like
  `index.html?assignment=unit02-register-arithmetic`. The playground
  selects that assignment automatically, restoring the student's saved
  work for it (or the starter code on first open).
- Students write code, click **Check My Work**, read the feedback, fix,
  repeat — then download `<assignment-id>.asm` and submit it in Canvas.
- All checks run inside a second, dedicated copy of the in-browser
  emulator, so the student's editor/debugger state is never disturbed.
  Nothing ever leaves the browser.

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
https://dinocrates.github.io/x86-64-CSIS-118/index.html?assignment=unit02-register-arithmetic
```

Embed it in a Canvas page or assignment:

```html
<iframe
  src="https://dinocrates.github.io/x86-64-CSIS-118/index.html?assignment=unit02-register-arithmetic"
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
  `unit02-register-arithmetic.asm`), else `program.asm`. This is what
  students submit in Canvas.
- **Test report:** after running checks, *Download Test Report* saves
  `csis118b-<assignment-id>-test-report.txt` — assignment, timestamp,
  summary, per-test results, and a `sha256` hash of the exact source
  that was checked, so you can tell whether a report matches the `.asm`
  a student submitted. No student name is collected or included.

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
   practice tests in your browser. Passing these tests does not submit
   your assignment and does not guarantee full credit."*

Grade in Canvas as usual, from the submitted `.asm`. If you later want
private/hidden tests, run them **locally**: the same
`AssignmentConfig`/test shapes are designed so a future instructor-only
batch grader can reuse them against downloaded Canvas submissions —
keep hidden tests out of this repository's deployed code.

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
- Entry-point rules for procedure tests: if the student file includes
  `csis118b.inc` (which provides `_start` → `main`), the harness is
  `main`; otherwise the harness provides `_start`. Conflicts (student
  defines `main` while including the library, or defines `_start`)
  produce a clear student-facing message instead of a mystery error.
- Type-check assignment edits with
  `cd webapp && npx -p typescript tsc -p tsconfig.typecheck.json`.
