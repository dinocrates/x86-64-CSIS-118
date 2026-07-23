/**
 * Deep-link helpers for the ?assignment=<id> URL parameter.
 *
 * Canvas assignments embed the playground with an assignment-specific URL:
 *   https://.../index.html?assignment=unit02-register-arithmetic
 * so the correct starter code and Check My Work tests open automatically.
 */

export function getAssignmentIdFromUrl(): string | null {
	const params = new URLSearchParams(window.location.search);
	return params.get("assignment");
}

/**
 * Reflect the selected assignment in the URL without reloading and
 * without spamming browser history (replaceState, not pushState).
 * Pass null to remove the parameter (free practice mode).
 */
export function setAssignmentIdInUrl(assignmentId: string | null): void {
	try {
		const url = new URL(window.location.href);
		if (assignmentId) {
			url.searchParams.set("assignment", assignmentId);
		} else {
			url.searchParams.delete("assignment");
		}
		window.history.replaceState({}, "", url.toString());
	} catch (error) {
		// e.g. a sandboxed iframe that blocks history access —
		// the app keeps working, only the URL is not updated.
		console.error("Could not update the assignment URL:", error);
	}
}
