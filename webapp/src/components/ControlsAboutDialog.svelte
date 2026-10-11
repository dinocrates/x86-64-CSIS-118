<script lang="ts">
  import { createDialog, melt } from '@melt-ui/svelte';
  import Close from './icons/Close.svelte';

  const {
    elements: { trigger, portalled, overlay, content, title, description, close },
    states: { open }
  } = createDialog();
</script>

<button {...$trigger} use:trigger
  type="button"
  class="button button--secondary about-btn"
>
  About
</button>

{#if $open}
  <div {...$portalled} use:portalled>
    <div {...$overlay} use:overlay />
    <div {...$content} use:content class="about-dialog">

      <button {...$close} use:close class="about-dialog__close">
        <Close
          style="fill:var(--color-gray-100);"
          aria-hidden="true"
          focusable="false"
        />
        <span class="visually-hidden">Close</span>
      </button>

      <h2 {...$title} use:title class="about-dialog__title">CSIS-118B Assembly IDE</h2>

      <div {...$description} use:description class="visually-hidden">
        Reference guide for the CSIS-118B Assembly IDE
      </div>

      <div class="about-dialog__body">

        <!-- ═══════════════════════════════════════════════ -->
        <!--  Section 1 — About                             -->
        <!-- ═══════════════════════════════════════════════ -->
        <section>
          <h3 class="section-heading">About</h3>
          <p>
            CSIS-118B Assembly IDE is a browser-based x86-64 NASM assembly editor,
            emulator, and debugger designed for CSIS-118B at Mt. San Jacinto College.
          </p>
          <p class="attribution">
            Built on the open source
            <span class="accent">x86-64 Playground</span> by robalb.
            Customized for CSIS-118B by Stephen Hamrick, Mt. San Jacinto College.
          </p>
        </section>

        <hr class="divider" />

        <!-- ═══════════════════════════════════════════════ -->
        <!--  Section 2 — Getting Started                   -->
        <!-- ═══════════════════════════════════════════════ -->
        <section>
          <h3 class="section-heading">Getting Started</h3>
          <p>Every CSIS-118B program follows this basic structure:</p>

          <pre class="code-block"><code>%include "csis118b.inc"

section .data
    msg db "Hello, World!", 0   ; null-terminated string

section .bss
    buf resb 64                 ; reserve 64 bytes (uninitialized)

section .text
    global main

main:
    mov rdi, msg
    call print_line
    exit                        ; macro — exits with code 0</code></pre>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">section .data</span>
              <span class="info-desc">Initialized data — strings, numbers, and other values you define up front.</span>
            </div>
            <div class="info-item">
              <span class="info-label">section .bss</span>
              <span class="info-desc">Uninitialized data — memory buffers and variables that start empty. Use <code>resb</code>, <code>resw</code>, <code>resd</code>, or <code>resq</code> to reserve space.</span>
            </div>
            <div class="info-item">
              <span class="info-label">section .text</span>
              <span class="info-desc">Your executable code lives here. The <code>global main</code> directive marks the entry point.</span>
            </div>
          </div>

          <h4 class="subsection-heading">Toolbar Buttons</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label btn-label">Compile</span>
              <span class="info-desc">Assembles and links your code. Error messages appear in red below the editor. Fix errors before running.</span>
            </div>
            <div class="info-item">
              <span class="info-label btn-label">Debug</span>
              <span class="info-desc">Compiles and starts the program <em>paused</em> at the first instruction. Use Step and Continue to walk through execution.</span>
            </div>
            <div class="info-item">
              <span class="info-label btn-label">Run</span>
              <span class="info-desc">Compiles and runs the program to completion. Output appears in the Terminal panel.</span>
            </div>
            <div class="info-item">
              <span class="info-label btn-label">Step</span>
              <span class="info-desc">Executes one instruction at a time. The Disassembly panel highlights the current instruction; Registers shows what changed.</span>
            </div>
            <div class="info-item">
              <span class="info-label btn-label">Continue</span>
              <span class="info-desc">Resumes execution from the current pause point and runs until the next breakpoint or program exit.</span>
            </div>
          </div>
        </section>

        <hr class="divider" />

        <!-- ═══════════════════════════════════════════════ -->
        <!--  Section 3 — csis118b.inc Procedure Reference  -->
        <!-- ═══════════════════════════════════════════════ -->
        <section>
          <h3 class="section-heading">csis118b.inc Procedure Reference</h3>
          <p>
            Include <code>%include "csis118b.inc"</code> at the top of your program
            to access all procedures below. Pass arguments using the
            <a href="#calling-convention" class="inline-link">calling convention</a> — first argument in <code>rdi</code>,
            second in <code>rsi</code>, etc.
          </p>

          <!-- print_int -->
          <div class="proc">
            <h4 class="proc__name">print_int</h4>
            <p class="proc__desc">Prints a <strong>signed</strong> 64-bit integer to the terminal, with no newline.</p>
            <pre class="code-block"><code>mov rdi, -42
call print_int          ; prints: -42</code></pre>
          </div>

          <!-- print_uint -->
          <div class="proc">
            <h4 class="proc__name">print_uint</h4>
            <p class="proc__desc">Prints an <strong>unsigned</strong> 64-bit integer to the terminal, with no newline.</p>
            <pre class="code-block"><code>mov rdi, 255
call print_uint         ; prints: 255</code></pre>
          </div>

          <!-- print_string -->
          <div class="proc">
            <h4 class="proc__name">print_string</h4>
            <p class="proc__desc">Prints a null-terminated string — no newline added.</p>
            <pre class="code-block"><code>section .data
    greeting db "Hello", 0

section .text
main:
    mov rdi, greeting
    call print_string   ; prints: Hello</code></pre>
          </div>

          <!-- print_line -->
          <div class="proc">
            <h4 class="proc__name">print_line</h4>
            <p class="proc__desc">Prints a null-terminated string <strong>followed by a newline</strong>. Shorthand for <code>print_string</code> + <code>print_newline</code>.</p>
            <pre class="code-block"><code>mov rdi, greeting
call print_line         ; prints: Hello\n</code></pre>
          </div>

          <!-- print_char -->
          <div class="proc">
            <h4 class="proc__name">print_char</h4>
            <p class="proc__desc">Prints a single character. Pass the ASCII value in <code>rdi</code>.</p>
            <pre class="code-block"><code>mov rdi, 65             ; ASCII 'A'
call print_char         ; prints: A</code></pre>
          </div>

          <!-- print_newline -->
          <div class="proc">
            <h4 class="proc__name">print_newline</h4>
            <p class="proc__desc">Prints a single newline character (<code>\n</code>). No arguments needed.</p>
            <pre class="code-block"><code>call print_newline      ; moves cursor to next line</code></pre>
          </div>

          <!-- print_hex -->
          <div class="proc">
            <h4 class="proc__name">print_hex</h4>
            <p class="proc__desc">Prints a 64-bit value in hexadecimal (e.g. <code>0x1A2B</code>). Useful for inspecting raw values.</p>
            <pre class="code-block"><code>mov rdi, 255
call print_hex          ; prints: 0xFF</code></pre>
          </div>

          <!-- read_int -->
          <div class="proc">
            <h4 class="proc__name">read_int</h4>
            <p class="proc__desc">Reads a signed integer typed by the user and returns it in <code>rax</code>. No arguments needed.</p>
            <pre class="code-block"><code>call read_int           ; user types a number
mov rbx, rax            ; save the result in rbx</code></pre>
          </div>

          <!-- read_string -->
          <div class="proc">
            <h4 class="proc__name">read_string</h4>
            <p class="proc__desc">Reads a line of text from the user into a buffer. Pass the buffer address in <code>rdi</code> and the maximum number of bytes in <code>rsi</code>.</p>
            <pre class="code-block"><code>section .bss
    buf resb 64

section .text
main:
    mov rdi, buf
    mov rsi, 64
    call read_string    ; stores input in buf</code></pre>
          </div>

          <!-- read_char -->
          <div class="proc">
            <h4 class="proc__name">read_char</h4>
            <p class="proc__desc">Reads a single character from the user and returns its ASCII value in <code>rax</code>.</p>
            <pre class="code-block"><code>call read_char          ; user presses a key
; rax now holds the ASCII value of the key</code></pre>
          </div>

          <!-- rand_range -->
          <div class="proc">
            <h4 class="proc__name">rand_range</h4>
            <p class="proc__desc">Returns a random integer in the range [<code>rdi</code>, <code>rsi</code>] (inclusive on both ends). Result is in <code>rax</code>.</p>
            <pre class="code-block"><code>mov rdi, 1
mov rsi, 6
call rand_range         ; rax = random number 1–6 (like a die roll)</code></pre>
          </div>

          <!-- rand_seed -->
          <div class="proc">
            <h4 class="proc__name">rand_seed</h4>
            <p class="proc__desc">Seeds the random number generator. Call this once at the start of your program to get different results each run.</p>
            <pre class="code-block"><code>mov rdi, 42             ; any seed value
call rand_seed</code></pre>
          </div>

          <!-- clear_screen -->
          <div class="proc">
            <h4 class="proc__name">clear_screen</h4>
            <p class="proc__desc">Clears the terminal output. No arguments needed.</p>
            <pre class="code-block"><code>call clear_screen</code></pre>
          </div>

          <!-- exit_program -->
          <div class="proc">
            <h4 class="proc__name">exit_program</h4>
            <p class="proc__desc">Exits the program with the given exit code. Pass the code in <code>rdi</code>. Exit code 0 means success.</p>
            <pre class="code-block"><code>mov rdi, 0
call exit_program       ; exit with success</code></pre>
          </div>

          <h4 class="subsection-heading">Convenience Macros</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label"><code>exit</code></span>
              <span class="info-desc">Shorthand for <code>mov rdi, 0 / call exit_program</code>. Exits with code 0.</span>
            </div>
            <div class="info-item">
              <span class="info-label"><code>endl</code></span>
              <span class="info-desc">Shorthand for <code>call print_newline</code>. Prints a newline character.</span>
            </div>
            <div class="info-item">
              <span class="info-label"><code>cls</code></span>
              <span class="info-desc">Shorthand for <code>call clear_screen</code>. Clears the terminal.</span>
            </div>
          </div>
        </section>

        <hr class="divider" />

        <!-- ═══════════════════════════════════════════════ -->
        <!--  Section 4 — Calling Convention                -->
        <!-- ═══════════════════════════════════════════════ -->
        <section id="calling-convention">
          <h3 class="section-heading">Calling Convention</h3>
          <p>
            When you <code>call</code> any procedure — including the ones in
            <code>csis118b.inc</code> — arguments are passed in registers in this order:
          </p>

          <div class="convention-row">
            <span class="convention-reg">rdi</span>
            <span class="convention-arrow">→</span>
            <span class="convention-desc">1st argument</span>
          </div>
          <div class="convention-row">
            <span class="convention-reg">rsi</span>
            <span class="convention-arrow">→</span>
            <span class="convention-desc">2nd argument</span>
          </div>
          <div class="convention-row">
            <span class="convention-reg">rdx</span>
            <span class="convention-arrow">→</span>
            <span class="convention-desc">3rd argument</span>
          </div>
          <div class="convention-row">
            <span class="convention-reg">rcx</span>
            <span class="convention-arrow">→</span>
            <span class="convention-desc">4th argument</span>
          </div>
          <div class="convention-row">
            <span class="convention-reg">rax</span>
            <span class="convention-arrow">←</span>
            <span class="convention-desc">Return value (after the call returns)</span>
          </div>

          <div class="callout">
            <strong>Tip:</strong> After a <code>call</code>, assume that <code>rax</code>,
            <code>rcx</code>, <code>rdx</code>, <code>rdi</code>, <code>rsi</code>,
            <code>r8</code>–<code>r11</code> may have changed. If you need to preserve
            a value across a call, save it in <code>rbx</code>, <code>rbp</code>, or
            on the stack first.
          </div>
        </section>

        <hr class="divider" />

        <!-- ═══════════════════════════════════════════════ -->
        <!--  Section 5 — Register Quick Reference          -->
        <!-- ═══════════════════════════════════════════════ -->
        <section>
          <h3 class="section-heading">Register Quick Reference</h3>
          <p>x86-64 has 16 general-purpose 64-bit registers. Here are the most common ones:</p>

          <table class="reg-table">
            <thead>
              <tr>
                <th>Register</th>
                <th>Common Use</th>
                <th>Preserved across calls?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>rax</code></td>
                <td>Accumulator; holds <strong>return values</strong> from calls</td>
                <td class="no">No</td>
              </tr>
              <tr>
                <td><code>rbx</code></td>
                <td>General purpose — safe to use for long-lived values</td>
                <td class="yes">Yes</td>
              </tr>
              <tr>
                <td><code>rcx</code></td>
                <td>Counter (e.g. loop counter); 4th call argument</td>
                <td class="no">No</td>
              </tr>
              <tr>
                <td><code>rdx</code></td>
                <td>Data register; 3rd call argument; used in multiply/divide</td>
                <td class="no">No</td>
              </tr>
              <tr>
                <td><code>rdi</code></td>
                <td><strong>1st call argument</strong></td>
                <td class="no">No</td>
              </tr>
              <tr>
                <td><code>rsi</code></td>
                <td><strong>2nd call argument</strong></td>
                <td class="no">No</td>
              </tr>
              <tr>
                <td><code>rbp</code></td>
                <td>Base pointer — marks the bottom of the current stack frame</td>
                <td class="yes">Yes</td>
              </tr>
              <tr>
                <td><code>rsp</code></td>
                <td>Stack pointer — always points to the top of the stack. Don't clobber this.</td>
                <td class="yes">Yes</td>
              </tr>
              <tr>
                <td><code>r8</code>–<code>r11</code></td>
                <td>Extra argument registers (5th–8th args) and general purpose</td>
                <td class="no">No</td>
              </tr>
              <tr>
                <td><code>r12</code>–<code>r15</code></td>
                <td>General purpose — safe to use for long-lived values</td>
                <td class="yes">Yes</td>
              </tr>
            </tbody>
          </table>

          <div class="callout">
            <strong>Preserved across calls</strong> ("callee-saved") means the procedure
            you call is responsible for restoring these registers before returning.
            You can rely on <code>rbx</code>, <code>rbp</code>, <code>r12</code>–<code>r15</code>
            surviving a <code>call</code>. All others may be overwritten.
          </div>
        </section>

      </div><!-- /.about-dialog__body -->
    </div><!-- /.about-dialog -->
  </div>
{/if}


<style>
/* ─── Trigger button ──────────────────────────────────── */
.about-btn {
  /* inherits .button--secondary from global style */
}

/* ─── Dialog overrides ────────────────────────────────── */
/*
 * The global style sets max-width: 450px on data-melt-dialog-content.
 * We use a wrapper class to widen the About dialog.
 */
:global(.about-dialog[data-melt-dialog-content]) {
  max-width: 780px;
  width: 95vw;
  max-height: 88vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0;
}

/* ─── Close button ────────────────────────────────────── */
:global(.about-dialog[data-melt-dialog-content] [data-melt-dialog-close]) {
  position: absolute;
  right: 0.75rem;
  top: 0.75rem;
  color: var(--theme-brand-close-fg, var(--color-white));
}

/* ─── Title bar ───────────────────────────────────────── */
.about-dialog__title {
  margin: 0;
  padding: 1rem 3rem 1rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--theme-brand-fg);
  background-color: var(--theme-brand-bg);
  border-bottom: 2px solid rgba(0,0,0,0.3);
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

/* ─── Scrollable body ─────────────────────────────────── */
.about-dialog__body {
  overflow-y: auto;
  padding: 1.5rem;
  flex: 1;
  color: var(--theme-text-fg);
  line-height: 1.65;
}

.about-dialog__body p {
  margin: 0 0 0.75rem;
}

.about-dialog__body section {
  margin-bottom: 0.5rem;
}

/* ─── Section headings ────────────────────────────────── */
.section-heading {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-msjc-red);
  margin: 0 0 0.75rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid rgba(178, 41, 46, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.subsection-heading {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-gray-100);
  margin: 1.25rem 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.divider {
  border: none;
  border-top: 1px solid var(--theme-panel-border);
  margin: 1.25rem 0;
}

/* ─── Attribution ─────────────────────────────────────── */
.attribution {
  font-size: 0.85rem;
  color: var(--color-gray-200);
}

.accent {
  color: var(--color-orange);
  font-style: italic;
}

/* ─── Code blocks ─────────────────────────────────────── */
.code-block {
  background-color: var(--theme-panel-controls-bg);
  border: 1px solid var(--theme-panel-border);
  border-left: 3px solid var(--color-msjc-red);
  border-radius: 4px;
  padding: 0.75rem 1rem;
  margin: 0.5rem 0 1rem;
  overflow-x: auto;
  font-family: var(--code-font-family);
  font-size: 0.82rem;
  line-height: 1.55;
  color: var(--color-gray-50);
}

.code-block code {
  font-family: inherit;
  font-size: inherit;
  background: none;
  padding: 0;
}

code {
  font-family: var(--code-font-family);
  font-size: 0.85em;
  background-color: var(--theme-inline-code-bg);
  padding: 0.1em 0.35em;
  border-radius: 3px;
  color: var(--color-gray-50);
}

/* ─── Info grid (key/value pairs) ─────────────────────── */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0.5rem 0 1rem;
}

.info-item {
  display: grid;
  grid-template-columns: 10rem 1fr;
  gap: 0.75rem;
  align-items: baseline;
  padding: 0.3rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.info-label {
  font-family: var(--code-font-family);
  font-size: 0.85rem;
  color: var(--color-orange);
  font-weight: 600;
  white-space: nowrap;
}

.btn-label {
  font-family: var(--font-family);
  font-size: 0.85rem;
  color: var(--color-blue);
}

.info-desc {
  font-size: 0.9rem;
  color: var(--color-gray-100);
}

/* ─── Procedure blocks ────────────────────────────────── */
.proc {
  margin-bottom: 1.25rem;
  padding-bottom: 0.25rem;
}

.proc__name {
  font-family: var(--code-font-family);
  font-size: 0.95rem;
  color: var(--color-orange);
  margin: 0 0 0.25rem;
  font-weight: 600;
}

.proc__desc {
  margin: 0 0 0.3rem;
  font-size: 0.9rem;
  color: var(--color-gray-100);
}

/* ─── Calling convention ──────────────────────────────── */
.convention-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.3rem 0.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.convention-reg {
  font-family: var(--code-font-family);
  font-size: 0.9rem;
  color: var(--color-blue);
  font-weight: 600;
  width: 3rem;
  flex-shrink: 0;
}

.convention-arrow {
  color: var(--color-msjc-red);
  font-weight: 700;
  font-size: 1rem;
}

.convention-desc {
  font-size: 0.9rem;
  color: var(--color-gray-100);
}

/* ─── Callout box ─────────────────────────────────────── */
.callout {
  background-color: rgba(178, 41, 46, 0.1);
  border-left: 3px solid var(--color-msjc-red);
  border-radius: 0 4px 4px 0;
  padding: 0.65rem 1rem;
  margin: 0.75rem 0;
  font-size: 0.88rem;
  color: var(--color-gray-100);
  line-height: 1.55;
}

/* ─── Register table ──────────────────────────────────── */
.reg-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  margin: 0.5rem 0 1rem;
}

.reg-table th {
  text-align: left;
  padding: 0.4rem 0.75rem;
  background-color: var(--theme-panel-controls-bg);
  color: var(--color-gray-200);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--theme-panel-border);
}

.reg-table td {
  padding: 0.4rem 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  color: var(--color-gray-100);
  vertical-align: top;
}

.reg-table tr:last-child td {
  border-bottom: none;
}

.reg-table td:first-child {
  white-space: nowrap;
  width: 7rem;
}

.reg-table .yes {
  color: var(--color-green);
  font-size: 0.82rem;
  white-space: nowrap;
  width: 9rem;
}

.reg-table .no {
  color: var(--color-gray-250);
  font-size: 0.82rem;
  white-space: nowrap;
  width: 9rem;
}

/* ─── Inline link ─────────────────────────────────────── */
.inline-link {
  color: var(--color-blue);
  text-underline-offset: 2px;
}

.inline-link:hover {
  color: var(--color-gray-50);
}
</style>
