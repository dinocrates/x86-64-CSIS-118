import type { AssignmentConfig } from "./types";
import { unit01HelloStarter } from "./starters/unit01_hello.asm";
import { unit02ArithmeticStarter } from "./starters/unit02_arithmetic.asm";
import { unit03BranchingStarter } from "./starters/unit03_branching.asm";
import { unit01HelloTests } from "./tests/unit01_hello.tests";
import { unit02ArithmeticTests } from "./tests/unit02_arithmetic.tests";
import { unit03BranchingTests } from "./tests/unit03_branching.tests";

/**
 * The CSIS-118B assignment list.
 *
 * To add a new assignment:
 *   1. Create a starter file in ./starters/ (export the code as a string).
 *   2. Create a test file in ./tests/ (export an AssignmentTest[]).
 *   3. Add an AssignmentConfig entry below.
 *
 * The `id` becomes the deep link (?assignment=<id>), the autosave key,
 * and the download filename — pick it once and never change it.
 * See docs/assignment-testing.md for the full instructor guide.
 */

export const unit01HelloAssignment: AssignmentConfig = {
	id: "unit01-hello-assembly",
	title: "Unit 1 - Hello Assembly",
	unit: "Unit 1",
	description:
		"Print the greeting message to the screen using the csis118b.inc library.",
	starterCode: unit01HelloStarter,
	tests: unit01HelloTests,
};

export const unit02ArithmeticAssignment: AssignmentConfig = {
	id: "unit02-register-arithmetic",
	title: "Unit 2 - Register Arithmetic",
	unit: "Unit 2",
	description:
		"Write a procedure that adds two integers passed in registers. " +
		"Inputs: rdi and rsi. Output: rax = rdi + rsi. Do not rename the label.",
	starterCode: unit02ArithmeticStarter,
	tests: unit02ArithmeticTests,
};

export const unit03BranchingAssignment: AssignmentConfig = {
	id: "unit03-branching",
	title: "Unit 3 - Branching",
	unit: "Unit 3",
	description:
		"Write a procedure that returns the larger of two integers. " +
		"Inputs: rdi and rsi. Output: rax = the larger value. Do not rename the label.",
	starterCode: unit03BranchingStarter,
	tests: unit03BranchingTests,
};

export const assignments: AssignmentConfig[] = [
	unit01HelloAssignment,
	unit02ArithmeticAssignment,
	unit03BranchingAssignment,
];

export function getAssignmentById(id: string | null): AssignmentConfig | null {
	if (!id) return null;
	return assignments.find((a) => a.id === id) ?? null;
}
