import type { SourceCheckTest } from "../assignments/types";
import type { AssignmentSingleTestResult } from "./TestResultTypes";

/**
 * Static checks against the student's source text: required labels,
 * required patterns, banned patterns. Also provides the source scanning
 * used by the harness builder (does the code define main / _start /
 * include csis118b.inc?).
 */

/**
 * Remove NASM comments (; to end of line), respecting single and double
 * quoted strings so a ';' inside a string literal is not treated as a
 * comment. Used so label and banned-pattern checks ignore commented-out
 * code.
 */
export function stripComments(source: string): string {
	return source
		.split("\n")
		.map((line) => {
			let quote: string | null = null;
			for (let i = 0; i < line.length; i++) {
				const c = line[i];
				if (quote) {
					if (c === quote) quote = null;
				} else if (c === '"' || c === "'") {
					quote = c;
				} else if (c === ";") {
					return line.slice(0, i);
				}
			}
			return line;
		})
		.join("\n");
}

const LABEL_NAME_RE = /^[A-Za-z_.?$][A-Za-z0-9_.?$#@~]*$/;

export function isValidLabelName(name: string): boolean {
	return LABEL_NAME_RE.test(name);
}

/** True if the (de-commented) source defines the NASM label `name:` */
export function hasLabel(source: string, name: string): boolean {
	if (!isValidLabelName(name)) return false;
	const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const re = new RegExp(`^\\s*${escaped}\\s*:`, "m");
	return re.test(stripComments(source));
}

/** True if the source has an active `%include "csis118b.inc"` line */
export function includesCsis118bInc(source: string): boolean {
	return /^\s*%\s*include\s+["']csis118b\.inc["']/im.test(
		stripComments(source),
	);
}

/**
 * Test a configured pattern against text. Patterns are treated as
 * case-insensitive multiline regular expressions; if the pattern is not
 * a valid regex it is matched as a literal string instead.
 */
function patternMatches(pattern: string, text: string): boolean {
	try {
		return new RegExp(pattern, "im").test(text);
	} catch {
		return text.toLowerCase().includes(pattern.toLowerCase());
	}
}

/**
 * Run one source-check test.
 *
 * - requiredLabels are checked against the de-commented source.
 * - bannedPatterns are checked against the de-commented source, so
 *   commented-out code is not flagged.
 * - requiredPatterns are checked against the raw source, so an
 *   instructor may require a comment (e.g. a header line).
 */
export function runSourceCheckTest(
	test: SourceCheckTest,
	source: string,
): AssignmentSingleTestResult {
	const problems: string[] = [];

	for (const label of test.requiredLabels ?? []) {
		if (!hasLabel(source, label)) {
			problems.push(
				`The required label \`${label}:\` was not found in your code. ` +
					"Do not rename or remove it.",
			);
		}
	}
	for (const pattern of test.requiredPatterns ?? []) {
		if (!patternMatches(pattern, source)) {
			problems.push(`Your code is missing something this assignment requires (pattern: ${pattern}).`);
		}
	}
	const decommented = stripComments(source);
	for (const pattern of test.bannedPatterns ?? []) {
		if (patternMatches(pattern, decommented)) {
			problems.push(
				`Your code uses something this assignment does not allow (pattern: ${pattern}).`,
			);
		}
	}

	const passed = problems.length === 0;
	return {
		id: test.id,
		name: test.name,
		type: test.type,
		status: passed ? "passed" : "failed",
		pointsPossible: test.points,
		pointsEarned: passed ? test.points : 0,
		message: passed
			? "Your code contains everything this check looks for."
			: problems.join("\n"),
		hint: passed ? undefined : test.hint,
	};
}
