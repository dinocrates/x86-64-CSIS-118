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
	/**
	 * Omitted assignments retain the existing Unit 1 Canvas Text Entry
	 * workflow (share link + written responses). "file-upload" is Unit 02A's
	 * source+output file checklist. "source-text" is a narrower Canvas Text
	 * Entry variant for assignments whose Canvas submission is the complete,
	 * commented NASM source pasted as formatted code — no mandatory share
	 * link or written responses; the Share link remains available but is
	 * explicitly optional and does not replace the pasted source.
	 */
	submissionMode?: "file-upload" | "source-text";
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
	/** Shown under the manual completion checklist; names this assignment's own instructor review items. */
	manualReviewNote: string;
	/** Selectable, read-only sample code and expected output, shown in their own code-block UI. */
	codeExamples?: AssignmentCodeExample[];
	/** Student support links shown alongside the directions (e.g. a discussion board, course chat). */
	helpLinks?: { label: string; url: string }[];
}

/**
 * A single selectable code sample shown in the instructions dialog, with
 * optional sample input/output. Rendered read-only with NASM syntax
 * highlighting; never presented as an in-app "solution" button.
 */
export interface AssignmentCodeExample {
	title: string;
	code: string;
	/** Shown above `output` as what a student would type at each prompt. */
	sampleInput?: string;
	output?: string;
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
	/** Separate named db definitions; NASM data-label colons are optional. */
	requiredDataLabels?: string[];
	/** Separate named dd (DWORD) definitions; NASM data-label colons are optional. */
	requiredDwordVariables?: string[];
	/** Separate named dw (WORD) definitions (e.g. `num1: dw 0`); NASM data-label colons are optional. */
	requiredWordDataVariables?: string[];
	/** Separate named resw 1 (WORD) reservations; NASM data-label colons are optional. */
	requiredWordVariables?: string[];
	/** Opt-in lab organization check on student source before includes expand. */
	studentSectionCounts?: { data: number; text: number };
	/** Regex sources (or plain strings) that must NOT appear. Checked against de-commented source. */
	bannedPatterns?: string[];
	/**
	 * Regex sources (or plain strings) that must appear in the raw source.
	 * Use this only to require something inside a comment (e.g. a header
	 * line) — a commented-out example also satisfies this check.
	 */
	requiredPatterns?: string[];
	/**
	 * Regex sources (or plain strings) that must appear in active code.
	 * Checked against de-commented source, so a commented-out example does
	 * NOT satisfy this check. Prefer this over requiredPatterns whenever the
	 * check is about what the program actually does.
	 */
	requiredActivePatterns?: string[];
	/**
	 * An active `mov <register>, <prefix><digits>` literal load whose parsed
	 * numeric value equals `decimalValue`. Checked against de-commented
	 * source; accepts any capitalization and NASM underscore digit
	 * separators (e.g. 0b1010_1011). A commented-out example does not count.
	 */
	requiredLiteralLoad?: { register: string; prefix: "0b" | "0x" | "0o"; decimalValue: number };
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
	/** Personalized Title/Year/Director records, separated by blank lines. */
	movieRecords?: { count: number };
	/**
	 * Locates exactly one `Sum: <value>` line, then a `Reverse order:`
	 * heading immediately followed by exactly four decimal-value lines, and
	 * compares them to `sum`/`reverse`. Everything before the Sum: line
	 * (prompts, echoed input) is ignored and its wording is unconstrained;
	 * a missing or duplicated Sum: line, a missing/misplaced Reverse order:
	 * heading, extra or missing reversed values, or trailing output after
	 * them all fail. Values compare as exact unsigned decimal integers.
	 */
	sumAndReverse?: { sum: number; reverse: [number, number, number, number] };
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
