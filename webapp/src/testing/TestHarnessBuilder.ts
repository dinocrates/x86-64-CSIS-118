import type {
	MemoryExpectation,
	MemoryFixture,
	X64Register,
} from "../assignments/types";
import { MEMORY_KINDS, elementValues } from "./memoryChecks";
import { toU64 } from "./registerChecks";
import {
	hasLabel,
	includesCsis118bInc,
	isValidLabelName,
} from "./sourceChecks";

/**
 * Generates the temporary assembly programs used by procedure tests.
 *
 * The harness is appended AFTER the student code (so assembler error line
 * numbers still point at the student's own lines) and:
 *   1. injects test data into .data
 *   2. zeroes the general purpose registers, then initializes the
 *      configured ones
 *   3. calls the student procedure
 *   4. captures every register into memory immediately after the call
 *   5. prints registers and memory as sentinel-marked hex lines on stdout
 *
 * The runner parses the sentinel lines internally; they are never shown
 * in the student UI. All generated labels use the __csis118b_test_ prefix
 * to avoid collisions with student labels.
 */

export const HARNESS_LABEL_PREFIX = "__csis118b_test_";
export const SENTINEL_PREFIX = "__CSIS_TEST_";
export const DONE_MARKER = "__CSIS_TEST_DONE__";

/** All GPRs captured after the call, in emission order. */
export const CAPTURED_REGISTERS: X64Register[] = [
	"rax",
	"rbx",
	"rcx",
	"rdx",
	"rsi",
	"rdi",
	"rbp",
	"rsp",
	"r8",
	"r9",
	"r10",
	"r11",
	"r12",
	"r13",
	"r14",
	"r15",
];

export interface HarnessRequest {
	procedure: string;
	setupRegisters?: Partial<Record<X64Register, string | number>>;
	/**
	 * Values applied before setupRegisters, as plain u64 bigints.
	 * Used by ABI tests to plant sentinels in callee-saved registers.
	 */
	presetRegisters?: Partial<Record<X64Register, bigint>>;
	memorySetup?: MemoryFixture[];
	expectedMemory?: MemoryExpectation[];
}

export type BuiltHarness =
	| { ok: true; source: string }
	| {
			ok: false;
			/** true: student code conflicts (their fix). false: config problem. */
			blocked: boolean;
			reason: string;
	  };

/** Parse the raw sentinel lines out of captured stdout. */
export function parseSentinels(stdout: string): Map<string, bigint> {
	const map = new Map<string, bigint>();
	const re = /__CSIS_TEST_([A-Z0-9_]+?)__=([0-9A-F]{16})/g;
	let match: RegExpExecArray | null;
	// biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop
	while ((match = re.exec(stdout)) !== null) {
		map.set(match[1], BigInt(`0x${match[2]}`));
	}
	return map;
}

export function sawDoneMarker(stdout: string): boolean {
	return stdout.includes(DONE_MARKER);
}

/** Remove harness sentinel lines, leaving only the student's own output. */
export function stripSentinelLines(stdout: string): string {
	return stdout
		.split("\n")
		.filter((line) => !line.includes(SENTINEL_PREFIX))
		.join("\n")
		.trim();
}

function hex64(value: bigint): string {
	return `0x${BigInt.asUintN(64, value).toString(16).toUpperCase().padStart(16, "0")}`;
}

function dataLabelFor(fixtureLabel: string): string {
	return `${HARNESS_LABEL_PREFIX}data_${fixtureLabel}`;
}

/**
 * Build the complete test program (student code + harness) for one
 * procedure-based test.
 */
export function buildProcedureHarness(
	studentSource: string,
	request: HarnessRequest,
): BuiltHarness {
	// ---- choose the entry symbol -------------------------------------
	// csis118b.inc provides _start (which calls main), so when the student
	// code includes it the harness must BE main. Otherwise the harness
	// provides _start itself.
	const usesInc = includesCsis118bInc(studentSource);
	const definesMain = hasLabel(studentSource, "main");
	const definesStart = hasLabel(studentSource, "_start");

	if (usesInc && definesMain) {
		return {
			ok: false,
			blocked: true,
			reason:
				"These checks call your procedure directly and provide their own " +
				"program entry, but your file defines a main procedure while " +
				"including csis118b.inc — so the test program cannot start. " +
				"Comment out your main procedure (and its `global main` line) " +
				"while running Check My Work. Your procedure itself can stay " +
				"exactly as it is.",
		};
	}
	if (!usesInc && definesStart) {
		return {
			ok: false,
			blocked: true,
			reason:
				"These checks call your procedure directly and provide their own " +
				"program entry, but your file already defines _start — so the " +
				"test program cannot start. Remove or comment out your _start " +
				"code (keep the required procedure) and run Check My Work again.",
		};
	}
	const entry = usesInc ? "main" : "_start";

	// ---- validate the test configuration -----------------------------
	if (!isValidLabelName(request.procedure)) {
		return {
			ok: false,
			blocked: false,
			reason: `"${request.procedure}" is not a valid procedure name.`,
		};
	}
	const fixtures = request.memorySetup ?? [];
	const fixtureLabels = new Set<string>();
	for (const fixture of fixtures) {
		if (!isValidLabelName(fixture.label)) {
			return {
				ok: false,
				blocked: false,
				reason: `memory fixture label "${fixture.label}" is not a valid label name.`,
			};
		}
		if (fixtureLabels.has(fixture.label)) {
			return {
				ok: false,
				blocked: false,
				reason: `memory fixture label "${fixture.label}" is defined twice.`,
			};
		}
		fixtureLabels.add(fixture.label);
		if (fixture.values.length === 0 && fixture.kind !== "string") {
			return {
				ok: false,
				blocked: false,
				reason: `memory fixture "${fixture.label}" has no values.`,
			};
		}
	}
	const expectations = request.expectedMemory ?? [];
	for (const expectation of expectations) {
		if (!isValidLabelName(expectation.label)) {
			return {
				ok: false,
				blocked: false,
				reason: `expected memory label "${expectation.label}" is not a valid label name.`,
			};
		}
		if (expectation.values.length === 0) {
			return {
				ok: false,
				blocked: false,
				reason: `expected memory "${expectation.label}" has no values.`,
			};
		}
	}

	// ---- .data: hex table, sentinel prefixes, fixtures ----------------
	const dataLines: string[] = [
		"section .data",
		"",
		`${HARNESS_LABEL_PREFIX}hexchars: db "0123456789ABCDEF"`,
	];
	// sentinel prefix strings; printPlan pairs each with a value loader
	const printPlan: { prefixLabel: string; loadInstructions: string[] }[] = [];
	let prefixCount = 0;
	function addSentinel(name: string, loadInstructions: string[]) {
		const prefixLabel = `${HARNESS_LABEL_PREFIX}p${prefixCount++}`;
		dataLines.push(`${prefixLabel}: db "${SENTINEL_PREFIX}${name}__="`);
		dataLines.push(`${prefixLabel}_len equ $ - ${prefixLabel}`);
		printPlan.push({ prefixLabel, loadInstructions });
	}

	for (const register of CAPTURED_REGISTERS) {
		addSentinel(register.toUpperCase(), [
			`mov  rax, [rel ${HARNESS_LABEL_PREFIX}save_${register}]`,
		]);
	}
	addSentinel("RSP_BEFORE", [
		`mov  rax, [rel ${HARNESS_LABEL_PREFIX}save_rsp_before]`,
	]);

	expectations.forEach((expectation, expectationIndex) => {
		const info = MEMORY_KINDS[expectation.kind];
		const count = elementValues(expectation.kind, expectation.values).length;
		const address = fixtureLabels.has(expectation.label)
			? dataLabelFor(expectation.label)
			: expectation.label;
		for (let i = 0; i < count; i++) {
			const offset = i * info.size;
			const location = `[rel ${address} + ${offset}]`;
			let load: string;
			switch (info.size) {
				case 8:
					load = `mov  rax, ${location}`;
					break;
				case 4:
					load = `mov  eax, ${location}`;
					break;
				case 2:
					load = `movzx eax, word ${location}`;
					break;
				default:
					load = `movzx eax, byte ${location}`;
					break;
			}
			addSentinel(`MEM_${expectationIndex}_${i}`, [load]);
		}
	});

	const doneLabel = `${HARNESS_LABEL_PREFIX}pdone`;
	dataLines.push(`${doneLabel}: db "${DONE_MARKER}", 10`);
	dataLines.push(`${doneLabel}_len equ $ - ${doneLabel}`);

	// fixtures
	for (const fixture of fixtures) {
		const info = MEMORY_KINDS[fixture.kind];
		const values = elementValues(fixture.kind, fixture.values);
		if (fixture.kind === "string") values.push(0n); // null terminator
		const label = dataLabelFor(fixture.label);
		// chunk values across lines to keep them readable
		const chunkSize = 8;
		for (let i = 0; i < values.length; i += chunkSize) {
			const chunk = values
				.slice(i, i + chunkSize)
				.map((v) => `0x${v.toString(16).toUpperCase()}`)
				.join(", ");
			dataLines.push(
				i === 0 ? `${label}: ${info.directive} ${chunk}` : `    ${info.directive} ${chunk}`,
			);
		}
	}

	// ---- .bss: register save area + hex conversion buffer -------------
	const bssLines: string[] = ["section .bss", ""];
	for (const register of CAPTURED_REGISTERS) {
		bssLines.push(`${HARNESS_LABEL_PREFIX}save_${register}: resq 1`);
	}
	bssLines.push(`${HARNESS_LABEL_PREFIX}save_rsp_before: resq 1`);
	bssLines.push(`${HARNESS_LABEL_PREFIX}hexbuf: resb 24`);

	// ---- .text: entry, setup, call, capture, print, exit ---------------
	const textLines: string[] = ["section .text", "", `global ${entry}`, `${entry}:`];
	// deterministic stack alignment: rsp is 16-byte aligned right before
	// the call, exactly what the System V ABI promises a caller does
	textLines.push("    and  rsp, -16");
	// deterministic register state
	for (const register of CAPTURED_REGISTERS) {
		if (register === "rsp") continue;
		textLines.push(`    xor  ${register}, ${register}`);
	}
	// ABI sentinels first, then configured registers (setup wins)
	for (const [register, value] of Object.entries(
		request.presetRegisters ?? {},
	)) {
		textLines.push(`    mov  ${register}, ${hex64(value)}`);
	}
	for (const [register, value] of Object.entries(
		request.setupRegisters ?? {},
	)) {
		if (register === "rsp") {
			return {
				ok: false,
				blocked: false,
				reason: "setupRegisters cannot set rsp.",
			};
		}
		if (typeof value === "string" && value.trim().startsWith("&")) {
			const target = value.trim().slice(1);
			if (!isValidLabelName(target)) {
				return {
					ok: false,
					blocked: false,
					reason: `"${value}" is not a valid label reference.`,
				};
			}
			const address = fixtureLabels.has(target)
				? dataLabelFor(target)
				: target;
			textLines.push(`    lea  ${register}, [rel ${address}]`);
		} else {
			let u64: bigint;
			try {
				u64 = toU64(value);
			} catch (error) {
				return {
					ok: false,
					blocked: false,
					reason: `register ${register}: ${(error as Error).message}`,
				};
			}
			textLines.push(`    mov  ${register}, ${hex64(u64)}`);
		}
	}
	// record rsp, call the student procedure, capture everything
	textLines.push(
		`    mov  [rel ${HARNESS_LABEL_PREFIX}save_rsp_before], rsp`,
		`    call ${request.procedure}`,
	);
	for (const register of CAPTURED_REGISTERS) {
		textLines.push(
			`    mov  [rel ${HARNESS_LABEL_PREFIX}save_${register}], ${register}`,
		);
	}
	// print every sentinel line
	for (const { prefixLabel, loadInstructions } of printPlan) {
		textLines.push(
			`    lea  rsi, [rel ${prefixLabel}]`,
			`    mov  rdx, ${prefixLabel}_len`,
			`    call ${HARNESS_LABEL_PREFIX}write`,
		);
		for (const instruction of loadInstructions) {
			textLines.push(`    ${instruction}`);
		}
		textLines.push(`    call ${HARNESS_LABEL_PREFIX}print_hex`);
	}
	textLines.push(
		`    lea  rsi, [rel ${doneLabel}]`,
		`    mov  rdx, ${doneLabel}_len`,
		`    call ${HARNESS_LABEL_PREFIX}write`,
	);
	// exit(0)
	textLines.push("    mov  rax, 60", "    xor  rdi, rdi", "    syscall");

	// helper routines
	textLines.push(
		"",
		"; write(stdout, rsi=buffer, rdx=length)",
		`${HARNESS_LABEL_PREFIX}write:`,
		"    mov  rax, 1",
		"    mov  rdi, 1",
		"    syscall",
		"    ret",
		"",
		"; print rax as exactly 16 uppercase hex digits plus a newline",
		`${HARNESS_LABEL_PREFIX}print_hex:`,
		`    lea  rsi, [rel ${HARNESS_LABEL_PREFIX}hexbuf]`,
		`    lea  rdi, [rel ${HARNESS_LABEL_PREFIX}hexchars]`,
		"    mov  rcx, 16",
		".next_digit:",
		"    rol  rax, 4",
		"    mov  rbx, rax",
		"    and  rbx, 0xF",
		"    mov  bl, [rdi + rbx]",
		"    mov  [rsi], bl",
		"    inc  rsi",
		"    dec  rcx",
		"    jnz  .next_digit",
		"    mov  byte [rsi], 10",
		`    lea  rsi, [rel ${HARNESS_LABEL_PREFIX}hexbuf]`,
		"    mov  rdx, 17",
		`    jmp  ${HARNESS_LABEL_PREFIX}write`,
	);

	const harness = [
		"; =============================================================",
		"; CSIS-118B Check My Work harness (auto-generated, not student code)",
		"; =============================================================",
		"",
		...dataLines,
		"",
		...bssLines,
		"",
		...textLines,
		"",
	].join("\n");

	return { ok: true, source: `${studentSource}\n\n${harness}` };
}
