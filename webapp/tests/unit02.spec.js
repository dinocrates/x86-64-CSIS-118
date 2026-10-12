import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const id = 'unit02-movie-showcase';
const launch = `index.html?assignment=${id}`;
const editor = (page) => page.locator('.prism-code-editor textarea');
const results = (page) => page.getByRole('region', { name: 'Check My Work results' });
const records = [
  ['Star Wars: Episode IV', '1977', 'George Lucas'],
  ["L'été; café / 李", '0001', "D'Arcy & Jean-Luc O’Neill"],
  ['A title with: punctuation!', '9999', 'Director One, Director Two'],
];
const output = records.map(([title, year, director]) => `Title: ${title}\nYear: ${year}\nDirector: ${director}`).join('\n\n') + '\n';

// Complete arbitrary fixture exists only in tests, never in student content.
function completed(starter) {
  const data = records.slice(1).map((values, index) => {
    const letter = String.fromCharCode(66 + index);
    return ['Title', 'Year', 'Director'].map((field, i) =>
      `    movie${field}${letter} db "${field}: ${values[i]}", 0`).join('\n');
  }).join('\n');
  const code = ['B', 'C'].map((letter) => `    ; Movie ${letter}: display this movie's fields.\n    call print_newline\n` +
    ['Title', 'Year', 'Director'].map((field) => `    mov rdi, movie${field}${letter}\n    call print_line`).join('\n')).join('\n');
  return starter.replace('Your Name', 'Alex Rivera').replace('YYYY-MM-DD', '2026-10-11')
    .replace('One movie now; expand this program to display three movies.', 'Three movie records with blank lines between them.')
    .replace('    ; TODO: Add separate title, year, and director strings for B and C.', data)
    .replace(/    ; TODO: Print a blank line,[\s\S]*?    exit/, `${code}\n\n    exit`);
}

async function open(page, url = launch) {
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'compile', exact: true })).toBeEnabled();
}

async function report(page, source, timeoutMs) {
  return page.evaluate(async ({ source, timeoutMs }) => {
    const { runAssignmentTests } = await import('/x86-64-CSIS-118/src/testing/AssignmentTestRunner.ts');
    const { unit02MovieShowcaseAssignment: assignment } = await import('/x86-64-CSIS-118/src/assignments/assignments.ts');
    const config = timeoutMs ? { ...assignment, tests: assignment.tests.map((test) => ({ ...test, timeoutMs })) } : assignment;
    return runAssignmentTests(source, config);
  }, { source, timeoutMs });
}

test.beforeEach(async ({ context }) => {
  await context.route('**/analytics.halb.it/**', (route) => route.fulfill({ body: '' }));
});

test('movie starter runs exactly one movie and gives formative feedback', async ({ page }) => {
  await open(page);
  const starter = await editor(page).inputValue();
  expect(starter).toMatch(/^; Name: Your Name\n/);
  expect(starter).not.toMatch(/movie(?:Title|Year|Director)[BC]/);
  await page.getByRole('button', { name: 'compile', exact: true }).click();
  await expect(page.locator('.term__codewrap')).toContainText('Title: Star Wars: Episode IV\nYear: 1977\nDirector: George Lucas');
  await expect(page.locator('.term .exitcodeinfo')).toContainText('Exit(0)');
  const checked = await report(page, starter);
  expect(checked.results.map((test) => test.status)).toEqual(['passed', 'failed', 'passed', 'failed']);
  expect(checked.results[3].actual).toBe('Title: Star Wars: Episode IV\nYear: 1977\nDirector: George Lucas\n');
  expect(checked.results[3].message).toMatch(/exactly 3 movie records; found 1/);
  expect(checked.results[1].message).toContain('movieDirectorC');
  expect(checked.reminders).toHaveLength(2);
  expect(checked.pointsPossible).toBe(0);
  expect(checked.results.every((test) => test.pointsPossible === undefined)).toBe(true);
});

test('real movie runner accepts personalized fixture, blocks assembly errors, rejects exits, and recovers after timeout', async ({ page }) => {
  test.setTimeout(300000);
  await open(page);
  const source = completed(await editor(page).inputValue());
  const good = await report(page, source);
  expect(good.passed, JSON.stringify(good)).toBe(4);
  expect(good.reminders).toEqual([]);
  expect(good.results[3].actual).toBe(output);
  const placeholder = await report(page, source.replace('Alex Rivera', 'Your Name').replace('2026-10-11', 'YYYY-MM-DD'));
  expect(placeholder.passed).toBe(4);
  expect(placeholder.reminders).toHaveLength(2);
  const broken = await report(page, source.replace('mov rdi, movieTitleA', 'invalid_mnemonic rdi, movieTitleA'));
  expect(broken.results.map((test) => test.status)).toEqual(['failed', 'passed', 'passed', 'blocked']);
  for (const [code, message] of [
    [source.replace('    exit', '    mov rdi, 7\n    call exit_program'), /exit status 0; received 7/],
    [source.replace('    exit', '    jmp $'), /ran too long/],
  ]) {
    const checked = await report(page, code, 800);
    expect(checked.results[3].status).toBe('failed');
    expect(checked.results[3].message).toMatch(message);
  }
  expect((await report(page, source)).passed).toBe(4);
});

test('movie output contract handles formatting and rejects incomplete or extra output without restricting movie choices', async ({ page }) => {
  await open(page);
  const cases = [
    [output, null],
    [output.replaceAll('\n', '\r\n'), null],
    [output.replaceAll('\n', '\r'), null],
    [output.trimEnd(), null],
    ['\n\n' + output.replaceAll('\n', ' \t\n').replaceAll('\n \t\n', '\n\n\n') + '\n', null],
    [output.replace('A title with: punctuation!', "L'été; café / 李"), null], // distinct remake, same title
    [output.split('\n\n')[0], /found 1/],
    [output.split('\n\n').slice(0, 2).join('\n\n'), /found 2/],
    [output + '\nTitle: Fourth\nYear: 2000\nDirector: Four\n', /found 4/],
    [output.replace("Director: D'Arcy & Jean-Luc O’Neill\n", ''), /Movie B needs a nonempty Director:/],
    [output.replace("Title: L'été; café / 李", 'Title:   '), /Movie B needs a nonempty Title:/],
    [output.replace('Year: 0001', 'Year: 01'), /Movie B needs a four-digit/],
    [output.replace('Year: 0001', 'Year: １２３４'), /four-digit/],
    [output.replace('Year: 0001', 'year: 0001'), /Year:/],
    [output.replace("Title: L'été; café / 李\nYear: 0001", "Year: 0001\nTitle: L'été; café / 李"), /order/],
    [Array(3).fill(output.split('\n\n')[0]).join('\n\n'), /Movie B repeats an identical/],
    [output.replaceAll('\n\n', '\n'), /Add a blank line/],
    [output + 'Goodbye\n', /extra lines/],
    ['Prompt\n\n' + output, /Movie A needs/],
    ['', /found 0/],
  ];
  for (const [stdout, expected] of cases) {
    const problem = await page.evaluate(async (stdout) => {
      const { checkMovieRecords } = await import('/x86-64-CSIS-118/src/testing/stdoutCompare.ts');
      return checkMovieRecords(stdout, { count: 3 });
    }, stdout);
    if (expected === null) expect(problem, stdout).toBeNull();
    else expect(problem, stdout).toMatch(expected);
  }
});

test('movie source checks accept optional colons and section attributes and ignore literal/comment lookalikes', async ({ page }) => {
  await open(page);
  const source = completed(await editor(page).inputValue());
  const variants = [
    [source, [true, true]],
    [source.replace(/\b(movie(?:Title|Year|Director)[ABC]):?[ \t]+db /g, '$1: DB ').replace('section .data', '  SECTION   .DATA align=8').replace('section .text', '[SECTION .TEXT align=16]'), [true, true]],
    [source.replace('movieTitleB db', '; movieTitleB db'), [false, true]],
    [source.replace('movieTitleB db', 'movietitleB db'), [false, true]],
    [source.replace('movieTitleB db', 'movieTitleB dq'), [false, true]],
    [source.replace('movieTitleB db', 'movieTitleB: movieYearB: db'), [false, true]],
    [source + '\nmovieTitleB db "Title: duplicate", 0', [false, true]],
    [source.replace('movieTitleB db', 'otherLabel db') + '\n; movieTitleB db "fake", 0\nfake db "movieTitleB: db", 0', [false, true]],
    [source + '\n; section .data\nfake db "section .data; section .text", 0\nother db `section .text; \\`movieTitleB db`, 0', [true, true]],
    [source + '\nsection .DATA align=8', [true, false]],
    [source.replace('section .text', '; section .text'), [true, false]],
    [source.replace('section .data', 'section .data ; section .text').replaceAll('\n', '\r\n'), [true, true]],
  ];
  for (const [code, expected] of variants) {
    const statuses = await page.evaluate(async (source) => {
      const { runSourceCheckTest } = await import('/x86-64-CSIS-118/src/testing/sourceChecks.ts');
      const { unit02MovieShowcaseAssignment } = await import('/x86-64-CSIS-118/src/assignments/assignments.ts');
      return unit02MovieShowcaseAssignment.tests.filter((test) => test.type === 'source-check')
        .map((test) => runSourceCheckTest(test, source).status === 'passed');
    }, code);
    expect(statuses, code).toEqual(expected);
  }
});

test('Unit 02 autosaves stay isolated, reset confirms, source downloads, and shared code wins', async ({ page, context }) => {
  await open(page);
  const starter = await editor(page).inputValue();
  const source = completed(starter);
  await editor(page).fill(source);
  await page.locator('#assignment-select').selectOption('unit01-hello-assembly');
  await expect(page.getByRole('button', { name: 'Copy Submission Link', exact: true })).toBeVisible();
  await expect(page.locator('.assignment__submitnote')).toContainText('Canvas Text Entry');
  const unit1 = await editor(page).inputValue();
  await editor(page).fill(unit1 + '; Keep Unit 1 notes\n');
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
  // Conflicting saved source and query must not replace explicit shared source.
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
  await page.reload();
  await expect(editor(page)).toHaveValue(starter);
  await page.locator('#assignment-select').selectOption('unit01-hello-assembly');
  await expect(editor(page)).toHaveValue(unit1 + '; Keep Unit 1 notes\n');
  await page.locator('#assignment-select').selectOption('');
  await expect(editor(page)).toHaveValue('; Free practice\n');
});

test('movie instructions and practice readouts support keyboard and all themes at desktop and narrow widths', async ({ page }, testInfo) => {
  await open(page);
  await page.getByRole('button', { name: 'Check My Work', exact: true }).click();
  await expect(results(page)).toContainText('2 / 4');
  for (const width of [1600, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1100 });
    for (const mode of ['dark', 'light', 'high-contrast']) {
      await page.getByRole('combobox', { name: 'Color theme' }).selectOption(mode);
      await expect(page.locator('.assignment__submitnote')).toContainText('Canvas File Upload');
      await expect(results(page)).toContainText('Download your final .asm source');
      await expect(results(page)).not.toContainText('Copy Submission Link');
      const summary = results(page).locator('summary').last();
      await summary.focus();
      await summary.press('Enter');
      await expect(results(page).getByText(/Print exactly 3 movie records/)).toBeVisible();
      await summary.press('Enter');
      const trigger = page.getByRole('button', { name: /Instructions, submission, and grading/ });
      await trigger.focus();
      await trigger.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Unit 2A — Movie Showcase' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('Submission in Canvas File Upload', { exact: true })).toBeAttached();
      await expect(dialog).not.toContainText('Screenshots are not required');
      const region = dialog.getByRole('region', { name: 'Assignment instructions' });
      await region.focus();
      await region.press('End');
      await expect.poll(() => region.evaluate((el) =>
        el.scrollTop + el.clientHeight >= el.scrollHeight - 2)).toBe(true);
      const box = await dialog.boundingBox();
      expect(box.width).toBeLessThanOrEqual(width);
      await page.screenshot({ path: testInfo.outputPath(`movie-${mode}-${width}.png`) });
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
  }
});
