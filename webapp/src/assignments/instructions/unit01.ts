import type { AssignmentInstructions } from "../types";

export const unit01Instructions: AssignmentInstructions = {
	points: 30,
	objectives: [
		"Edit, assemble, link, and execute a NASM program in the playground.",
		"Use Debug and Step to observe a register value.",
		"Identify initialized data, executable instructions, and the main label.",
		"Document purpose, input, output, and register use.",
		"Save and share a reproducible copy of your code.",
	],
	steps: [
		{ title: "Prepare", items: [
			"Complete the Unit 1 reading and watch the playground demonstration on the lecture page. Open this assignment in the playground. Save existing work before loading a fresh starter.",
			"Use the NASM starter in the editor. The course helper is available automatically through %include \"csis118b.inc\" and provides startup, print_line, and exit.",
		] },
		{ title: "Personalize", items: [
			"Replace “Your Name” in the file header and author message with your name.",
			"Replace YYYY-MM-DD with the date you complete the assignment.",
			"Change the greeting to a short, school-appropriate message of your choice. Keep the double quotation marks and terminating zero byte.",
			"Rewrite the purpose comment in your own words so it describes your program.",
			"Add a comment explaining why mov rdi, greeting appears before call print_line.",
			"Keep the header fields, register notes, and meaningful block/instruction comments accurate. Keep the RBX = 42 observation and pass each string address in RDI.",
		] },
		{ title: "Compile and run", items: [
			"Use compile and wait for assembly and linking. Read and correct diagnostics. Use Run as needed.",
			"Confirm that your personalized greeting and “Programmer: [your name]” print as two lines and that execution ends normally. Copy those two program-output lines for your Canvas submission.",
			"The starter runs before personalization and prints Hello, Assembly! followed by Programmer: Your Name. Check My Work gives practice feedback; complete your personalization and the manual checklist before submitting.",
		] },
		{ title: "Debug", items: [
			"Start Debug, expand Disassembly, and keep Registers visible.",
			"Step through startup until the first instruction in main, mov rbx, 42. Predict the value, execute that instruction, and record RBX immediately afterward.",
			"Interpret 0x2a as decimal 42. NASM may show mov ebx, 0x2a in Disassembly; that shorter encoding still gives the full RBX register the value 42.",
			"Continue to finish. Compile again after source changes before starting a fresh debugging session.",
		] },
		{ title: "Save", items: [
			"Use File options → Save .asm file and name the file Lastname_Firstname_U01.asm. If your browser downloads automatically, rename the downloaded file. This is your saved copy.",
		] },
		{ title: "Share", items: [
			"Generate a share link after the final edits using Share or Copy Submission Link. Open it in a new tab and verify the personalized code and comments load correctly, then compile and run that copy.",
			"Copy the complete link into Canvas. Generate a fresh link after subsequent source changes.",
		] },
	],
	submission: [
		"The complete tested playground share link.",
		"The two program-output lines.",
		"Debugger observation: observed RBX value immediately after the load, its decimal equivalent, and the instruction that produced it.",
		"Program organization: explain section .data, section .text, and main: in your own words.",
		"Workflow: explain what compiling prepares and how Debug with Step helped you observe execution, in two or three sentences.",
	],
	rubric: [
		{ criterion: "Working, personalized program", points: 12, description: "Assembles, runs, prints the customized greeting and student name, and ends normally." },
		{ criterion: "Documentation", points: 6, description: "Complete header, purpose in your own words, accurate register notes and explanatory comments." },
		{ criterion: "Debugger observation", points: 6, description: "Correct load instruction, observed register value, and decimal interpretation." },
		{ criterion: "Submission and explanations", points: 6, description: "Working final share link, output, and accurate program-organization/workflow explanations." },
	],
	completionChecklist: [
		"Review your personalized name, completion date, greeting, purpose, header, register notes, and explanatory comments.",
		"Run your program and copy its two output lines. Observe RBX immediately after its load using Debug and Step.",
		"Save Lastname_Firstname_U01.asm and test your final share link in a new tab.",
		"Prepare the three written responses and submit the link, output, and responses in Canvas Text Entry. Screenshots are not required.",
	],
};
