/**
 * x86-64 GPR sub-register naming, per the real ISA encoding rules:
 * - rax/rbx/rcx/rdx have an addressable high byte (ah/bh/ch/dh).
 * - rsp/rbp/rsi/rdi and r8-r15 do not: their bits 15-8 aren't
 *   individually addressable in 64-bit mode.
 */
export type RegisterFamily = {
	d: string;
	w: string;
	hi8: string | null;
	lo8: string;
};

export const REGISTER_FAMILIES: Record<string, RegisterFamily> = {
	rax: { d: "eax", w: "ax", hi8: "ah", lo8: "al" },
	rbx: { d: "ebx", w: "bx", hi8: "bh", lo8: "bl" },
	rcx: { d: "ecx", w: "cx", hi8: "ch", lo8: "cl" },
	rdx: { d: "edx", w: "dx", hi8: "dh", lo8: "dl" },
	rsp: { d: "esp", w: "sp", hi8: null, lo8: "spl" },
	rbp: { d: "ebp", w: "bp", hi8: null, lo8: "bpl" },
	rsi: { d: "esi", w: "si", hi8: null, lo8: "sil" },
	rdi: { d: "edi", w: "di", hi8: null, lo8: "dil" },
	r8: { d: "r8d", w: "r8w", hi8: null, lo8: "r8b" },
	r9: { d: "r9d", w: "r9w", hi8: null, lo8: "r9b" },
	r10: { d: "r10d", w: "r10w", hi8: null, lo8: "r10b" },
	r11: { d: "r11d", w: "r11w", hi8: null, lo8: "r11b" },
	r12: { d: "r12d", w: "r12w", hi8: null, lo8: "r12b" },
	r13: { d: "r13d", w: "r13w", hi8: null, lo8: "r13b" },
	r14: { d: "r14d", w: "r14w", hi8: null, lo8: "r14b" },
	r15: { d: "r15d", w: "r15w", hi8: null, lo8: "r15b" },
};

export type NumberBase = "hex" | "dec" | "oct" | "bin";

export const NUMBER_BASES: { id: NumberBase; label: string }[] = [
	{ id: "hex", label: "HEX" },
	{ id: "dec", label: "DEC" },
	{ id: "oct", label: "OCT" },
	{ id: "bin", label: "BIN" },
];

/** Format a value known to fit in `bits` bits, in the given base. */
export function formatValue(value: bigint, bits: number, base: NumberBase): string {
	const mask = (1n << BigInt(bits)) - 1n;
	const v = value & mask;
	switch (base) {
		case "hex":
			return `0x${v.toString(16).padStart(Math.ceil(bits / 4), "0")}`;
		case "dec":
			return v.toString(10);
		case "oct":
			return `0o${v.toString(8)}`;
		case "bin":
			return v
				.toString(2)
				.padStart(bits, "0")
				.replace(/(.{4})(?=.)/g, "$1 ");
	}
}
