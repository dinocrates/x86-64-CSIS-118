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
	return text.replace(/^\r?\n\$ \/program[^\n]*\n/, "");
}

/** Preserve message content; normalize CRLF and at most one final newline. */
export function checkMessageLines(
	stdout: string,
	contract: { count: number; identifyingPrefix: string },
): string | null {
	const lines = stdout.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
	if (lines.length !== contract.count || lines.some((line) => !line.trim())) {
		return `Print exactly ${contract.count} nonempty message lines: your greeting, then your identifying message. Received ${lines.length} line(s).`;
	}
	const identifyingLine = lines[lines.length - 1];
	if (!identifyingLine.startsWith(contract.identifyingPrefix)) {
		return `Start the second message with “${contract.identifyingPrefix}”, followed by your name.`;
	}
	if (!identifyingLine.slice(contract.identifyingPrefix.length).trim()) {
		return `Add your name after “${contract.identifyingPrefix}” in the second message.`;
	}
	return null;
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

/** Validate personalized movie output without a fixed answer or movie database. */
export function checkMovieRecords(stdout: string, contract: { count: number }): string | null {
	const lines = stdout.replace(/\r\n?/g, "\n").split("\n")
		.map((line) => line.replace(/[ \t]+$/g, ""));
	while (lines[0] === "") lines.shift();
	while (lines.length && lines[lines.length - 1] === "") lines.pop();
	const records: string[][] = [];
	for (const line of lines) {
		if (line === "") {
			if (records.length && records[records.length - 1].length) records.push([]);
		} else {
			if (!records.length) records.push([]);
			records[records.length - 1].push(line);
		}
	}
	const seen = new Set<string>();
	for (const [index, record] of records.entries()) {
		const movie = `Movie ${String.fromCharCode(65 + index)}`;
		if (record.length > 3) return `${movie} has extra lines. Print only Title:, Year:, and Director: for each movie. Add a blank line between each three-line movie record; remove other output.`;
		const values: string[] = [];
		for (const [fieldIndex, prefix] of ["Title:", "Year:", "Director:"].entries()) {
			const line = record[fieldIndex];
			if (line === undefined || !line.startsWith(prefix) || !line.slice(prefix.length).trim()) {
				return `${movie} needs a nonempty ${prefix} line in Title:, Year:, Director: order.`;
			}
			values.push(line.slice(prefix.length).trim());
		}
		if (!/^[0-9]{4}$/.test(values[1])) return `${movie} needs a four-digit Year: value, stored as text (for example, 1977).`;
		const key = JSON.stringify(values);
		if (seen.has(key)) return `${movie} repeats an identical movie record. Check your string values and the labels passed to print_line.`;
		seen.add(key);
	}
	if (records.length !== contract.count) return `Print exactly ${contract.count} movie records; found ${records.length}. Keep Movie A, add your movies B and C, and separate the records with blank lines.`;
	return null;
}

/**
 * Validate a "Sum: <n>" line followed by a "Reverse order:" section of
 * exactly four decimal values, ignoring everything before the Sum: line
 * (prompts/echo, whose wording this assignment does not fix). Rejects a
 * missing or duplicated Sum: line, a missing/misplaced heading, missing or
 * extra reversed values (including trailing output after them), and
 * compares every value as an exact unsigned decimal integer.
 */
export function checkSumAndReverse(
	stdout: string,
	contract: { sum: number; reverse: [number, number, number, number] },
): string | null {
	const lines = stdout.replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim());
	const isSumLine = (line: string) => /^Sum:\s*[0-9]+\s*$/.test(line);

	const sumIndex = lines.findIndex(isSumLine);
	if (sumIndex === -1) {
		return "No \"Sum: <value>\" line was found. Print exactly one Sum: line with your 64-bit total.";
	}
	if (lines.slice(sumIndex + 1).some(isSumLine)) {
		return "More than one \"Sum: \" line was found. Print the Sum: result exactly once.";
	}
	const actualSum = Number(lines[sumIndex].match(/[0-9]+/)![0]);
	if (actualSum !== contract.sum) {
		return `Sum: printed ${actualSum}, but the correct total for these inputs is ${contract.sum}. Check that your running total and additions use 64-bit operands.`;
	}

	let i = sumIndex + 1;
	while (i < lines.length && lines[i] === "") i++;
	if (lines[i] !== "Reverse order:") {
		return "Expected a \"Reverse order:\" line immediately after Sum: (with no other output in between).";
	}
	i++;

	const values: number[] = [];
	for (let k = 0; k < 4; k++) {
		if (i >= lines.length || !/^[0-9]+$/.test(lines[i])) {
			return `Expected four reversed values after "Reverse order:" (num4, num3, num2, num1, one per line); found ${values.length} valid value(s) before something else appeared.`;
		}
		values.push(Number(lines[i]));
		i++;
	}
	while (i < lines.length && lines[i] === "") i++;
	if (i < lines.length) {
		return "Found extra output after the four reversed values. Print only the required Sum: and Reverse order: section.";
	}

	const labels = ["num4", "num3", "num2", "num1"];
	for (const [index, expected] of contract.reverse.entries()) {
		if (values[index] !== expected) {
			return `Reverse order: value ${index + 1} (${labels[index]}) is ${values[index]}, but expected ${expected}. Reload the original inputs from memory and print them in num4, num3, num2, num1 order.`;
		}
	}
	return null;
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
