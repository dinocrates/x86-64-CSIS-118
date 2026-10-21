import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const id = 'unit04-a01-sum-reverse';
const launch = `index.html?assignment=${id}`;
const editor = (page) => page.locator('.prism-code-editor textarea');
const results = (page) => page.getByRole('region', { name: 'Check My Work results' });

// Exact fixtures from the assignment spec. All eight are this assignment's
// visible stdout checks (there is no hidden/regression-only subset here).
const fixtures = [
  [10, 20, 300, 400, 730, [400, 300, 20, 10]],
  [0, 0, 0, 0, 0, [0, 0, 0, 0]],
  [1, 2, 65536, 70000, 135539, [70000, 65536, 2, 1]],
  [0, 0, 4294967295, 1, 4294967296, [1, 4294967295, 0, 0]],
  [65535, 65535, 4294967295, 4294967295, 8590065660, [4294967295, 4294967295, 65535, 65535]],
  [32768, 65535, 2147483648, 2147483649, 4295065600, [2147483649, 2147483648, 65535, 32768]],
  [65535, 1, 4000000000, 123456789, 4123522325, [123456789, 4000000000, 1, 65535]],
  [1, 1, 1, 1, 4, [1, 1, 1, 1]],
];

function expectedStdout(num1, num2, num3, num4, sum, reverse) {
  return (
    'Enter num1 (0-65535):\n' +
    'Enter num2 (0-65535):\n' +
    'Enter num3 (0-4294967295):\n' +
    'Enter num4 (0-4294967295):\n' +
    `Sum: ${sum}\n` +
    'Reverse order:\n' +
    reverse.map((v) => `${v}\n`).join('')
  );
}

// Complete arbitrary fixture exists only in tests, never in student content.
function completed(starter) {
  return starter
    .replace('Your Name', 'Alex Rivera')
    .replace('YYYY-MM-DD', '2026-10-21')
    .replace(
      '    prompt1: db "Enter num1 (0-65535):", 0 ; Prompt for the first value.\n' +
      '    echo_label: db "Starter value: ", 0 ; Label the temporary echo.\n' +
      '    ; TODO 1: Add prompts for the remaining three inputs.\n' +
      '    ; TODO 2: Add Sum: and Reverse order: strings.\n' +
      '    ; TODO 3: Add separate QWORD total storage if needed.',
      '    prompt1: db "Enter num1 (0-65535):", 0 ; Prompt for the first value.\n' +
      '    prompt2: db "Enter num2 (0-65535):", 0 ; Prompt for the second value.\n' +
      '    prompt3: db "Enter num3 (0-4294967295):", 0 ; Prompt for the third value.\n' +
      '    prompt4: db "Enter num4 (0-4294967295):", 0 ; Prompt for the fourth value.\n' +
      '    sum_text: db "Sum: ", 0          ; Label for the total.\n' +
      '    reverse_text: db "Reverse order:", 0 ; Heading for the reversed values.',
    )
    .replace(
      'main:                               ; Begin the student program.\n' +
      '    lea rdi, [rel prompt1]           ; Pass the prompt\'s address.\n' +
      '    call print_line                 ; Print the prompt and a newline.\n' +
      '    call read_int                   ; Read one decimal integer into RAX.\n' +
      '    mov word [rel num1], ax          ; Save the first input\'s low 16 bits immediately.\n' +
      '\n' +
      '    ; TODO 4: Read and store num2, num3, and num4 in order.\n' +
      '    ; TODO 5: Calculate and preserve the complete 64-bit sum.\n' +
      '    ; TODO 6: Replace the temporary echo with the required final output.\n' +
      '    ; TODO 7: Print num4, num3, num2, and num1 on separate lines.\n' +
      '\n' +
      '    lea rdi, [rel echo_label]        ; Pass the temporary echo label\'s address.\n' +
      '    call print_string               ; Print the label without a newline.\n' +
      '    movzx edi, word [rel num1]       ; Zero-extend the saved WORD for output.\n' +
      '    call print_uint                 ; Display the stored input.\n' +
      '    call print_newline              ; End the output line.\n' +
      '    exit                            ; Finish the program normally.',
      'main:                               ; Begin the student program.\n' +
      '    lea rdi, [rel prompt1]           ; Pass the first prompt\'s address.\n' +
      '    call print_line                 ; Print the first prompt with a newline.\n' +
      '    call read_int                   ; Read the first decimal integer into RAX.\n' +
      '    mov word [rel num1], ax          ; Store the first value\'s low 16 bits immediately.\n' +
      '\n' +
      '    lea rdi, [rel prompt2]           ; Pass the second prompt\'s address.\n' +
      '    call print_line                 ; Print the second prompt with a newline.\n' +
      '    call read_int                   ; Read the second decimal integer into RAX.\n' +
      '    mov word [rel num2], ax          ; Store the second value\'s low 16 bits immediately.\n' +
      '\n' +
      '    lea rdi, [rel prompt3]           ; Pass the third prompt\'s address.\n' +
      '    call print_line                 ; Print the third prompt with a newline.\n' +
      '    call read_int                   ; Read the third decimal integer into RAX.\n' +
      '    mov dword [rel num3], eax        ; Store the third value\'s low 32 bits immediately.\n' +
      '\n' +
      '    lea rdi, [rel prompt4]           ; Pass the fourth prompt\'s address.\n' +
      '    call print_line                 ; Print the fourth prompt with a newline.\n' +
      '    call read_int                   ; Read the fourth decimal integer into RAX.\n' +
      '    mov dword [rel num4], eax        ; Store the fourth value\'s low 32 bits immediately.\n' +
      '\n' +
      '    movzx rax, word [rel num1]       ; Start the 64-bit total from num1.\n' +
      '    movzx rcx, word [rel num2]       ; Widen num2 into a different register.\n' +
      '    add rax, rcx                     ; Add num2 into the running total.\n' +
      '    mov ecx, dword [rel num3]        ; Widen num3 into a different register.\n' +
      '    add rax, rcx                     ; Add num3 into the running total.\n' +
      '    mov ecx, dword [rel num4]        ; Widen num4 into a different register.\n' +
      '    add rax, rcx                     ; Add num4 into the running total.\n' +
      '    mov r12, rax                     ; Preserve the complete 64-bit total across library calls.\n' +
      '\n' +
      '    lea rdi, [rel sum_text]          ; Pass the Sum label\'s address.\n' +
      '    call print_string               ; Print the label.\n' +
      '    mov rdi, r12                     ; Pass the preserved total.\n' +
      '    call print_uint                 ; Display Sum.\n' +
      '    call print_newline              ; End the line.\n' +
      '\n' +
      '    lea rdi, [rel reverse_text]      ; Pass the Reverse order heading\'s address.\n' +
      '    call print_line                 ; Print the heading with a newline.\n' +
      '\n' +
      '    mov edi, dword [rel num4]        ; Reload num4 for reverse output.\n' +
      '    call print_uint                 ; Display num4.\n' +
      '    call print_newline              ; End the line.\n' +
      '\n' +
      '    mov edi, dword [rel num3]        ; Reload num3 for reverse output.\n' +
      '    call print_uint                 ; Display num3.\n' +
      '    call print_newline              ; End the line.\n' +
      '\n' +
      '    movzx edi, word [rel num2]       ; Reload num2 for reverse output.\n' +
      '    call print_uint                 ; Display num2.\n' +
      '    call print_newline              ; End the line.\n' +
      '\n' +
      '    movzx edi, word [rel num1]       ; Reload num1 for reverse output.\n' +
      '    call print_uint                 ; Display num1.\n' +
      '    call print_newline              ; End the line.\n' +
      '    exit                            ; Finish the program normally.',
    );
}

async function open(page, url = launch) {
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'compile', exact: true })).toBeEnabled();
}

async function report(page, source, timeoutMs) {
  return page.evaluate(async ({ source, timeoutMs }) => {
    const { runAssignmentTests } = await import('/x86-64-CSIS-118/src/testing/AssignmentTestRunner.ts');
    const { unit04A01SumReverseAssignment: assignment } = await import('/x86-64-CSIS-118/src/assignments/assignments.ts');
    const config = timeoutMs ? { ...assignment, tests: assignment.tests.map((test) => ({ ...test, timeoutMs })) } : assignment;
    return runAssignmentTests(source, config);
  }, { source, timeoutMs });
}

test.beforeEach(async ({ context }) => {
  await context.route('**/analytics.halb.it/**', (route) => route.fulfill({ body: '' }));
});

test('starter deep link selects Sum and Reverse in an empty autosave slot, echoes typed input via the real terminal for 0/42/65535, and reports unfinished requirements honestly', async ({ page }) => {
  await open(page);
  await expect(page.locator('#assignment-select')).toHaveValue(id);
  await expect(page.locator(`#assignment-select option[value="unit04-variables-basic-arithmetic"]`)).toHaveCount(1);
  const starter = await editor(page).inputValue();
  expect(starter).toMatch(/^; Name: Your Name\n/);
  expect(starter).not.toMatch(/^Sum:|^Reverse order:/m);
  expect(starter).not.toMatch(/mov\s+(?:word|dword)\s*\[\s*rel\s+num2\s*\]/i);

  for (const value of [0, 42, 65535]) {
    await page.getByRole('button', { name: 'compile', exact: true }).click();
    await expect(page.locator('.term__codewrap')).toContainText('Enter num1 (0-65535):');
    await page.locator('.stdin input[type=text]').fill(String(value));
    await page.getByRole('button', { name: 'submit', exact: true }).click();
    await expect(page.locator('.term__codewrap')).toContainText(`Starter value: ${value}`);
    await expect(page.locator('.term .exitcodeinfo')).toContainText('Exit(0)');
  }

  const checked = await report(page, starter);
  expect(checked.results.map((r) => r.status)).toEqual([
    'passed', 'passed', 'failed',
    'failed', 'failed', 'failed', 'failed', 'failed', 'failed', 'failed', 'failed',
  ]);
  expect(checked.reminders).toHaveLength(2);
  expect(checked.pointsPossible).toBe(0);
});

test('real runner accepts the completed reference across all eight fixtures, rejects hardcoded/truncated/mis-widened/reordered bugs, and recovers after timeout', async ({ page }) => {
  test.setTimeout(600000);
  await open(page);
  const starter = await editor(page).inputValue();
  const source = completed(starter);
  const good = await report(page, source);
  expect(good.passed, JSON.stringify(good)).toBe(11);
  expect(good.reminders).toEqual([]);

  // Confirm the real NASM/Blink runtime directly against every fixture row,
  // plus two varied, deterministic pairs not in the spec's public table
  // (guards against a solution that merely special-cases the known inputs).
  const extraFixtures = [
    [5000, 6000, 123456, 987654321, 987788777, [987654321, 123456, 6000, 5000]],
    [12345, 54321, 0, 4000000001, 4000066667, [4000000001, 0, 54321, 12345]],
  ];
  for (const [num1, num2, num3, num4, sum, reverse] of [...fixtures, ...extraFixtures]) {
    const run = await page.evaluate(async ({ source, stdin }) => {
      const { getTestMachine } = await import('/x86-64-CSIS-118/src/testing/testMachine.ts');
      const machine = await getTestMachine();
      await machine.assemble(source, 30000);
      return machine.runLoaded(stdin, 5000);
    }, { source, stdin: `${num1}\n${num2}\n${num3}\n${num4}` });
    expect(run.stdout, `${num1}/${num2}/${num3}/${num4}`).toBe(expectedStdout(num1, num2, num3, num4, sum, reverse));
    expect(run.exitCode).toBe(0);
  }

  // Hardcoded sample output: ignores the four inputs entirely.
  const hardcoded =
    '%include "csis118b.inc"\n' +
    'section .data\n' +
    '    prompt1: db "Enter num1 (0-65535):", 0\n' +
    '    out: db "Sum: 730", 10, "Reverse order:", 10, "400", 10, "300", 10, "20", 10, "10", 10, 0\n' +
    'section .bss\n    num1: resw 1\n    num2: resw 1\n    num3: resd 1\n    num4: resd 1\n' +
    'section .text\n    global main\nmain:\n' +
    '    lea rdi, [rel prompt1]\n    call print_line\n    call read_int\n    mov word [rel num1], ax\n' +
    '    lea rdi, [rel prompt1]\n    call print_line\n    call read_int\n    mov word [rel num2], ax\n' +
    '    lea rdi, [rel prompt1]\n    call print_line\n    call read_int\n    mov dword [rel num3], eax\n' +
    '    lea rdi, [rel prompt1]\n    call print_line\n    call read_int\n    mov dword [rel num4], eax\n' +
    '    lea rdi, [rel out]\n    call print_string\n    exit\n';
  const hardcodedResult = await report(page, hardcoded);
  expect(hardcodedResult.results.find((r) => r.id === 'sumreverse-10-20-300-400').status).toBe('passed');
  expect(hardcodedResult.results.find((r) => r.id === 'sumreverse-0-0-0-0').status).toBe('failed');

  // Deliberate 32-bit accumulation: a sum that crosses 32 bits wraps to 0.
  const accumulate32 = source.replace(
    '    movzx rax, word [rel num1]       ; Start the 64-bit total from num1.\n' +
    '    movzx rcx, word [rel num2]       ; Widen num2 into a different register.\n' +
    '    add rax, rcx                     ; Add num2 into the running total.\n' +
    '    mov ecx, dword [rel num3]        ; Widen num3 into a different register.\n' +
    '    add rax, rcx                     ; Add num3 into the running total.\n' +
    '    mov ecx, dword [rel num4]        ; Widen num4 into a different register.\n' +
    '    add rax, rcx                     ; Add num4 into the running total.\n' +
    '    mov r12, rax                     ; Preserve the complete 64-bit total across library calls.',
    '    movzx eax, word [rel num1]       ; Bug: 32-bit accumulator.\n' +
    '    movzx ecx, word [rel num2]       ; Bug: 32-bit register.\n' +
    '    add eax, ecx                     ; Bug: 32-bit add.\n' +
    '    add eax, dword [rel num3]        ; Bug: 32-bit add, can overflow.\n' +
    '    add eax, dword [rel num4]        ; Bug: 32-bit add, can overflow.\n' +
    '    mov r12d, eax                    ; Bug: only the low 32 bits are preserved.',
  ).replace('mov rdi, r12                     ; Pass the preserved total.', 'movzx rdi, r12d                  ; Bug: zero-extends the truncated 32-bit total.');
  const accumulate32Result = await report(page, accumulate32);
  expect(accumulate32Result.results.find((r) => r.id === 'sumreverse-10-20-300-400').status).toBe('passed');
  expect(accumulate32Result.results.find((r) => r.id === 'sumreverse-0-0-max-1').status).toBe('failed');

  // Signed DWORD extension: a high-bit DWORD input is sign-extended instead
  // of zero-extended, corrupting the 64-bit total.
  const signedDwordBug = source.replace(
    '    mov ecx, dword [rel num3]        ; Widen num3 into a different register.',
    '    movsxd rcx, dword [rel num3]     ; Bug: sign-extends an unsigned DWORD input.',
  );
  const signedDwordResult = await report(page, signedDwordBug);
  expect(signedDwordResult.results.find((r) => r.id === 'sumreverse-10-20-300-400').status).toBe('passed');
  expect(signedDwordResult.results.find((r) => r.id === 'sumreverse-high-bit-dwords').status).toBe('failed');

  // Truncated DWORD load: only num3's low 16 bits are added to the total.
  const truncatedLoadBug = source.replace(
    '    mov ecx, dword [rel num3]        ; Widen num3 into a different register.',
    '    movzx ecx, word [rel num3]       ; Bug: reads only num3\'s low 16 bits.',
  );
  const truncatedLoadResult = await report(page, truncatedLoadBug);
  expect(truncatedLoadResult.results.find((r) => r.id === 'sumreverse-10-20-300-400').status).toBe('passed');
  expect(truncatedLoadResult.results.find((r) => r.id === 'sumreverse-1-2-65536-70000').status).toBe('failed');

  // Wrong output order: prints num1, num2, num3, num4 instead of reversed.
  const wrongOrderBug = source
    .replace(
      '    mov edi, dword [rel num4]        ; Reload num4 for reverse output.\n' +
      '    call print_uint                 ; Display num4.\n' +
      '    call print_newline              ; End the line.\n' +
      '\n' +
      '    mov edi, dword [rel num3]        ; Reload num3 for reverse output.\n' +
      '    call print_uint                 ; Display num3.\n' +
      '    call print_newline              ; End the line.\n' +
      '\n' +
      '    movzx edi, word [rel num2]       ; Reload num2 for reverse output.\n' +
      '    call print_uint                 ; Display num2.\n' +
      '    call print_newline              ; End the line.\n' +
      '\n' +
      '    movzx edi, word [rel num1]       ; Reload num1 for reverse output.\n' +
      '    call print_uint                 ; Display num1.\n' +
      '    call print_newline              ; End the line.',
      '    movzx edi, word [rel num1]       ; Bug: prints in original order, not reversed.\n' +
      '    call print_uint                 ; Display num1.\n' +
      '    call print_newline              ; End the line.\n' +
      '\n' +
      '    movzx edi, word [rel num2]       ; Bug: prints in original order, not reversed.\n' +
      '    call print_uint                 ; Display num2.\n' +
      '    call print_newline              ; End the line.\n' +
      '\n' +
      '    mov edi, dword [rel num3]        ; Bug: prints in original order, not reversed.\n' +
      '    call print_uint                 ; Display num3.\n' +
      '    call print_newline              ; End the line.\n' +
      '\n' +
      '    mov edi, dword [rel num4]        ; Bug: prints in original order, not reversed.\n' +
      '    call print_uint                 ; Display num4.\n' +
      '    call print_newline              ; End the line.',
    );
  const wrongOrderResult = await report(page, wrongOrderBug);
  expect(wrongOrderResult.results.find((r) => r.id === 'sumreverse-1-1-1-1').status).toBe('passed');
  expect(wrongOrderResult.results.find((r) => r.id === 'sumreverse-10-20-300-400').status).toBe('failed');

  for (const [code, message] of [
    [source.replace('    exit                            ; Finish the program normally.', '    mov rdi, 7\n    call exit_program'), /exit status 0; received 7/],
    [source.replace('    exit                            ; Finish the program normally.', '    jmp $'), /ran too long/],
  ]) {
    const checked = await report(page, code, 800);
    const stdoutResult = checked.results.find((r) => r.id === 'sumreverse-10-20-300-400');
    expect(stdoutResult.status).toBe('failed');
    expect(stdoutResult.message).toMatch(message);
  }
  expect((await report(page, source)).passed).toBe(11);
});

test('a second valid implementation with different temporary registers is accepted', async ({ page }) => {
  await open(page);
  const starter = await editor(page).inputValue();
  const altSource = completed(starter)
    .replace(/\br12\b/g, 'r13')
    .replace(/\bmov ecx, dword \[rel num3\]/, 'mov edx, dword [rel num3]')
    .replace('add rax, rcx                     ; Add num3 into the running total.', 'add rax, rdx                     ; Add num3 into the running total.');
  const altResult = await report(page, altSource);
  expect(altResult.passed, JSON.stringify(altResult)).toBe(11);
});

test('source checks tolerate capitalization/spacing variants, reject commented-out or quoted fake declarations, and require the correct widths', async ({ page }) => {
  await open(page);
  const source = completed(await editor(page).inputValue());
  const variants = [
    [source, [true, true]],
    [
      source
        .replace('mov word [rel num1], ax          ; Store the first value\'s low 16 bits immediately.', 'MOV   WORD   [REL num1]  ,  AX')
        .replace('mov dword [rel num3], eax        ; Store the third value\'s low 32 bits immediately.', 'mov dword[rel num3],eax'),
      [true, true],
    ],
    [
      source.replace(
        '    num3: dd 0                      ; Store the third unsigned DWORD input.',
        '    ; num3: dd 0\n    num3: dw 0',
      ),
      [false, true],
    ],
  ];
  for (const [code, expected] of variants) {
    const statuses = await page.evaluate(async (source) => {
      const { runSourceCheckTest } = await import('/x86-64-CSIS-118/src/testing/sourceChecks.ts');
      const { unit04A01SumReverseAssignment } = await import('/x86-64-CSIS-118/src/assignments/assignments.ts');
      return unit04A01SumReverseAssignment.tests.filter((test) => test.type === 'source-check')
        .map((test) => runSourceCheckTest(test, source).status === 'passed');
    }, code);
    expect(statuses, code).toEqual(expected);
  }

  // A comment-only or quoted fake declaration never satisfies the check.
  const fakeDeclaration =
    '; num1: dw 0\n; num2: dw 0\n; num3: dd 0\n; num4: dd 0\n' +
    'section .data\n    note: db "num1: dw 0, num3: dd 0", 0\n';
  const fakeStatus = await page.evaluate(async (source) => {
    const { runSourceCheckTest } = await import('/x86-64-CSIS-118/src/testing/sourceChecks.ts');
    const { unit04A01SumReverseAssignment } = await import('/x86-64-CSIS-118/src/assignments/assignments.ts');
    const test = unit04A01SumReverseAssignment.tests.find((t) => t.id === 'variables-defined');
    return runSourceCheckTest(test, source).status;
  }, fakeDeclaration);
  expect(fakeStatus).toBe('failed');
});

test('the Sum/Reverse order parser rejects missing, duplicated, and extra results, tolerates whitespace and prompt wording, but does not silently realign a debug line', async ({ page }) => {
  await open(page);
  const contract = { sum: 730, reverse: [400, 300, 20, 10] };
  const cases = [
    ['Reverse order:\n400\n300\n20\n10\n', 'missing Sum'],
    ['Sum: 730\nReverse order:\n400\n300\n20\n10\n', 'ordinary case passes'],
    ['Sum: 730\nSum: 730\nReverse order:\n400\n300\n20\n10\n', 'duplicate Sum'],
    ['Sum: 730\nReverse order:\n400\n300\n20\n10\n999\n', 'extra trailing value'],
    ['Sum: 730\nReverse order:\n400\n300\n10\n', 'missing a reversed value'],
    ['Sum: 730\n400\n300\n20\n10\n', 'missing the heading'],
    ['Whatever prompt text the student chose (0-65535):\nAnother prompt:\nSum: 730\nReverse order:\n400\n300\n20\n10\n', 'varied prompt wording before Sum still passes'],
    ['Sum:   730  \nReverse order:\n400\n300\n20\n10\n\n', 'reasonable whitespace around labels and a trailing blank line still pass'],
    ['Sum: 730\r\nReverse order:\r\n400\r\n300\r\n20\r\n10\r\n', 'CRLF line endings still pass'],
    ['Sum: 730\nReverse order:\n400\n300\n999\n20\n10\n', 'a debug numeric line inserted mid-sequence does not silently realign'],
  ];
  const outcomes = await page.evaluate(async ({ cases, contract }) => {
    const { checkSumAndReverse } = await import('/x86-64-CSIS-118/src/testing/stdoutCompare.ts');
    return cases.map(([stdout]) => checkSumAndReverse(stdout, contract));
  }, { cases, contract });
  expect(outcomes[0]).not.toBeNull(); // missing Sum
  expect(outcomes[1]).toBeNull(); // ordinary case
  expect(outcomes[2]).not.toBeNull(); // duplicate Sum
  expect(outcomes[3]).not.toBeNull(); // extra trailing value
  expect(outcomes[4]).not.toBeNull(); // missing a reversed value
  expect(outcomes[5]).not.toBeNull(); // missing heading
  expect(outcomes[6]).toBeNull(); // prompt wording is unconstrained
  expect(outcomes[7]).toBeNull(); // whitespace tolerance
  expect(outcomes[8]).toBeNull(); // CRLF tolerance
  expect(outcomes[9]).not.toBeNull(); // debug line never passes silently
});

test('Sum and Reverse autosaves stay isolated, reset confirms, source downloads, and shared code wins, alongside the Unit 04 calculator', async ({ page, context }) => {
  await open(page);
  const starter = await editor(page).inputValue();
  const source = completed(starter);
  await editor(page).fill(source);
  await page.locator('#assignment-select').selectOption('unit04-variables-basic-arithmetic');
  const calculator = await editor(page).inputValue();
  expect(calculator).toMatch(/Unit 04 - Variables & Basic Arithmetic/);
  await page.locator('#assignment-select').selectOption('');
  await editor(page).fill('; Free practice\n');
  await page.locator('#assignment-select').selectOption(id);
  await expect(editor(page)).toHaveValue(source);
  await page.reload();
  await expect(editor(page)).toHaveValue(source);
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Reset to Starter Code' }).click();
  await expect(editor(page)).toHaveValue(source);
  await expect(page.getByRole('button', { name: 'Copy Submission Link', exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download .asm file', exact: true })).toHaveCount(0);
  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press('Control+s');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`${id}.asm`);
  expect(await readFile(await download.path(), 'utf8')).toBe(source);
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const share = page.getByRole('dialog', { name: 'Share', exact: true });
  await expect(share).toContainText('this link is optional');
  const shareLink = await share.locator('input[readonly]').inputValue();
  await page.keyboard.press('Escape');
  await editor(page).fill('; Different saved work\n');
  await page.locator('#assignment-select').selectOption('');
  const shared = await context.newPage();
  await open(shared, shareLink + '&assignment=unit04-variables-basic-arithmetic');
  await expect(shared.locator('#assignment-select')).toHaveValue(id);
  await expect(editor(shared)).toHaveValue(source);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#assignment-select').selectOption(id);
  await page.getByRole('button', { name: 'Reset to Starter Code' }).click();
  await expect(editor(page)).toHaveValue(starter);
  await page.locator('#assignment-select').selectOption('unit04-variables-basic-arithmetic');
  await expect(editor(page)).toHaveValue(calculator);
});

test('Sum and Reverse instructions render code examples and help links, support keyboard and all themes at desktop and narrow widths, and edits invalidate stale results', async ({ page }) => {
  await open(page);
  const source = completed(await editor(page).inputValue());
  await editor(page).fill(source);
  await page.getByRole('button', { name: 'Check My Work', exact: true }).click();
  await expect(results(page)).toContainText('11 / 11');
  await expect(page.locator('.results__note')).toContainText('Paste your complete, commented NASM source');
  for (const width of [1600, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1100 });
    for (const mode of ['dark', 'light', 'high-contrast']) {
      await page.getByRole('combobox', { name: 'Color theme' }).selectOption(mode);
      await expect(page.locator('.assignment__submitnote')).toContainText('Share link is optional');
      const trigger = page.getByRole('button', { name: /Instructions, submission, and grading/ });
      await trigger.focus();
      await trigger.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Unit 04 — Assignment 1: Sum and Reverse' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('Examples', { exact: true })).toBeVisible();
      await expect(dialog.getByText('Submission in Canvas Text Entry', { exact: true })).toBeVisible();
      await expect(dialog.locator('pre', { hasText: 'Enter num1' }).first()).toBeVisible();
      await expect(dialog.getByRole('link', { name: 'Course Discord' })).toHaveAttribute('href', 'https://discord.gg/rykbgQt5cd');
      await expect(dialog).not.toContainText('video');
      const region = dialog.getByRole('region', { name: 'Assignment instructions' });
      await region.focus();
      await region.press('End');
      await expect.poll(() => region.evaluate((el) =>
        el.scrollTop + el.clientHeight >= el.scrollHeight - 2)).toBe(true);
      const box = await dialog.boundingBox();
      expect(box.width).toBeLessThanOrEqual(width);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
  }
  await editor(page).fill(source.replace('add rax, rcx                     ; Add num4 into the running total.', 'sub rax, rcx                     ; Add num4 into the running total.'));
  await expect(results(page)).toContainText('Run Check My Work again');
  await expect(results(page).getByText('11 / 11')).toHaveCount(0);
});
