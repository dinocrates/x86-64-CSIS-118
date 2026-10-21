import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const id = 'unit04-variables-basic-arithmetic';
const launch = `index.html?assignment=${id}`;
const editor = (page) => page.locator('.prism-code-editor textarea');
const results = (page) => page.getByRole('region', { name: 'Check My Work results' });

// Exact fixtures from the assignment spec. All eight are this assignment's
// visible stdout checks (there is no hidden/regression-only subset here).
const fixtures = [
  [22, 10, 'Enter a number\nEnter a number\nSum: 32\nDiff: 12\nProd: 220\nQuot: 2\nRem: 2\n'],
  [10, 22, 'Enter a number\nEnter a number\nSum: 32\nDiff: -12\nProd: 220\nQuot: 0\nRem: 10\n'],
  [0, 5, 'Enter a number\nEnter a number\nSum: 5\nDiff: -5\nProd: 0\nQuot: 0\nRem: 0\n'],
  [1, 1, 'Enter a number\nEnter a number\nSum: 2\nDiff: 0\nProd: 1\nQuot: 1\nRem: 0\n'],
  [65535, 1, 'Enter a number\nEnter a number\nSum: 65536\nDiff: 65534\nProd: 65535\nQuot: 65535\nRem: 0\n'],
  [1, 65535, 'Enter a number\nEnter a number\nSum: 65536\nDiff: -65534\nProd: 65535\nQuot: 0\nRem: 1\n'],
  [65535, 65535, 'Enter a number\nEnter a number\nSum: 131070\nDiff: 0\nProd: 4294836225\nQuot: 1\nRem: 0\n'],
  [60000, 40001, 'Enter a number\nEnter a number\nSum: 100001\nDiff: 19999\nProd: 2400060000\nQuot: 1\nRem: 19999\n'],
];

// Complete arbitrary fixture exists only in tests, never in student content.
function completed(starter) {
  return starter
    .replace('Your Name', 'Alex Rivera')
    .replace('YYYY-MM-DD', '2026-10-20')
    .replace(
      '    prompt: db "Enter a number", 0   ; Store the required input prompt.\n' +
      '    echo_text: db "Starter value: ", 0 ; Label the starter demonstration\'s output.\n' +
      '    ; TODO: Add the five required null-terminated result labels.',
      '    prompt: db "Enter a number", 0   ; Store the required input prompt.\n' +
      '    sum_text: db "Sum: ", 0          ; Label for the sum result.\n' +
      '    diff_text: db "Diff: ", 0        ; Label for the difference result.\n' +
      '    prod_text: db "Prod: ", 0        ; Label for the product result.\n' +
      '    quot_text: db "Quot: ", 0        ; Label for the quotient result.\n' +
      '    rem_text: db "Rem: ", 0          ; Label for the remainder result.',
    )
    .replace(
      '    val2: resw 1                    ; Reserve two bytes for the second input.\n' +
      '    ; TODO: Add appropriately sized result storage if your approach uses it.',
      '    val2: resw 1                    ; Reserve two bytes for the second input.',
    )
    .replace(
      'main:                               ; Begin the student program.\n' +
      '    lea rdi, [rel prompt]            ; Pass the prompt\'s address.\n' +
      '    call print_line                 ; Print the prompt and a newline.\n' +
      '    call read_int                   ; Read one decimal integer into RAX.\n' +
      '    mov word [rel val1], ax          ; Save the input\'s low sixteen bits immediately.\n' +
      '\n' +
      '    lea rdi, [rel echo_text]         ; Pass the starter output label\'s address.\n' +
      '    call print_string               ; Print the label without a newline.\n' +
      '    movzx edi, word [rel val1]       ; Widen the saved unsigned WORD for printing.\n' +
      '    call print_uint                 ; Display the stored input.\n' +
      '    call print_newline              ; End the output line.\n' +
      '\n' +
      '    ; TODO: Extend the prompt/read/store sequence to fill val2.\n' +
      '    ; TODO: Replace this starter echo with the five required labeled results.\n' +
      '    ; TODO: Calculate from the original inputs and preserve results before output.\n' +
      '    exit                            ; Finish the program normally.',
      'main:                               ; Begin the student program.\n' +
      '    lea rdi, [rel prompt]            ; Pass the first input prompt\'s address.\n' +
      '    call print_line                 ; Print the first prompt with a newline.\n' +
      '    call read_int                   ; Read the first decimal integer into RAX.\n' +
      '    mov word [rel val1], ax          ; Store the first value\'s low 16 bits immediately.\n' +
      '\n' +
      '    lea rdi, [rel prompt]            ; Pass the second input prompt\'s address.\n' +
      '    call print_line                 ; Print the second prompt with a newline.\n' +
      '    call read_int                   ; Read the second decimal integer into RAX.\n' +
      '    mov word [rel val2], ax          ; Store the second value\'s low 16 bits immediately.\n' +
      '\n' +
      '    movzx eax, word [rel val1]       ; Zero-extend the first value into EAX.\n' +
      '    movzx ecx, word [rel val2]       ; Zero-extend the second value into ECX.\n' +
      '    add eax, ecx                     ; Add using 32-bit registers so Sum is not truncated.\n' +
      '    mov r12d, eax                    ; Preserve Sum across upcoming library calls.\n' +
      '\n' +
      '    movzx eax, word [rel val1]       ; Reload the original first value into EAX.\n' +
      '    movzx ecx, word [rel val2]       ; Reload the original second value into ECX.\n' +
      '    sub eax, ecx                     ; Calculate val1 minus val2 in EAX.\n' +
      '    mov r13d, eax                    ; Preserve Diff across upcoming library calls.\n' +
      '\n' +
      '    movzx eax, word [rel val1]       ; Reload the original first value into EAX.\n' +
      '    movzx ecx, word [rel val2]       ; Reload the original second value into ECX.\n' +
      '    mul ecx                          ; EDX:EAX = EAX * ECX (full unsigned product).\n' +
      '    mov r14d, eax                    ; Preserve Prod across upcoming library calls.\n' +
      '\n' +
      '    movzx eax, word [rel val1]       ; Reload the original first value as the dividend.\n' +
      '    xor edx, edx                     ; Zero-extend the dividend into EDX:EAX.\n' +
      '    movzx ecx, word [rel val2]       ; Reload the original second value as the divisor.\n' +
      '    div ecx                          ; EAX = quotient, EDX = remainder.\n' +
      '    mov r15d, eax                    ; Preserve Quot across upcoming library calls.\n' +
      '    mov ebx, edx                     ; Preserve Rem across upcoming library calls.\n' +
      '\n' +
      '    lea rdi, [rel sum_text]          ; Pass the Sum label\'s address.\n' +
      '    call print_string               ; Print the label.\n' +
      '    mov edi, r12d                    ; Pass the preserved Sum.\n' +
      '    call print_uint                 ; Display Sum.\n' +
      '    call print_newline              ; End the line.\n' +
      '\n' +
      '    lea rdi, [rel diff_text]         ; Pass the Diff label\'s address.\n' +
      '    call print_string               ; Print the label.\n' +
      '    movsxd rdi, r13d                 ; Sign-extend the preserved Diff to 64 bits.\n' +
      '    call print_int                  ; Display Diff, with a minus sign when negative.\n' +
      '    call print_newline              ; End the line.\n' +
      '\n' +
      '    lea rdi, [rel prod_text]         ; Pass the Prod label\'s address.\n' +
      '    call print_string               ; Print the label.\n' +
      '    mov edi, r14d                    ; Pass the preserved Prod.\n' +
      '    call print_uint                 ; Display Prod.\n' +
      '    call print_newline              ; End the line.\n' +
      '\n' +
      '    lea rdi, [rel quot_text]         ; Pass the Quot label\'s address.\n' +
      '    call print_string               ; Print the label.\n' +
      '    mov edi, r15d                    ; Pass the preserved Quot.\n' +
      '    call print_uint                 ; Display Quot.\n' +
      '    call print_newline              ; End the line.\n' +
      '\n' +
      '    lea rdi, [rel rem_text]          ; Pass the Rem label\'s address.\n' +
      '    call print_string               ; Print the label.\n' +
      '    mov edi, ebx                     ; Pass the preserved Rem.\n' +
      '    call print_uint                 ; Display Rem.\n' +
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
    const { unit04VariablesArithmeticAssignment: assignment } = await import('/x86-64-CSIS-118/src/assignments/assignments.ts');
    const config = timeoutMs ? { ...assignment, tests: assignment.tests.map((test) => ({ ...test, timeoutMs })) } : assignment;
    return runAssignmentTests(source, config);
  }, { source, timeoutMs });
}

test.beforeEach(async ({ context }) => {
  await context.route('**/analytics.halb.it/**', (route) => route.fulfill({ body: '' }));
});

test('starter deep link selects Unit 04 in an empty autosave slot, echoes typed input via the real terminal for 0/42/65535, and reports unfinished requirements honestly', async ({ page }) => {
  await open(page);
  await expect(page.locator('#assignment-select')).toHaveValue(id);
  await expect(page.locator(`#assignment-select option[value="unit03-lab3b-variables"]`)).toHaveCount(1);
  const starter = await editor(page).inputValue();
  expect(starter).toMatch(/^; Name: Your Name\n/);
  expect(starter).not.toMatch(/Sum:|Diff:|Prod:|Quot:|Rem:/);
  expect(starter).not.toMatch(/mov\s+word\s*\[\s*rel\s+val2\s*\]/i);

  for (const value of [0, 42, 65535]) {
    await page.getByRole('button', { name: 'compile', exact: true }).click();
    await expect(page.locator('.term__codewrap')).toContainText('Enter a number');
    await page.locator('.stdin input[type=text]').fill(String(value));
    await page.getByRole('button', { name: 'submit', exact: true }).click();
    await expect(page.locator('.term__codewrap')).toContainText(`Starter value: ${value}`);
    await expect(page.locator('.term .exitcodeinfo')).toContainText('Exit(0)');
  }

  const checked = await report(page, starter);
  expect(checked.results.map((r) => r.status)).toEqual([
    'passed', 'passed', 'failed', 'failed',
    'failed', 'failed', 'failed', 'failed', 'failed', 'failed', 'failed', 'failed',
  ]);
  expect(checked.reminders).toHaveLength(2);
  expect(checked.pointsPossible).toBe(0);
});

test('real runner accepts the completed reference across all eight fixtures, isolates read/widen/divide/output bugs, and recovers after timeout', async ({ page }) => {
  test.setTimeout(600000);
  await open(page);
  const starter = await editor(page).inputValue();
  const source = completed(starter);
  const good = await report(page, source);
  expect(good.passed, JSON.stringify(good)).toBe(12);
  expect(good.reminders).toEqual([]);

  // Confirm the real NASM/Blink runtime directly against every fixture row.
  for (const [val1, val2, expected] of fixtures) {
    const run = await page.evaluate(async ({ source, stdin }) => {
      const { getTestMachine } = await import('/x86-64-CSIS-118/src/testing/testMachine.ts');
      const machine = await getTestMachine();
      await machine.assemble(source, 30000);
      return machine.runLoaded(stdin, 5000);
    }, { source, stdin: `${val1}\n${val2}` });
    expect(run.stdout, `${val1}/${val2}`).toBe(expected);
    expect(run.exitCode).toBe(0);
  }

  // Hardcoded 22/10 output: a fixed-string program instead of real arithmetic.
  const hardcoded =
    '%include "csis118b.inc"\nsection .data\n' +
    '    prompt: db "Enter a number", 0\n' +
    '    out: db "Sum: 32", 10, "Diff: 12", 10, "Prod: 220", 10, "Quot: 2", 10, "Rem: 2", 10, 0\n' +
    'section .bss\n    val1: resw 1\n    val2: resw 1\nsection .text\n    global main\nmain:\n' +
    '    lea rdi, [rel prompt]\n    call print_line\n    call read_int\n    mov word [rel val1], ax\n' +
    '    lea rdi, [rel prompt]\n    call print_line\n    call read_int\n    mov word [rel val2], ax\n' +
    '    lea rdi, [rel out]\n    call print_string\n    exit\n';
  const hardcodedResult = await report(page, hardcoded);
  expect(hardcodedResult.results.find((r) => r.id === 'stdout-22-10').status).toBe('passed');
  expect(hardcodedResult.results.find((r) => r.id === 'stdout-10-22').status).toBe('failed');

  // WORD-width result truncation: Sum computed in 16-bit registers overflows at 65536.
  const sumTruncated = source
    .replace(
      '    movzx eax, word [rel val1]       ; Zero-extend the first value into EAX.\n' +
      '    movzx ecx, word [rel val2]       ; Zero-extend the second value into ECX.\n' +
      '    add eax, ecx                     ; Add using 32-bit registers so Sum is not truncated.\n' +
      '    mov r12d, eax                    ; Preserve Sum across upcoming library calls.',
      '    mov ax, word [rel val1]          ; Bug: keep the first value in a 16-bit register.\n' +
      '    add ax, word [rel val2]          ; Bug: add in 16 bits, truncating a sum over 65535.\n' +
      '    movzx r12d, ax                   ; Preserve the truncated (wrong) Sum.',
    );
  const sumTruncatedResult = await report(page, sumTruncated);
  expect(sumTruncatedResult.results.find((r) => r.id === 'stdout-22-10').status).toBe('passed');
  expect(sumTruncatedResult.results.find((r) => r.id === 'stdout-65535-1').status).toBe('failed');

  // Sign-extending an unsigned WORD input: movsx instead of movzx for val1 in Sum.
  const signExtendedInput = source.replace(
    '    movzx eax, word [rel val1]       ; Zero-extend the first value into EAX.\n' +
    '    movzx ecx, word [rel val2]       ; Zero-extend the second value into ECX.\n' +
    '    add eax, ecx                     ; Add using 32-bit registers so Sum is not truncated.',
    '    movsx eax, word [rel val1]       ; Bug: sign-extends the unsigned WORD instead of zero-extending.\n' +
    '    movzx ecx, word [rel val2]       ; Zero-extend the second value into ECX.\n' +
    '    add eax, ecx                     ; Add using 32-bit registers so Sum is not truncated.',
  );
  const signExtendedResult = await report(page, signExtendedInput);
  expect(signExtendedResult.results.find((r) => r.id === 'stdout-22-10').status).toBe('passed');
  expect(signExtendedResult.results.find((r) => r.id === 'stdout-65535-1').status).toBe('failed');

  // Zero-extending a negative DWORD difference for output instead of sign-extending.
  const diffZeroExtended = source.replace(
    '    movsxd rdi, r13d                 ; Sign-extend the preserved Diff to 64 bits.',
    '    mov edi, r13d                    ; Bug: zeroes RDI\'s upper half instead of sign-extending.',
  );
  const diffZeroExtendedResult = await report(page, diffZeroExtended);
  expect(diffZeroExtendedResult.results.find((r) => r.id === 'stdout-10-22').status).toBe('failed');

  // Printing the large unsigned product as a sign-extended (negative) value.
  const prodSignExtended = source.replace(
    '    mov edi, r14d                    ; Pass the preserved Prod.\n' +
    '    call print_uint                 ; Display Prod.',
    '    movsxd rdi, r14d                 ; Bug: sign-extends the unsigned product.\n' +
    '    call print_int                  ; Bug: prints it as a negative signed value.',
  );
  const prodSignExtendedResult = await report(page, prodSignExtended);
  expect(prodSignExtendedResult.results.find((r) => r.id === 'stdout-22-10').status).toBe('passed');
  expect(prodSignExtendedResult.results.find((r) => r.id === 'stdout-65535-65535').status).toBe('failed');

  // Losing the quotient/remainder across print calls: reused directly from
  // the (by-then-clobbered) EAX/EDX instead of the preserved registers.
  const lostQuotRem = source
    .replace(
      '    mov r15d, eax                    ; Preserve Quot across upcoming library calls.\n' +
      '    mov ebx, edx                     ; Preserve Rem across upcoming library calls.',
      '    ; Bug: Quot/Rem are not preserved before the Sum/Diff/Prod print calls.',
    )
    .replace(
      '    mov edi, r15d                    ; Pass the preserved Quot.',
      '    mov edi, eax                     ; Bug: EAX was clobbered by the print calls above.',
    )
    .replace(
      '    mov edi, ebx                     ; Pass the preserved Rem.',
      '    mov edi, edx                     ; Bug: EDX was clobbered by the print calls above.',
    );
  const lostQuotRemResult = await report(page, lostQuotRem);
  expect(lostQuotRemResult.results.find((r) => r.id === 'stdout-22-10').status).toBe('failed');

  for (const [code, message] of [
    [source.replace('    exit                            ; Finish the program normally.', '    mov rdi, 7\n    call exit_program'), /exit status 0; received 7/],
    [source.replace('    exit                            ; Finish the program normally.', '    jmp $'), /ran too long/],
  ]) {
    const checked = await report(page, code, 800);
    const stdoutResult = checked.results.find((r) => r.id === 'stdout-22-10');
    expect(stdoutResult.status).toBe('failed');
    expect(stdoutResult.message).toMatch(message);
  }
  expect((await report(page, source)).passed).toBe(12);
});

test('a second valid implementation with different temporary registers and wider working registers is accepted', async ({ page }) => {
  await open(page);
  const starter = await editor(page).inputValue();
  const source = completed(starter);
  const altSource = source
    .replace(/r12d/g, 'r8d')
    .replace(/r13d/g, 'r9d')
    .replace(/r14d/g, 'r10d')
    .replace(/r15d/g, 'r11d')
    .replace('mov ebx, edx', 'mov r12d, edx')
    .replace('mov edi, ebx', 'mov edi, r12d');
  const altResult = await report(page, altSource);
  expect(altResult.passed, JSON.stringify(altResult)).toBe(12);

  // A wider (64-bit) working-register variant for Sum should also pass.
  const wideSource = source.replace(
    '    movzx eax, word [rel val1]       ; Zero-extend the first value into EAX.\n' +
    '    movzx ecx, word [rel val2]       ; Zero-extend the second value into ECX.\n' +
    '    add eax, ecx                     ; Add using 32-bit registers so Sum is not truncated.\n' +
    '    mov r12d, eax                    ; Preserve Sum across upcoming library calls.',
    '    movzx rax, word [rel val1]       ; Zero-extend the first value into RAX (wider than required).\n' +
    '    movzx rcx, word [rel val2]       ; Zero-extend the second value into RCX.\n' +
    '    add rax, rcx                     ; Add using 64-bit registers.\n' +
    '    mov r12, rax                     ; Preserve Sum in a 64-bit register.',
  );
  const wideResult = await report(page, wideSource);
  expect(wideResult.passed, JSON.stringify(wideResult)).toBe(12);
});

test('source checks tolerate capitalization/spacing variants, reject commented-out or quoted fake declarations, and require real WORD reservations', async ({ page }) => {
  await open(page);
  const source = completed(await editor(page).inputValue());
  const variants = [
    [source, [true, true, true]],
    [
      source
        .replace('mov word [rel val1], ax          ; Store the first value\'s low 16 bits immediately.', 'MOV   WORD   [REL val1]  ,  AX')
        .replace('mov word [rel val2], ax          ; Store the second value\'s low 16 bits immediately.', 'mov word[rel val2],ax')
        .replace('movsxd rdi, r13d                 ; Sign-extend the preserved Diff to 64 bits.', 'MOVSXD RDI, R13D'),
      [true, true, true],
    ],
    [
      source.replace(
        '    val1: resw 1                    ; Reserve two bytes for the first input.',
        '    ; val1: resw 1\n    val1: resd 1',
      ),
      [false, true, true],
    ],
    [
      source.replace(
        '    movsxd rdi, r13d                 ; Sign-extend the preserved Diff to 64 bits.',
        '    mov edi, r13d                    ; no sign extension here',
      ),
      [true, true, false],
    ],
  ];
  for (const [code, expected] of variants) {
    const statuses = await page.evaluate(async (source) => {
      const { runSourceCheckTest } = await import('/x86-64-CSIS-118/src/testing/sourceChecks.ts');
      const { unit04VariablesArithmeticAssignment } = await import('/x86-64-CSIS-118/src/assignments/assignments.ts');
      return unit04VariablesArithmeticAssignment.tests.filter((test) => test.type === 'source-check')
        .map((test) => runSourceCheckTest(test, source).status === 'passed');
    }, code);
    expect(statuses, code).toEqual(expected);
  }

  // A comment-only or quoted fake WORD declaration never satisfies the check.
  const fakeDeclaration =
    '; val1: resw 1\n; val2: resw 1\nsection .data\n    note: db "val1: resw 1", 0\n';
  const fakeStatus = await page.evaluate(async (source) => {
    const { runSourceCheckTest } = await import('/x86-64-CSIS-118/src/testing/sourceChecks.ts');
    const { unit04VariablesArithmeticAssignment } = await import('/x86-64-CSIS-118/src/assignments/assignments.ts');
    const test = unit04VariablesArithmeticAssignment.tests.find((t) => t.id === 'variables-defined');
    return runSourceCheckTest(test, source).status;
  }, fakeDeclaration);
  expect(fakeStatus).toBe('failed');
});

test('Unit 04 autosaves stay isolated, reset confirms, source downloads, and shared code wins, alongside Lab 3B', async ({ page, context }) => {
  await open(page);
  const starter = await editor(page).inputValue();
  const source = completed(starter);
  await editor(page).fill(source);
  await page.locator('#assignment-select').selectOption('unit03-lab3b-variables');
  const lab3b = await editor(page).inputValue();
  expect(lab3b).toMatch(/Unit 03 Lab 3B/);
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
  // Download .asm file is still reachable via File options for this submissionMode
  // (submissionMode: "source-text" is not "file-upload", so the dedicated
  // Download .asm file button is not shown next to Check My Work).
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
  await open(shared, shareLink + '&assignment=unit03-lab3b-variables');
  await expect(shared.locator('#assignment-select')).toHaveValue(id);
  await expect(editor(shared)).toHaveValue(source);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#assignment-select').selectOption(id);
  await page.getByRole('button', { name: 'Reset to Starter Code' }).click();
  await expect(editor(page)).toHaveValue(starter);
  await page.locator('#assignment-select').selectOption('unit03-lab3b-variables');
  await expect(editor(page)).toHaveValue(lab3b);
});

test('Unit 04 instructions render code examples and help links, support keyboard and all themes at desktop and narrow widths, and edits invalidate stale results', async ({ page }) => {
  await open(page);
  const source = completed(await editor(page).inputValue());
  await editor(page).fill(source);
  await page.getByRole('button', { name: 'Check My Work', exact: true }).click();
  await expect(results(page)).toContainText('12 / 12');
  await expect(page.locator('.results__note')).toContainText('Paste your complete, commented NASM source');
  for (const width of [1600, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1100 });
    for (const mode of ['dark', 'light', 'high-contrast']) {
      await page.getByRole('combobox', { name: 'Color theme' }).selectOption(mode);
      await expect(page.locator('.assignment__submitnote')).toContainText('Share link is optional');
      const trigger = page.getByRole('button', { name: /Instructions, submission, and grading/ });
      await trigger.focus();
      await trigger.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Unit 04 — Variables & Basic Arithmetic' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('Examples', { exact: true })).toBeVisible();
      await expect(dialog.getByText('Submission in Canvas Text Entry', { exact: true })).toBeVisible();
      await expect(dialog.locator('pre', { hasText: 'Enter a number' }).first()).toBeVisible();
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
  await editor(page).fill(source.replace('sub eax, ecx', 'add eax, ecx'));
  await expect(results(page)).toContainText('Run Check My Work again');
  await expect(results(page).getByText('12 / 12')).toHaveCount(0);
});
