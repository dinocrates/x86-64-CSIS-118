import type { X64Register } from "../assignments/types";

/**
 * 64-bit value handling for register and memory tests.
 *
 * All values are normalized to unsigned 64-bit bigints (two's complement)
 * for comparison, and formatted back to a student-friendly signed decimal
 * (or hex for very large values) for display.
 */

const U64_MASK = (1n << 64n) - 1n;

/**
 * Normalize a configured test value to an unsigned 64-bit bigint.
 * Accepts numbers, decimal strings ("-8"), and hex strings ("0x1F", "-0x1F").
 * Throws on values that cannot be parsed — the runner reports that as a
 * test configuration problem.
 */
export function toU64(value: string | number | bigint): bigint {
	let big: bigint;
	if (typeof value === "bigint") {
		big = value;
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new Error(`test value ${value} is not an integer`);
		}
		big = BigInt(value);
	} else {
		const str = value.trim();
		const negative = str.startsWith("-");
		const body = negative ? str.slice(1) : str;
		if (!/^(0[xX][0-9a-fA-F]+|\d+)$/.test(body)) {
			throw new Error(`test value "${value}" is not a number`);
		}
		big = BigInt(body);
		if (negative) big = -big;
	}
	return BigInt.asUintN(64, big);
}

/** Interpret an unsigned 64-bit value as signed two's complement. */
export function toI64(u64: bigint): bigint {
	return BigInt.asIntN(64, u64 & U64_MASK);
}

/**
 * Format a 64-bit value the way a student expects to read it:
 * signed decimal for reasonably sized values, hex otherwise.
 */
export function formatU64(u64: bigint): string {
	const signed = toI64(u64);
	const abs = signed < 0n ? -signed : signed;
	if (abs <= 0xffffffffn) {
		return signed.toString();
	}
	return `0x${(u64 & U64_MASK).toString(16).toUpperCase()}`;
}

/** "rdi = 5" lines for a register/value map, in a stable order. */
export function formatRegisterLines(
	regs: Partial<Record<X64Register, string | number>>,
): string[] {
	return Object.entries(regs).map(
		([reg, value]) => `${reg} = ${formatU64(toU64(value))}`,
	);
}

export interface RegisterMismatch {
	register: X64Register;
	expected: bigint; // u64
	actual: bigint | null; // u64, or null when the value was never captured
}

/**
 * Compare expected register values against the values captured by the
 * test harness. Returns the list of mismatches (empty = pass).
 */
export function compareRegisters(
	expected: Partial<Record<X64Register, string | number>>,
	captured: Map<string, bigint>,
): RegisterMismatch[] {
	const mismatches: RegisterMismatch[] = [];
	for (const [reg, value] of Object.entries(expected)) {
		const expectedU64 = toU64(value);
		const actualU64 = captured.get(reg.toUpperCase()) ?? null;
		if (actualU64 === null || actualU64 !== expectedU64) {
			mismatches.push({
				register: reg as X64Register,
				expected: expectedU64,
				actual: actualU64,
			});
		}
	}
	return mismatches;
}
