import type { AssignmentTest } from "../types";

export const unit01HelloTests: AssignmentTest[] = [
	{
		id: "assemble",
		type: "assemble",
		name: "Code assembles and links successfully",
		visible: true,
		hint: "Read the diagnostics and check your instructions, labels, and string quotation marks.",
	},
	{
		id: "prints-message",
		type: "stdout",
		name: "Program ends with status zero and prints two message lines",
		visible: true,
		messageLines: { count: 2, identifyingPrefix: "Programmer:" },
		expectedExitCode: 0,
		hint: "Pass each message address in RDI to print_line. Print your greeting, then Programmer: and your name; finish with exit.",
	},
];
