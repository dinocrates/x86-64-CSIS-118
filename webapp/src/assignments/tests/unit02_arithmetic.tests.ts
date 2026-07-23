import type { AssignmentTest } from "../types";

export const unit02ArithmeticTests: AssignmentTest[] = [
	{
		id: "assemble",
		type: "assemble",
		name: "Code assembles successfully",
		visible: true,
		points: 1,
		hint: "Check for missing labels, invalid instructions, or syntax errors.",
	},
	{
		id: "required-label",
		type: "source-check",
		name: "Required procedure exists: add_numbers",
		visible: true,
		requiredLabels: ["add_numbers"],
		points: 1,
		hint: "Do not rename the add_numbers procedure.",
	},
	{
		id: "positive-values",
		type: "procedure-register",
		name: "Adds two positive numbers",
		visible: true,
		procedure: "add_numbers",
		setupRegisters: {
			rdi: 5,
			rsi: 7,
		},
		expectedRegisters: {
			rax: 12,
		},
		points: 1,
		hint: "The result should be returned in rax.",
	},
	{
		id: "zero-value",
		type: "procedure-register",
		name: "Works when one value is zero",
		visible: true,
		procedure: "add_numbers",
		setupRegisters: {
			rdi: 0,
			rsi: 9,
		},
		expectedRegisters: {
			rax: 9,
		},
		points: 1,
		hint: "Make sure you are adding both input registers and not hardcoding a result.",
	},
	{
		id: "negative-value",
		type: "procedure-register",
		name: "Works with negative values",
		visible: true,
		procedure: "add_numbers",
		setupRegisters: {
			rdi: -8,
			rsi: 3,
		},
		expectedRegisters: {
			rax: -5,
		},
		points: 1,
		hint: "Signed integer addition works normally with two's complement values.",
	},
];
