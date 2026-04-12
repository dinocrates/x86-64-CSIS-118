# CSIS-118B Assembly IDE — Design Document
**Version 1.0 | Mt. San Jacinto College**

---

## Project Overview

This project is a customized fork of the [x86-64 Playground](https://github.com/robalb/x86-64-playground) — an open source, browser-based x86-64 assembly editor, emulator, and debugger. The goal is to create a dedicated IDE for CSIS-118B (x86-64 Assembly Language) at Mt. San Jacinto College (MSJC), hosted at shamrick.com and deployed via GitHub Pages.

**Live URL (GitHub Pages):** https://dinocrates.github.io/x86-64-CSIS-118  
**Production URL (target):** https://shamrick.com/csis118b  
**Repository:** https://github.com/dinocrates/x86-64-CSIS-118

---

## Background & Context

### Why we're building this
The course previously used MASM (Microsoft Macro Assembler) with Visual Studio on Windows. This setup has become unusable due to Visual Studio compatibility issues and fails to support students on Chromebooks and Macs. The course is being redesigned around 64-bit NASM on Linux, which is more modern, more portable, and more relevant to real-world assembly programming.

### Student environment
- Class size: ~32 students
- Devices: Mix of Windows PCs, Chromebooks, and Macs
- Platform restriction: Students cannot use GitHub (FERPA compliance — student code cannot be submitted to third-party platforms)
- LMS: Canvas (used for assignment submission via file upload)
- No local software installation required — everything must run in the browser

### What students do
- Write x86-64 NASM assembly programs
- Assemble, run, and debug their code
- Save their .asm files locally and submit via Canvas
- Pick up where they left off across sessions (auto-save)

---

## Technical Foundation

### Base project
**x86-64 Playground** by robalb  
- GitHub: https://github.com/robalb/x86-64-playground  
- Live: https://x64.halb.it  
- Stack: Svelte + TypeScript + Vite  
- Emulator: Blink x86-64-Linux emulator compiled to WebAssembly (runs entirely client-side)
- All code runs in the browser — nothing is ever sent to a server
- Works offline once loaded
- License: ISC

### Why this tool
- Runs entirely in the browser — no installation needed
- Supports NASM natively
- GDB-like debugger with register and memory visualization
- Designed with academic use in mind
- Open source and self-hostable
- Works on Chromebooks, Macs, and Windows

---

## Branding & Visual Design

### Identity
- **Course:** CSIS-118B
- **Institution:** Mt. San Jacinto College (MSJC)
- **Header title:** `CSIS-118B` with subtitle `x86-64 Assembly | Mt. San Jacinto College`
- **Do NOT use the official MSJC trademark/logo** — the institution is extremely protective of it and requires 18+ months of approval for any use. Use text-only branding.

### Color Palette
From the official MSJC Brand Identity Guide (Version 1.0, October 2021):

**Primary Colors:**
| Name | Hex | Use |
|---|---|---|
| MSJC Red | `#B2292E` | Primary accent, buttons, highlights, active states |
| Black | `#000000` | Text, backgrounds |
| Dark Gray | `#5B6670` | Panels, borders, secondary UI |
| Medium Gray | `#888B8D` | Muted text, inactive states |
| Light Gray | `#CFD2D3` | Subtle backgrounds |

**Accent Colors (available):**
| Name | Hex |
|---|---|
| Dark Red | `#7F2629` |
| Blue | `#3D7CC9` |
| Gold | `#F5A800` |

### Typography
- MSJC official fonts (Magneta, Univers LT Std) are Adobe fonts not available on the web
- Use **DM Sans** or **Inter** from Google Fonts as substitutes — clean, modern, close in feel to Univers
- Monospace font for the code editor: keep existing editor font (JetBrains Mono or similar)

### Overall aesthetic
- Dark theme (keep the existing dark background from x86-64 Playground)
- MSJC Red (`#B2292E`) as the primary accent color replacing the existing accent color
- Clean, professional, academic feel
- Not cluttered — students are beginners, the UI should be approachable

---

## Functional Requirements

### 1. Lock to NASM Only
The original app supports multiple assemblers: GNU Binutils (GAS), FASM, and NASM. 

**Change:** Remove the assembler selector entirely. Lock the environment to NASM only. Students should never see options for GAS or FASM — this reduces confusion for beginners.

### 2. Replace "Load Examples" with "Load Templates"
The original app has a "Load Examples" button that loads demo programs.

**Change:** Replace this with a "Load Templates" button containing assignment starter templates for CSIS-118B. Each template should include the standard boilerplate with `%include "csis118b.inc"` already at the top so students never have to type it.

**Standard template boilerplate:**
```nasm
%include "csis118b.inc"

section .data
    ; your data here

section .text
    global main

main:
    ; your code here
    exit
```

Templates will be defined as the course assignments are finalized. The system should make it easy to add new templates by editing a single configuration file.

### 3. Bake in csis118b.inc
The `csis118b.inc` include file must be available in the emulator environment so students can use `%include "csis118b.inc"` without uploading any files.

This replaces the role of the old MASM `asmlib.inc` + precompiled C library that was used in the previous course. The new version is:
- Pure NASM (no precompiled binary blob)
- Transparent — students can read the source and see exactly how each procedure works
- Educational — the library itself is a teaching tool

### 4. Auto-Save
Student code should auto-save to browser localStorage as they type (debounced ~1.5 seconds after last keystroke). When they return to the page their last code should be restored automatically.

- Show a subtle status indicator: "Auto-saved at 2:34 PM" / "Unsaved changes"
- Include a "Reset to template" option to discard saved work
- Note: localStorage is per-browser per-device. This is acceptable for 1:1 Chromebook setups. Students on shared devices should use Ctrl+S to download their .asm file and re-upload next session.

### 5. File Save/Load
Students should be able to:
- **Ctrl+S** — download their code as a `.asm` file
- **Open File** — upload a previously saved `.asm` file
- These are used to persist work across devices and for Canvas submission

---

## csis118b.inc — Library Specification

### Philosophy
- Pure NASM — no precompiled C library, no binary blobs
- Follows the 64-bit Linux System V AMD64 ABI (arguments in registers: rdi, rsi, rdx, rcx, r8, r9)
- Transparent and readable — students can open the file and see how everything works
- Serves as a teaching tool, not just a black box
- Designed to be progressively revealed — early weeks students use it freely, later assignments ask them to implement procedures from scratch

### Calling Convention
All procedures follow the standard 64-bit Linux ABI:
- First argument: `rdi`
- Second argument: `rsi`  
- Third argument: `rdx`
- Return value: `rax`
- Caller-saved: rax, rcx, rdx, rsi, rdi, r8-r11
- Callee-saved: rbx, rbp, r12-r15

### Procedure List (v1)

**Output:**
| Procedure | Arguments | Description |
|---|---|---|
| `print_int` | rdi = signed integer | Print signed 64-bit integer to stdout |
| `print_uint` | rdi = unsigned integer | Print unsigned 64-bit integer to stdout |
| `print_string` | rdi = pointer to null-terminated string | Print string to stdout |
| `print_line` | rdi = pointer to null-terminated string | Print string + newline to stdout |
| `print_char` | rdi = character (byte) | Print single character to stdout |
| `print_newline` | none | Print newline character |
| `print_hex` | rdi = value | Print value as hexadecimal (e.g. 0x1A2B) |

**Input:**
| Procedure | Arguments | Returns | Description |
|---|---|---|---|
| `read_int` | none | rax = integer | Read integer from stdin |
| `read_string` | rdi = buffer ptr, rsi = max length | rax = bytes read | Read string from stdin |
| `read_char` | none | rax = character | Read single character from stdin |

**Utilities:**
| Procedure | Arguments | Returns | Description |
|---|---|---|---|
| `rand_range` | rdi = min, rsi = max | rax = random number | Return random integer between min and max inclusive |
| `rand_seed` | rdi = seed value | none | Seed the random number generator |
| `clear_screen` | none | none | Clear the terminal (ANSI escape sequence) |
| `exit_program` | rdi = exit code | none | Exit cleanly with given exit code |

**Macros:**
| Macro | Expands to | Description |
|---|---|---|
| `exit` | `mov rdi, 0` / `call exit_program` | Clean exit with code 0 |
| `endl` | `call print_newline` | Print newline |
| `cls` | `call clear_screen` | Clear screen |

### Deferred to v2 (when floating point unit is taught)
- `print_float` — print double-precision float (uses xmm0)
- `read_float` — read float from stdin (returns in xmm0)
- `print_money` — format integer cents as $X.XX currency string

### Implementation notes
- `print_int` requires integer-to-ASCII conversion (divide by 10 repeatedly, push digits, write)
- `rand_range` should use a simple LCG or the `rdrand` instruction
- `read_int` requires ASCII-to-integer parsing
- All procedures should preserve callee-saved registers (push/pop rbx, rbp, r12-r15 as needed)
- Use Linux syscalls directly (sys_write = 1, sys_read = 0, sys_exit = 60) via `syscall` instruction

---

## Assignment Templates

Templates replace the "Load Examples" feature. Each template is a starter file for a specific assignment. Templates should be easy to add/modify in a single config file.

### Standard header for all templates
```nasm
; ============================================
; CSIS-118B | Mt. San Jacinto College
; Assignment: [Assignment Name]
; Student: [Your Name]
; Date: [Date]
; Description: [Brief description]
; ============================================

%include "csis118b.inc"

section .data
    ; Define your data here

section .bss
    ; Define uninitialized data here

section .text
    global main

main:
    ; Your code here

    exit
```

### Planned templates (to be finalized with instructor)
- Hello World (intro)
- Arithmetic Operations
- Branching / Conditionals
- Loops
- Procedures & Stack
- Arrays
- String Operations
- Dice Game (random numbers + game logic)

---

## Development Workflow

### Local development
```
cd webapp
npm install
npm run dev
# App runs at http://localhost:5173
```

### Deployment
Push to `master` branch → GitHub Actions automatically builds and deploys to GitHub Pages.

The workflow file is at `.github/workflows/deploy_github_pages.yml`

### Key files to modify
| File | Purpose |
|---|---|
| `webapp/index.html` | Page title |
| `webapp/src/App.svelte` | Root component, header branding |
| `webapp/src/DesktopLayout.svelte` | Main desktop UI layout |
| `webapp/src/styles/` | CSS theme/colors |
| `webapp/src/components/` | Individual UI components |
| `webapp/public/` | Static assets, place csis118b.inc here |

---

## Constraints & Decisions Log

| Decision | Reasoning |
|---|---|
| x86-64 (not 16/32-bit) | More relevant to modern computing; students learn real 64-bit assembly |
| NASM only (not GAS/FASM) | Reduces beginner confusion; Intel syntax familiar from MASM background |
| No MSJC trademark/logo | Approval process takes 18+ months; text-only branding avoids this |
| No floats in v1 library | Floats use xmm registers — a separate topic; add in v2 when taught |
| Pure NASM library (no C binary) | Transparent, educational, no precompiled blobs to manage |
| localStorage for auto-save | No backend needed; sufficient for 1:1 Chromebook setups |
| GitHub Pages for hosting | Free, automatic CI/CD, no server management |
| HostGator as production domain | shamrick.com already hosted there; point domain at GitHub Pages |
| Canvas for assignment submission | Students download .asm file, upload to Canvas — no GitHub needed |
| Students never touch GitHub | FERPA compliance — student data stays off third-party platforms |

---

## Future Considerations
- v2: Add floating point procedures to csis118b.inc when that unit is taught
- v2: writeMoney procedure for the dice/money game assignment
- Possible: PHP backend on HostGator for cloud save tied to student ID
- Possible: Canvas LTI integration for seamless authentication
- Possible: Instructor view to see student code progress

---

*Document maintained by: Stephen (MSJC CSIS Department)*  
*Last updated: April 2026*
