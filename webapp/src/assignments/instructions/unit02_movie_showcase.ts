import type { AssignmentInstructions } from "../types";

export const unit02MovieShowcaseInstructions: AssignmentInstructions = {
	points: 30,
	objectives: [
		"Assemble, link, and run a NASM program in the course playground.",
		"Declare null-terminated strings and use labels to refer to their addresses.",
		"Pass a string address in RDI to the course print_line procedure.",
		"Modify a working example and verify its output.",
	],
	steps: [
		{ title: "Run the starter", items: [
			"Download any current work you want to keep before switching assignments or resetting the starter.",
			"Assemble and run the loaded movie starter. Confirm it prints the three lines for Star Wars: Episode IV.",
			"The playground supplies csis118b.inc. Leave the include and exit scaffolding in place.",
			"db \"...\", 0 stores a null-terminated string. mov rdi, label passes its address; square brackets would read memory instead. print_line prints the string and emits a newline.",
			"The starter passes the assembly check but needs movies B and C to pass the complete-record checks. Check My Work is practice feedback.",
		] },
		{ title: "Add your two movies", items: [
			"Keep Movie A and choose two different additional movies for B and C. Include a title, four-digit release year, and director for each.",
			"Add six separate db strings to the existing section .data. Use the B and C label names shown below; end each string with , 0.",
			"Movie A: movieTitleA, movieYearA, movieDirectorA. Movie B: movieTitleB, movieYearB, movieDirectorB. Movie C: movieTitleC, movieYearC, movieDirectorC.",
			"Keep the literal prefixes Title:, Year:, and Director: in every movie’s strings. Store each year as text in quotation marks.",
			"In main, before exit, add a blank line and three mov rdi, label / call print_line pairs for Movie B. Repeat for Movie C.",
			"Use call print_newline between movies. Keep one section .data and one section .text in your own source file.",
			"Complete the name/date header, update the output comment, and identify each movie’s output block with a useful comment.",
			"Print only the movie records. This task needs no input, terminal-clear calls, loops, new procedures, or raw syscall work.",
		] },
		{ title: "Verify and submit", items: [
			"Assemble and run the revised program. Confirm nine information lines appear in A, B, C order, with a blank line between movies.",
			"Check spelling, year, director, label names, and which label each mov instruction uses.",
			"Download the final source and save it as Lastname_Firstname_U02A.asm. If your browser downloads automatically, rename the downloaded file. Capture a readable screenshot showing all three movie records.",
			"Submit the .asm file and the output screenshot to this Canvas assignment. Include readable output text in the submission comment if a screenshot is difficult to read.",
		] },
	],
	submission: [
		"Final NASM source: Lastname_Firstname_U02A.asm.",
		"One readable output screenshot showing all three movie records. An output text file may replace the screenshot if needed for accessibility.",
		"Submit both files through this Canvas assignment. A Check My Work result is practice feedback, not your grade.",
	],
	rubric: [
		{ criterion: "Program assembles and runs", points: 10, description: "Assembles and links (5); runs to normal completion without an execution error (5)." },
		{ criterion: "Complete movie output", points: 12, description: "Each of the three movies has the correct title (1), year (1), director (1), and readable three-line record with the required prefixes (1)." },
		{ criterion: "Source organization", points: 4, description: "Nine distinct, correctly named string labels (2); one student .data section and one student .text section (2)." },
		{ criterion: "Readability and documentation", points: 4, description: "Completed name/date header and accurate purpose/output comments (2); consistent indentation and useful comments identifying each movie’s output block (2)." },
	],
	completionChecklist: [
		"Movie A plus two different movies, each with title, year, and director.",
		"Nine distinct required labels; one student data section and one student text section.",
		"All nine strings end with a zero byte and use the required prefixes.",
		"Program runs normally and prints the records in A, B, C order.",
		"Header and comments are complete; source and output evidence are attached.",
	],
	manualReviewNote: "Movie A retention, movie accuracy, distinct choices for B and C, and documentation are reviewed by your instructor. Practice checks do not prove factual accuracy or originality.",
};
