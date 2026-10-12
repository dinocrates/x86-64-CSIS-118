import type { AssignmentConfig } from "./types";
import { unit01HelloStarter } from "./starters/unit01_hello.asm";
import { unit01HelloTests } from "./tests/unit01_hello.tests";
import { unit01Instructions } from "./instructions/unit01";
import { unit02MovieShowcaseStarter } from "./starters/unit02_movie_showcase.asm";
import { unit02MovieShowcaseTests } from "./tests/unit02_movie_showcase.tests";
import { unit02MovieShowcaseInstructions } from "./instructions/unit02_movie_showcase";

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

export const assignments: AssignmentConfig[] = [unit01HelloAssignment, unit02MovieShowcaseAssignment];

export function getAssignmentById(id: string | null): AssignmentConfig | null {
	if (!id) return null;
	return assignments.find((a) => a.id === id) ?? null;
}
