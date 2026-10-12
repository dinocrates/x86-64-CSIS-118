import type {
	AssignmentSingleTestResult,
	AssignmentTestReport,
} from "../testing/TestResultTypes";

/**
 * File download helpers.
 *
 * The .asm filename is assignment-aware: when an assignment is selected
 * the download is named <assignment-id>.asm. Students rename the download
 * as their assignment requires. Unit 02A submits this file with output
 * evidence; Unit 1 uses Copy Submission Link (see core/shareLink.ts) and
 * keeps the source download as a saved copy.
 */

export function downloadTextFile(filename: string, content: string): void {
	const blob = new Blob([content], { type: "text/plain" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export function asmFilenameFor(assignmentId: string | null): string {
	return assignmentId ? `${assignmentId}.asm` : "program.asm";
}

export function downloadAsm(
	content: string,
	assignmentId: string | null,
): void {
	downloadTextFile(asmFilenameFor(assignmentId), content);
}

const STATUS_LABELS: Record<AssignmentSingleTestResult["status"], string> = {
	passed: "PASS",
	failed: "FAIL",
	blocked: "BLOCKED",
};

/** Plain-text Check My Work report, formatted for Canvas-friendly reading. */
export function formatTestReport(report: AssignmentTestReport): string {
	const lines: string[] = [
		"CSIS-118B Check My Work Report",
		"",
		"Assignment:",
		report.assignmentTitle,
		"",
		"Assignment ID:",
		report.assignmentId,
		"",
		"Timestamp:",
		report.timestamp,
	];
	if (report.sourceSha256) {
		lines.push("", "Source Hash:", `sha256:${report.sourceSha256}`);
	}
	lines.push("", "Summary:", `${report.passed} / ${report.total} checks passed`);
	if (report.blocked > 0) {
		lines.push(`(${report.blocked} could not run)`);
	}
	lines.push("", "Results:");
	for (const result of report.results) {
		lines.push("", `[${STATUS_LABELS[result.status]}] ${result.name}`);
		if (result.status !== "passed") {
			if (result.message) lines.push(result.message);
			if (result.expected !== undefined) {
				lines.push("Expected:", result.expected, "");
			}
			if (result.actual !== undefined) {
				lines.push("Actual:", result.actual, "");
			}
			if (result.hint) {
				lines.push("Hint:", result.hint);
			}
			if (result.details?.length) {
				lines.push(...result.details);
			}
		}
	}
	if (report.reminders?.length) {
		lines.push("", "Personalization reminders (not execution checks):", ...report.reminders);
	}
	lines.push(
		"",
		"----",
		"Check My Work runs practice tests in your browser. Passing these",
		"tests does not guarantee full credit. Submit your work in Canvas",
		"following the assignment's submission checklist when finished.",
		"",
	);
	return lines.join("\n");
}

export function downloadTestReport(report: AssignmentTestReport): void {
	downloadTextFile(
		`csis118b-${report.assignmentId}-test-report.txt`,
		formatTestReport(report),
	);
}
