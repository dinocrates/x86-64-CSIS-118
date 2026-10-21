export const unit04A01SumReverseStarter = `; Name: Your Name
; Course: CSIS-118B
; Date: YYYY-MM-DD
; Assignment: Unit 04 Assignment 1 - Sum and Reverse
; Purpose: Starter demonstration - read, store, and echo one unsigned WORD.
; Input: Four unsigned whole numbers (num1/num2: 0-65535; num3/num4: 0-4294967295).
; Output: One prompt followed by the saved starter value.
; Complete the TODOs to build the required four-input sum-and-reverse program.

%include "csis118b.inc"              ; Make the course library available.

section .data                       ; Define initialized data.
    num1: dw 0                      ; Store the first unsigned WORD input.
    num2: dw 0                      ; Store the second unsigned WORD input.
    num3: dd 0                      ; Store the third unsigned DWORD input.
    num4: dd 0                      ; Store the fourth unsigned DWORD input.
    prompt1: db "Enter num1 (0-65535):", 0 ; Prompt for the first value.
    echo_label: db "Starter value: ", 0 ; Label the temporary echo.
    ; TODO 1: Add prompts for the remaining three inputs.
    ; TODO 2: Add Sum: and Reverse order: strings.
    ; TODO 3: Add separate QWORD total storage if needed.

section .text                       ; Begin executable instructions.
    global main                     ; Expose the course entry procedure.

main:                               ; Begin the student program.
    lea rdi, [rel prompt1]           ; Pass the prompt's address.
    call print_line                 ; Print the prompt and a newline.
    call read_int                   ; Read one decimal integer into RAX.
    mov word [rel num1], ax          ; Save the first input's low 16 bits immediately.

    ; TODO 4: Read and store num2, num3, and num4 in order.
    ; TODO 5: Calculate and preserve the complete 64-bit sum.
    ; TODO 6: Replace the temporary echo with the required final output.
    ; TODO 7: Print num4, num3, num2, and num1 on separate lines.

    lea rdi, [rel echo_label]        ; Pass the temporary echo label's address.
    call print_string               ; Print the label without a newline.
    movzx edi, word [rel num1]       ; Zero-extend the saved WORD for output.
    call print_uint                 ; Display the stored input.
    call print_newline              ; End the output line.
    exit                            ; Finish the program normally.
`;
