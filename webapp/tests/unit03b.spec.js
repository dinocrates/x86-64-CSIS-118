import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const id = 'unit03-lab3b-variables';
const launch = `index.html?assignment=${id}`;
const editor = (page) => page.locator('.prism-code-editor textarea');
const results = (page) => page.getByRole('region', { name: 'Check My Work results' });

// Exact fixtures from the assignment spec. The first three are this
// assignment's visible stdout checks; the rest are regression-only.
const fixtures = [
  [18, 5, 'Input a number\nInput a number\n18 - 5 = 13\nAfter Swapping\nfirst variable: 5\nsecond variable: 18\n'],
  [5, 18, 'Input a number\nInput a number\n5 - 18 = -13\nAfter Swapping\nfirst variable: 18\nsecond variable: 5\n'],
  [7, 7, 'Input a number\nInput a number\n7 - 7 = 0\nAfter Swapping\nfirst variable: 7\nsecond variable: 7\n'],
  [0, 9, 'Input a number\nInput a number\n0 - 9 = -9\nAfter Swapping\nfirst variable: 9\nsecond variable: 0\n'],
  [-8, 3, 'Input a number\nInput a number\n-8 - 3 = -11\nAfter Swapping\nfirst variable: 3\nsecond variable: -8\n'],
  [12, -4, 'Input a number\nInput a number\n12 - -4 = 16\nAfter Swapping\nfirst variable: -4\nsecond variable: 12\n'],
  [-5, -12, 'Input a number\nInput a number\n-5 - -12 = 7\nAfter Swapping\nfirst variable: -12\nsecond variable: -5\n'],
  [-1000000, 1000000, 'Input a number\nInput a number\n-1000000 - 1000000 = -2000000\nAfter Swapping\nfirst variable: 1000000\nsecond variable: -1000000\n'],
  [1000000, -1000000, 'Input a number\nInput a number\n1000000 - -1000000 = 2000000\nAfter Swapping\nfirst variable: -1000000\nsecond variable: 1000000\n'],
];

// Complete arbitrary fixture exists only in tests, never in student content.
function completed(starter) {
  return starter
    .replace('Your Name', 'Alex Rivera')
    .replace('YYYY-MM-DD', '2026-10-19')
    .replace(
      '    prompt: db "Input a number", 0   ; Store a NUL-terminated input prompt.\n' +
      '    echo_text: db "You entered: ", 0 ; Store the prefix for the starter\'s output.\n' +
      '    sample_value: dd 0               ; Allocate one four-byte integer variable.',
      '    prompt: db "Input a number", 0   ; Store a NUL-terminated input prompt.\n' +
      '    minus_text: db " - ", 0          ; Store the subtraction separator.\n' +
      '    equals_text: db " = ", 0         ; Store the equals separator.\n' +
      '    swapped_text: db "After Swapping", 0 ; Store the post-swap heading.\n' +
      '    first_text: db "first variable: ", 0 ; Store the first-value prefix.\n' +
      '    second_text: db "second variable: ", 0 ; Store the second-value prefix.\n' +
      '    first_value: dd 0                ; Allocate the first DWORD variable.\n' +
      '    second_value: dd 0               ; Allocate the second DWORD variable.',
    )
    .replace(
      'main:                               ; Begin the student program.\n' +
      '    lea rdi, [rel prompt]            ; Pass the prompt\'s address to the output routine.\n' +
      '    call print_line                 ; Display the prompt and add a newline.\n' +
      '    call read_int                   ; Read one signed decimal integer into RAX.\n' +
      '    mov dword [rel sample_value], eax ; Save four bytes immediately after input.\n' +
      '\n' +
      '    lea rdi, [rel echo_text]         ; Pass the output prefix\'s address.\n' +
      '    call print_string               ; Print the prefix without a newline.\n' +
      '    movsxd rdi, dword [rel sample_value] ; Widen the saved signed DWORD to 64 bits.\n' +
      '    call print_int                  ; Display the stored integer as signed decimal.\n' +
      '    call print_newline              ; End the output line.\n' +
      '    exit                            ; Finish the program normally.',
      'main:                               ; Begin the student program.\n' +
      '    lea rdi, [rel prompt]            ; Pass the first input prompt\'s address.\n' +
      '    call print_line                 ; Print the first prompt with a newline.\n' +
      '    call read_int                   ; Read the first signed integer into RAX.\n' +
      '    mov dword [rel first_value], eax ; Store the first value immediately.\n' +
      '\n' +
      '    lea rdi, [rel prompt]            ; Pass the second input prompt\'s address.\n' +
      '    call print_line                 ; Print the second prompt with a newline.\n' +
      '    call read_int                   ; Read the second signed integer into RAX.\n' +
      '    mov dword [rel second_value], eax ; Store the second value immediately.\n' +
      '\n' +
      '    movsxd rdi, dword [rel first_value] ; Load the original first value with its sign.\n' +
      '    call print_int                  ; Print the original first value.\n' +
      '    lea rdi, [rel minus_text]        ; Pass the subtraction separator\'s address.\n' +
      '    call print_string               ; Print the separator.\n' +
      '    movsxd rdi, dword [rel second_value] ; Load the original second value with its sign.\n' +
      '    call print_int                  ; Print the original second value.\n' +
      '    lea rdi, [rel equals_text]       ; Pass the equals separator\'s address.\n' +
      '    call print_string               ; Print the separator.\n' +
      '    mov eax, dword [rel first_value] ; Load the original first value for subtraction.\n' +
      '    sub eax, dword [rel second_value] ; Calculate first minus second in EAX.\n' +
      '    movsxd rdi, eax                  ; Widen the signed difference for output.\n' +
      '    call print_int                  ; Print the difference.\n' +
      '    call print_newline              ; End the equation line.\n' +
      '\n' +
      '    mov eax, dword [rel first_value] ; Preserve the original first value in EAX.\n' +
      '    mov ebx, dword [rel second_value] ; Preserve the original second value in EBX.\n' +
      '    mov dword [rel first_value], ebx ; Store the original second value into the first.\n' +
      '    mov dword [rel second_value], eax ; Store the original first value into the second.\n' +
      '\n' +
      '    lea rdi, [rel swapped_text]      ; Pass the post-swap heading\'s address.\n' +
      '    call print_line                 ; Print the heading with a newline.\n' +
      '    lea rdi, [rel first_text]        ; Pass the first variable\'s output prefix.\n' +
      '    call print_string               ; Print the prefix.\n' +
      '    movsxd rdi, dword [rel first_value] ; Reload the first variable after the swap.\n' +
      '    call print_int                  ; Print its updated stored value.\n' +
      '    call print_newline              ; End the line.\n' +
      '    lea rdi, [rel second_text]       ; Pass the second variable\'s output prefix.\n' +
      '    call print_string               ; Print the prefix.\n' +
      '    movsxd rdi, dword [rel second_value] ; Reload the second variable after the swap.\n' +
      '    call print_int                  ; Print its updated stored value.\n' +
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
    const { unit03Lab3bVariablesAssignment: assignment } = await import('/x86-64-CSIS-118/src/assignments/assignments.ts');
    const config = timeoutMs ? { ...assignment, tests: assignment.tests.map((test) => ({ ...test, timeoutMs })) } : assignment;
    return runAssignmentTests(source, config);
  }, { source, timeoutMs });
}

test.beforeEach(async ({ context }) => {
  await context.route('**/analytics.halb.it/**', (route) => route.fulfill({ body: '' }));
});

test('starter deep link selects Lab 3B in an empty autosave slot, echoes typed input via the real terminal, and reports unfinished requirements honestly', async ({ page }) => {
  await open(page);
  await expect(page.locator('#assignment-select')).toHaveValue(id);
  await expect(page.locator(`#assignment-select option[value="unit03-lab3a-registers"]`)).toHaveCount(1);
  const starter = await editor(page).inputValue();
  expect(starter).toMatch(/^; Name: Your Name\n/);
  expect(starter).not.toMatch(/first_value|second_value/);
  const mode = await page.evaluate(async () => {
    const { blinkStore } = await import('/x86-64-CSIS-118/src/core/store.ts');
    return blinkStore.getAppState().mode;
  });
  expect(mode).toBe('NASM_trunk');

  await page.getByRole('button', { name: 'compile', exact: true }).click();
  await expect(page.locator('.term__codewrap')).toContainText('Input a number');
  await page.locator('.stdin input[type=text]').fill('-7');
  await page.getByRole('button', { name: 'submit', exact: true }).click();
  await expect(page.locator('.term__codewrap')).toContainText('You entered: -7');
  await expect(page.locator('.term .exitcodeinfo')).toContainText('Exit(0)');

  const checked = await report(page, starter);
  expect(checked.results.map((test) => test.status)).toEqual([
    'passed', 'failed', 'failed', 'passed', 'failed', 'failed', 'failed',
  ]);
  expect(checked.reminders).toHaveLength(2);
  expect(checked.pointsPossible).toBe(0);
});

test('real runner accepts the completed reference across every fixture, isolates read/store/subtract/swap bugs, and recovers after timeout', async ({ page }) => {
  test.setTimeout(600000);
  await open(page);
  const starter = await editor(page).inputValue();
  const source = completed(starter);
  const good = await report(page, source);
  expect(good.passed, JSON.stringify(good)).toBe(7);
  expect(good.reminders).toEqual([]);

  // Regression-check the full fixture matrix (beyond the 3 visible stdout
  // tests) directly against the real NASM/Blink runtime.
  for (const [first, second, expected] of fixtures) {
    const run = await page.evaluate(async ({ source, stdin }) => {
      const { getTestMachine } = await import('/x86-64-CSIS-118/src/testing/testMachine.ts');
      const machine = await getTestMachine();
      await machine.assemble(source, 30000);
      return machine.runLoaded(stdin, 5000);
    }, { source, stdin: `${first}\n${second}` });
    expect(run.stdout, `${first}/${second}`).toBe(expected);
    expect(run.exitCode).toBe(0);
  }

  // Losing the first input: the store after the first read is dropped.
  const losesFirstInput = source.replace(
    '    mov dword [rel first_value], eax ; Store the first value immediately.\n',
    '',
  );
  const losesFirstResult = await report(page, losesFirstInput);
  expect(losesFirstResult.results.find((r) => r.id === 'stdout-18-5').status).toBe('failed');

  // Reversing the subtraction operands (second minus first instead of first minus second).
  const reversedSub = source.replace(
    '    mov eax, dword [rel first_value] ; Load the original first value for subtraction.\n' +
    '    sub eax, dword [rel second_value] ; Calculate first minus second in EAX.',
    '    mov eax, dword [rel second_value] ; Load the original second value for subtraction.\n' +
    '    sub eax, dword [rel first_value] ; Calculate second minus first in EAX (bug).',
  );
  const reversedResult = await report(page, reversedSub);
  expect(reversedResult.results.find((r) => r.id === 'stdout-18-5').status).toBe('failed');

  // Loading a negative DWORD only into EDI (clears RDI's upper half) instead of movsxd.
  const ediOnlyBug = source.replace(
    '    movsxd rdi, dword [rel second_value] ; Load the original second value with its sign.\n' +
    '    call print_int                  ; Print the original second value.',
    '    mov edi, dword [rel second_value] ; Bug: clears RDI upper half instead of sign-extending.\n' +
    '    call print_int                  ; Print the original second value.',
  );
  const ediOnlyResult = await report(page, ediOnlyBug);
  expect(ediOnlyResult.results.find((r) => r.id === 'stdout-12-neg4').status).toBe('failed');

  // Displaying pre-swap memory values: the swap's register-preserve and
  // memory-store lines are dropped, so the post-swap section reloads and
  // prints the ORIGINAL, never-swapped values.
  const noSwap = source.replace(
    '    mov eax, dword [rel first_value] ; Preserve the original first value in EAX.\n' +
    '    mov ebx, dword [rel second_value] ; Preserve the original second value in EBX.\n' +
    '    mov dword [rel first_value], ebx ; Store the original second value into the first.\n' +
    '    mov dword [rel second_value], eax ; Store the original first value into the second.\n' +
    '\n',
    '',
  );
  const noSwapResult = await report(page, noSwap);
  expect(noSwapResult.results.find((r) => r.id === 'stdout-18-5').status).toBe('failed');

  for (const [code, message] of [
    [source.replace('    exit                            ; Finish the program normally.', '    mov rdi, 7\n    call exit_program'), /exit status 0; received 7/],
    [source.replace('    exit                            ; Finish the program normally.', '    jmp $'), /ran too long/],
  ]) {
    const checked = await report(page, code, 800);
    const stdoutResult = checked.results.find((r) => r.id === 'stdout-18-5');
    expect(stdoutResult.status).toBe('failed');
    expect(stdoutResult.message).toMatch(message);
  }
  expect((await report(page, source)).passed).toBe(7);
});

test('source checks accept valid capitalization and spacing, ignore commented-out lookalikes, and reject xchg', async ({ page }) => {
  await open(page);
  const source = completed(await editor(page).inputValue());
  const variants = [
    [source, [true, true, true]],
    [
      source
        .replace('mov dword [rel first_value], eax ; Store the first value immediately.', 'MOV   DWORD   [REL first_value]  ,  EAX')
        .replace('mov dword [rel second_value], eax ; Store the second value immediately.', 'mov dword[rel second_value],eax')
        .replace('movsxd rdi, dword [rel first_value] ; Load the original first value with its sign.', 'MOVSXD RDI, DWORD [REL first_value]'),
      [true, true, true],
    ],
    [
      source.replace(
        '    first_value: dd 0                ; Allocate the first DWORD variable.',
        '    ; first_value: dd 0\n    first_value: dq 0',
      ),
      [false, true, true],
    ],
    [
      // "mov dword [rel second_value], eax" appears twice in this fixture
      // (the initial read-store, and again during the swap) — both active
      // occurrences must be commented out to truly remove the pattern.
      source
        .replace(
          '    mov dword [rel second_value], eax ; Store the second value immediately.',
          '    ; mov dword [rel second_value], eax ; Store the second value immediately.',
        )
        .replace(
          '    mov dword [rel second_value], eax ; Store the original first value into the second.',
          '    ; mov dword [rel second_value], eax ; Store the original first value into the second.',
        ),
      [true, false, true],
    ],
    [
      source.replace(
        '    mov eax, dword [rel first_value] ; Preserve the original first value in EAX.\n' +
        '    mov ebx, dword [rel second_value] ; Preserve the original second value in EBX.\n' +
        '    mov dword [rel first_value], ebx ; Store the original second value into the first.\n' +
        '    mov dword [rel second_value], eax ; Store the original first value into the second.',
        '    mov eax, dword [rel first_value]\n    xchg eax, dword [rel second_value]\n    mov dword [rel first_value], eax',
      ),
      [true, true, false],
    ],
  ];
  for (const [code, expected] of variants) {
    const statuses = await page.evaluate(async (source) => {
      const { runSourceCheckTest } = await import('/x86-64-CSIS-118/src/testing/sourceChecks.ts');
      const { unit03Lab3bVariablesAssignment } = await import('/x86-64-CSIS-118/src/assignments/assignments.ts');
      return unit03Lab3bVariablesAssignment.tests.filter((test) => test.type === 'source-check')
        .map((test) => runSourceCheckTest(test, source).status === 'passed');
    }, code);
    expect(statuses, code).toEqual(expected);
  }
});

test('Lab 3B autosaves stay isolated, reset confirms, source downloads, and shared code wins, alongside Lab 3A', async ({ page, context }) => {
  await open(page);
  const starter = await editor(page).inputValue();
  const source = completed(starter);
  await editor(page).fill(source);
  await page.locator('#assignment-select').selectOption('unit03-lab3a-registers');
  const lab3a = await editor(page).inputValue();
  expect(lab3a).toMatch(/Unit 03 Lab 3A/);
  await page.locator('#assignment-select').selectOption('');
  await editor(page).fill('; Free practice\n');
  await page.locator('#assignment-select').selectOption(id);
  await expect(editor(page)).toHaveValue(source);
  await page.reload();
  await expect(editor(page)).toHaveValue(source);
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Reset to Starter Code' }).click();
  await expect(editor(page)).toHaveValue(source);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .asm file', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`${id}.asm`);
  expect(await readFile(await download.path(), 'utf8')).toBe(source);
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const share = page.getByRole('dialog', { name: 'Share', exact: true });
  await expect(share).toContainText('submit your .asm file and output evidence');
  const link = await share.locator('input[readonly]').inputValue();
  await page.keyboard.press('Escape');
  await editor(page).fill('; Different saved work\n');
  await page.locator('#assignment-select').selectOption('');
  const shared = await context.newPage();
  await open(shared, link + '&assignment=unit03-lab3a-registers');
  await expect(shared.locator('#assignment-select')).toHaveValue(id);
  await expect(editor(shared)).toHaveValue(source);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#assignment-select').selectOption(id);
  await page.getByRole('button', { name: 'Reset to Starter Code' }).click();
  await expect(editor(page)).toHaveValue(starter);
  await page.locator('#assignment-select').selectOption('unit03-lab3a-registers');
  await expect(editor(page)).toHaveValue(lab3a);
});

test('Lab 3B instructions render code examples and help links, support keyboard and all themes at desktop and narrow widths, and edits invalidate stale results', async ({ page }) => {
  await open(page);
  const source = completed(await editor(page).inputValue());
  await editor(page).fill(source);
  await page.getByRole('button', { name: 'Check My Work', exact: true }).click();
  await expect(results(page)).toContainText('7 / 7');
  for (const width of [1600, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1100 });
    for (const mode of ['dark', 'light', 'high-contrast']) {
      await page.getByRole('combobox', { name: 'Color theme' }).selectOption(mode);
      await expect(page.locator('.assignment__submitnote')).toContainText('Canvas File Upload');
      const trigger = page.getByRole('button', { name: /Instructions, submission, and grading/ });
      await trigger.focus();
      await trigger.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Unit 03 Lab 3B — Creating Variables' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('Examples', { exact: true })).toBeVisible();
      await expect(dialog.locator('pre', { hasText: 'Input a number' }).first()).toBeVisible();
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
  await editor(page).fill(source.replace('sub eax, dword [rel second_value]', 'add eax, dword [rel second_value]'));
  await expect(results(page)).toContainText('Run Check My Work again');
  await expect(results(page).getByText('7 / 7')).toHaveCount(0);
});
