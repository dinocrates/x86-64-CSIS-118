import {
	type AppState,
	serializeAppState,
	deserializeAppState,
} from "./appState";

/**
 * Assignment-aware autosave.
 *
 * Each assignment saves to its own localStorage key so work on one
 * assignment never overwrites work on another:
 *
 *   csis118b.autosave.default                    (free practice)
 *   csis118b.autosave.unit02-register-arithmetic (per assignment)
 *
 * All storage access is wrapped in try/catch: localStorage can throw in
 * sandboxed Canvas iframes or private browsing modes, and autosave failure
 * must never crash the app.
 */

const KEY_PREFIX = "csis118b.autosave.";
const DEFAULT_KEY = `${KEY_PREFIX}default`;
/** Key used by the app before assignment-aware autosave existed. */
const LEGACY_KEY = "appstate";

export function autosaveKeyFor(assignmentId: string | null): string {
	return assignmentId ? `${KEY_PREFIX}${assignmentId}` : DEFAULT_KEY;
}

export function autosave_save(
	assignmentId: string | null,
	state: AppState,
): void {
	try {
		localStorage.setItem(autosaveKeyFor(assignmentId), serializeAppState(state));
	} catch (error) {
		console.error("Autosave failed:", error);
	}
}

export function autosave_load(assignmentId: string | null): AppState | null {
	try {
		const item = localStorage.getItem(autosaveKeyFor(assignmentId));
		if (item) {
			return deserializeAppState(item);
		}
		// Migration: the pre-assignment app stored everything under one
		// global key. Treat it as the "default" (free practice) save.
		if (!assignmentId) {
			const legacy = localStorage.getItem(LEGACY_KEY);
			if (legacy) {
				return deserializeAppState(legacy);
			}
		}
		return null;
	} catch (error) {
		console.error("Autosave read failed:", error);
		return null;
	}
}

export function autosave_clear(assignmentId: string | null): void {
	try {
		localStorage.removeItem(autosaveKeyFor(assignmentId));
	} catch (error) {
		console.error("Autosave clear failed:", error);
	}
}
