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
}

const idleState: CheckRunState = {
	status: "idle",
	forAssignmentId: null,
	report: null,
	error: null,
	progressLabel: "",
};

export const checkRun = writable<CheckRunState>(idleState);

/** Run the selected assignment's checks against the current editor code. */
export async function startCheckMyWork(): Promise<void> {
	if (get(checkRun).status === "running") return;
	const assignment = get(selectedAssignment);
	if (!assignment) return;
	const source = blinkStore.getAppState().editorContent;

	checkRun.set({
		status: "running",
		forAssignmentId: assignment.id,
		report: null,
		error: null,
		progressLabel: "Preparing checks…",
	});
	try {
		const report = await runAssignmentTests(source, assignment, (label) => {
			checkRun.update((s) => ({ ...s, progressLabel: label }));
		});
		checkRun.set({
			status: "done",
			forAssignmentId: assignment.id,
			report,
			error: null,
			progressLabel: "",
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
		});
	}
}

export function dismissCheckResults(): void {
	checkRun.set(idleState);
}
