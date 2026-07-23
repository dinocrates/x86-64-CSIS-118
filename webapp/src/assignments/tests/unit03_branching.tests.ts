import type { AssignmentTest } from "../types";

export const unit03BranchingTests: AssignmentTest[] = [
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
		name: "Required procedure exists: max_of_two",
		visible: true,
		requiredLabels: ["max_of_two"],
		points: 1,
		hint: "Do not rename the max_of_two procedure.",
	},
	{
		id: "second-larger",
		type: "procedure-register",
		name: "Picks the larger value when it is second",
		visible: true,
		procedure: "max_of_two",
		setupRegisters: {
			rdi: 5,
			rsi: 9,
		},
		expectedRegisters: {
			rax: 9,
		},
		points: 1,
		hint: "Compare rdi and rsi, then move the larger one into rax.",
	},
	{
		id: "first-larger",
		type: "procedure-register",
		name: "Picks the larger value when it is first",
		visible: true,
		procedure: "max_of_two",
		setupRegisters: {
			rdi: 10,
			rsi: 2,
		},
		expectedRegisters: {
			rax: 10,
		},
		points: 1,
		hint: "Make sure both branches of your comparison put a value in rax.",
	},
	{
		id: "equal-values",
		type: "procedure-register",
		name: "Works when both values are equal",
		visible: true,
		procedure: "max_of_two",
		setupRegisters: {
			rdi: 7,
			rsi: 7,
		},
		expectedRegisters: {
			rax: 7,
		},
		points: 1,
		hint: "When the values are equal, returning either one is correct.",
	},
	{
		id: "negative-values",
		type: "procedure-register",
		name: "Works with negative values",
		visible: true,
		procedure: "max_of_two",
		setupRegisters: {
			rdi: -3,
			rsi: -8,
		},
		expectedRegisters: {
			rax: -3,
		},
		points: 1,
		hint: "Use a signed comparison (jg/jl), not an unsigned one (ja/jb), so negative numbers compare correctly.",
	},
];
