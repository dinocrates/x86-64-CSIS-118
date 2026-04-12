import type { Snippet } from "./example_snippets";

// Re-export Snippet as Template so callers can use either name.
// The shape is identical — templates feed into the same snippetToAppState()
// pipeline that examples use, so no new interface is needed.
export type Template = Snippet;

// ─── Template source strings ──────────────────────────────────────────────────

const hello_world = `; ============================================
; CSIS-118B | Mt. San Jacinto College
; Assignment: Hello World
; Student: [Your Name]
; Date: [Date]
; Description: Print Hello World to the screen
; ============================================

%include "csis118b.inc"

section .data
    msg db "Hello, World!", 0

section .text
    global main

main:
    mov rdi, msg
    call print_line
    exit
`;

// ─── Template registry ────────────────────────────────────────────────────────
// To add a new template:
//   1. Define the source string above.
//   2. Add an entry to this record following the same pattern.
// The key becomes the template's unique id.

export const templates: Record<string, Template> = {
    hello_world: {
        id: "hello_world",
        display_name: "Hello World",
        description: "Starter template for the Hello World assignment. Prints a string using print_line from csis118b.inc.",
        mode: "NASM_trunk",
        editorContent: hello_world,
    },
} as const;

export const default_template: keyof typeof templates = "hello_world";
