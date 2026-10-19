import type { AssignmentInstructions } from "../types";

export const unit03Lab3aRegistersInstructions: AssignmentInstructions = {
	points: 30,
	objectives: [
		"Load integer literals written in binary, hexadecimal, and octal notation with mov.",
		"Distinguish a literal's source radix from the decimal value a register holds and print_uint displays.",
		"Copy a value between general-purpose registers with mov, and explain why EAX's source register still holds its value immediately after the copy.",
		"Explain, in one sentence each, what assembly, linking, and execution each do.",
	],
	steps: [
		{ title: "Run the starter", items: [
			"Run the starter as loaded. It assembles, links, and prints three zeros — the three TODOs are not complete yet. The course library is already available through %include \"csis118b.inc\".",
			"Source notation controls how NASM reads the digits you type; it does not change what the register stores. For example, hexadecimal 0x0C and decimal 12 load the identical bit pattern into a register — print_uint always displays that bit pattern as decimal, regardless of which notation loaded it.",
			"A register stores a bit pattern, not a permanent radix. The 0b, 0x, and 0o prefixes only tell the assembler how to read your source digits.",
		] },
		{ title: "Complete the three TODOs", items: [
			"TODO 1: replace the 0 with a 0b-prefixed binary literal equal to decimal 171, then mov edi, eax, call print_uint, and call print_newline. Run and confirm the first line prints 171.",
			"TODO 2: replace the 0 with a 0x-prefixed hexadecimal literal for hex 32 (decimal 50). Run and confirm the second line prints 50.",
			"TODO 3: replace the 0 with a 0o-prefixed octal literal for octal 20 (decimal 16). Run and confirm the third line prints 16.",
			"mov edi, eax copies EAX's value into EDI so print_uint can display it; EAX still holds that same value immediately afterward, because mov copies its source without changing it. Writing a 32-bit register like EDI also zeroes the upper half of RDI, so EDI alone supplies a complete nonnegative argument to print_uint.",
		] },
		{ title: "Debug", items: [
			"Start Debug and step to each load into EAX. Execute it and observe EAX's value, then step the mov edi, eax copy and observe EDI, immediately before the call to print_uint.",
			"Do this for each of the three tasks. This checkpoint is about the load and the copy, not about EAX's value after print_uint returns or after the program exits.",
		] },
		{ title: "Document and verify", items: [
			"Update the name/date header, replace each TODO comment with an accurate description of what the completed line does, and comment every nonblank code line, including directives, labels, and instructions.",
			"Run the program and confirm it prints exactly three lines — 171, then 50, then 16 — and exits normally. Then run Check My Work.",
			"Check My Work is formative practice feedback in your browser. It does not submit your work and does not guarantee full credit.",
		] },
		{ title: "Save and submit", items: [
			"Download the source and save it as Lastname_Firstname_U03A.asm. If your browser downloads automatically, rename the downloaded file.",
			"Capture a readable screenshot showing all three output lines (171, 50, 16). A plain-text output file may replace the screenshot if needed for accessibility.",
			"In the Canvas submission comment, briefly answer: (1) why the hexadecimal task prints 50, and what mov edi, eax does; (2) in one sentence, the difference between assembly, linking, and execution.",
		] },
	],
	submission: [
		"Final NASM source: Lastname_Firstname_U03A.asm.",
		"One readable screenshot (or accessible plain-text output file) showing all three output lines: 171, 50, 16.",
		"Two brief responses in the Canvas submission comment: the hexadecimal/mov edi,eax explanation, and the assembly/linking/execution distinction.",
		"Submit through this Canvas assignment. Grading is expected within four days of the due date, shown in Canvas.",
	],
	rubric: [
		{ criterion: "Directions and documentation", points: 9, description: "Useful comments on every nonblank code line (6); completed name/date header, required submission items, and brief explanations (3)." },
		{ criterion: "Assembly and linking", points: 4.5, description: "The submitted source assembles and links successfully." },
		{ criterion: "Execution and output", points: 9, description: "Normal completion and the three decimal output lines in order — 171, 50, 16 — 3 points per result." },
		{ criterion: "Program correctness", points: 7.5, description: "Required radix prefix and correct literal loaded into EAX, copied to EDI for print_uint — 2.5 points per task." },
	],
	completionChecklist: [
		"Task 1 loads a 0b-prefixed literal equal to decimal 171 into EAX.",
		"Task 2 loads a 0x-prefixed literal equal to decimal 50 into EAX.",
		"Task 3 loads a 0o-prefixed literal equal to decimal 16 into EAX.",
		"Each task copies EAX into EDI and calls print_uint, then print_newline.",
		"Output is exactly 171, 50, and 16 on three lines, in order, with normal program exit.",
		"Header, comments, and the two Canvas submission-comment responses are complete.",
	],
	manualReviewNote: "Comment quality on every nonblank line, the header and completed TODO descriptions, and the two Canvas submission-comment responses are reviewed by your instructor. Practice checks do not prove documentation quality or authorship.",
};
