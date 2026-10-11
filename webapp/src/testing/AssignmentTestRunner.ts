import type {
	AbiPreservationTest,
	AssembleTest,
	AssignmentConfig,
	AssignmentTest,
	ProcedureMemoryTest,
	ProcedureRegisterTest,
	StdoutTest,
} from "../assignments/types";
import { abiExpectations, compareAbi, describeAbiViolation } from "./abiChecks";
import {
	MEMORY_KINDS,
	compareMemoryExpectation,
	elementValues,
	formatElement,
	formatExpectedValues,
} from "./memoryChecks";
import {
	compareRegisters,
	formatRegisterLines,
	formatU64,
} from "./registerChecks";
import { hasLabel, runSourceCheckTest } from "./sourceChecks";
import { checkMessageLines, compareStdout } from "./stdoutCompare";
import { personalizationReminders } from "./personalization";
import {
	type HarnessRequest,
	buildProcedureHarness,
	parseSentinels,
	sawDoneMarker,
	stripSentinelLines,
} from "./TestHarnessBuilder";
import {
	MESSAGES,
	type AssignmentSingleTestResult,
	type AssignmentTestReport,
	type TestStatus,
} from "./TestResultTypes";
import {
	type AssembleOutcome,
	type TestMachine,
	getTestMachine,
} from "./testMachine";

/**
 * Runs an assignment's visible tests against the student's source code
 * and produces a complete AssignmentTestReport.
 *
 * Runner rules:
 *   1. Source checks run first (no emulator needed).
 *   2. The student code is assembled once, as-is, before runtime checks.
 *   3. If assembly fails, runtime checks are blocked, not failed.
 *   4. A failing test never stops the remaining tests.
 *   5. Every runtime test runs under a timeout.
 */

export const DEFAULT_RUN_TIMEOUT_MS = 5000;
const ASSEMBLE_TIMEOUT_MS = 30000;
const MAX_SHOWN_OUTPUT = 2000;

export type ProgressCallback = (label: string) => void;

export async function runAssignmentTests(
	sourceCode: string,
	assignment: AssignmentConfig,
	onProgress?: ProgressCallback,
): Promise<AssignmentTestReport> {
	const progress = onProgress ?? (() => {});
	// Only visible tests run in the browser. Nothing in a static site can
	// be kept secret, so hidden tests are reserved for instructor tooling.
	const tests = assignment.tests.filter((t) => t.visible !== false);
	const results = new Map<string, AssignmentSingleTestResult>();
	const sourceSha256 = await sha256Hex(sourceCode);

	// ---- 1. source checks --------------------------------------------
	for (const test of tests) {
		if (test.type === "source-check") {
			results.set(test.id, runSourceCheckTest(test, sourceCode));
		}
	}

	const assembleTests = tests.filter(
		(t): t is AssembleTest => t.type === "assemble",
	);
	const runtimeTests = tests.filter(
		(t) => t.type !== "assemble" && t.type !== "source-check",
	);

	// ---- 2. start the shared test emulator ----------------------------
	let machine: TestMachine | null = null;
	let machineError: string | null = null;
	if (assembleTests.length > 0 || runtimeTests.length > 0) {
		progress("Starting the practice-check emulator…");
		try {
			machine = await getTestMachine();
		} catch (error) {
			console.error("Check My Work: emulator failed to start", error);
			machineError =
				"The practice checks could not start in this browser. " +
				"Reload the page and try again; your code is unaffected.";
		}
	}

	// ---- 3. assemble the student code as-is ---------------------------
	// The source of truth for the assemble test, and the gate for all
	// runtime tests.
	let assembleOutcome: AssembleOutcome | null = null;
	// which program is currently loaded in the machine's file system
	let loadedSource: string | null = null;
	if (machine) {
		progress("Assembling your code…");
		assembleOutcome = await machine.assemble(sourceCode, ASSEMBLE_TIMEOUT_MS);
		if (assembleOutcome.ok) loadedSource = sourceCode;
	}

	for (const test of assembleTests) {
		if (machineError || !assembleOutcome) {
			results.set(
				test.id,
				finish(test, "blocked", { message: machineError ?? "" }),
			);
		} else {
			results.set(test.id, evaluateAssemble(test, assembleOutcome));
		}
	}

	// ---- 4. runtime tests, in configuration order ---------------------
	const assembleOk = assembleOutcome?.ok ?? false;
	let runIndex = 0;
	for (const test of runtimeTests) {
		runIndex++;
		if (machineError || !machine) {
			results.set(
				test.id,
				finish(test, "blocked", { message: machineError ?? "" }),
			);
			continue;
		}
		if (!assembleOk) {
			const details =
				assembleTests.length > 0
					? ["See the assemble check for the error details."]
					: assembleDetails(assembleOutcome);
			results.set(
				test.id,
				finish(test, "blocked", {
					message: MESSAGES.blockedByAssemble,
					details,
				}),
			);
			continue;
		}
		progress(
			`Running check ${runIndex} of ${runtimeTests.length}: ${test.name}…`,
		);
		try {
			let result: AssignmentSingleTestResult;
			switch (test.type) {
				case "stdout": {
					const r = await runStdoutTest(machine, sourceCode, test, loadedSource);
					loadedSource = r.loadedSource;
					result = r.result;
					break;
				}
				case "procedure-register": {
					const r = await runProcedureTest(
						machine,
						sourceCode,
						test,
						{
							procedure: test.procedure,
							setupRegisters: test.setupRegisters,
							memorySetup: test.memorySetup,
						},
						(sentinels) => evaluateRegisterTest(test, sentinels),
					);
					loadedSource = r.loadedSource;
					result = r.result;
					break;
				}
				case "procedure-memory": {
					const r = await runProcedureTest(
						machine,
						sourceCode,
						test,
						{
							procedure: test.procedure,
							setupRegisters: test.setupRegisters,
							memorySetup: test.memorySetup,
							expectedMemory: test.expectedMemory,
						},
						(sentinels) => evaluateMemoryTest(test, sentinels),
					);
					loadedSource = r.loadedSource;
					result = r.result;
					break;
				}
				case "abi-preservation": {
					const presetRegisters: HarnessRequest["presetRegisters"] = {};
					for (const { register, expected } of abiExpectations(test)) {
						presetRegisters[register] = expected;
					}
					const r = await runProcedureTest(
						machine,
						sourceCode,
						test,
						{
							procedure: test.procedure,
							setupRegisters: test.setupRegisters,
							presetRegisters,
							memorySetup: test.memorySetup,
						},
						(sentinels) => evaluateAbiTest(test, sentinels),
					);
					loadedSource = r.loadedSource;
					result = r.result;
					break;
				}
				default:
					result = finish(test as AssignmentTest, "blocked", {
						message:
							"This check uses a test type this app does not support yet. " +
							"Please tell your instructor.",
					});
			}
			results.set((test as AssignmentTest).id, result);
		} catch (error) {
			console.error("Check My Work: test crashed", test.id, error);
			results.set(
				test.id,
				finish(test, "blocked", {
					message:
						"This check could not run because of an unexpected problem " +
						"in the check itself (not in your code). Please tell your " +
						`instructor. (${(error as Error).message})`,
				}),
			);
		}
	}

	// ---- 5. build the report in configuration order -------------------
	const ordered = tests
		.map((t) => results.get(t.id))
		.filter((r): r is AssignmentSingleTestResult => Boolean(r));
	const passed = ordered.filter((r) => r.status === "passed").length;
	const failed = ordered.filter((r) => r.status === "failed").length;
	const blocked = ordered.filter((r) => r.status === "blocked").length;
	return {
		assignmentId: assignment.id,
		assignmentTitle: assignment.title,
		passed,
		failed,
		blocked,
		total: ordered.length,
		pointsEarned: ordered.reduce((sum, r) => sum + (r.pointsEarned ?? 0), 0),
		pointsPossible: ordered.reduce(
			(sum, r) => sum + (r.pointsPossible ?? 0),
			0,
		),
		results: ordered,
		timestamp: new Date().toISOString(),
		sourceSha256,
		reminders: personalizationReminders(sourceCode, assignment),
	};
}

// ======================================================================
// helpers
// ======================================================================

function finish(
	test: AssignmentTest,
	status: TestStatus,
	fields: Partial<AssignmentSingleTestResult>,
): AssignmentSingleTestResult {
	return {
		id: test.id,
		name: test.name,
		type: test.type,
		status,
		pointsPossible: test.points,
		pointsEarned:
			test.points === undefined ? undefined : status === "passed" ? test.points : 0,
		message: "",
		// hints explain how to fix a failure; blocked tests have a
		// different problem, so a hint would only mislead
		hint: status === "failed" ? test.hint : undefined,
		...fields,
	};
}

function truncate(text: string, max = MAX_SHOWN_OUTPUT): string {
	if (text.length <= max) return text;
	return `${text.slice(0, max)}\n… (output shortened)`;
}

function assembleDetails(outcome: AssembleOutcome | null): string[] {
	if (!outcome) return [];
	const details: string[] = [];
	for (const diagnostic of outcome.diagnostics.slice(0, 8)) {
		details.push(`Line ${diagnostic.line}: ${diagnostic.error}`);
	}
	if (outcome.logs) {
		details.push("Assembler output:");
		details.push(truncate(outcome.logs, 1500));
	}
	return details;
}

function evaluateAssemble(
	test: AssembleTest,
	outcome: AssembleOutcome,
): AssignmentSingleTestResult {
	if (outcome.timedOut) {
		return finish(test, "failed", {
			message:
				"The assembler took too long. Check for extremely long code or " +
				"a runaway macro, then try again.",
		});
	}
	if (outcome.ok) {
		return finish(test, "passed", {
			message: "Your code assembled with no errors.",
		});
	}
	return finish(test, "failed", {
		message: MESSAGES.assembleFailedHeading,
		details: assembleDetails(outcome),
	});
}

async function ensureLoaded(
	machine: TestMachine,
	source: string,
	loadedSource: string | null,
): Promise<{ outcome: AssembleOutcome | null; loadedSource: string | null }> {
	if (loadedSource === source) {
		return { outcome: null, loadedSource };
	}
	const outcome = await machine.assemble(source, ASSEMBLE_TIMEOUT_MS);
	return { outcome, loadedSource: outcome.ok ? source : null };
}

// ---------------------------------------------------------------- stdout

async function runStdoutTest(
	machine: TestMachine,
	sourceCode: string,
	test: StdoutTest,
	previousLoaded: string | null,
): Promise<{ result: AssignmentSingleTestResult; loadedSource: string | null }> {
	// the student program may have been replaced by a harness program
	const { outcome, loadedSource } = await ensureLoaded(
		machine,
		sourceCode,
		previousLoaded,
	);
	if (outcome && !outcome.ok) {
		return {
			result: finish(test, "blocked", {
				message: MESSAGES.blockedByAssemble,
				details: assembleDetails(outcome),
			}),
			loadedSource,
		};
	}

	const run = await machine.runLoaded(
		test.stdin,
		test.timeoutMs ?? DEFAULT_RUN_TIMEOUT_MS,
	);
	const actual = run.stdout;

	if (run.timedOut) {
		return {
			result: finish(test, "failed", {
				message: MESSAGES.timeout,
				actual: truncate(actual),
			}),
			loadedSource,
		};
	}
	if (run.ranOutOfInput) {
		return {
			result: finish(test, "failed", {
				message:
					"The program asked for more input than this test provides. " +
					"Check how many times your program reads from the keyboard.",
				actual: truncate(actual),
			}),
			loadedSource,
		};
	}
	if (run.crashed) {
		return {
			result: finish(test, "failed", {
				message: "The program crashed before finishing.",
				details: [run.stopDetails],
				expected: test.expectedStdout,
				actual: truncate(actual),
			}),
			loadedSource,
		};
	}
	if (test.expectedExitCode !== undefined && run.exitCode !== test.expectedExitCode) {
		return {
			result: finish(test, "failed", {
				message: `Expected exit status ${test.expectedExitCode}; received ${run.exitCode ?? "no exit status"}. Finish with the course exit macro.`,
				actual: truncate(actual),
			}),
			loadedSource,
		};
	}
	if (test.messageLines) {
		const problem = checkMessageLines(actual, test.messageLines);
		return {
			result: finish(test, problem ? "failed" : "passed", {
				message: problem ?? "Your program ran successfully and printed two message lines. Review personalization and the manual checklist before submitting.",
				actual: truncate(actual),
			}),
			loadedSource,
		};
	}
	if (test.expectedStdout === undefined) {
		throw new Error("A stdout check needs expectedStdout or messageLines.");
	}

	const mode = test.compareMode ?? "normalized";
	if (compareStdout(test.expectedStdout, actual, mode)) {
		return {
			result: finish(test, "passed", {
				message: "The program printed the expected output.",
			}),
			loadedSource,
		};
	}
	const details: string[] = [];
	if (mode !== "exact") {
		details.push(
			"(Line endings and surrounding blank space are ignored in this comparison.)",
		);
	}
	return {
		result: finish(test, "failed", {
			message: "The program's output did not match the expected output.",
			expected: test.expectedStdout,
			actual: truncate(actual),
			details,
		}),
		loadedSource,
	};
}

// ------------------------------------------------------------ procedures

async function runProcedureTest(
	machine: TestMachine,
	sourceCode: string,
	test: ProcedureRegisterTest | ProcedureMemoryTest | AbiPreservationTest,
	request: HarnessRequest,
	evaluate: (
		sentinels: Map<string, bigint>,
	) => AssignmentSingleTestResult,
): Promise<{ result: AssignmentSingleTestResult; loadedSource: string | null }> {
	if (!hasLabel(sourceCode, test.procedure)) {
		return {
			result: finish(test, "blocked", {
				message:
					`This check needs the procedure \`${test.procedure}\`, which was ` +
					`not found in your code. Add the \`${test.procedure}:\` label ` +
					"(or restore its original name), then run the checks again.",
			}),
			loadedSource: null,
		};
	}

	const built = buildProcedureHarness(sourceCode, request);
	if (built.ok === false) {
		return {
			result: finish(test, "blocked", {
				message: built.blocked
					? built.reason
					: "This check could not run because of a problem in the " +
						"assignment configuration (not in your code). Please tell " +
						`your instructor. (${built.reason})`,
			}),
			loadedSource: null,
		};
	}

	const { outcome, loadedSource } = await ensureLoaded(
		machine,
		built.source,
		null, // harness source is unique per test; always assemble
	);
	if (outcome && !outcome.ok) {
		return {
			result: finish(test, "blocked", {
				message:
					"Your code assembles on its own, but the practice check could " +
					"not be prepared for it. This can happen when a file defines " +
					"names the checks also use, or has stray code outside the " +
					"required procedure.",
				details: assembleDetails(outcome),
			}),
			loadedSource,
		};
	}

	const run = await machine.runLoaded(
		undefined,
		test.timeoutMs ?? DEFAULT_RUN_TIMEOUT_MS,
	);

	const failWith = (
		fields: Partial<AssignmentSingleTestResult>,
	): { result: AssignmentSingleTestResult; loadedSource: string | null } => {
		const studentOutput = stripSentinelLines(run.stdout);
		const details = [...(fields.details ?? [])];
		if (studentOutput) {
			details.push("Output printed during this check:");
			details.push(truncate(studentOutput, 500));
		}
		return {
			result: finish(test, "failed", { ...fields, details }),
			loadedSource,
		};
	};

	if (run.timedOut) {
		return failWith({ message: MESSAGES.timeout });
	}
	if (run.ranOutOfInput) {
		return failWith({
			message:
				`Your procedure asked for user input. \`${test.procedure}\` should ` +
				"work only with the values passed in registers and must not read " +
				"from the keyboard.",
		});
	}
	if (run.crashed) {
		return failWith({
			message:
				"Your program crashed while running this check. A crash right " +
				"after your procedure often means the stack is unbalanced — a " +
				"push without a matching pop, or a missing ret.",
			details: [run.stopDetails],
		});
	}

	const sentinels = parseSentinels(run.stdout);
	if (!sawDoneMarker(run.stdout) || sentinels.size === 0) {
		return failWith({
			message:
				`Your procedure did not return control to this check. Make sure ` +
				`\`${test.procedure}\` ends with ret, does not exit the whole ` +
				"program, and does not jump outside the procedure.",
			details: run.stopDetails ? [run.stopDetails] : [],
		});
	}

	const evaluated = evaluate(sentinels);
	if (evaluated.status === "passed") {
		return { result: evaluated, loadedSource };
	}
	// attach any output the student's procedure printed, to help debugging
	const studentOutput = stripSentinelLines(run.stdout);
	if (studentOutput) {
		evaluated.details = [
			...(evaluated.details ?? []),
			"Output printed during this check:",
			truncate(studentOutput, 500),
		];
	}
	return { result: evaluated, loadedSource };
}

function evaluateRegisterTest(
	test: ProcedureRegisterTest,
	sentinels: Map<string, bigint>,
): AssignmentSingleTestResult {
	const mismatches = compareRegisters(test.expectedRegisters, sentinels);
	const setupLines = formatRegisterLines(test.setupRegisters);
	const calledWith =
		setupLines.length > 0 ? setupLines.join(", ") : "no register arguments";

	if (mismatches.length === 0) {
		return finish(test, "passed", {
			message: `Called ${test.procedure} with ${calledWith} — returned the expected result.`,
		});
	}

	const expectedLines = formatRegisterLines(test.expectedRegisters);
	const actualLines = Object.keys(test.expectedRegisters).map((register) => {
		const captured = sentinels.get(register.toUpperCase());
		return `${register} = ${captured === undefined ? "(not captured)" : formatU64(captured)}`;
	});
	return finish(test, "failed", {
		message:
			`This test called ${test.procedure} with:\n\n` +
			(setupLines.length > 0 ? setupLines.join("\n") : "(no register arguments)"),
		expected: expectedLines.join("\n"),
		actual: actualLines.join("\n"),
	});
}

function evaluateMemoryTest(
	test: ProcedureMemoryTest,
	sentinels: Map<string, bigint>,
): AssignmentSingleTestResult {
	const registerMismatches = test.expectedRegisters
		? compareRegisters(test.expectedRegisters, sentinels)
		: [];
	const memoryMismatches = test.expectedMemory.flatMap(
		(expectation, index) =>
			compareMemoryExpectation(index, expectation, sentinels),
	);

	const setupLines = formatRegisterLines(test.setupRegisters);
	if (registerMismatches.length === 0 && memoryMismatches.length === 0) {
		return finish(test, "passed", {
			message: "The memory contents after the call were exactly as expected.",
		});
	}

	// student-friendly expected/actual reconstruction
	const expectedParts: string[] = [];
	const actualParts: string[] = [];
	test.expectedMemory.forEach((expectation, index) => {
		expectedParts.push(
			`${expectation.label} = ${formatExpectedValues(expectation)}`,
		);
		const count = elementValues(expectation.kind, expectation.values).length;
		const bits = MEMORY_KINDS[expectation.kind].size * 8;
		const actualValues: string[] = [];
		for (let i = 0; i < count; i++) {
			const raw = sentinels.get(`MEM_${index}_${i}`);
			actualValues.push(
				raw === undefined
					? "?"
					: formatElement(expectation.kind, BigInt.asUintN(bits, raw)),
			);
		}
		actualParts.push(`${expectation.label} = [${actualValues.join(", ")}]`);
	});
	if (test.expectedRegisters) {
		expectedParts.push(...formatRegisterLines(test.expectedRegisters));
		for (const register of Object.keys(test.expectedRegisters)) {
			const captured = sentinels.get(register.toUpperCase());
			actualParts.push(
				`${register} = ${captured === undefined ? "(not captured)" : formatU64(captured)}`,
			);
		}
	}

	const details = memoryMismatches
		.slice(0, 12)
		.map(
			(m) =>
				`${m.label}[${m.index}]: expected ${formatElement(m.kind, m.expected)}, ` +
				`but found ${m.actual === null ? "nothing captured" : formatElement(m.kind, m.actual)}`,
		);

	return finish(test, "failed", {
		message:
			`This test called ${test.procedure} with:\n\n` +
			(setupLines.length > 0 ? setupLines.join("\n") : "(no register arguments)"),
		expected: expectedParts.join("\n"),
		actual: actualParts.join("\n"),
		details,
	});
}

function evaluateAbiTest(
	test: AbiPreservationTest,
	sentinels: Map<string, bigint>,
): AssignmentSingleTestResult {
	const expectations = abiExpectations(test);
	const violations = compareAbi(expectations, sentinels);
	if (violations.length === 0) {
		return finish(test, "passed", {
			message:
				"All callee-saved registers (and the stack pointer) were preserved.",
		});
	}
	return finish(test, "failed", {
		message: violations.map(describeAbiViolation).join("\n"),
		expected: expectations
			.map(({ register, expected }) => `${register} = ${formatU64(expected)}`)
			.join("\n"),
		actual: expectations
			.map(({ register }) => {
				const captured = sentinels.get(register.toUpperCase());
				return `${register} = ${captured === undefined ? "(not captured)" : formatU64(captured)}`;
			})
			.join("\n"),
	});
}

async function sha256Hex(text: string): Promise<string | undefined> {
	try {
		const data = new TextEncoder().encode(text);
		const digest = await crypto.subtle.digest("SHA-256", data);
		return Array.from(new Uint8Array(digest))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	} catch {
		return undefined;
	}
}
