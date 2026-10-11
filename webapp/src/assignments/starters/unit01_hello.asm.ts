export const unit01HelloStarter = `; ============================================================================
; Name:    Your Name
; Course:  CSIS-118B - Computer Organization & Assembly Language
; Date:    YYYY-MM-DD
; Program: Unit 1 - My First Assembly Program
; Purpose: Print a greeting and my name, then finish successfully.
; Input:   Values and messages are supplied in the source code.
; Output:  Two lines of text in the Terminal.
; Registers:
;   RBX holds the value 42 for a debugger observation.
;   RDI holds the address of each message passed to print_line.
; ============================================================================

%include "csis118b.inc"         ; Make the course startup and helpers available.

section .data                  ; Store messages with their initial contents.
    greeting db "Hello, Assembly!", 0
    author   db "Programmer: Your Name", 0
    ; Each final zero marks the end of its string for print_line.

section .text                  ; Place the executable instructions here.
    global main                ; Make main available to the course startup code.

main:
    mov rbx, 42                ; Load a known value to inspect in the debugger.

    ; Print the greeting using the course output procedure.
    mov rdi, greeting          ; Pass the address where the greeting begins.
    call print_line            ; Display the string and advance to a new line.

    ; Print my name on a separate line.
    mov rdi, author            ; Pass the address of my identifying message.
    call print_line            ; Display the message and advance to a new line.

    exit                       ; Use the course macro to end with status zero.

`;
