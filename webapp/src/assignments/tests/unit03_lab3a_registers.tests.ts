import type { AssignmentTest } from "../types";

export const unit03Lab3aRegistersTests: AssignmentTest[] = [
	{ id: "assemble", type: "assemble", name: "Code assembles and links successfully", visible: true,
		hint: "Run the starter first. Check NASM diagnostics, spelling, and the course include." },
	{ id: "binary-literal", type: "source-check", name: "Binary literal loaded into EAX: decimal 171", visible: true,
		requiredLiteralLoad: { register: "eax", prefix: "0b", decimalValue: 171 },
		hint: "Task 1 needs an active mov eax, <literal> using the 0b prefix, equal to decimal 171 (binary 10101011)." },
	{ id: "hex-literal", type: "source-check", name: "Hexadecimal literal loaded into EAX: decimal 50", visible: true,
		requiredLiteralLoad: { register: "eax", prefix: "0x", decimalValue: 50 },
		hint: "Task 2 needs an active mov eax, <literal> using the 0x prefix, equal to decimal 50 (hexadecimal 32)." },
	{ id: "octal-literal", type: "source-check", name: "Octal literal loaded into EAX: decimal 16", visible: true,
		requiredLiteralLoad: { register: "eax", prefix: "0o", decimalValue: 16 },
		hint: "Task 3 needs an active mov eax, <literal> using the 0o prefix, equal to decimal 16 (octal 20)." },
	{ id: "register-to-output", type: "source-check", name: "Register-to-output pattern: EAX copied to EDI, then print_uint", visible: true,
		requiredLabels: ["main"],
		requiredActivePatterns: ["mov\\s+edi\\s*,\\s*eax", "call\\s+print_uint"],
		bannedPatterns: ["call\\s+print_hex"],
		hint: "After loading EAX, copy it with mov edi, eax and call print_uint to print it in decimal. This assignment does not use print_hex." },
	{ id: "decimal-output", type: "stdout", name: "Prints 171, 50, and 16 in order, and exits normally", visible: true,
		expectedStdout: "171\n50\n16", compareMode: "trimmed", expectedExitCode: 0,
		hint: "Print exactly three decimal lines, in order: 171, then 50, then 16, with no extra text, then exit." },
];
