; ==============================================================================
; test_csis118b.asm — Library verification test for csis118b.inc
; CSIS-118B | Mt. San Jacinto College
; ==============================================================================
; Load this file into the editor and click "compile", then "run".
; Expected output is shown in the comments next to each test.
; ==============================================================================

%include "csis118b.inc"

section .data
    ; --- Test strings ---
    str_hello:      db "Hello from CSIS-118B!", 0
    str_divider:    db "------------------------------", 0

    ; --- Labels for each test ---
    lbl_strings:    db "[1] print_string / print_line:", 0
    lbl_integers:   db "[2] print_int (positive and negative):", 0
    lbl_uint:       db "[3] print_uint:", 0
    lbl_hex:        db "[4] print_hex:", 0
    lbl_char:       db "[5] print_char:", 0
    lbl_rand:       db "[6] rand_range (1-100, seeded with 42):", 0
    lbl_done:       db "All tests complete.", 0

section .text
    global main

main:

    ; ------------------------------------------------------------------
    ; [1] String output
    ; ------------------------------------------------------------------
    mov  rdi, lbl_strings
    call print_line                 ; [1] print_string / print_line:

    mov  rdi, str_hello
    call print_string               ; Hello from CSIS-118B!
    call print_newline              ; (newline)

    mov  rdi, str_hello
    call print_line                 ; Hello from CSIS-118B!  (+ newline via print_line)

    mov  rdi, str_divider
    call print_line

    ; ------------------------------------------------------------------
    ; [2] Signed integer output  — print_int
    ; ------------------------------------------------------------------
    mov  rdi, lbl_integers
    call print_line                 ; [2] print_int (positive and negative):

    mov  rdi, 0
    call print_int                  ; 0
    call print_newline

    mov  rdi, 42
    call print_int                  ; 42
    call print_newline

    mov  rdi, -42
    call print_int                  ; -42
    call print_newline

    mov  rdi, 9223372036854775807   ; INT64_MAX
    call print_int                  ; 9223372036854775807
    call print_newline

    mov  rdi, -9223372036854775808  ; INT64_MIN (edge case — expect large negative)
    call print_int
    call print_newline

    mov  rdi, str_divider
    call print_line

    ; ------------------------------------------------------------------
    ; [3] Unsigned integer output  — print_uint
    ; ------------------------------------------------------------------
    mov  rdi, lbl_uint
    call print_line                 ; [3] print_uint:

    mov  rdi, 0
    call print_uint                 ; 0
    call print_newline

    mov  rdi, 255
    call print_uint                 ; 255
    call print_newline

    mov  rdi, 18446744073709551615  ; UINT64_MAX
    call print_uint                 ; 18446744073709551615
    call print_newline

    mov  rdi, str_divider
    call print_line

    ; ------------------------------------------------------------------
    ; [4] Hexadecimal output  — print_hex
    ; ------------------------------------------------------------------
    mov  rdi, lbl_hex
    call print_line                 ; [4] print_hex:

    mov  rdi, 0
    call print_hex                  ; 0x0
    call print_newline

    mov  rdi, 255
    call print_hex                  ; 0xFF
    call print_newline

    mov  rdi, 0xDEADBEEF
    call print_hex                  ; 0xDEADBEEF
    call print_newline

    mov  rdi, 0xCAFEBABEDEADC0DE
    call print_hex                  ; 0xCAFEBABEDEADC0DE
    call print_newline

    mov  rdi, str_divider
    call print_line

    ; ------------------------------------------------------------------
    ; [5] Single character output  — print_char
    ; ------------------------------------------------------------------
    mov  rdi, lbl_char
    call print_line                 ; [5] print_char:

    mov  rdi, 'A'
    call print_char                 ; A
    mov  rdi, 'B'
    call print_char                 ; B
    mov  rdi, 'C'
    call print_char                 ; C
    call print_newline              ; (newline after A B C)

    mov  rdi, str_divider
    call print_line

    ; ------------------------------------------------------------------
    ; [6] Random number generation  — rand_seed + rand_range
    ; ------------------------------------------------------------------
    mov  rdi, lbl_rand
    call print_line                 ; [6] rand_range (1-100, seeded with 42):

    mov  rdi, 42
    call rand_seed                  ; seed = 42 → deterministic sequence

    ; Print five random numbers in [1, 100]
    mov  rdi, 1
    mov  rsi, 100
    call rand_range
    mov  rdi, rax
    call print_int
    call print_newline

    mov  rdi, 1
    mov  rsi, 100
    call rand_range
    mov  rdi, rax
    call print_int
    call print_newline

    mov  rdi, 1
    mov  rsi, 100
    call rand_range
    mov  rdi, rax
    call print_int
    call print_newline

    mov  rdi, 1
    mov  rsi, 100
    call rand_range
    mov  rdi, rax
    call print_int
    call print_newline

    mov  rdi, 1
    mov  rsi, 100
    call rand_range
    mov  rdi, rax
    call print_int
    call print_newline

    mov  rdi, str_divider
    call print_line

    ; ------------------------------------------------------------------
    ; Done
    ; ------------------------------------------------------------------
    mov  rdi, lbl_done
    call print_line                 ; All tests complete.

    exit                            ; clean exit, code 0
