import {
	DEFAULT_PRESERVED_REGISTERS,
	type AbiPreservationTest,
	type X64Register,
} from "../assignments/types";
import { formatU64, toU64 } from "./registerChecks";

/**
 * ABI preservation checks: callee-saved registers (rbx, rbp, r12-r15)
 * must hold their original values after the student procedure returns,
 * and the stack pointer must be balanced.
 */

/**
 * A recognizable sentinel per callee-saved register. The values are
 * arbitrary but distinct, and unlikely to be produced by student code.
 */
export function abiSentinelFor(register: X64Register): bigint {
	const index = BigInt(
		["rbx", "rbp", "r12", "r13", "r14", "r15"].indexOf(register) + 1,
	);
	return 0xc515c0de00000000n + (index <= 0n ? 0xffn : index);
}

export interface AbiExpectation {
	register: X64Register;
	expected: bigint; // u64 value the register must still hold after the call
}

/**
 * Build the list of (register, expected value) pairs for an ABI test.
 * Registers also present in setupRegisters must preserve the setup value;
 * the rest must preserve their sentinel.
 */
export function abiExpectations(test: AbiPreservationTest): AbiExpectation[] {
	const preserved = test.preservedRegisters ?? DEFAULT_PRESERVED_REGISTERS;
	return preserved.map((register) => {
		const setupValue = test.setupRegisters?.[register];
		return {
			register,
			expected:
				setupValue !== undefined
					? toU64(setupValue)
					: abiSentinelFor(register),
		};
	});
}

export interface AbiViolation {
	register: X64Register | "rsp";
	expected: bigint;
	actual: bigint | null;
}

export function compareAbi(
	expectations: AbiExpectation[],
	captured: Map<string, bigint>,
): AbiViolation[] {
	const violations: AbiViolation[] = [];
	for (const { register, expected } of expectations) {
		const actual = captured.get(register.toUpperCase()) ?? null;
		if (actual === null || actual !== expected) {
			violations.push({ register, expected, actual });
		}
	}
	// stack balance: rsp after the call must equal rsp just before it
	const rspBefore = captured.get("RSP_BEFORE");
	const rspAfter = captured.get("RSP");
	if (
		rspBefore !== undefined &&
		rspAfter !== undefined &&
		rspBefore !== rspAfter
	) {
		violations.push({ register: "rsp", expected: rspBefore, actual: rspAfter });
	}
	return violations;
}

export function describeAbiViolation(v: AbiViolation): string {
	if (v.register === "rsp") {
		return (
			"The stack pointer (rsp) was not back to its original value after " +
			"your procedure returned. Check that every push has a matching pop."
		);
	}
	const actual = v.actual === null ? "an unknown value" : formatU64(v.actual);
	return (
		`Your procedure changed ${v.register} and did not restore it ` +
		`(it held ${formatU64(v.expected)} before the call, and ${actual} after).`
	);
}
