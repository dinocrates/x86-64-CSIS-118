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

const NASM_INT_LITERAL_RE = /^(0[bB]|0[xX]|0[oO])([0-9a-fA-F_]+)$/;

/** Parse a NASM 0b/0x/0o literal (underscores allowed) to its base and value. */
function parseNasmIntLiteral(raw: string): { prefix: "0b" | "0x" | "0o"; value: number } | null {
	const m = NASM_INT_LITERAL_RE.exec(raw);
	if (!m) return null;
	const prefix = m[1].toLowerCase() as "0b" | "0x" | "0o";
	const digits = m[2].replace(/_/g, "");
	const base = prefix === "0b" ? 2 : prefix === "0x" ? 16 : 8;
	const validDigits = base === 2 ? /^[01]+$/ : base === 16 ? /^[0-9a-fA-F]+$/ : /^[0-7]+$/;
	if (!digits || !validDigits.test(digits)) return null;
	return { prefix, value: parseInt(digits, base) };
}

/**
 * True if de-commented source has an active `mov <register>, <literal>`
 * where <literal> is a <prefix>-notated literal parsing to decimalValue.
 * A commented-out example is excluded because the source is de-commented
 * first (stripComments removes everything from ';' to end of line).
 */
function hasLiteralLoad(
	decommented: string,
	register: string,
	prefix: "0b" | "0x" | "0o",
	decimalValue: number,
): boolean {
	const escapedRegister = register.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const re = new RegExp(`\\bmov\\s+${escapedRegister}\\s*,\\s*([0-9a-zA-Z_]+)`, "gi");
	let match: RegExpExecArray | null;
	while ((match = re.exec(decommented))) {
		const parsed = parseNasmIntLiteral(match[1]);
		if (parsed && parsed.prefix === prefix && parsed.value === decimalValue) return true;
	}
	return false;
}

/** Narrow formative scanner, not a NASM parser: mask literals and comments
 * while preserving lines. Only backtick strings have NASM backslash escapes.
 * Includes are deliberately not expanded; library sections do not count. */
function studentCodeTokens(source: string): string {
	return source.replace(/\r\n?/g, "\n").split("\n").map((line) => {
		let quote: string | null = null;
		let tokens = "";
		for (let i = 0; i < line.length; i++) {
			const c = line[i];
			if (quote) {
				tokens += " ";
				if (quote === "`" && c === "\\") { tokens += " "; i++; }
				else if (c === quote) quote = null;
			} else if (c === ";") break;
			else if (c === '"' || c === "'" || c === "`") {
				quote = c;
				tokens += " ";
			} else tokens += c;
		}
		return tokens;
	}).join("\n");
}

export function checkStudentOrganization(source: string, test: SourceCheckTest): string[] {
	if (!test.requiredDataLabels && !test.requiredDwordVariables && !test.studentSectionCounts) return [];
	const tokens = studentCodeTokens(source);
	const problems: string[] = [];
	const dbDefinitions = [...tokens.matchAll(/^[ \t]*([A-Za-z_.?$][A-Za-z0-9_.?$#@~]*)[ \t]*(?::[ \t]*|[ \t]+)([dD][bB])\b/gm)];
	for (const label of test.requiredDataLabels ?? []) {
		if (dbDefinitions.filter((definition) => definition[1] === label).length !== 1) {
			problems.push(`Define \`${label}\` once as its own db string in section .data. A colon before db is optional.`);
		}
	}
	const ddDefinitions = [...tokens.matchAll(/^[ \t]*([A-Za-z_.?$][A-Za-z0-9_.?$#@~]*)[ \t]*(?::[ \t]*|[ \t]+)([dD][dD])\b/gm)];
	for (const label of test.requiredDwordVariables ?? []) {
		if (ddDefinitions.filter((definition) => definition[1] === label).length !== 1) {
			problems.push(`Define \`${label}\` once as its own dd (DWORD) variable. A colon before dd is optional.`);
		}
	}
	if (test.studentSectionCounts) {
		const sections = [...tokens.matchAll(/^\s*(?:\[\s*)?section\s+(\.data|\.text)(?=\s|\]|$)/gim)];
		for (const section of ["data", "text"] as const) {
			const count = sections.filter((match) => match[1].toLowerCase() === `.${section}`).length;
			const expected = test.studentSectionCounts[section];
			if (count !== expected) problems.push(`For this lab, keep exactly ${expected} section .${section} declaration in your own source; found ${count}. NASM allows repeated sections, but this assignment asks you to organize each section together.`);
		}
	}
	return problems;
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
	problems.push(...checkStudentOrganization(source, test));
	const decommented = stripComments(source);

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
	for (const pattern of test.requiredActivePatterns ?? []) {
		if (!patternMatches(pattern, decommented)) {
			problems.push(`Your active code is missing something this assignment requires (pattern: ${pattern}).`);
		}
	}
	if (test.requiredLiteralLoad) {
		const { register, prefix, decimalValue } = test.requiredLiteralLoad;
		if (!hasLiteralLoad(decommented, register, prefix, decimalValue)) {
			problems.push(
				`An active \`mov ${register}, ${prefix}...\` literal loading decimal ${decimalValue} was not found. ` +
					`Check the ${prefix} prefix and the exact value.`,
			);
		}
	}
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
