import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const id = 'unit01-hello-assembly';
const launch = `index.html?assignment=${id}`;
const editor = (page) => page.locator('.prism-code-editor textarea');
const results = (page) => page.getByRole('region', { name: 'Check My Work results' });
// Windows stores native clipboard line breaks as CRLF. Compare the source's
// line structure while still checking every tab, space, and Unicode character.
const clipboardNewlines = (text) => text.replace(/\r\n/g, '\n');
const personalize = (source, name = 'Alex Rivera') => source
  .replaceAll('Your Name', name).replace('YYYY-MM-DD', '2026-10-11')
  .replace('Hello, Assembly!', 'Ready to learn assembly!')
  .replace('Print a greeting and my name, then finish successfully.', 'Introduce myself and welcome my class to assembly.')
  .replace('; Pass the address where the greeting begins.', '; RDI supplies the string address that print_line reads.');

async function open(page, url = launch) {
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'compile', exact: true })).toBeEnabled();
}

async function check(page) {
  await page.getByRole('button', { name: 'Check My Work', exact: true }).click();
  await expect(results(page).getByText(/\d \/ \d/)).toBeVisible();
}

async function report(page, source) {
  return page.evaluate(async (code) => {
    const { runAssignmentTests } = await import('/x86-64-CSIS-118/src/testing/AssignmentTestRunner.ts');
    const { unit01HelloAssignment } = await import('/x86-64-CSIS-118/src/assignments/assignments.ts');
    return runAssignmentTests(code, unit01HelloAssignment);
  }, source);
}

test.beforeEach(async ({ context }) => {
  await context.route('**/analytics.halb.it/**', (route) => route.fulfill({ body: '' }));
});

test('Copy Code below the share link copies exact current source in every theme and free practice', async ({ page, context }, testInfo) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page);
  const source = '; café / 李 / tabs and blank lines\n\n\tmov rbx, 42  \n\n';
  await editor(page).fill(source);
  for (const theme of ['dark', 'light', 'high-contrast']) {
    await page.getByRole('combobox', { name: 'Color theme' }).selectOption(theme);
    await page.getByRole('button', { name: 'Share', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Share', exact: true });
    const copyCode = dialog.getByRole('button', { name: 'Copy Code', exact: true });
    const linkBox = await dialog.locator('input[readonly]').boundingBox();
    const codeBox = await copyCode.boundingBox();
    expect(codeBox.y).toBeGreaterThan(linkBox.y + linkBox.height);
    await copyCode.click();
    await expect(dialog.getByRole('status')).toHaveText('Code copied to clipboard.');
    expect(clipboardNewlines(await page.evaluate(() => navigator.clipboard.readText()))).toBe(source);
    await page.screenshot({ path: testInfo.outputPath(`copy-code-${theme}.png`) });
    await page.keyboard.press('Escape');
    await expect(editor(page)).toHaveValue(source);
  }
  await page.locator('#assignment-select').selectOption('');
  await editor(page).fill('; Different free practice source\n');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Share', exact: true });
  await expect(dialog.locator('.copy-code__status')).toBeEmpty();
  await dialog.getByRole('button', { name: 'Copy Code', exact: true }).click();
  await expect(dialog.getByRole('status')).toHaveText('Code copied to clipboard.');
  expect(clipboardNewlines(await page.evaluate(() => navigator.clipboard.readText()))).toBe('; Different free practice source\n');
  await page.screenshot({ path: testInfo.outputPath('copy-code-mobile.png') });
});

test('Copy Code uses the legacy clipboard fallback inside the Share dialog and restores focus', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page);
  const source = await editor(page).inputValue();
  await page.evaluate(() => {
    window.readTestClipboard = navigator.clipboard.readText.bind(navigator.clipboard);
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Share', exact: true });
  const copyCode = dialog.getByRole('button', { name: 'Copy Code', exact: true });
  await copyCode.click();
  await expect(dialog.getByRole('status')).toHaveText('Code copied to clipboard.');
  expect(clipboardNewlines(await page.evaluate(() => window.readTestClipboard()))).toBe(source);
  await expect(copyCode).toBeFocused();
  await expect(dialog.locator('textarea')).toHaveCount(0);
});

test('Copy Code reports clipboard denial honestly and allows a successful retry', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page);
  const source = await editor(page).inputValue();
  await page.evaluate(() => {
    window.writeTestClipboard = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = async () => { throw new DOMException('Clipboard blocked', 'NotAllowedError'); };
    document.execCommand = () => false;
  });
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Share', exact: true });
  const copyCode = dialog.getByRole('button', { name: 'Copy Code', exact: true });
  await copyCode.click();
  await expect(dialog.getByRole('status')).toContainText('Could not copy code.');
  await expect(dialog.getByText('Code copied to clipboard.', { exact: true })).toHaveCount(0);
  await expect(copyCode).toBeEnabled();
  await page.evaluate(() => { navigator.clipboard.writeText = window.writeTestClipboard; });
  await copyCode.click();
  await expect(dialog.getByRole('status')).toHaveText('Code copied to clipboard.');
  expect(clipboardNewlines(await page.evaluate(() => navigator.clipboard.readText()))).toBe(source);
});

test('video display controls preserve code and results, persist on refresh, and work on mobile', async ({ page }, testInfo) => {
  await open(page);
  const source = await editor(page).inputValue();
  const size = page.getByRole('combobox', { name: 'Editor text size', exact: true });
  await expect(size).toHaveValue('16');
  await editor(page).press('Control+End');
  await page.keyboard.insertText('; video note');
  const selection = await editor(page).evaluate((el) => [el.selectionStart, el.selectionEnd]);
  await size.selectOption('24');
  await expect(editor(page)).toHaveCSS('font-size', '24px');
  await expect(page.locator('.pce-line').first()).toHaveCSS('font-size', '24px');
  await expect(editor(page)).toHaveValue(source + '; video note');
  expect(await editor(page).evaluate((el) => [el.selectionStart, el.selectionEnd])).toEqual(selection);
  await editor(page).press('Control+z');
  await expect(editor(page)).toHaveValue(source);
  await page.getByRole('button', { name: 'Increase editor text size' }).click();
  await expect(size).toHaveValue('26');
  await page.getByRole('button', { name: 'Decrease editor text size' }).click();
  await expect(size).toHaveValue('24');
  await size.selectOption('12');
  await expect(page.getByRole('button', { name: 'Decrease editor text size' })).toBeDisabled();
  await size.selectOption('72');
  await expect(page.getByRole('button', { name: 'Increase editor text size' })).toBeDisabled();
  await size.selectOption('24');

  await page.getByRole('button', { name: 'Check My Work', exact: true }).click();
  await expect(results(page)).toBeVisible();
  const editorViewport = page.locator('.pane__content').first();
  const editorHeight = await editorViewport.evaluate((el) => el.getBoundingClientRect().height);
  await page.getByRole('button', { name: 'Hide assignment details' }).click();
  const showDetails = page.getByRole('button', { name: 'Show assignment details' });
  await expect(showDetails).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#assignment-select')).toBeVisible();
  await expect(page.locator('#assignment-details')).toBeHidden();
  await expect(page.locator('#assignment-results')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Check My Work', exact: true })).toHaveCount(0);
  expect(await editorViewport.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(editorHeight);
  await expect(page.locator('#assignment-results')).toContainText('2 / 2');
  await page.screenshot({ path: testInfo.outputPath('video-display-desktop.png') });
  await showDetails.click();
  await expect(results(page)).toContainText('2 / 2');
  await expect(page.getByRole('button', { name: 'Hide assignment details' })).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Hide assignment details' }).click();
  await page.reload();
  await expect(showDetails).toBeVisible();
  await expect(size).toHaveValue('24');
  await expect(editor(page)).toHaveValue(source);
  await expect(editor(page)).toHaveCSS('font-size', '24px');

  await page.locator('#assignment-select').selectOption('');
  await expect(showDetails).toBeVisible();
  await page.locator('#assignment-select').selectOption(id);
  await expect(editor(page)).toHaveValue(source);
  await expect(page.locator('#assignment-details')).toBeHidden();
  await page.setViewportSize({ width: 500, height: 1000 });
  await expect(showDetails).toBeVisible();
  await expect(size).toHaveValue('24');
  await expect(editor(page)).toHaveCSS('font-size', '24px');
  await page.screenshot({ path: testInfo.outputPath('video-display-mobile.png') });
  await showDetails.click();
  await expect(page.getByRole('button', { name: 'Check My Work', exact: true })).toBeVisible();
});

test('invalid saved display preferences fall back to usable defaults', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('csis118b.display.assignmentDetailsCollapsed', '"false"');
    localStorage.setItem('csis118b.display.editorFontSize', '10000');
  });
  await open(page);
  await expect(page.getByRole('button', { name: 'Hide assignment details' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Editor text size', exact: true })).toHaveValue('16');
  await expect(editor(page)).toHaveCSS('font-size', '16px');
});

test('starter launches, compiles, and runs; personalization and instructor rubric remain visible', async ({ page }) => {
  await open(page);
  await expect(page.locator(`#assignment-select option[value="${id}"]`)).toHaveCount(1);
  await expect(page.locator('#assignment-select')).toHaveValue(id);
  await expect(page.locator('#assignment-select option')).toHaveText([
    'Free practice — no assignment', 'Unit 1 — My First Assembly Program', 'Unit 2A — Movie Showcase',
  ]);
  const source = await editor(page).inputValue();
  await page.getByRole('button', { name: 'Instructions, submission, and grading · 30 points' }).click();
  await expect(page.getByRole('heading', { name: 'Unit 1 — My First Assembly Program' })).toBeVisible();
  await expect(page.getByText('See the due date shown in Canvas', { exact: true })).toBeVisible();
  await expect(page.getByText(/Your instructor awards credit, including partial credit/)).toBeAttached();
  await page.getByRole('button', { name: 'Close assignment instructions' }).click();
  await page.getByRole('button', { name: 'compile', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Debug', exact: true })).toBeEnabled();
  const observed = await page.evaluate(async () => {
    const { blinkStore } = await import('/x86-64-CSIS-118/src/core/store.ts');
    return { exit: blinkStore.getInstance().stopReason.exitCode, mode: blinkStore.getAppState().mode };
  });
  expect(observed).toEqual({ exit: 0, mode: 'NASM_trunk' });
  await expect(page.locator('.term__codewrap')).toContainText('Hello, Assembly!\nProgrammer: Your Name');
  const checked = await report(page, source);
  expect(checked.results.map((r) => r.status)).toEqual(['passed', 'passed']);
  expect(checked.results[1].actual).toBe('Hello, Assembly!\nProgrammer: Your Name\n');
  expect(checked.pointsPossible).toBe(0);
  expect(checked.reminders).toHaveLength(3);
  await check(page);
  await expect(results(page)).toContainText('Personalization still needed');
});

test('real runner accepts personalization, catches compile/output/exit failures, and recovers after timeout', async ({ page }) => {
  test.setTimeout(300000);
  await open(page);
  const source = personalize(await editor(page).inputValue());
  for (const name of ['Alex Rivera', "Jean-Luc O’Neill", "D'Arcy", '李']) {
    const r = await report(page, source.replaceAll('Alex Rivera', name));
    expect(r.failed, JSON.stringify(r)).toBe(0);
    expect(r.blocked).toBe(0);
    expect(r.reminders).toEqual([]);
    expect(r.results[1].actual).toBe(`Ready to learn assembly!\nProgrammer: ${name}\n`);
  }
  const invalid = await report(page, source.replace('mov rbx, 42', 'invalid_mnemonic rbx, 42'));
  expect(invalid.results.map((r) => r.status)).toEqual(['failed', 'blocked']);
  expect(invalid.results[0].details.join('\n')).toMatch(/error|instruction/i);
  for (const [code, message] of [
    [source.replace('call print_line', '; omitted greeting output'), /exactly 2 nonempty/],
    [source.replace('Programmer: Alex Rivera', 'Programmer:   '), /Add your name/],
    [source.replace('Programmer: Alex Rivera', 'Author: Alex Rivera'), /Start the second message/],
    [source.replace('    exit ', '    mov rdi, 7\n    call exit_program '), /exit status 0; received 7/],
    [source.replace('    exit ', '    jmp $ '), /ran too long/],
  ]) {
    const r = await report(page, code);
    expect(r.results[1].status).toBe('failed');
    expect(r.results[1].message).toMatch(message);
  }
  expect((await report(page, source)).passed).toBe(2);
});

test('stdout checks preserve message content and never count stderr or compiler output', async ({ page }) => {
  await open(page);
  const original = personalize(await editor(page).inputValue());
  // Redirect the author write to stderr with a real Linux syscall.
  const stderrOnly = original.replace('    call print_line            ; Display the message and advance to a new line.',
    '    mov rax, 1\n    mov rdi, 2\n    mov rsi, author\n    mov rdx, 23\n    syscall');
  expect((await report(page, stderrOnly)).results[1].message).toMatch(/exactly 2 nonempty/);
  const compared = await page.evaluate(async () => {
    const { checkMessageLines, stripTerminalPrompt } = await import('/x86-64-CSIS-118/src/testing/stdoutCompare.ts');
    const contract = { count: 2, identifyingPrefix: 'Programmer:' };
    return {
      crlf: checkMessageLines('  Welcome!  \r\nProgrammer: D\'Arcy-Smith\r\n', contract),
      noFinal: checkMessageLines('Welcome!\nProgrammer: Alex', contract),
      extraBlank: checkMessageLines('Welcome!\n\nProgrammer: Alex\n', contract),
      prefixSpace: checkMessageLines('Welcome!\n Programmer: Alex\n', contract),
      prompt: stripTerminalPrompt('\n$ /program\n$ /program is my greeting\nProgrammer: Alex\n'),
    };
  });
  expect(compared.crlf).toBeNull();
  expect(compared.noFinal).toBeNull();
  expect(compared.extraBlank).toMatch(/exactly 2/);
  expect(compared.prefixSpace).toMatch(/Start the second/);
  expect(compared.prompt).toBe('$ /program is my greeting\nProgrammer: Alex\n');
});

test('Debug and Step observe RBX immediately after main load; checks leave paused state alone', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'compile', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Debug', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Debug', exact: true }).click();
  // Disassembly is expanded by default now (needed to set breakpoints there).
  const current = page.locator('.disass tr.current');
  for (let steps = 0; steps < 12; steps++) {
    if (/mov\s+(?:e|r)bx,\s*0x2a/i.test(await current.innerText())) break;
    await page.getByRole('button', { name: 'Step', exact: true }).click();
  }
  await expect(current).toContainText(/mov\s+(?:e|r)bx,\s*0x2a/i);
  await page.getByRole('button', { name: 'Step', exact: true }).click();
  // Registers with a sub-register breakdown (rax, rbx, ...) now render their
  // name as a button prefixed with a collapse/expand chevron (see
  // Registers.svelte), so match that optional leading glyph too.
  await expect(page.locator('.registers p').filter({ has: page.locator('.name', { hasText: /^[▸▾]?rbx$/ }) })).toContainText('0x2a');
  const checkpoint = await current.innerText();
  const source = await editor(page).inputValue();
  await check(page);
  await expect(current).toHaveText(checkpoint);
  await expect(editor(page)).toHaveValue(source);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled();
});

test('edits invalidate results, including edits during a running check', async ({ page }) => {
  await open(page);
  const source = personalize(await editor(page).inputValue());
  await editor(page).fill(source);
  await check(page);
  await editor(page).fill(source.replace('mov rbx, 42', 'invalid_mnemonic rbx, 42'));
  await expect(results(page)).toContainText('Run Check My Work again');
  await expect(results(page).getByText('2 / 2')).toHaveCount(0);
  await check(page);
  await expect(results(page)).toContainText('0 / 2');
  await editor(page).fill(source.replace('    exit ', '    jmp $ '));
  await page.getByRole('button', { name: 'Check My Work', exact: true }).click();
  await editor(page).fill(source);
  await page.locator('#assignment-select').selectOption('');
  await page.locator('#assignment-select').selectOption(id);
  await expect(page.getByRole('button', { name: 'Checking…', exact: true })).toBeDisabled();
  await expect(editor(page)).toHaveValue(source);
  await expect(results(page)).toContainText('after the previous run finishes');
  await expect(page.getByRole('button', { name: 'Check My Work', exact: true })).toBeEnabled();
  await expect(results(page)).toContainText('Run Check My Work again');
  await check(page);
  await expect(results(page)).toContainText('2 / 2');
});

test('save/open, refresh, revisit, reset confirmation, and free practice recovery', async ({ page }) => {
  await open(page);
  const starter = await editor(page).inputValue();
  const source = personalize(starter) + '; Keep this extra comment and blank lines.\n\n';
  await editor(page).fill(source);
  await page.locator('#assignment-select').selectOption('');
  await editor(page).fill('; Free practice notes\n');
  await page.locator('#assignment-select').selectOption(id);
  await expect(editor(page)).toHaveValue(source);
  await page.reload();
  await expect(editor(page)).toHaveValue(source);
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Reset to Starter Code' }).click();
  await expect(editor(page)).toHaveValue(source);
  await page.getByRole('button', { name: 'File options' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'Save .asm file' }).click();
  const downloaded = await downloadPromise;
  expect(await readFile(await downloaded.path(), 'utf8')).toBe(source);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reset to Starter Code' }).click();
  await expect(editor(page)).toHaveValue(starter);
  await page.locator('input[type=file][accept]').setInputFiles({ name: 'Rivera_Alex_U01.asm', mimeType: 'text/plain', buffer: Buffer.from(source) });
  await expect(editor(page)).toHaveValue(source);
  await page.locator('#assignment-select').selectOption('');
  await expect(editor(page)).toHaveValue('; Free practice notes\n');
  // Links to unreleased units use the existing unknown-assignment recovery.
  // Their saved code remains available if that same stable ID is reintroduced.
  await page.evaluate(async () => {
    const { autosave_save } = await import('/x86-64-CSIS-118/src/core/assignmentAutosave.ts');
    for (const assignmentId of ['unit02-register-arithmetic', 'unit03-branching']) {
      autosave_save(assignmentId, { editorContent: '; Saved draft unit work\n', mode: 'NASM_trunk' });
    }
  });
  for (const assignmentId of ['unit02-register-arithmetic', 'unit03-branching']) {
    await open(page, `index.html?assignment=${assignmentId}`);
    await expect(page.locator('#assignment-select')).toHaveValue('');
    await expect(editor(page)).toHaveValue('; Free practice notes\n');
    await expect(page.getByText('The requested assignment could not be found.', { exact: false })).toBeVisible();
    const saved = await page.evaluate(async (draftId) => {
      const { autosave_load } = await import('/x86-64-CSIS-118/src/core/assignmentAutosave.ts');
      return autosave_load(draftId);
    }, assignmentId);
    expect(saved.editorContent).toBe('; Saved draft unit work\n');
  }
});

test('share source wins over assignment starters/autosaves and legacy links remain compatible', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page);
  const source = personalize(await editor(page).inputValue()) + '\n' + Array.from(
    { length: 180 }, (_, i) => `; Keep comment ${i}: ${(i * 2654435761 >>> 0).toString(16)} / + & # ü\n`,
  ).join('');
  await editor(page).fill(source);
  await page.getByRole('button', { name: 'Copy Submission Link', exact: true }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain('/x86-64-CSIS-118/index.html?appstate=');
  expect(link.length).toBeGreaterThan(2048);
  await expect(page.getByText('Auto-saved at', { exact: false })).toBeVisible();
  // Give the receiving tab a conflicting autosave as well as a conflicting
  // URL assignment. The explicit shared payload must still win.
  await page.evaluate(async (assignmentId) => {
    const { autosave_save } = await import('/x86-64-CSIS-118/src/core/assignmentAutosave.ts');
    autosave_save(assignmentId, { editorContent: '; Older saved work\n', mode: 'NASM_trunk' });
  }, id);
  const shared = await context.newPage();
  await open(shared, `${link}&assignment=unit02-register-arithmetic`);
  await expect(editor(shared)).toHaveValue(source);
  await expect(shared.locator('#assignment-select')).toHaveValue(id);
  await shared.getByRole('button', { name: 'compile', exact: true }).click();
  await expect(shared.getByRole('button', { name: 'Debug', exact: true })).toBeEnabled();
  await expect(shared.locator('.term__codewrap')).toContainText('Ready to learn assembly!\nProgrammer: Alex Rivera');
  await expect(shared.getByText('Auto-saved at', { exact: false })).toBeVisible();
  await shared.reload();
  await expect(editor(shared)).toHaveValue(source);
  const legacy = await page.evaluate(async (code) => {
    const { compressStringToBase64 } = await import('/x86-64-CSIS-118/src/core/compression.ts');
    return compressStringToBase64(JSON.stringify({ magic: 'it.halb.x64', version: 1, data: { mode: 'NASM_trunk', editorContent: code } }));
  }, source);
  await open(shared, `index.html?appstate=${legacy}&assignment=${id}`);
  await expect(editor(shared)).toHaveValue(source);
  await expect(shared.locator('#assignment-select')).toHaveValue('');
});
