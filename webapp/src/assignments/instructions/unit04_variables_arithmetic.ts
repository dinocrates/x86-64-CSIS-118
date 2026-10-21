import type { AssignmentInstructions } from "../types";

export const unit04VariablesArithmeticInstructions: AssignmentInstructions = {
	points: 30,
	objectives: [
		"Reserve two unsigned WORD variables with `resw 1` in `section .bss`, and store each `read_int` result's low 16 bits into its own variable immediately after the call.",
		"Compute five independent results — Sum, Diff, Prod, Quot, Rem — from the two original inputs, reloading the original operands for each calculation instead of reusing a previous result.",
		"Widen a stored WORD correctly for its use: `movzx` into a 32-bit register when treating it as unsigned, and sign-extend a signed 32-bit difference into RDI with `movsxd` before `print_int`.",
		"Preserve a division's quotient and remainder — and every other calculated result — before any library call that could overwrite working registers, then print five labeled results in order.",
	],
	codeExamples: [
		{
			title: "Starter: read, store, and echo one unsigned WORD",
			code: `%include "csis118b.inc"              ; Make the course library available.

section .data                       ; Define initialized strings.
    prompt: db "Enter a number", 0   ; Store the required input prompt.
    echo_text: db "Starter value: ", 0 ; Label the starter demonstration's output.

section .bss                        ; Reserve input storage.
    val1: resw 1                    ; Reserve two bytes for the first input.
    val2: resw 1                    ; Reserve two bytes for the second input.

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
    exit                            ; Finish the program normally.`,
			sampleInput: "42",
			output: "Enter a number\nStarter value: 42",
		},
		{
			title: "Widening: load a WORD into a wider working register",
			code: `movzx eax, word [rel val1]      ; Zero-extend the saved unsigned WORD into EAX.
movzx ecx, word [rel val2]      ; Zero-extend the saved unsigned WORD into ECX.
add eax, ecx                    ; Add using 32-bit registers, so the sum is not limited to 16 bits.
mov edi, eax                    ; Pass the 32-bit sum to print_uint (a DWORD write to EDI zeroes RDI's upper half).
call print_uint                 ; Display the sum.`,
		},
		{
			title: "Printing a possibly negative difference",
			code: `mov eax, 10                     ; Load a sample first value into EAX.
sub eax, 25                     ; Subtract a sample second value; EAX may go negative.
movsxd rdi, eax                 ; Sign-extend the 32-bit difference to 64 bits.
call print_int                  ; Display the signed difference.`,
			output: "-15",
		},
	],
	steps: [
		{ title: "Run the starter", items: [
			"Run the starter as loaded. It prints `Enter a number`, reads one unsigned whole number, stores its low 16 bits into `val1` with `resw 1`, and echoes `Starter value: ` followed by that value — try 0, 42, and 65535. This starter only demonstrates reading and storing one WORD; it does not implement the five required calculations yet.",
			"`read_int` takes no register arguments and returns a signed 64-bit integer in RAX. This assignment's inputs (0–65535 for `val1`, 1–65535 for `val2`) are always within that range. Save the valid result's low 16 bits from AX into its WORD variable immediately after the call, before another library call can overwrite working registers: `mov word [rel val1], ax`.",
			"`val1` and `val2` are each reserved as one WORD with `resw 1` in `section .bss` — two bytes, not four. Do not load a DWORD from a two-byte input object, and do not store all eight bytes of RAX into it; either would read or write past the reserved two bytes.",
			"Procedure contract — call: `call read_int`. Arguments: none. Return: one signed 64-bit integer in RAX. Store its low 16 bits into a WORD: `mov word [rel val1], ax`.",
		] },
		{ title: "Read and store the second input", items: [
			"Add a second `Enter a number` prompt, a second `call read_int`, and store that result into `val2` the same way the starter already does for `val1`.",
			"Each input is read exactly once, from its own prompt, and stored into its own WORD variable before any further work.",
		] },
		{ title: "Add the five result labels", items: [
			"Add five null-terminated label strings to `section .data`: `Sum: `, `Diff: `, `Prod: `, `Quot: `, and `Rem: ` — each including the space after the colon, exactly as shown. Replace the starter's temporary `Starter value: ` echo with these labeled results.",
		] },
		{ title: "Compute Sum, Diff, and Prod", items: [
			"For each of Sum, Diff, and Prod, reload the original `val1` and `val2` from memory — do not reuse a value left over from a previous calculation. This assignment's three independent results are each computed from the original input pair.",
			"Widen each unsigned WORD input with a WORD load before arithmetic, for example `movzx eax, word [rel val1]`, so the full value is used in a 32-bit working register rather than truncated.",
			"Sum (`val1 + val2`) can reach 131070, and Prod (`val1 * val2`) can reach 4294836225 — both exceed what a WORD can hold. Compute them in 32-bit (or wider) registers so the complete result is preserved; a DWORD `mul` using EAX times an explicit 32-bit source returns its full unsigned result in EDX:EAX.",
			"Diff (`val1 - val2`) ranges from -65535 through 65535 and must show a minus sign when negative — print it with `print_int`, not `print_uint`. Subtract the original `val2` from the original `val1` (not the other way around), and sign-extend the 32-bit result into RDI with `movsxd rdi, eax` before calling `print_int`. An ordinary 32-bit write to EDI zeroes RDI's upper half and does not produce a negative 64-bit argument for a negative result.",
			"Library calls (including `print_string`, `print_uint`, and `print_int`) can overwrite working registers and flags. Save each calculated result (in memory or in a register you know will survive) before the next library call, and reload operands from `val1`/`val2` again for the next calculation rather than trusting a register to still hold them.",
		] },
		{ title: "Compute Quot and Rem", items: [
			"Quot and Rem come from one integer division of the original `val1` by the original `val2` — reload both from memory; do not reuse a result from Sum, Diff, or Prod.",
			"A DWORD `div` divides EDX:EAX by its explicit 32-bit source, returning the quotient in EAX and the remainder in EDX. Before dividing, prepare EDX as zero (the original `val1`, zero-extended, is the dividend; it is never negative, so this is an unsigned division).",
			"`div` and the two output calls that follow both need the quotient and the remainder — save both of them (for example, into two registers that survive a call, or into memory) before printing either one, since printing one result can overwrite the register still holding the other.",
		] },
		{ title: "Print the five labeled results", items: [
			"Print, in order, each on its own line: `Sum: ` then the sum, `Diff: ` then the difference, `Prod: ` then the product, `Quot: ` then the quotient, `Rem: ` then the remainder. Use `print_string` for each label and `print_newline` after each value.",
			"Use `print_int` only for Diff, since it is the only result that can be negative. Sum, Prod, Quot, and Rem are always nonnegative — use `print_uint` for those.",
			"For the sample inputs 22 and 10, the complete output, line by line, is: `Enter a number`, `Enter a number`, `Sum: 32`, `Diff: 12`, `Prod: 220`, `Quot: 2`, `Rem: 2`.",
		] },
		{ title: "Test and submit", items: [
			"Test at least a few input pairs, including one where `val1` is smaller than `val2` (so Diff is negative) and one using large values near 65535 (so Sum and Prod need their full width).",
			"Review that every nonblank line has an accurate comment, update the name/date header, and replace the starter's purpose/input/output comments with accurate descriptions of your finished program.",
			"Run Check My Work, then submit your complete, commented NASM source as formatted code through Canvas Text Entry (Canvas's `tohtml` tool or its own code formatting may be used). A Share link is optional for this assignment and does not replace the required source.",
			"This assignment is due Monday at 5:00 am; see Canvas for the exact calendar due date.",
		] },
	],
	submission: [
		"Complete, commented NASM source, submitted as readable formatted code through Canvas Text Entry (use Canvas's `tohtml` tool or its built-in code formatting).",
		"A Share link is optional and does not replace the required source; no screenshot, separate output file, or written reflection is required for this assignment.",
		"Submit through this Canvas assignment, due Monday at 5:00 am (see Canvas for the exact calendar date). Grading is expected within four days of the due date.",
		"Personal questions about this assignment go through Canvas Inbox, not the public discussion board.",
	],
	rubric: [
		{ criterion: "Program correctness", points: 30, description: "Correct/incorrect, graded by your instructor: both WORD inputs are correctly stored and used, all five results (Sum, Diff, Prod, Quot, Rem) are correct for the submitted source's actual behavior, labels and line order match exactly, and the program completes normally." },
	],
	completionChecklist: [
		"val1 and val2 are each reserved with resw 1 in section .bss and are each read and stored exactly once.",
		"Sum, Diff, Prod, Quot, and Rem are each computed from the original val1/val2, not from each other.",
		"Sum and Prod are computed and printed without 16-bit truncation; Diff prints a minus sign when negative; Quot and Rem both survive to their print calls.",
		"Output shows the five labels in order — Sum: , Diff: , Prod: , Quot: , Rem: — each on its own line, with the program exiting normally.",
		"Every nonblank line has an accurate comment, and the name/date header is complete.",
	],
	manualReviewNote: "Check My Work's checks confirm the WORD declarations, the read/store/output pattern, and output for a set of input pairs — they cannot by themselves confirm comment quality, that every line uses only concepts covered through Unit 4, or originality. Per course policy, missing required comments reduces the grade by 20%, and using concepts not covered through Unit 4 is not allowed and may be treated as plagiarism with a reduction of at least 50%; your instructor applies these reviews manually.",
	helpLinks: [
		{ label: "Unit 4 discussion", url: "https://msjc.instructure.com/courses/50358/discussion_topics/1565497" },
		{ label: "Course Discord", url: "https://discord.gg/rykbgQt5cd" },
	],
};
