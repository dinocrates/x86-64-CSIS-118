import type { MemoryExpectation, MemoryKind } from "../assignments/types";
import { toU64 } from "./registerChecks";

/**
 * Memory fixture/expectation helpers shared by the harness builder
 * (which generates the reads) and the runner (which compares values).
 */

export interface MemoryKindInfo {
	/** element size in bytes */
	size: 1 | 2 | 4 | 8;
	/** NASM data directive used to emit fixture values */
	directive: "db" | "dw" | "dd" | "dq";
}

export const MEMORY_KINDS: Record<MemoryKind, MemoryKindInfo> = {
	"byte-array": { size: 1, directive: "db" },
	"word-array": { size: 2, directive: "dw" },
	"dword-array": { size: 4, directive: "dd" },
	"qword-array": { size: 8, directive: "dq" },
	string: { size: 1, directive: "db" },
};

/**
 * Normalize fixture/expectation values into unsigned element values,
 * truncated to the element width (two's complement for negatives).
 * For "string" kinds the characters are UTF-8 encoded bytes.
 */
export function elementValues(
	kind: MemoryKind,
	values: number[] | string,
): bigint[] {
	if (typeof values === "string") {
		return Array.from(new TextEncoder().encode(values)).map((b) => BigInt(b));
	}
	const bits = BigInt(MEMORY_KINDS[kind].size * 8);
	return values.map((v) => BigInt.asUintN(Number(bits), toU64(v)));
}

/** Format one element for student-facing messages. */
export function formatElement(kind: MemoryKind, u: bigint): string {
	if (kind === "string") {
		const code = Number(u);
		if (code >= 0x20 && code <= 0x7e) return `'${String.fromCharCode(code)}'`;
		return `byte ${code}`;
	}
	const bits = MEMORY_KINDS[kind].size * 8;
	const signed = BigInt.asIntN(bits, u);
	return signed.toString();
}

export interface MemoryMismatch {
	label: string;
	index: number;
	kind: MemoryKind;
	expected: bigint;
	actual: bigint | null;
}

/**
 * Compare one memory expectation against the values captured by the
 * harness sentinels. `captured` maps sentinel names like MEM_0_2
 * (expectation index 0, element index 2) to values.
 */
export function compareMemoryExpectation(
	expectationIndex: number,
	expectation: MemoryExpectation,
	captured: Map<string, bigint>,
): MemoryMismatch[] {
	const expected = elementValues(expectation.kind, expectation.values);
	const bits = BigInt(MEMORY_KINDS[expectation.kind].size * 8);
	const mismatches: MemoryMismatch[] = [];
	expected.forEach((expectedValue, i) => {
		const raw = captured.get(`MEM_${expectationIndex}_${i}`);
		const actual =
			raw === undefined ? null : BigInt.asUintN(Number(bits), raw);
		if (actual === null || actual !== expectedValue) {
			mismatches.push({
				label: expectation.label,
				index: i,
				kind: expectation.kind,
				expected: expectedValue,
				actual,
			});
		}
	});
	return mismatches;
}

/** "[2, 4, 6, 8]" or a readable string preview, for messages. */
export function formatExpectedValues(expectation: MemoryExpectation): string {
	if (typeof expectation.values === "string") {
		return JSON.stringify(expectation.values);
	}
	return `[${expectation.values.join(", ")}]`;
}
