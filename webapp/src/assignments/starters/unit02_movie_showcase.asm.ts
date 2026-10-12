export const unit02MovieShowcaseStarter = `; Name: Your Name
; Course: CSIS-118B
; Date: YYYY-MM-DD
; Assignment: Unit 02A - Movie Showcase
; Purpose: Display movie titles, release years, and directors.
; Input: None.
; Output: One movie now; expand this program to display three movies.
; Registers: RDI holds the address passed to print_line.

%include "csis118b.inc"

section .data
    movieTitleA:    db "Title: Star Wars: Episode IV", 0
    movieYearA:     db "Year: 1977", 0
    movieDirectorA: db "Director: George Lucas", 0

    ; TODO: Add separate title, year, and director strings for B and C.

section .text
    global main

main:
    ; Movie A: pass each string's address in RDI, then print it.
    mov rdi, movieTitleA
    call print_line
    mov rdi, movieYearA
    call print_line
    mov rdi, movieDirectorA
    call print_line

    ; TODO: Print a blank line, then all three fields for Movie B.
    ;       Use call print_newline to print a blank line.
    ; TODO: Print a blank line, then all three fields for Movie C.

    exit
`;
