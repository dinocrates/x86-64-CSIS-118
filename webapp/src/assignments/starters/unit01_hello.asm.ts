export const unit01HelloStarter = `; ============================================
; CSIS-118B | x86-64 Assembly
; Unit 1 - Hello Assembly
; Student: [Your Name]
; ============================================

%include "csis118b.inc"

section .data
    message db "Hello, Assembly!", 0

section .text
    global main

main:
    ; TODO: print the message

    exit
`;
