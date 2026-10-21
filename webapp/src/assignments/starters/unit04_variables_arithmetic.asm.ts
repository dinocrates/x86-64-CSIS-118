export const unit04VariablesArithmeticStarter = `; Name: Your Name
; Course: CSIS-118B
; Date: YYYY-MM-DD
; Assignment: Unit 04 - Variables & Basic Arithmetic
; Purpose: Starter demonstration - read, store, and echo one unsigned WORD.
; Input: One decimal whole number from 0 through 65535.
; Output: One prompt followed by the saved starter value.
; Complete the TODOs to build the required two-input arithmetic program.

%include "csis118b.inc"              ; Make the course library available.

section .data                       ; Define initialized strings.
    prompt: db "Enter a number", 0   ; Store the required input prompt.
    echo_text: db "Starter value: ", 0 ; Label the starter demonstration's output.
    ; TODO: Add the five required null-terminated result labels.

section .bss                        ; Reserve input storage.
    val1: resw 1                    ; Reserve two bytes for the first input.
    val2: resw 1                    ; Reserve two bytes for the second input.
    ; TODO: Add appropriately sized result storage if your approach uses it.

section .text                       ; Begin executable instructions.
    global main                     ; Expose the course entry procedure.

main:                               ; Begin the student program.
    lea rdi, [rel prompt]            ; Pass the prompt's address.
    call print_line                 ; Print the prompt and a newline.
    call read_int                   ; Read one decimal integer into RAX.
    mov word [rel val1], ax          ; Save the input's low sixteen bits immediately.

    lea rdi, [rel echo_text]         ; Pass the starter output label's address.
    call print_string               ; Print the label without a newline.
    movzx edi, word [rel val1]       ; Widen the saved unsigned WORD for printing.
    call print_uint                 ; Display the stored input.
    call print_newline              ; End the output line.

    ; TODO: Extend the prompt/read/store sequence to fill val2.
    ; TODO: Replace this starter echo with the five required labeled results.
    ; TODO: Calculate from the original inputs and preserve results before output.
    exit                            ; Finish the program normally.
`;
