export const unit03Lab3bVariablesStarter = `; Name: Your Name
; Course: CSIS-118B
; Date: YYYY-MM-DD
; Assignment: Unit 03 Lab 3B - Creating Variables
; Purpose: Starter example - read, store, and echo one signed integer.
; Input: One decimal integer from -1000000 through 1000000.
; Output: An input prompt followed by the stored value.
; Registers: RAX returns input; EAX supplies its low 32 bits; RDI passes output.

%include "csis118b.inc"              ; Make the course library available.

section .data                       ; Define initialized data.
    prompt: db "Input a number", 0   ; Store a NUL-terminated input prompt.
    echo_text: db "You entered: ", 0 ; Store the prefix for the starter's output.
    sample_value: dd 0               ; Allocate one four-byte integer variable.

section .text                       ; Begin executable instructions.
    global main                     ; Make main available as the entry procedure.

main:                               ; Begin the student program.
    lea rdi, [rel prompt]            ; Pass the prompt's address to the output routine.
    call print_line                 ; Display the prompt and add a newline.
    call read_int                   ; Read one signed decimal integer into RAX.
    mov dword [rel sample_value], eax ; Save four bytes immediately after input.

    lea rdi, [rel echo_text]         ; Pass the output prefix's address.
    call print_string               ; Print the prefix without a newline.
    movsxd rdi, dword [rel sample_value] ; Widen the saved signed DWORD to 64 bits.
    call print_int                  ; Display the stored integer as signed decimal.
    call print_newline              ; End the output line.
    exit                            ; Finish the program normally.
`;
