import type { AssignmentTest } from "../types";

export const unit02MovieShowcaseTests: AssignmentTest[] = [
	{ id: "assemble", type: "assemble", name: "Code assembles and links successfully", visible: true,
		hint: "Run the starter first. Check NASM diagnostics, spelling, quotation marks, and the course include." },
	{ id: "movie-labels", type: "source-check", name: "main and nine separate movie strings are defined", visible: true,
		requiredLabels: ["main"],
		requiredDataLabels: ["movieTitleA", "movieYearA", "movieDirectorA", "movieTitleB", "movieYearB", "movieDirectorB", "movieTitleC", "movieYearC", "movieDirectorC"],
		hint: "The starter defines Movie A only. Add six separate db strings for B and C, with these exact label names." },
	{ id: "movie-sections", type: "source-check", name: "Student source has one .data and one .text section", visible: true,
		studentSectionCounts: { data: 1, text: 1 },
		hint: "Add your strings inside the existing .data section and your output instructions inside the existing .text section; the library's sections do not count." },
	{ id: "movie-output", type: "stdout", name: "Three complete movie records print and the program exits normally", visible: true,
		movieRecords: { count: 3 }, expectedExitCode: 0,
		hint: "The starter prints one movie. Add B and C using RDI and print_line, with print_newline between records; finish with exit." },
];
