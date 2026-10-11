/**
 * Assignment configuration model for CSIS-118B.
 *
 * An AssignmentConfig describes one Canvas assignment: its starter code
 * and the visible "Check My Work" tests students can run in the browser.
 *
 * The `id` must be stable — it is used for URL deep links
 * (?assignment=<id>), autosave keys, download filenames, and test reports.
 */

export interface AssignmentConfig {
	id: string;
	title: string;
	unit: string;
	description: string;
	starterCode: string;
	tests: AssignmentTest[];
	instructions?: AssignmentInstructions;
	/** Advisory source reminders only; never execution checks or grades. */
	personalizationReminders?: { pattern: string; message: string }[];
}

export interface AssignmentInstructions {
	points: number;
	objectives: string[];
	steps: { title: string; items: string[] }[];
	submission: string[];
	rubric: { criterion: string; points: number; description: string }[];
	completionChecklist: string[];
}

/** The x86-64 general purpose registers a test can set up or inspect. */
export type X64Register =
	| "rax"
	| "rbx"
	| "rcx"
	| "rdx"
	| "rsi"
	| "rdi"
	| "rbp"
	| "rsp"
	| "r8"
	| "r9"
	| "r10"
	| "r11"
	| "r12"
	| "r13"
	| "r14"
	| "r15";

/**
 * Fields shared by every test type.
 *
 * `points` is optional and only used to show progress — the UI must never
 * present it as an official grade.
 * `visible` should normally be true; tests with visible=false are ignored
 * by the browser runner (they are reserved for a future instructor-side
 * grader, since nothing in a static site can be kept secret).
 */
export interface BaseTest {
	id: string;
	name: string;
	points?: number;
	visible: boolean;
	hint?: string;
	/** Per-test runtime limit in milliseconds. Defaults to the runner's limit. */
	timeoutMs?: number;
}

/** Passes if the student code assembles successfully on its own. */
export interface AssembleTest extends BaseTest {
	type: "assemble";
}

/**
 * Static checks against the source text.
 * Use sparingly — prefer checks that catch renamed labels or banned
 * instructions, not checks that reject valid alternate solutions.
 */
export interface SourceCheckTest extends BaseTest {
	type: "source-check";
	/** Labels that must be defined, e.g. ["add_numbers"]. */
	requiredLabels?: string[];
	/** Regex sources (or plain strings) that must NOT appear. */
	bannedPatterns?: string[];
	/** Regex sources (or plain strings) that must appear. */
	requiredPatterns?: string[];
}

/** Runs the full student program and compares captured stdout. */
export interface StdoutTest extends BaseTest {
	type: "stdout";
	/**
	 * Input fed to the program, one line per read — exactly as if the
	 * student typed each line into the terminal input box.
	 */
	stdin?: string;
	expectedStdout?: string;
	compareMode?: "exact" | "trimmed" | "normalized";
	/** Alternative to a fixed output string, for personalized full programs. */
	messageLines?: { count: number; identifyingPrefix: string };
	expectedExitCode?: number;
}

/**
 * Calls a student procedure with given register values and checks
 * register values after it returns. This is the primary test type
 * for procedure-contract assignments.
 */
export interface ProcedureRegisterTest extends BaseTest {
	type: "procedure-register";
	procedure: string;
	/**
	 * Registers to initialize before the call. Values can be numbers,
	 * numeric strings ("-8", "0x1F"), or "&label" to pass the address
	 * of a memory fixture declared in `memorySetup`.
	 */
	setupRegisters: Partial<Record<X64Register, string | number>>;
	expectedRegisters: Partial<Record<X64Register, string | number>>;
	/** Optional data fixtures, so "&label" register values can resolve. */
	memorySetup?: MemoryFixture[];
}

/** Calls a student procedure and checks memory contents after it returns. */
export interface ProcedureMemoryTest extends BaseTest {
	type: "procedure-memory";
	procedure: string;
	setupRegisters: Partial<Record<X64Register, string | number>>;
	memorySetup: MemoryFixture[];
	expectedMemory: MemoryExpectation[];
	/** Optionally also check registers after the call (e.g. a count in rax). */
	expectedRegisters?: Partial<Record<X64Register, string | number>>;
}

export type MemoryKind =
	| "byte-array"
	| "word-array"
	| "dword-array"
	| "qword-array"
	| "string";

/**
 * Known data generated in the test program's .data section.
 * Reference its address from setupRegisters with "&<label>".
 * For kind "string", `values` is the string content; a null terminator
 * is appended automatically.
 */
export interface MemoryFixture {
	label: string;
	kind: MemoryKind;
	values: number[] | string;
}

/**
 * Expected memory contents after the procedure returns.
 * For kind "string" the comparison covers the string's characters
 * (the trailing null terminator is not compared).
 */
export interface MemoryExpectation {
	label: string;
	kind: MemoryKind;
	values: number[] | string;
}

/**
 * Verifies that callee-saved registers survive a call to the student
 * procedure, per the System V AMD64 ABI.
 */
export interface AbiPreservationTest extends BaseTest {
	type: "abi-preservation";
	procedure: string;
	setupRegisters?: Partial<Record<X64Register, string | number>>;
	/** Defaults to DEFAULT_PRESERVED_REGISTERS. */
	preservedRegisters?: X64Register[];
	/** Optional data fixtures, so "&label" register values can resolve. */
	memorySetup?: MemoryFixture[];
}

/** Callee-saved registers under the System V AMD64 ABI. */
export const DEFAULT_PRESERVED_REGISTERS: X64Register[] = [
	"rbx",
	"rbp",
	"r12",
	"r13",
	"r14",
	"r15",
];

export type AssignmentTest =
	| AssembleTest
	| SourceCheckTest
	| StdoutTest
	| ProcedureRegisterTest
	| ProcedureMemoryTest
	| AbiPreservationTest;
