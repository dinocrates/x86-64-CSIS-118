import type { AssignmentInstructions } from "../types";

export const unit03Lab3bVariablesInstructions: AssignmentInstructions = {
	points: 30,
	objectives: [
		"Define DWORD variables with `dd` and access them with matching four-byte loads and stores.",
		"Read signed decimal input with `read_int` and preserve its result in memory.",
		"Use registers for calculation and temporary storage, distinguishing an address from a stored value.",
		"Use `sub` for a difference and `mov` instructions to exchange stored values.",
		"Widen signed DWORD values correctly for `print_int` and verify the program with several inputs.",
	],
	codeExamples: [
		{
			title: "Starter: read, store, and echo one signed integer",
			code: `%include "csis118b.inc"              ; Make the course library available.

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
    exit                            ; Finish the program normally.`,
			sampleInput: "-7",
			output: "Input a number\nYou entered: -7",
		},
		{
			title: "Reading: prompt, read, and store",
			code: `call read_int                        ; RAX receives the signed integer.
mov dword [rel first_value], eax      ; Save four bytes immediately after input.`,
		},
		{
			title: "Reading: print a signed DWORD",
			code: `movsxd rdi, dword [rel first_value]   ; Widen the saved signed DWORD to 64 bits.
call print_int                       ; Display its signed decimal value.`,
		},
		{
			title: "Reading: subtract before swapping",
			code: `mov eax, 25                          ; Load the first example value.
sub eax, 7                           ; Subtract seven from EAX.
movsxd rdi, eax                      ; Widen the signed result for output.
call print_int                       ; Display the difference.
call print_newline                   ; End the output line.`,
			output: "18",
		},
	],
	steps: [
		{ title: "Run the starter", items: [
			"Run the one-number starter as loaded. It prints `Input a number`, reads one value, and echoes `You entered: ` followed by that value — try -7, 0, and 42.",
			"`read_int` reads one signed decimal integer from the terminal and returns its numeric value in RAX. It takes no register arguments. Display a prompt first, call the routine, then enter one number and press Enter when the playground requests input. A leading minus sign is allowed: enter decimal text such as -7, rather than an assembly literal such as 0x07.",
			"Save the input immediately after the call, before any other input/output routine can change working registers. A DWORD variable occupies four bytes, so use EAX — the low 32-bit part of RAX — as the source of the store: `mov dword [rel first_value], eax`. Writing all eight bytes of RAX into a four-byte object could overwrite neighboring data. This lab's input range (-1,000,000 through 1,000,000) ensures every value fits a signed DWORD.",
			"Procedure contract — call: `call read_int`. Arguments: none. Return: one signed 64-bit integer in RAX. Store into a DWORD: `mov dword [rel first_value], eax`. Input format for this lab: decimal, one value per prompt, from -1,000,000 through 1,000,000.",
		] },
		{ title: "Rename the variable and add a second one", items: [
			"Rename the starter's `sample_value` to `first_value` throughout the program.",
			"Add a second DWORD variable, `second_value: dd 0`, next to `first_value` in `section .data`.",
		] },
		{ title: "Read and store both inputs", items: [
			"Print `Input a number` with a newline, call `read_int`, and immediately store its result from EAX into `first_value`, exactly as the starter already does for `sample_value`.",
			"Repeat the same prompt/read/store sequence for `second_value`. Each value is read once, from its own prompt, and stored into its own variable.",
		] },
		{ title: "Display the equation", items: [
			"Replace the starter's echo-only output with the original first value, the separator \" - \", the original second value, the separator \" = \", and the signed difference, ending with a newline. Use `print_int` for the three numbers and `print_string` for the two separators.",
			"`sub destination, source` subtracts the source from the destination and leaves the result in the destination. Calculating in a register does not change the original memory variables unless you explicitly store a new value into them. Print the equation using the original operands before swapping the variables.",
			"`print_int` expects a signed 64-bit argument in RDI. Use `movsxd` to load a signed DWORD and extend its sign to 64 bits — for example, `movsxd rdi, dword [rel first_value]`, or `movsxd rdi, eax` for an already-calculated signed 32-bit result in EAX. An ordinary load into EDI clears RDI's upper half, which gives the wrong 64-bit signed interpretation for negative DWORD values: a stored -7 loaded only into EDI becomes positive 4,294,967,289 in RDI, while sign extension preserves -7.",
			"Since output routines can change working registers, reload operands from memory when needed instead of assuming a register survived an earlier call to `print_int` or `print_string`.",
		] },
		{ title: "Swap the variables", items: [
			"Preserve both original values in different general-purpose registers before replacing either memory value. Ordinary MOV cannot copy directly between two memory operands, so a swap always needs at least one register.",
			"Write the saved values back into the opposite variables: the register holding the original first value is stored into `second_value`, and the register holding the original second value is stored into `first_value`.",
			"No `xchg`, bitwise XOR/AND/OR, addition/subtraction swap, or stack-based temporary storage for this step. `sub` is still required and allowed for the equation above — only the swap itself must use plain `mov` and temporary registers.",
		] },
		{ title: "Display the swapped values", items: [
			"Print `After Swapping` on its own line, then `first variable: ` and its updated value, then `second variable: ` and its updated value, each ending with a newline.",
			"Reload these values from `first_value` and `second_value` after the swap, so the output reflects the updated contents of memory rather than a register that happens to still hold an old value.",
			"In Debug, step through the stores one at a time and watch which memory location each one changes — this is the key checkpoint for proving the swap actually happened in memory.",
		] },
		{ title: "Test and submit", items: [
			"Test at least two input pairs, including one where the first number is smaller than the second (so the equation's difference is negative) and one with a negative input.",
			"Review that every nonblank line has an accurate comment, update the name/date header, and replace the starter's purpose/output comments with accurate descriptions of your finished program.",
			"Download the source, save it as Lastname_Firstname_U03B.asm, and capture readable output evidence for both 18/5 and 5/18. Then run Check My Work before submitting.",
			"Submit Lab 3B, then select Next in Canvas to continue through the unit.",
		] },
	],
	submission: [
		"Final NASM source: Lastname_Firstname_U03B.asm.",
		"Readable output evidence for both 18/5 and 5/18. Screenshots or a plain-text output file containing both runs are acceptable.",
		"A two-to-four-sentence Canvas submission comment explaining why EAX is stored immediately after read_int, and how temporary registers prevent loss of an original swap value.",
		"Submit through this Canvas assignment. Grading is expected within four days of the due date; read your Canvas submission feedback once it's posted.",
	],
	rubric: [
		{ criterion: "Directions and documentation", points: 9, description: "Useful comments on every nonblank code line (6); completed name/date and input/output header, required files, and brief explanation (3)." },
		{ criterion: "Assembly and linking", points: 4.5, description: "Source assembles and links successfully." },
		{ criterion: "Execution and output", points: 9, description: "Normal completion, two prompts (2), formatted signed subtraction equation (3), post-swap heading and both displayed values (4)." },
		{ criterion: "Program correctness", points: 7.5, description: "Correct DWORD variables and stored inputs (2.5); original first minus original second (2.5); actual in-memory MOV/register swap (2.5)." },
	],
	completionChecklist: [
		"Each input is read once and stored in its own four-byte variable.",
		"The equation uses the original values and displays a negative difference correctly.",
		"The swap changes both memory values using MOV and temporary registers.",
		"Signed values are widened correctly before print_int.",
		"The name/date and input/output header, line comments, source file, both required output runs, and brief explanation are complete.",
	],
	manualReviewNote: "Check My Work's output checks cannot by themselves distinguish a correct in-memory swap from a program that merely prints the original values in reverse order. Your instructor reviews the actual stores and the MOV-only swap, your comments, and your Canvas submission responses; practice checks do not prove every rubric criterion.",
	helpLinks: [
		{ label: "Unit 3 discussion", url: "https://msjc.instructure.com/courses/50358/discussion_topics/1565496" },
		{ label: "Course Discord", url: "https://discord.gg/rykbgQt5cd" },
		{ label: "Course modules", url: "https://msjc.instructure.com/courses/50358/modules" },
	],
};
