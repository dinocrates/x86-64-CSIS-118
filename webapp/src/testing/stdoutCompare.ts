/**
 * Output comparison for stdout tests.
 *
 * Compare modes:
 *   exact      — output must match exactly, byte for byte
 *   trimmed    — leading/trailing whitespace is ignored
 *   normalized — line endings are normalized, trailing spaces on each
 *                line are ignored, runs of blank lines collapse to one,
 *                and leading/trailing blank space is ignored.
 *
 * For beginner assignments prefer "normalized" unless exact formatting
 * is the point of the assignment.
 */

export type StdoutCompareMode = "exact" | "trimmed" | "normalized";

/**
 * The emulator echoes a shell-style prompt line ("$ /program") into the
 * terminal stream when a program starts. It is cosmetic terminal output,
 * not program output, so the test runner strips it from captured stdout.
 */
export function stripTerminalPrompt(text: string): string {
	return text.replace(/^\s*\$ \/program[^\n]*\n/, "");
}

export function normalizeStdout(text: string): string {
	const lines = text
		.replace(/\r\n?/g, "\n")
		.split("\n")
		.map((line) => line.replace(/[ \t]+$/g, ""));
	// collapse runs of blank lines into a single blank line
	const collapsed: string[] = [];
	for (const line of lines) {
		if (line === "" && collapsed[collapsed.length - 1] === "") continue;
		collapsed.push(line);
	}
	return collapsed.join("\n").trim();
}

export function compareStdout(
	expected: string,
	actual: string,
	mode: StdoutCompareMode = "normalized",
): boolean {
	switch (mode) {
		case "exact":
			return actual === expected;
		case "trimmed":
			return actual.trim() === expected.trim();
		default:
			return normalizeStdout(actual) === normalizeStdout(expected);
	}
}
