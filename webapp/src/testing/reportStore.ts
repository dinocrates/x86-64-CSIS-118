import { get, writable } from "svelte/store";
import { blinkStore, selectedAssignment } from "../core/store";
import { runAssignmentTests } from "./AssignmentTestRunner";
import type { AssignmentTestReport } from "./TestResultTypes";

/**
 * UI state for Check My Work runs, consumed by CheckMyWorkButton and
 * TestResultsPanel.
 */

export interface CheckRunState {
	status: "idle" | "running" | "done" | "error";
	/** which assignment this run belongs to */
	forAssignmentId: string | null;
	report: AssignmentTestReport | null;
	error: string | null;
	progressLabel: string;
	stale: boolean;
}

const idleState: CheckRunState = {
	status: "idle",
	forAssignmentId: null,
	report: null,
	error: null,
	progressLabel: "",
	stale: false,
};

export const checkRun = writable<CheckRunState>(idleState);

// Version the source AND context so editing and then undoing, or switching
// away and back during a run, cannot revive an obsolete success.
let revision = 0;
let previous = blinkStore.getAppState();
blinkStore.subscribe(() => {
	const current = blinkStore.getAppState();
	if (current.editorContent !== previous.editorContent || current.assignmentId !== previous.assignmentId) {
		revision++;
		checkRun.update((s) => s.status === "idle" ? s : { ...s, stale: true, report: null });
	}
	previous = current;
});

/** Run the selected assignment's checks against the current editor code. */
export async function startCheckMyWork(): Promise<void> {
	if (get(checkRun).status === "running") return;
	const assignment = get(selectedAssignment);
	if (!assignment) return;
	const source = blinkStore.getAppState().editorContent;
	const startedRevision = revision;

	checkRun.set({
		status: "running",
		forAssignmentId: assignment.id,
		report: null,
		error: null,
		progressLabel: "Preparing checks…",
		stale: false,
	});
	try {
		const report = await runAssignmentTests(source, assignment, (label) => {
			checkRun.update((s) => ({ ...s, progressLabel: label }));
		});
		checkRun.set({
			status: "done",
			forAssignmentId: assignment.id,
			report: revision === startedRevision ? report : null,
			error: null,
			progressLabel: "",
			stale: revision !== startedRevision,
		});
	} catch (error) {
		console.error("Check My Work failed:", error);
		checkRun.set({
			status: "error",
			forAssignmentId: assignment.id,
			report: null,
			error:
				"Something went wrong while running the checks. Reload the page " +
				"and try again — your code is unaffected.",
			progressLabel: "",
			stale: revision !== startedRevision,
		});
	}
}

export function dismissCheckResults(): void {
	// Keep the run lock until the isolated emulator finishes, even if the
	// student switches assignments. Never run two programs in it at once.
	if (get(checkRun).status === "running") return;
	checkRun.set(idleState);
}
