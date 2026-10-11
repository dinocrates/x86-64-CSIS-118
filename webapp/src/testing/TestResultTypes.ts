/**
 * Result types produced by the Check My Work test runner.
 *
 * These results power the in-app results panel and the downloadable
 * test report. They are formative feedback only — never an official grade.
 */

export type TestStatus = "passed" | "failed" | "blocked";

export interface AssignmentSingleTestResult {
	id: string;
	name: string;
	type: string;
	status: TestStatus;
	pointsEarned?: number;
	pointsPossible?: number;
	/** Beginner-friendly, plain-language explanation of the outcome. */
	message: string;
	expected?: string;
	actual?: string;
	hint?: string;
	/** Extra technical detail lines (assembler output, register dumps, ...). */
	details?: string[];
}

export interface AssignmentTestReport {
	assignmentId: string;
	assignmentTitle: string;
	passed: number;
	failed: number;
	blocked: number;
	total: number;
	pointsEarned: number;
	pointsPossible: number;
	results: AssignmentSingleTestResult[];
	/** ISO-8601 timestamp of when the checks were run. */
	timestamp: string;
	/** sha256 of the exact source that was checked, when available. */
	sourceSha256?: string;
	/** Advisory personalization reminders, separate from test counts/points. */
	reminders?: string[];
}

/** Standard student-facing wording, used consistently across the UI. */
export const MESSAGES = {
	blockedByAssemble:
		"This test could not run because the program did not assemble successfully.",
	assembleFailedHeading: "The assembler found a syntax problem.",
	timeout:
		"This test stopped because the program ran too long. " +
		"Check for an infinite loop or a missing ret instruction.",
	checkMyWorkNote:
		"Check My Work runs practice tests in your browser. Passing these " +
		"tests does not guarantee full credit. When you are finished, click " +
		"Copy Submission Link and paste it into Canvas.",
} as const;
