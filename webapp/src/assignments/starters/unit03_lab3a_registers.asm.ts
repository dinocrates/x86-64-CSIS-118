export const unit03Lab3aRegistersStarter = `; Name: Your Name
; Course: CSIS-118B
; Date: YYYY-MM-DD
; Assignment: Unit 03 Lab 3A - General Purpose Registers
; Purpose: Load integer literals written in three bases and print decimal values.
; Input: None.
; Output: The starter prints three zeros; complete TODOs 1-3.
; Registers: EAX holds each value; EDI passes its copy to print_uint.

%include "csis118b.inc"        ; Make the course library available.

section .text                 ; Begin the executable instructions.
    global main               ; Make main available as the program entry procedure.

main:                         ; Begin the student program.
    ; TODO 1: Replace 0 with a 0b-prefixed binary literal representing decimal 171.
    mov eax, 0                ; TODO: Load the required binary literal into EAX.
    mov edi, eax              ; Copy the value into the output argument register.
    call print_uint           ; Print the value as unsigned decimal.
    call print_newline        ; End the first output line.

    ; TODO 2: Replace 0 with the hexadecimal literal for 32 hex, using 0x.
    mov eax, 0                ; TODO: Load the required hexadecimal literal into EAX.
    mov edi, eax              ; Copy the value into the output argument register.
    call print_uint           ; Print the value as unsigned decimal.
    call print_newline        ; End the second output line.

    ; TODO 3: Replace 0 with the octal literal for 20 octal, using 0o.
    mov eax, 0                ; TODO: Load the required octal literal into EAX.
    mov edi, eax              ; Copy the value into the output argument register.
    call print_uint           ; Print the value as unsigned decimal.
    call print_newline        ; End the third output line.

    exit                      ; Finish the program normally.
`;
