import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const id = 'unit03-lab3a-registers';
const launch = `index.html?assignment=${id}`;
const editor = (page) => page.locator('.prism-code-editor textarea');
const results = (page) => page.getByRole('region', { name: 'Check My Work results' });
const output = '171\n50\n16\n';

// Complete arbitrary fixture exists only in tests, never in student content.
function completed(starter) {
  return starter
    .replace('Your Name', 'Alex Rivera')
    .replace('YYYY-MM-DD', '2026-10-18')
    .replace(
      '    mov eax, 0                ; TODO: Load the required binary literal into EAX.',
      '    mov eax, 0b10101011       ; Load decimal 171 using binary notation.',
    )
    .replace(
      '    mov eax, 0                ; TODO: Load the required hexadecimal literal into EAX.',
      '    mov eax, 0x32             ; Load decimal 50 using hexadecimal notation.',
    )
    .replace(
      '    mov eax, 0                ; TODO: Load the required octal literal into EAX.',
      '    mov eax, 0o20             ; Load decimal 16 using octal notation.',
    );
}

async function open(page, url = launch) {
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'compile', exact: true })).toBeEnabled();
}

async function report(page, source, timeoutMs) {
  return page.evaluate(async ({ source, timeoutMs }) => {
    const { runAssignmentTests } = await import('/x86-64-CSIS-118/src/testing/AssignmentTestRunner.ts');
    const { unit03Lab3aRegistersAssignment: assignment } = await import('/x86-64-CSIS-118/src/assignments/assignments.ts');
    const config = timeoutMs ? { ...assignment, tests: assignment.tests.map((test) => ({ ...test, timeoutMs })) } : assignment;
    return runAssignmentTests(source, config);
  }, { source, timeoutMs });
}

test.beforeEach(async ({ context }) => {
  await context.route('**/analytics.halb.it/**', (route) => route.fulfill({ body: '' }));
});

test('starter deep link selects Lab 3A in an empty autosave slot, runs in NASM mode, and reports unfinished requirements honestly', async ({ page }) => {
  await open(page);
  await expect(page.locator('#assignment-select')).toHaveValue(id);
  const starter = await editor(page).inputValue();
  expect(starter).toMatch(/^; Name: Your Name\n/);
  expect(starter).not.toMatch(/0b10101011|0x32\b|0o20\b/);
  await page.getByRole('button', { name: 'compile', exact: true }).click();
  const mode = await page.evaluate(async () => {
    const { blinkStore } = await import('/x86-64-CSIS-118/src/core/store.ts');
    return blinkStore.getAppState().mode;
  });
  expect(mode).toBe('NASM_trunk');
  await expect(page.locator('.term__codewrap')).toContainText('0\n0\n0');
  await expect(page.locator('.term .exitcodeinfo')).toContainText('Exit(0)');
  const checked = await report(page, starter);
  expect(checked.results.map((test) => test.status)).toEqual([
    'passed', 'failed', 'failed', 'failed', 'passed', 'failed',
  ]);
  expect(checked.results[5].message).not.toMatch(/crash|timeout/i);
  expect(checked.reminders).toHaveLength(2);
  expect(checked.pointsPossible).toBe(0);
});

test('real runner accepts the completed reference, isolates each literal-prefix requirement from decimal-only substitutes, and recovers after timeout', async ({ page }) => {
  test.setTimeout(300000);
  await open(page);
  const starter = await editor(page).inputValue();
  const source = completed(starter);
  const good = await report(page, source);
  expect(good.passed, JSON.stringify(good)).toBe(6);
  expect(good.reminders).toEqual([]);
  await editor(page).fill(source);
  await page.getByRole('button', { name: 'compile', exact: true }).click();
  await expect(page.locator('.term__codewrap')).toContainText('171\n50\n16');
  await expect(page.locator('.term .exitcodeinfo')).toContainText('Exit(0)');

  // Replacing a required prefixed literal with its equivalent bare decimal
  // literal still prints the correct value, but fails only that task's check.
  const decimalOnly = [
    ['    mov eax, 0b10101011       ; Load decimal 171 using binary notation.', '    mov eax, 171              ; decimal only, no 0b prefix.', 1],
    ['    mov eax, 0x32             ; Load decimal 50 using hexadecimal notation.', '    mov eax, 50               ; decimal only, no 0x prefix.', 2],
    ['    mov eax, 0o20             ; Load decimal 16 using octal notation.', '    mov eax, 16               ; decimal only, no 0o prefix.', 3],
  ];
  for (const [from, to, taskIndex] of decimalOnly) {
    const variant = await report(page, source.replace(from, to));
    const statuses = variant.results.map((test) => test.status);
    expect(statuses.filter((status) => status === 'failed')).toHaveLength(1);
    expect(statuses[taskIndex]).toBe('failed');
    expect(statuses[5]).toBe('passed'); // execution/output is unaffected
  }

  // A wrong numeric value fails both its literal check and the output check.
  const wrongValue = await report(page, source.replace('0b10101011', '0b10101010'));
  expect(wrongValue.results[1].status).toBe('failed');
  expect(wrongValue.results[5].status).toBe('failed');

  for (const [code, message] of [
    [source.replace('    exit', '    mov rdi, 7\n    call exit_program'), /exit status 0; received 7/],
    [source.replace('    exit', '    jmp $'), /ran too long/],
  ]) {
    const checked = await report(page, code, 800);
    expect(checked.results[5].status).toBe('failed');
    expect(checked.results[5].message).toMatch(message);
  }
  expect((await report(page, source)).passed).toBe(6);
});

test('decimal output contract rejects reordered output, extra text, blank separators, and hexadecimal display', async ({ page }) => {
  await open(page);
  const cases = [
    [output, true],
    [output.trimEnd(), true],
    ['16\n50\n171\n', false],
    [output + 'Extra\n', false],
    ['171\n\n50\n\n16\n', false],
    ['0xAB\n0x32\n0x10\n', false],
    [output + output, false],
    ['', false],
  ];
  for (const [actual, expected] of cases) {
    const matched = await page.evaluate(async (actual) => {
      const { compareStdout } = await import('/x86-64-CSIS-118/src/testing/stdoutCompare.ts');
      return compareStdout('171\n50\n16', actual, 'trimmed');
    }, actual);
    expect(matched, actual).toBe(expected);
  }
});

test('source checks accept valid capitalization, leading zeroes, and underscore separators, and ignore commented-out lookalikes when active loads are wrong', async ({ page }) => {
  await open(page);
  const source = completed(await editor(page).inputValue());
  const variants = [
    [source, [true, true, true, true]],
    [
      source
        .replace('mov eax, 0b10101011       ; Load decimal 171 using binary notation.', 'MOV EAX, 0B1010_1011      ; uppercase, underscore separator.')
        .replace('mov eax, 0x32             ; Load decimal 50 using hexadecimal notation.', 'mov EAX, 0x0032           ; leading zero.')
        .replace('mov eax, 0o20             ; Load decimal 16 using octal notation.', 'Mov eax, 0o0_20           ; leading zero, underscore.')
        .replace('mov edi, eax              ; Copy the value into the output argument register.', 'MOV EDI, EAX              ; uppercase copy.')
        .replace('call print_uint           ; Print the value as unsigned decimal.', 'CALL Print_Uint           ; uppercase call.'),
      [true, true, true, true],
    ],
    [
      source.replace(
        '    mov eax, 0b10101011       ; Load decimal 171 using binary notation.',
        '    ; mov eax, 0b10101011       ; Load decimal 171 using binary notation.\n    mov eax, 0b10101010       ; Load decimal 170 using binary notation.',
      ),
      [false, true, true, true],
    ],
    [source.replace('call print_uint', 'call print_hex'), [true, true, true, false]],
  ];
  for (const [code, expected] of variants) {
    const statuses = await page.evaluate(async (source) => {
      const { runSourceCheckTest } = await import('/x86-64-CSIS-118/src/testing/sourceChecks.ts');
      const { unit03Lab3aRegistersAssignment } = await import('/x86-64-CSIS-118/src/assignments/assignments.ts');
      return unit03Lab3aRegistersAssignment.tests.filter((test) => test.type === 'source-check')
        .map((test) => runSourceCheckTest(test, source).status === 'passed');
    }, code);
    expect(statuses, code).toEqual(expected);
  }
});

test('Lab 3A autosaves stay isolated, reset confirms, source downloads, and shared code wins', async ({ page, context }) => {
  await open(page);
  const starter = await editor(page).inputValue();
  const source = completed(starter);
  await editor(page).fill(source);
  await page.locator('#assignment-select').selectOption('unit01-hello-assembly');
  await expect(page.getByRole('button', { name: 'Copy Submission Link', exact: true })).toBeVisible();
  const unit1 = await editor(page).inputValue();
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
  await open(shared, link + '&assignment=unit01-hello-assembly');
  await expect(shared.locator('#assignment-select')).toHaveValue(id);
  await expect(editor(shared)).toHaveValue(source);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#assignment-select').selectOption(id);
  await page.getByRole('button', { name: 'Reset to Starter Code' }).click();
  await expect(editor(page)).toHaveValue(starter);
  await page.locator('#assignment-select').selectOption('unit01-hello-assembly');
  await expect(editor(page)).toHaveValue(unit1);
});

test('Lab 3A instructions and practice readouts support keyboard and all themes at desktop and narrow widths, and edits invalidate stale results', async ({ page }) => {
  await open(page);
  const source = completed(await editor(page).inputValue());
  await editor(page).fill(source);
  await page.getByRole('button', { name: 'Check My Work', exact: true }).click();
  await expect(results(page)).toContainText('6 / 6');
  for (const width of [1600, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1100 });
    for (const mode of ['dark', 'light', 'high-contrast']) {
      await page.getByRole('combobox', { name: 'Color theme' }).selectOption(mode);
      await expect(page.locator('.assignment__submitnote')).toContainText('Canvas File Upload');
      await expect(results(page)).toContainText('Download your final .asm source');
      await expect(results(page)).not.toContainText('Copy Submission Link');
      const trigger = page.getByRole('button', { name: /Instructions, submission, and grading/ });
      await trigger.focus();
      await trigger.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Unit 03 Lab 3A — General Purpose Registers' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('Submission in Canvas File Upload', { exact: true })).toBeAttached();
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
  await editor(page).fill(source.replace('0b10101011', '0b10101010'));
  await expect(results(page)).toContainText('Run Check My Work again');
  await expect(results(page).getByText('6 / 6')).toHaveCount(0);
  await page.getByRole('button', { name: 'Check My Work', exact: true }).click();
  await expect(results(page)).toContainText('4 / 6');
});
