import { writable } from "svelte/store";

/**
 * Maps NASM source lines to the final linked addresses of the instructions
 * they generate, using a NASM listing file (`-l`).
 *
 * NASM's listing marks every line that came from a %include or macro
 * expansion with a `<N>` depth tag; lines from the top-level file (the
 * student's own assembly.s) have no tag. We only keep untagged lines, so a
 * lookup that lands inside library code (e.g. mid-`exit_program`) naturally
 * resolves to the student's own call-site line instead.
 *
 * The listing's offsets are relative to the start of the (single) .text
 * section in the object file, not final linked addresses. We don't parse
 * the linked ELF to find .text's base - instead we anchor on `_start`
 * (provided by csis118b.inc, so always present and always immediately
 * followed by a real instruction): its listing offset, compared against
 * the real runtime entry address blink reports after starti(), gives the
 * constant offset to apply to every other listing offset.
 */

export interface SourceMapEntry {
	line: number;
	addr: number;
}

export function parseNasmListing(listing: string): { line: number; offset: number }[] {
	const perLine = new Map<number, number>();
	const lineRe = /^\s*(\d+)\s+([0-9A-Fa-f]{6,8})\b/;
	for (const raw of listing.split(/\r?\n/)) {
		if (/<\d+>/.test(raw)) continue; // from a %include or macro expansion
		const m = raw.match(lineRe);
		if (!m) continue;
		const line = Number.parseInt(m[1], 10);
		const offset = Number.parseInt(m[2], 16);
		const prev = perLine.get(line);
		if (prev === undefined || offset < prev) perLine.set(line, offset);
	}
	return [...perLine.entries()].map(([line, offset]) => ({ line, offset }));
}

/** Finds the listing offset of the instruction right after the `_start:` label. */
export function findEntryPointOffset(listing: string): number | null {
	const lines = listing.split(/\r?\n/);
	let seenLabel = false;
	const offsetRe = /^\s*\d+\s+([0-9A-Fa-f]{6,8})\b/;
	for (const raw of lines) {
		if (!seenLabel) {
			if (/\b_start:/.test(raw)) seenLabel = true;
			continue;
		}
		const m = raw.match(offsetRe);
		if (m) return Number.parseInt(m[1], 16);
	}
	return null;
}

export class DebugSourceMap {
	// sorted ascending by addr
	#entries: SourceMapEntry[];

	constructor(entries: SourceMapEntry[]) {
		this.#entries = [...entries].sort((a, b) => a.addr - b.addr);
	}

	/** Nearest line at or before `addr` - so addresses inside library calls
	 * resolve to the student line that called into them. */
	lineForAddress(addr: number): number | null {
		let lo = 0;
		let hi = this.#entries.length - 1;
		let ans = -1;
		while (lo <= hi) {
			const mid = (lo + hi) >> 1;
			if (this.#entries[mid].addr <= addr) {
				ans = mid;
				lo = mid + 1;
			} else {
				hi = mid - 1;
			}
		}
		return ans === -1 ? null : this.#entries[ans].line;
	}

	addressForLine(line: number): number | null {
		const found = this.#entries.find((e) => e.line === line);
		return found ? found.addr : null;
	}
}

/** The source map for the program currently loaded for debugging, or null
 * if unavailable (non-NASM mode, or the listing build failed). */
export const debugSourceMap = writable<DebugSourceMap | null>(null);
