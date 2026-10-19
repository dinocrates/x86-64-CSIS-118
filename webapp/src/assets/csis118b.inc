; ==============================================================================
; csis118b.inc  —  Standard Library for CSIS-118B
; x86-64 Assembly Language | Mt. San Jacinto College
; ==============================================================================
;
; USAGE
;   Place this line at the very top of every program:
;
;       %include "csis118b.inc"
;
; CALLING CONVENTION  (64-bit Linux System V AMD64 ABI)
;   Arguments passed in registers (in order):  rdi, rsi, rdx, rcx, r8, r9
;   Return value:                              rax
;   Caller-saved (may be clobbered by calls):  rax, rcx, rdx, rsi, rdi, r8-r11
;   Callee-saved (preserved across calls):     rbx, rbp, r12-r15
;
;   This library follows these conventions exactly. Each procedure saves and
;   restores every callee-saved register it uses, so your values in rbx, r12,
;   etc. are safe across any call into this library.
;
; LINUX SYSCALLS USED
;   sys_read  = 0   read bytes from a file descriptor
;   sys_write = 1   write bytes to a file descriptor
;   sys_exit  = 60  terminate the process
;
; PROCEDURES — OUTPUT
;   print_newline               print a newline character
;   print_char   rdi=char       print one character
;   print_string rdi=ptr        print a null-terminated string
;   print_line   rdi=ptr        print a null-terminated string + newline
;   print_uint   rdi=uint       print an unsigned 64-bit integer
;   print_int    rdi=int        print a signed 64-bit integer
;   print_hex    rdi=value      print a value as hex  (e.g. 0x1A2B)
;
; PROCEDURES — INPUT
;   read_char                   read one character  → rax
;   read_string  rdi=buf, rsi=max  read a line      → rax = bytes read
;   read_int                    read an integer     → rax
;
; PROCEDURES — UTILITIES
;   rand_seed    rdi=seed       seed the random number generator
;   rand_range   rdi=min, rsi=max  random integer in [min, max]  → rax
;   clear_screen                clear the terminal (ANSI)
;   exit_program rdi=code       exit with the given code (does not return)
;
; MACROS
;   exit     →  exit with code 0
;   endl     →  print newline
;   cls      →  clear screen
;
; ==============================================================================

; --- Include guard: safe to %include this file more than once ----------------
%ifndef CSIS118B_INC
%define CSIS118B_INC


; ==============================================================================
; MACROS
; ==============================================================================

; exit — terminate the program cleanly with exit code 0
;
; Usage:
;   exit
;
; This is the standard way to end a CSIS-118B program. It calls exit_program
; with code 0, which tells the OS "everything went fine."
;
%macro exit 0
    xor  rdi, rdi           ; exit code = 0
    call exit_program
%endmacro


; endl — print a newline character to stdout
;
; Usage:
;   endl
;
; Equivalent to calling print_newline. Useful inline to break a line
; after print_int, print_string, etc.
;
%macro endl 0
    call print_newline
%endmacro


; cls — clear the terminal screen
;
; Usage:
;   cls
;
; Sends the ANSI "clear screen" escape sequence. Only works in a terminal
; that supports ANSI codes (the emulator's terminal does).
;
%macro cls 0
    call clear_screen
%endmacro


; ==============================================================================
; INTERNAL DATA  (do not use these labels directly in your programs)
; ==============================================================================
section .data

    ; ANSI escape sequence: ESC[2J clears the screen, ESC[H moves cursor home.
    _csis_cls_str:  db  27, '[2J', 27, '[H'
    _csis_cls_len   equ $ - _csis_cls_str

section .bss

    ; 64-bit state variable for the LCG random number generator.
    ; Zero-initialized by the OS (BSS), which is a valid starting seed.
    _csis_lcg_state:  resq 1


; ==============================================================================
; OUTPUT PROCEDURES
; ==============================================================================
section .text
DEFAULT REL                 ; use RIP-relative addressing for all memory refs
                            ; required by NASM 3.x — suppresses DEFAULT ABS warning


; ------------------------------------------------------------------------------
; print_newline — write a newline character ('\n') to stdout
;
; Arguments:  none
; Returns:    nothing
; Clobbers:   rax, rdi, rsi, rdx  (caller-saved — normal for any call)
;
; Example:
;   call print_string       ; print something
;   call print_newline      ; move to the next line
; ------------------------------------------------------------------------------
print_newline:
    push rbp
    mov  rbp, rsp
    sub  rsp, 16            ; allocate 16 bytes on the stack for the character
                            ; alignment: enter=8, +push rbp=0, +sub 16=0 ✓

    mov  byte [rsp], 10     ; ASCII 10 = '\n'
    mov  rax, 1             ; sys_write
    mov  rdi, 1             ; file descriptor 1 = stdout
    mov  rsi, rsp           ; pointer to our newline byte
    mov  rdx, 1             ; write exactly 1 byte
    syscall

    leave                   ; mov rsp, rbp  +  pop rbp
    ret


; ------------------------------------------------------------------------------
; print_char — write a single character to stdout
;
; Arguments:  rdi = the character to print (only the low byte is used)
; Returns:    nothing
;
; Example:
;   mov  rdi, 'A'
;   call print_char         ; prints: A
; ------------------------------------------------------------------------------
print_char:
    push rbp
    mov  rbp, rsp
    sub  rsp, 16            ; space for one character byte
                            ; alignment: enter=8, +push rbp=0, +sub 16=0 ✓

    mov  [rsp], dil         ; dil = low 8 bits of rdi = the character
    mov  rax, 1             ; sys_write
    mov  rdi, 1             ; stdout
    mov  rsi, rsp           ; pointer to character
    mov  rdx, 1             ; 1 byte
    syscall

    leave
    ret


; ------------------------------------------------------------------------------
; print_string — write a null-terminated string to stdout
;
; Arguments:  rdi = pointer to a null-terminated string
; Returns:    nothing
;
; The null terminator itself is NOT printed. An empty string ("") prints
; nothing at all.
;
; Example:
;   section .data
;       greeting: db "Hello, world!", 0
;   section .text
;       mov  rdi, greeting
;       call print_string
; ------------------------------------------------------------------------------
print_string:
    push rbp
    mov  rbp, rsp
    push rbx                ; save rbx (callee-saved); we use it for the string pointer
                            ; alignment: enter=8, +push rbp=0, +push rbx=8
                            ; (no further stack allocation; no subcalls)

    mov  rbx, rdi           ; rbx = original start of string (rdi will be modified)

    ; --- Compute string length (strlen) ---
    ; Walk rdi forward until we hit the null terminator,
    ; counting bytes in rdx as we go.
    xor  rdx, rdx           ; rdx = length = 0
.ps_strlen:
    cmp  byte [rdi], 0      ; is this byte the null terminator?
    je   .ps_write          ; yes → stop counting
    inc  rdi                ; no  → advance pointer
    inc  rdx                ;      increment length
    jmp  .ps_strlen

.ps_write:
    ; rdi now points at the null terminator (past the last real byte)
    ; rdx = number of real characters
    ; rbx = original start of string  →  use as buffer for sys_write
    mov  rax, 1             ; sys_write
    mov  rdi, 1             ; stdout
    mov  rsi, rbx           ; buffer = start of string
    ; rdx = length (already set above)
    syscall

    pop  rbx
    pop  rbp
    ret


; ------------------------------------------------------------------------------
; print_line — write a null-terminated string followed by a newline
;
; Arguments:  rdi = pointer to a null-terminated string
; Returns:    nothing
;
; Equivalent to: call print_string  +  call print_newline
;
; Example:
;   mov  rdi, greeting
;   call print_line         ; prints the string, then moves to the next line
; ------------------------------------------------------------------------------
print_line:
    push rbp
    mov  rbp, rsp
    ; alignment: enter=8, +push rbp=0
    ; At each call below, rsp is 16-byte aligned (0 mod 16) ✓

    call print_string       ; rdi already holds the string pointer
    call print_newline      ; no argument needed

    pop  rbp
    ret


; ------------------------------------------------------------------------------
; print_uint — print an unsigned 64-bit integer in decimal
;
; Arguments:  rdi = the unsigned integer to print
; Returns:    nothing
;
; Algorithm: repeatedly divide by 10, collecting remainders (digits) from
; least-significant to most-significant. Store them in reverse in a stack
; buffer, then print.
;
; Example:
;   mov  rdi, 12345
;   call print_uint         ; prints: 12345
; ------------------------------------------------------------------------------
print_uint:
    push rbp
    mov  rbp, rsp
    push rbx                ; callee-saved: divisor (10)
    push r12                ; callee-saved: value being converted
    push r13                ; callee-saved: write pointer into buffer
    sub  rsp, 40            ; 40-byte buffer (32 for digits, 8 alignment padding)
    ; alignment: enter=8, +push rbp=0, +push rbx=8, +push r12=0,
    ;            +push r13=8, +sub 40: (8-40)%16 = -32%16 = 0 ✓

    mov  r12, rdi           ; r12 = value to convert
    mov  rbx, 10            ; rbx = divisor
    lea  r13, [rsp + 40]    ; r13 = write pointer, starts ONE PAST the buffer end
                            ; we decrement before each write, so last byte → [rsp+39]

    ; --- Special case: value is zero ---
    test r12, r12
    jnz  .pu_convert
    dec  r13
    mov  byte [r13], '0'    ; write a literal '0'
    jmp  .pu_print

    ; --- Extract digits (least-significant first) ---
    ; Each iteration: divide r12 by 10
    ;   quotient  → r12 (remaining value)
    ;   remainder → one ASCII digit, written to buffer from the right
.pu_convert:
    test r12, r12           ; are there digits left?
    jz   .pu_print          ; no → done
    xor  rdx, rdx           ; zero-extend r12 into rdx:rax
    mov  rax, r12
    div  rbx                ; rax = r12 / 10,  rdx = r12 % 10
    mov  r12, rax           ; update remaining value
    add  dl, '0'            ; convert remainder (0-9) → ASCII digit
    dec  r13                ; move write pointer one byte to the left
    mov  [r13], dl          ; store the digit
    jmp  .pu_convert

.pu_print:
    ; r13 = pointer to first (most-significant) digit in the buffer
    ; length = (rsp + 40) - r13
    lea  rdx, [rsp + 40]
    sub  rdx, r13           ; rdx = number of characters to print
    mov  rax, 1             ; sys_write
    mov  rdi, 1             ; stdout
    mov  rsi, r13           ; start of digit string
    syscall

    add  rsp, 40
    pop  r13
    pop  r12
    pop  rbx
    pop  rbp
    ret


; ------------------------------------------------------------------------------
; print_int — print a signed 64-bit integer in decimal
;
; Arguments:  rdi = the signed integer to print (negative values show a '-')
; Returns:    nothing
;
; Internally: if the value is negative, print '-' and then pass the absolute
; value to print_uint.
;
; Example:
;   mov  rdi, -42
;   call print_int          ; prints: -42
; ------------------------------------------------------------------------------
print_int:
    push rbp
    mov  rbp, rsp
    push rbx                ; callee-saved: holds the value across the syscall
    sub  rsp, 24            ; 8-byte char slot + 16 alignment padding
    ; alignment: enter=8, +push rbp=0, +push rbx=8, +sub 24: (8-24)%16 = -16%16 = 0
    ; At the 'call print_uint' below, rsp is 0 mod 16 ✓

    mov  rbx, rdi           ; rbx = value to print

    ; --- Check sign ---
    test rdi, rdi
    jns  .pi_nonneg         ; non-negative: skip the minus sign

    ; --- Negative: emit '-' then negate ---
    mov  byte [rsp], '-'
    mov  rax, 1             ; sys_write
    mov  rdi, 1             ; stdout
    mov  rsi, rsp           ; '-' character is at [rsp]
    mov  rdx, 1
    syscall

    neg  rbx                ; rbx = absolute value
                            ; note: INT64_MIN (-2^63) negated is still -2^63
                            ; due to 2's-complement overflow — acceptable for
                            ; educational use at this level

.pi_nonneg:
    mov  rdi, rbx           ; argument: absolute value
    call print_uint         ; print it (handles the '0' case too)

    add  rsp, 24
    pop  rbx
    pop  rbp
    ret


; ------------------------------------------------------------------------------
; print_hex — print an unsigned 64-bit value in hexadecimal
;
; Arguments:  rdi = the value to print
; Returns:    nothing
;
; Output format: "0x" followed by uppercase hex digits, no leading zeros
; (except for the value 0, which prints as "0x0").
;
; Example:
;   mov  rdi, 255
;   call print_hex          ; prints: 0xFF
;
;   mov  rdi, 0
;   call print_hex          ; prints: 0x0
; ------------------------------------------------------------------------------
print_hex:
    push rbp
    mov  rbp, rsp
    push rbx                ; callee-saved: divisor (16)
    push r12                ; callee-saved: value being converted
    push r13                ; callee-saved: write pointer
    sub  rsp, 40            ; buffer: max output is "0x" + 16 hex digits = 18 chars
    ; alignment: enter=8, +push rbp=0, +push rbx=8, +push r12=0,
    ;            +push r13=8, +sub 40: (8-40)%16 = -32%16 = 0 ✓

    mov  r12, rdi           ; r12 = value to convert
    mov  rbx, 16            ; rbx = hex base
    lea  r13, [rsp + 40]    ; r13 = write pointer, starts past end of buffer

    ; --- Special case: value is zero ---
    test r12, r12
    jnz  .ph_convert
    dec  r13
    mov  byte [r13], '0'
    jmp  .ph_prefix

    ; --- Extract hex digits (least-significant first) ---
.ph_convert:
    test r12, r12
    jz   .ph_prefix
    xor  rdx, rdx           ; zero-extend r12 into rdx:rax
    mov  rax, r12
    div  rbx                ; rax = r12 / 16,  rdx = r12 % 16  (0-15)
    mov  r12, rax

    ; Convert 0-9 → '0'-'9', 10-15 → 'A'-'F'
    cmp  dl, 10
    jl   .ph_digit
    add  dl, 'A' - 10       ; 10→'A', 11→'B', ..., 15→'F'
    jmp  .ph_store
.ph_digit:
    add  dl, '0'
.ph_store:
    dec  r13
    mov  [r13], dl
    jmp  .ph_convert

    ; --- Prepend "0x" prefix ---
.ph_prefix:
    dec  r13
    mov  byte [r13], 'x'
    dec  r13
    mov  byte [r13], '0'

.ph_print:
    lea  rdx, [rsp + 40]
    sub  rdx, r13           ; length of "0x..." string
    mov  rax, 1             ; sys_write
    mov  rdi, 1             ; stdout
    mov  rsi, r13
    syscall

    add  rsp, 40
    pop  r13
    pop  r12
    pop  rbx
    pop  rbp
    ret


; ==============================================================================
; INPUT PROCEDURES
; ==============================================================================


; ------------------------------------------------------------------------------
; read_char — read one character from stdin
;
; Arguments:  none
; Returns:    rax = the character read (as an integer, 0-255)
;                   rax = 0 if end-of-file or error
;
; Note: reads exactly one byte. If the user types 'A' and presses Enter,
; this call returns 'A' (65); the next call returns '\n' (10).
;
; Example:
;   call read_char
;   ; rax now holds the character the user typed
; ------------------------------------------------------------------------------
read_char:
    push rbp
    mov  rbp, rsp
    sub  rsp, 16            ; 16-byte buffer (we only use 1 byte, rest is padding)
                            ; alignment: enter=8, +push rbp=0, +sub 16=0 ✓

    xor  rax, rax           ; sys_read = 0
    xor  rdi, rdi           ; stdin = 0
    mov  rsi, rsp           ; buffer: first byte of our allocated space
    mov  rdx, 1             ; read exactly 1 byte
    syscall

    movzx rax, byte [rsp]   ; zero-extend the byte we read into rax

    leave
    ret


; ------------------------------------------------------------------------------
; read_string — read a line of text from stdin into a buffer
;
; Arguments:  rdi = pointer to the destination buffer
;             rsi = maximum number of bytes to read
; Returns:    rax = number of bytes actually read
;
; Reads up to rsi bytes from stdin. The result typically includes a trailing
; newline ('\n', ASCII 10) unless the buffer was too small or EOF was hit.
; The buffer is NOT null-terminated by this procedure — do it yourself if
; you need it:   mov byte [buf + rax], 0
;
; Example:
;   section .bss
;       buf: resb 64
;   section .text
;       mov  rdi, buf
;       mov  rsi, 64
;       call read_string
;       ; rax = bytes read (includes '\n')
; ------------------------------------------------------------------------------
read_string:
    push rbp
    mov  rbp, rsp
    ; alignment: enter=8, +push rbp=0
    ; no subcalls → alignment not critical here

    ; sys_read(stdin, buffer, max_length)
    mov  rdx, rsi           ; rdx = max bytes to read
    mov  rsi, rdi           ; rsi = destination buffer pointer
    xor  rdi, rdi           ; rdi = 0 = stdin
    xor  rax, rax           ; rax = 0 = sys_read
    syscall
    ; rax = bytes actually read (return value lands here naturally)

    pop  rbp
    ret


; ------------------------------------------------------------------------------
; read_int — read a signed decimal integer from stdin
;
; Arguments:  none
; Returns:    rax = the integer value typed by the user
;
; Accepts an optional leading '+' or '-'. Reads until it hits a non-digit
; character (typically the Enter key / newline). Does not check for overflow.
;
; Example:
;   call read_int
;   ; rax now holds whatever integer the user typed
; ------------------------------------------------------------------------------
read_int:
    push rbp
    mov  rbp, rsp
    push rbx                ; callee-saved: current character pointer
    push r12                ; callee-saved: accumulated result
    push r13                ; callee-saved: negative flag
    sub  rsp, 40            ; 32-byte read buffer + 8 bytes alignment padding
    ; alignment: enter=8, +push rbp=0, +push rbx=8, +push r12=0,
    ;            +push r13=8, +sub 40: (8-40)%16 = -32%16 = 0 ✓

    ; --- Read raw input from stdin ---
    xor  rax, rax           ; sys_read = 0
    xor  rdi, rdi           ; stdin = 0
    mov  rsi, rsp           ; destination buffer (32 bytes at rsp..rsp+31)
    mov  rdx, 32            ; read up to 32 bytes
    syscall

    ; A short read (the common case - one typed line) leaves the rest of
    ; this buffer holding whatever was there before, which on a repeated
    ; call is this same stack slot's leftover bytes from the PREVIOUS
    ; call. NUL-terminate right after the bytes actually read so the
    ; digit scan below can never run on into a prior call's stale digits.
    cmp  rax, 32
    jae  .ri_terminated      ; a full 32-byte read leaves no room to terminate
    mov  byte [rsp + rax], 0
.ri_terminated:

    ; --- Set up parsing state ---
    mov  rbx, rsp           ; rbx = pointer to current character
    xor  r12, r12           ; r12 = result = 0
    xor  r13, r13           ; r13 = negative flag = 0

    ; --- Skip leading whitespace (spaces and tabs) ---
.ri_skip_ws:
    movzx rax, byte [rbx]
    cmp  al, ' '
    je   .ri_ws_advance
    cmp  al, 9              ; tab
    jne  .ri_check_sign
.ri_ws_advance:
    inc  rbx
    jmp  .ri_skip_ws

    ; --- Handle optional leading sign character ---
.ri_check_sign:
    movzx rax, byte [rbx]
    cmp  al, '-'
    je   .ri_negative
    cmp  al, '+'
    je   .ri_positive
    jmp  .ri_digits         ; no sign character — go straight to digits

.ri_negative:
    mov  r13, 1             ; set negative flag
    inc  rbx                ; skip past '-'
    jmp  .ri_digits

.ri_positive:
    inc  rbx                ; skip past '+'
    ; fall through to .ri_digits

    ; --- Accumulate decimal digits ---
    ; Each iteration: result = result * 10 + digit
.ri_digits:
    movzx rax, byte [rbx]   ; read current character
    cmp  al, '0'
    jl   .ri_done           ; below '0' → not a digit, stop
    cmp  al, '9'
    jg   .ri_done           ; above '9' → not a digit, stop
    sub  al, '0'            ; convert ASCII → numeric value (0-9)
    imul r12, r12, 10       ; shift accumulated result left one decimal place
    add  r12, rax           ; add new digit
    inc  rbx                ; advance to next character
    jmp  .ri_digits

.ri_done:
    ; --- Apply sign ---
    test r13, r13
    jz   .ri_return
    neg  r12                ; negate if the '-' flag was set

.ri_return:
    mov  rax, r12           ; return value

    add  rsp, 40
    pop  r13
    pop  r12
    pop  rbx
    pop  rbp
    ret


; ==============================================================================
; UTILITY PROCEDURES
; ==============================================================================


; ------------------------------------------------------------------------------
; rand_seed — seed the pseudo-random number generator
;
; Arguments:  rdi = seed value (any 64-bit integer)
; Returns:    nothing
;
; Call this once at the start of your program if you want a different random
; sequence each run. A common approach is to use a fixed seed during
; development (reproducible results) and a time-based seed for production.
; Without seeding, the generator starts from 0 and gives the same sequence
; every run — which is fine for testing.
;
; Example:
;   mov  rdi, 42
;   call rand_seed
; ------------------------------------------------------------------------------
rand_seed:
    ; No frame setup needed — this is a one-instruction leaf procedure.
    mov  [_csis_lcg_state], rdi
    ret


; ------------------------------------------------------------------------------
; rand_range — return a pseudo-random integer in [min, max]
;
; Arguments:  rdi = minimum value (inclusive)
;             rsi = maximum value (inclusive)
; Returns:    rax = random integer satisfying min <= rax <= max
;
; Uses a Linear Congruential Generator (LCG) — the same family of PRNG
; used in many C standard libraries. The multiplier and addend are from
; Knuth's MMIX:
;   next_state = state * 6364136223846793005 + 1442695040888963407  (mod 2^64)
;
; The 64-bit overflow in the multiply is intentional — it implements mod 2^64
; for free.
;
; WARNING: Requires min <= max. Calling with min > max is undefined behavior
; and will likely cause a division-by-zero fault.
;
; Example:
;   mov  rdi, 1
;   mov  rsi, 6
;   call rand_range         ; rax = a random die roll (1, 2, 3, 4, 5, or 6)
; ------------------------------------------------------------------------------
rand_range:
    push rbp
    mov  rbp, rsp
    push rbx                ; callee-saved: range value for division
    push r12                ; callee-saved: min
    push r13                ; callee-saved: max
    sub  rsp, 8             ; 8 bytes alignment padding
    ; alignment: enter=8, +push rbp=0, +push rbx=8, +push r12=0,
    ;            +push r13=8, +sub 8: (8-8)%16 = 0 ✓
    ; (no subcalls, so alignment is informational only here)

    mov  r12, rdi           ; r12 = min
    mov  r13, rsi           ; r13 = max

    ; --- Advance the LCG state ---
    ; Formula: state = state * a + c  (mod 2^64, overflow intentional)
    mov  rax, [_csis_lcg_state]
    mov  rbx, 6364136223846793005   ; LCG multiplier (a)
    imul rax, rbx           ; rax = rax * a  (lower 64 bits; upper bits discarded)
    mov  rbx, 1442695040888963407   ; LCG addend (c) — reuse rbx; too large for imm32
    add  rax, rbx           ; rax = rax + c  (mod 2^64, overflow intentional)
    mov  [_csis_lcg_state], rax     ; store updated state

    ; --- Map state value to [min, max] ---
    ; range = max - min + 1
    ; result = min + (state % range)
    mov  rbx, r13
    sub  rbx, r12
    inc  rbx                ; rbx = range  (= max - min + 1)

    xor  rdx, rdx           ; zero-extend rax into rdx:rax for unsigned division
    div  rbx                ; rdx = rax % range  (0 to range-1)

    add  rdx, r12           ; add min  →  result in [min, max]
    mov  rax, rdx

    add  rsp, 8
    pop  r13
    pop  r12
    pop  rbx
    pop  rbp
    ret


; ------------------------------------------------------------------------------
; clear_screen — clear the terminal using ANSI escape codes
;
; Arguments:  none
; Returns:    nothing
;
; Sends ESC[2J (erase entire screen) followed by ESC[H (move cursor to
; row 1, column 1). Works in any ANSI-compatible terminal, which includes
; the emulator's built-in terminal.
;
; Example:
;   call clear_screen
;   ; or use the macro:
;   cls
; ------------------------------------------------------------------------------
clear_screen:
    push rbp
    mov  rbp, rsp
    ; alignment: enter=8, +push rbp=0 ✓

    mov  rax, 1             ; sys_write
    mov  rdi, 1             ; stdout
    mov  rsi, _csis_cls_str ; pointer to ANSI escape sequence
    mov  rdx, _csis_cls_len ; length of escape sequence
    syscall

    pop  rbp
    ret


; ------------------------------------------------------------------------------
; exit_program — terminate the process with a given exit code
;
; Arguments:  rdi = exit code (0 = success, non-zero = error)
; Returns:    does not return — the process ends immediately
;
; Example:
;   mov  rdi, 0
;   call exit_program
;
;   ; or use the macro for a clean zero-code exit:
;   exit
; ------------------------------------------------------------------------------
exit_program:
    ; No frame setup — we never return, so there's nothing to restore.
    mov  rax, 60            ; sys_exit
    syscall                 ; hand control back to the OS; process is gone


; ------------------------------------------------------------------------------
; _start — process entry point (provided for you by this library)
;
; GNU ld requires a symbol named _start as the program entry point.
; This wrapper calls your 'main' procedure and exits using main's return value
; as the exit code — exactly how C programs work.
;
; YOU DO NOT NEED TO WRITE _start. Just write:
;
;     global main
;     main:
;         ; your code here
;         exit
;
; If your main procedure returns a value in rax, it becomes the exit code.
; Using the 'exit' macro inside main (recommended) calls exit_program directly
; and never reaches the return path below.
; ------------------------------------------------------------------------------
global _start
_start:
    xor  rbp, rbp           ; mark the bottom of the call stack (ABI convention)
    call main               ; call the student's main — RSP goes 16→8-aligned (normal)
    mov  rdi, rax           ; pass main's return value as the exit code
    call exit_program       ; exit cleanly (does not return)


%endif ; CSIS118B_INC
