import { uri_serializeAppState } from "./appState";
import { blinkStore } from "./store";

/**
 * The Share link is also the assignment submission mechanism: it encodes
 * the exact code and assignment id, entirely client-side (gzip+base64 in
 * the URL, nothing sent to a server), so opening it reproduces exactly
 * what the student had. Set the Canvas assignment's submission type to
 * "Website URL" so students paste this link directly.
 *
 * Some browsers/servers cap URL length around 8192 characters, so very
 * large programs cannot be shared this way — classifyShareLinkLength
 * lets the UI fall back to suggesting the .asm download instead.
 */

/** Some platforms silently truncate or reject links this long. */
export const SHARE_LINK_DANGEROUS_LEN = 2048;
/** Beyond this, some browsers/servers cannot handle the URL at all. */
export const SHARE_LINK_MAX_LEN = 8100;

export type ShareLinkLengthStatus = "ok" | "long" | "too-long";

export function classifyShareLinkLength(len: number): ShareLinkLengthStatus {
	if (len >= SHARE_LINK_MAX_LEN) return "too-long";
	if (len >= SHARE_LINK_DANGEROUS_LEN) return "long";
	return "ok";
}

/** Build the current full share URL (code + mode + selected assignment). */
export function buildShareLink(): string {
	return uri_serializeAppState(blinkStore.getAppState(), true);
}
