import type { AssignmentTest } from "../types";

export const unit01HelloTests: AssignmentTest[] = [
	{
		id: "assemble",
		type: "assemble",
		name: "Code assembles successfully",
		visible: true,
		points: 1,
		hint: "Check for missing labels, invalid instructions, or syntax errors.",
	},
	{
		id: "prints-message",
		type: "stdout",
		name: "Prints the greeting message",
		visible: true,
		expectedStdout: "Hello, Assembly!",
		compareMode: "normalized",
		points: 1,
		hint: "Put the address of the message in rdi, then call print_line (or print_string followed by print_newline).",
	},
];
