import type { DiagnosticLine } from "../core/assemblers";
import { assemblers } from "../core/assemblers";
import { Blink } from "../core/blink";
import { stripTerminalPrompt } from "./stdoutCompare";

/**
 * A dedicated blink emulator instance for Check My Work.
 *
 * Tests run in their own emulator so the student's editor, debugger and
 * terminal state are never disturbed: the main app instance keeps its
 * loaded program, register view and terminal buffer while checks run.
 *
 * The instance is created lazily on the first check run and then reused.
 */

const INIT_TIMEOUT_MS = 60000;

export interface AssembleOutcome {
	ok: boolean;
	timedOut: boolean;
	/** captured assembler/linker stdout+stderr */
	logs: string;
	/** structured "line N: message" diagnostics, when NASM reported any */
	diagnostics: DiagnosticLine[];
}

export interface RunOutcome {
	stdout: string;
	exitCode: number | null;
	/** the program was stopped by a signal (SIGSEGV, SIGFPE, ...) */
	crashed: boolean;
	stopDetails: string;
	timedOut: boolean;
	/** the program asked for more stdin lines than the test provides */
	ranOutOfInput: boolean;
}

export class TestMachine {
	#blink: Blink;
	#stdout = "";
	#stateListeners = new Set<(state: string) => void>();

	constructor() {
		this.#blink = new Blink(
			assemblers.NASM_trunk,
			() => null,
			(charcode: number) => {
				this.#stdout += String.fromCharCode(charcode);
			},
			(charcode: number) => {
				this.#stdout += String.fromCharCode(charcode);
			},
			() => {},
			(state: string) => {
				for (const listener of [...this.#stateListeners]) {
					listener(state);
				}
			},
		);
	}

	#onState(listener: (state: string) => void): () => void {
		this.#stateListeners.add(listener);
		return () => this.#stateListeners.delete(listener);
	}

	/** Wait for the next state change matching pred. Resolves null on timeout. */
	#waitState(
		pred: (state: string) => boolean,
		timeoutMs: number,
	): Promise<string | null> {
		return new Promise((resolve) => {
			let timer: ReturnType<typeof setTimeout>;
			const off = this.#onState((state) => {
				if (pred(state)) {
					clearTimeout(timer);
					off();
					resolve(state);
				}
			});
			timer = setTimeout(() => {
				off();
				resolve(null);
			}, timeoutMs);
		});
	}

	/** Resolve once the emulator finished downloading and initializing. */
	async ensureReady(timeoutMs = INIT_TIMEOUT_MS): Promise<void> {
		const states = this.#blink.states;
		if (this.#blink.state !== states.NOT_READY) return;
		const got = await this.#waitState(
			(state) => state !== states.NOT_READY,
			timeoutMs,
		);
		if (got === null) {
			throw new Error("The test emulator did not start in time.");
		}
	}

	/**
	 * Assemble (and link) a program without running it.
	 * Ends in PROGRAM_LOADED on success, READY on failure.
	 */
	async assemble(source: string, timeoutMs: number): Promise<AssembleOutcome> {
		await this.ensureReady();
		const states = this.#blink.states;
		this.#stdout = "";
		const settled = this.#waitState(
			(state) =>
				state === states.PROGRAM_LOADED || state === states.READY,
			timeoutMs,
		);
		this.#blink.loadASM(source, { autorun: false });
		const got = await settled;
		const logs = this.#stdout.trim();
		if (got === null) {
			return { ok: false, timedOut: true, logs, diagnostics: [] };
		}
		return {
			ok: got === states.PROGRAM_LOADED,
			timedOut: false,
			logs,
			diagnostics: this.#blink.assembler_errors ?? [],
		};
	}

	/**
	 * Run the currently loaded program to completion, feeding it stdin one
	 * line per read (exactly like the interactive terminal input box).
	 */
	async runLoaded(
		stdinText: string | undefined,
		timeoutMs: number,
	): Promise<RunOutcome> {
		const states = this.#blink.states;
		const blink = this.#blink;
		this.#stdout = "";
		let ranOutOfInput = false;
		let timedOut = false;
		const lines = stdinText === undefined ? [] : stdinText.split("\n");

		const stopped = new Promise<void>((resolve) => {
			const off = this.#onState((state) => {
				if (state === states.PROGRAM_READLINE_PAUSE) {
					if (lines.length > 0) {
						blink.readLineEnter(lines.shift());
					} else {
						ranOutOfInput = true;
						blink.terminate(
							"The program asked for more input than this check provides.",
						);
					}
				} else if (state === states.PROGRAM_STOPPED) {
					off();
					resolve();
				}
			});
		});

		let timer: ReturnType<typeof setTimeout>;
		const timeout = new Promise<void>((resolve) => {
			timer = setTimeout(() => {
				timedOut = true;
				blink.terminate("The program ran too long and was stopped.");
				resolve();
			}, timeoutMs);
		});

		blink.run();
		await Promise.race([stopped, timeout]);
		clearTimeout(timer);
		if (timedOut && blink.state !== states.PROGRAM_STOPPED) {
			// give the terminate request a moment to take effect at the next
			// preemption point, then recover the machine either way
			await Promise.race([
				stopped,
				new Promise((resolve) => setTimeout(resolve, 3000)),
			]);
			// the state may have changed during the await
			if ((blink.state as string) !== states.PROGRAM_STOPPED) {
				blink.setready();
			}
		}

		const reason = blink.stopReason;
		const exitCode = reason ? reason.exitCode : null;
		const crashed =
			!timedOut &&
			!ranOutOfInput &&
			((reason?.loadFail ?? false) ||
				(exitCode !== null && exitCode >= 128));
		return {
			stdout: stripTerminalPrompt(this.#stdout),
			exitCode,
			crashed,
			stopDetails: reason?.details ?? "",
			timedOut,
			ranOutOfInput,
		};
	}
}

let machinePromise: Promise<TestMachine> | null = null;

/**
 * Get the shared test emulator, creating it on first use.
 * On failure the promise is reset so a later attempt can retry.
 */
export function getTestMachine(): Promise<TestMachine> {
	if (!machinePromise) {
		machinePromise = (async () => {
			const machine = new TestMachine();
			await machine.ensureReady();
			return machine;
		})().catch((error) => {
			machinePromise = null;
			throw error;
		});
	}
	return machinePromise;
}
