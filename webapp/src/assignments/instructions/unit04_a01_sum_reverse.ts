import type { AssignmentInstructions } from "../types";

export const unit04A01SumReverseInstructions: AssignmentInstructions = {
	points: 30,
	objectives: [
		"Declare four correctly sized input variables — two WORDs (`num1`, `num2`) and two DWORDs (`num3`, `num4`) — and store each read_int result into its own variable immediately after the call, without overwriting an adjacent variable.",
		"Calculate the complete 64-bit sum of all four original inputs, using 64-bit arithmetic so the total is never limited to 32 bits.",
		"Widen an unsigned WORD or DWORD input correctly for 64-bit arithmetic, without sign-extending a value that is never negative.",
		"Preserve the sum (and the four original inputs) across library calls, and print the required Sum: and Reverse order: output in the exact required order.",
	],
	codeExamples: [
		{
			title: "Starter: read, store, and echo one unsigned WORD",
			code: `%include "csis118b.inc"              ; Make the course library available.

section .data                       ; Define initialized data.
    num1: dw 0                      ; Store the first unsigned WORD input.
    num2: dw 0                      ; Store the second unsigned WORD input.
    num3: dd 0                      ; Store the third unsigned DWORD input.
    num4: dd 0                      ; Store the fourth unsigned DWORD input.
    prompt1: db "Enter num1 (0-65535):", 0 ; Prompt for the first value.
    echo_label: db "Starter value: ", 0 ; Label the temporary echo.

section .text                       ; Begin executable instructions.
    global main                     ; Expose the course entry procedure.

main:                               ; Begin the student program.
    lea rdi, [rel prompt1]           ; Pass the prompt's address.
    call print_line                 ; Print the prompt and a newline.
    call read_int                   ; Read one decimal integer into RAX.
    mov word [rel num1], ax          ; Save the first input's low 16 bits immediately.

    lea rdi, [rel echo_label]        ; Pass the temporary echo label's address.
    call print_string               ; Print the label without a newline.
    movzx edi, word [rel num1]       ; Zero-extend the saved WORD for output.
    call print_uint                 ; Display the stored input.
    call print_newline              ; End the output line.
    exit                            ; Finish the program normally.`,
			sampleInput: "42",
			output: "Enter num1 (0-65535):\nStarter value: 42",
		},
		{
			title: "Widening: unsigned WORD and DWORD loads",
			code: `movzx eax, word [rel num1] ; RAX receives the unsigned WORD value.
mov ecx, dword [rel num3]  ; RCX receives the unsigned DWORD value (an ordinary
                            ; 32-bit MOV already zeroes RCX's upper half).`,
		},
		{
			title: "Accumulating a 64-bit total",
			code: `movzx rax, word [rel num1]  ; Start the total from the first input, widened to 64 bits.
movzx rcx, word [rel num2]  ; Widen the second input into a DIFFERENT register.
add rax, rcx                ; Add using 64-bit operands; RAX now holds a partial total.
mov ecx, dword [rel num3]   ; Widen the third input into a different register again
                            ; (never back into EAX/RAX, which would overwrite the total).
add rax, rcx                ; Continue accumulating the 64-bit total in RAX.
mov r12, rax                ; Preserve the running total in a register that survives library calls.`,
		},
	],
	steps: [
		{ title: "Run the starter", items: [
			"Run the starter as loaded. It prints `Enter num1 (0-65535):`, reads one unsigned whole number, stores it in `num1` (a WORD, `dw 0`), and echoes `Starter value: ` followed by that value — try 0, 42, and 65535. This starter only demonstrates reading and storing the first WORD input; it does not implement the remaining three inputs, the sum, or the reverse output yet.",
			"`read_int` returns a decimal integer in RAX. All four inputs fit a signed 64-bit integer, including the largest DWORD input. Save the result immediately after the call, before another library call can overwrite working registers.",
			"`num1` and `num2` are each one WORD (two bytes, `dw 0`): store with `mov word [rel num1], ax`. `num3` and `num4` are each one DWORD (four bytes, `dd 0`): store with `mov dword [rel num3], eax`. Storing all eight bytes of RAX into either kind of variable can corrupt adjacent storage — use AX for a WORD and EAX for a DWORD.",
		] },
		{ title: "Read and store the remaining three inputs", items: [
			"Add prompts, reads, and stores for `num2` (WORD), then `num3` (DWORD), then `num4` (DWORD), in that order — each read once, from its own prompt, stored into its own variable immediately after the call.",
		] },
		{ title: "Calculate the complete 64-bit sum", items: [
			"Widen each unsigned input for 64-bit arithmetic without sign-extending it (these inputs are never negative): `movzx eax, word [rel num1]` for a WORD, or an ordinary `mov ecx, dword [rel num3]` for a DWORD — writing a 32-bit register already zeroes the corresponding 64-bit register's upper half.",
			"Use 64-bit ADD operations for the running total (for example, accumulate in RAX and add each widened input to it). The maximum possible sum (8590065660) does not fit in 32 bits — loading another input into the low 32-bit portion of your accumulator (EAX) would overwrite the total and clear its upper half, so load each additional input into a different working register before adding it in.",
			"Library calls can overwrite working registers and flags. Preserve the complete total (in memory, or in a register you know will survive) before printing its label, and reload it into RDI for `print_uint` when you print it.",
		] },
		{ title: "Print the required output", items: [
			"Replace the starter's temporary echo with the required output: `Sum: ` followed by the total (use `print_uint` — the sum is always nonnegative), then `Reverse order:` on its own line, then the four original inputs in num4, num3, num2, num1 order, each on its own line.",
			"Reload each original input from its own memory variable for the reverse output — do not rely on a register that happens to still hold it, and do not alter the stored values when calculating the sum.",
			"For inputs 10, 20, 300, 400, the complete output, line by line, is: `Sum: 730`, `Reverse order:`, `400`, `300`, `20`, `10`.",
		] },
		{ title: "Reference examples", items: [
			"Check My Work verifies your program against a broader set of input combinations than shown here; these five are representative examples to test by hand.",
			"num1=10, num2=20, num3=300, num4=400 → `Sum: 730`, reverse `400, 300, 20, 10`.",
			"num1=0, num2=0, num3=0, num4=0 → `Sum: 0`, reverse `0, 0, 0, 0`.",
			"num1=1, num2=2, num3=65536, num4=70000 → `Sum: 135539`, reverse `70000, 65536, 2, 1`.",
			"num1=0, num2=0, num3=4294967295, num4=1 → `Sum: 4294967296`, reverse `1, 4294967295, 0, 0` (this total needs more than 32 bits).",
			"num1=65535, num2=65535, num3=4294967295, num4=4294967295 → `Sum: 8590065660`, reverse `4294967295, 4294967295, 65535, 65535` (the maximum possible inputs).",
		] },
		{ title: "Test and submit", items: [
			"Test at least a few input sets, including one using very large DWORD inputs (near 4294967295) so your total needs the full 64 bits, and one using all zeros.",
			"Review that every nonblank line has an accurate comment — explain your declarations, each input's storage, the 64-bit arithmetic, and the output — and update the name/date header.",
			"Run Check My Work, then submit your complete, commented NASM source as formatted code through Canvas Text Entry (Canvas's `tohtml` tool or its own code formatting may be used). A Share link is optional for this assignment and supplements, but does not replace, the required source.",
			"This assignment is due Monday at 5:00 am; see Canvas for the exact calendar due date.",
		] },
	],
	submission: [
		"Complete, commented NASM source, submitted as readable formatted code through Canvas Text Entry (use Canvas's `tohtml` tool or its built-in code formatting).",
		"A Share link is optional and supplements, but does not replace, the required source; no screenshot or separate output file is required for this assignment.",
		"Submit through this Canvas assignment, due Monday at 5:00 am (see Canvas for the exact calendar date). Grading is expected within four days of the due date.",
		"Personal questions about this assignment go through Canvas Inbox, not the public discussion board.",
	],
	rubric: [
		{ criterion: "Directions followed", points: 9, description: "Correct variable names and widths, required declarations, meaningful comments, and the submission requirements above." },
		{ criterion: "Builds without errors", points: 4.5, description: "The submitted source assembles and links successfully." },
		{ criterion: "Execution and input/output", points: 9, description: "All four inputs are read, the required output is clearly printed in the required format, and the program completes normally." },
		{ criterion: "Program correctness", points: 7.5, description: "The full 64-bit sum and the correctly reversed values are both correct across the valid input ranges." },
	],
	completionChecklist: [
		"num1 and num2 are each a WORD (dw 0); num3 and num4 are each a DWORD (dd 0); each is read once and stored in its own variable.",
		"The total is calculated with 64-bit arithmetic and is correct even when num3 and num4 are both near their maximum value.",
		"Output prints Sum: and the total, then Reverse order: and the four original inputs as num4, num3, num2, num1 — each on its own line.",
		"The original input values are unchanged by the sum calculation, and the printed reverse values are reloaded from memory.",
		"Every nonblank line has an accurate comment, and the name/date header is complete.",
	],
	manualReviewNote: "Check My Work's checks confirm the WORD/DWORD declarations, the read/store/output pattern, and output for a representative set of input combinations — they cannot by themselves confirm comment quality, that every line uses only concepts covered through Unit 4, or originality. Per course policy, using concepts not covered through Unit 4 is not allowed and may be treated as plagiarism with a reduction of at least 50%; your instructor applies this review, and the directions/comments criterion above, manually.",
	helpLinks: [
		{ label: "Course Discord", url: "https://discord.gg/rykbgQt5cd" },
		{ label: "Unit 4 discussion", url: "https://msjc.instructure.com/courses/50358/discussion_topics/1565497" },
	],
};
