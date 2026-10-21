import type { AssignmentConfig } from "./types";
import { unit01HelloStarter } from "./starters/unit01_hello.asm";
import { unit01HelloTests } from "./tests/unit01_hello.tests";
import { unit01Instructions } from "./instructions/unit01";
import { unit02MovieShowcaseStarter } from "./starters/unit02_movie_showcase.asm";
import { unit02MovieShowcaseTests } from "./tests/unit02_movie_showcase.tests";
import { unit02MovieShowcaseInstructions } from "./instructions/unit02_movie_showcase";
import { unit03Lab3aRegistersStarter } from "./starters/unit03_lab3a_registers.asm";
import { unit03Lab3aRegistersTests } from "./tests/unit03_lab3a_registers.tests";
import { unit03Lab3aRegistersInstructions } from "./instructions/unit03_lab3a_registers";
import { unit03Lab3bVariablesStarter } from "./starters/unit03_lab3b_variables.asm";
import { unit03Lab3bVariablesTests } from "./tests/unit03_lab3b_variables.tests";
import { unit03Lab3bVariablesInstructions } from "./instructions/unit03_lab3b_variables";
import { unit04VariablesArithmeticStarter } from "./starters/unit04_variables_arithmetic.asm";
import { unit04VariablesArithmeticTests } from "./tests/unit04_variables_arithmetic.tests";
import { unit04VariablesArithmeticInstructions } from "./instructions/unit04_variables_arithmetic";
import { unit04A01SumReverseStarter } from "./starters/unit04_a01_sum_reverse.asm";
import { unit04A01SumReverseTests } from "./tests/unit04_a01_sum_reverse.tests";
import { unit04A01SumReverseInstructions } from "./instructions/unit04_a01_sum_reverse";

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
	title: "Unit 1 — My First Assembly Program",
	unit: "Unit 1",
	description:
		"Personalize, run, debug, document, and share your first NASM program. 30 points, graded by your instructor.",
	starterCode: unit01HelloStarter,
	tests: unit01HelloTests,
	instructions: unit01Instructions,
	personalizationReminders: [
		{ pattern: "Your Name", message: "Replace “Your Name” in the header and identifying message with your name." },
		{ pattern: "YYYY-MM-DD", message: "Replace YYYY-MM-DD in the header with your completion date." },
		{ pattern: "Hello, Assembly!", message: "Personalize the starter greeting “Hello, Assembly!”." },
	],
};

// Register units as their course assignments become ready. Draft starters and
// tests for later units remain in their folders without appearing in the app.
export const unit02MovieShowcaseAssignment: AssignmentConfig = {
	id: "unit02-movie-showcase",
	title: "Unit 2A — Movie Showcase",
	unit: "Unit 2",
	description: "Expand a NASM starter to print three movies. 30 points, graded by your instructor.",
	starterCode: unit02MovieShowcaseStarter,
	tests: unit02MovieShowcaseTests,
	instructions: unit02MovieShowcaseInstructions,
	submissionMode: "file-upload",
	personalizationReminders: [
		{ pattern: "Your Name", message: "Replace “Your Name” in the header with your name." },
		{ pattern: "YYYY-MM-DD", message: "Replace YYYY-MM-DD in the header with your completion date." },
	],
};

export const unit03Lab3aRegistersAssignment: AssignmentConfig = {
	id: "unit03-lab3a-registers",
	title: "Unit 03 Lab 3A — General Purpose Registers",
	unit: "Unit 3",
	description: "Load literals written in binary, hexadecimal, and octal into EAX and print their decimal values. 30 points, graded by your instructor.",
	starterCode: unit03Lab3aRegistersStarter,
	tests: unit03Lab3aRegistersTests,
	instructions: unit03Lab3aRegistersInstructions,
	submissionMode: "file-upload",
	personalizationReminders: [
		{ pattern: "Your Name", message: "Replace “Your Name” in the header with your name." },
		{ pattern: "YYYY-MM-DD", message: "Replace YYYY-MM-DD in the header with your completion date." },
	],
};

export const unit03Lab3bVariablesAssignment: AssignmentConfig = {
	id: "unit03-lab3b-variables",
	title: "Unit 03 Lab 3B — Creating Variables",
	unit: "Unit 3",
	description: "Read two integers, store them in DWORD variables, calculate their difference, and swap the values using registers and MOV. 30 points, graded by your instructor.",
	starterCode: unit03Lab3bVariablesStarter,
	tests: unit03Lab3bVariablesTests,
	instructions: unit03Lab3bVariablesInstructions,
	submissionMode: "file-upload",
	personalizationReminders: [
		{ pattern: "Your Name", message: "Replace “Your Name” in the header with your name." },
		{ pattern: "YYYY-MM-DD", message: "Replace YYYY-MM-DD in the header with your completion date." },
	],
};

export const unit04VariablesArithmeticAssignment: AssignmentConfig = {
	id: "unit04-variables-basic-arithmetic",
	title: "Unit 04 — Variables & Basic Arithmetic",
	unit: "Unit 4",
	description: "Read two whole numbers into WORD variables and print their sum, difference, product, quotient, and remainder. 30 points, graded by your instructor.",
	starterCode: unit04VariablesArithmeticStarter,
	tests: unit04VariablesArithmeticTests,
	instructions: unit04VariablesArithmeticInstructions,
	submissionMode: "source-text",
	personalizationReminders: [
		{ pattern: "Your Name", message: "Replace “Your Name” in the header with your name." },
		{ pattern: "YYYY-MM-DD", message: "Replace YYYY-MM-DD in the header with your completion date." },
	],
};

export const unit04A01SumReverseAssignment: AssignmentConfig = {
	id: "unit04-a01-sum-reverse",
	title: "Unit 04 — Assignment 1: Sum and Reverse",
	unit: "Unit 4",
	description: "Read four unsigned whole numbers into WORD/DWORD variables, print their full 64-bit sum, then print the four values in reverse order. 30 points, graded by your instructor.",
	starterCode: unit04A01SumReverseStarter,
	tests: unit04A01SumReverseTests,
	instructions: unit04A01SumReverseInstructions,
	submissionMode: "source-text",
	personalizationReminders: [
		{ pattern: "Your Name", message: "Replace “Your Name” in the header with your name." },
		{ pattern: "YYYY-MM-DD", message: "Replace YYYY-MM-DD in the header with your completion date." },
	],
};

export const assignments: AssignmentConfig[] = [
	unit01HelloAssignment,
	unit02MovieShowcaseAssignment,
	unit03Lab3aRegistersAssignment,
	unit03Lab3bVariablesAssignment,
	unit04VariablesArithmeticAssignment,
	unit04A01SumReverseAssignment,
];

export function getAssignmentById(id: string | null): AssignmentConfig | null {
	if (!id) return null;
	return assignments.find((a) => a.id === id) ?? null;
}
