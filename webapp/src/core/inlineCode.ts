/**
 * Minimal inline-code rendering for assignment instruction prose.
 *
 * Instruction text is a trusted, developer-authored constant (never student
 * or network input), so turning backtick-delimited spans into `<code>` pills
 * via {@html} is safe here. Everything else is HTML-escaped first.
 */

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

/** Render `` `code` `` spans in plain instruction text as inline code pills. */
export function renderInline(text: string): string {
	return escapeHtml(text).replace(
		/`([^`]+)`/g,
		'<code class="code-pill">$1</code>',
	);
}
