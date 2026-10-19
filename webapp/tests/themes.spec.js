import { test, expect } from '@playwright/test';

const editor = (page) => page.locator('.prism-code-editor textarea');
const theme = (page) => page.getByRole('combobox', { name: 'Color theme' });

test.beforeEach(async ({ page, context }) => {
  await context.route('**/analytics.halb.it/**', (route) => route.fulfill({ body: '' }));
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('index.html?assignment=unit01-hello-assembly');
  await expect(page.getByRole('button', { name: 'compile', exact: true })).toBeEnabled();
});

test('Dark remains the default and restores the original palette after theme switching', async ({ page }) => {
  const readColors = () => page.evaluate(() => ({
    body: getComputedStyle(document.body).backgroundColor,
    text: getComputedStyle(document.body).color,
    editor: getComputedStyle(document.querySelector('.prism-code-editor')).backgroundColor,
    comment: getComputedStyle(document.querySelector('.token.comment')).color,
    scheme: getComputedStyle(document.documentElement).colorScheme,
  }));
  await expect(theme(page)).toHaveValue('dark');
  const dark = await readColors();
  expect(dark).toEqual({ body: 'rgb(40, 44, 56)', text: 'rgb(208, 213, 223)',
    editor: 'rgb(13, 17, 23)', comment: 'rgb(139, 148, 158)', scheme: 'dark' });
  await theme(page).selectOption('light');
  await expect(page.locator('.prism-code-editor')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  await theme(page).selectOption('high-contrast');
  await expect(page.locator('.prism-code-editor')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await theme(page).selectOption('dark');
  expect(await readColors()).toEqual(dark);
});

test('theme changes preserve editing, persist with video settings, and work on mobile', async ({ page }, testInfo) => {
  const source = await editor(page).inputValue();
  await editor(page).press('Control+End');
  await page.keyboard.insertText('; theme note');
  const caret = await editor(page).evaluate((el) => el.selectionStart);
  await page.getByRole('combobox', { name: 'Editor text size', exact: true }).selectOption('24');
  await page.getByRole('button', { name: 'Hide assignment details' }).click();
  for (const mode of ['light', 'high-contrast']) {
    await theme(page).selectOption(mode);
    await expect(editor(page)).toHaveValue(source + '; theme note');
    expect(await editor(page).evaluate((el) => el.selectionStart)).toBe(caret);
    await expect(editor(page)).toHaveCSS('font-size', '24px');
    await expect(page.getByRole('button', { name: 'Show assignment details' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`${mode}-desktop.png`) });
  }
  await editor(page).press('Control+z');
  await expect(editor(page)).toHaveValue(source);
  await page.reload();
  await expect(theme(page)).toHaveValue('high-contrast');
  await expect(editor(page)).toHaveValue(source);
  await expect(editor(page)).toHaveCSS('font-size', '24px');
  await expect(page.getByRole('button', { name: 'Show assignment details' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(theme(page)).toHaveValue('high-contrast');
  await expect(theme(page)).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('high-contrast-mobile.png') });
  await theme(page).selectOption('light');
  await page.reload();
  await expect(theme(page)).toHaveValue('light');
  await expect(editor(page)).toHaveValue(source);
  await page.screenshot({ path: testInfo.outputPath('light-mobile.png') });
});

test('Light and High Contrast keep syntax, panels, menus, and portalled dialogs readable', async ({ page }, testInfo) => {
  for (const [mode, minimum] of [['light', 4.5], ['high-contrast', 7]]) {
    await theme(page).selectOption(mode);
    const measured = await page.evaluate(() => {
      const rgb = (color) => color.match(/[\d.]+/g).slice(0, 3).map(Number);
      const luminance = (color) => rgb(color).map((c) => {
        c /= 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
      const ratio = (foreground, background) => {
        const a = luminance(foreground), b = luminance(background);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      };
      const codeBackground = getComputedStyle(document.querySelector('.prism-code-editor')).backgroundColor;
      const samples = [...document.querySelectorAll('.prism-code-editor .token')].map((el) => ({
        name: el.className, ratio: ratio(getComputedStyle(el).color, codeBackground),
      }));
      for (const selector of ['.assignment__label', '.assignment__description', '.branding__subtitle', '.registers .name']) {
        const el = document.querySelector(selector);
        let parent = el;
        while (getComputedStyle(parent).backgroundColor === 'rgba(0, 0, 0, 0)') parent = parent.parentElement;
        samples.push({ name: selector, ratio: ratio(getComputedStyle(el).color, getComputedStyle(parent).backgroundColor) });
      }
      return samples;
    });
    expect(measured.length).toBeGreaterThan(30);
    for (const sample of measured) expect(sample.ratio, `${mode}: ${sample.name}`).toBeGreaterThanOrEqual(minimum);
    await page.getByRole('button', { name: 'File options' }).click();
    await expect(page.getByRole('menu')).toHaveCSS('background-color', mode === 'light' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Instructions, submission, and grading/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveCSS('background-color', mode === 'light' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)');
    await expect(dialog).toHaveCSS('color', mode === 'light' ? 'rgb(37, 48, 65)' : 'rgb(255, 255, 255)');
    await page.screenshot({ path: testInfo.outputPath(`${mode}-instructions.png`) });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'About', exact: true }).click();
    await expect(page.locator('.about-dialog__title')).toHaveCSS('color', mode === 'light' ? 'rgb(255, 255, 255)' : 'rgb(255, 255, 0)');
    await page.keyboard.press('Escape');
  }
  await theme(page).focus();
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineColor);
  expect(outline).toBe('rgb(0, 255, 255)');
});

test('invalid saved themes safely recover to Dark', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('csis118b.display.theme', '"unknown-theme"'));
  await page.reload();
  await expect(theme(page)).toHaveValue('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('theme switching keeps the paused debugger intact and themes live disassembly and terminal output', async ({ page }, testInfo) => {
  await page.getByRole('button', { name: 'compile', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Debug', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Debug', exact: true }).click();
  // Disassembly is expanded by default now (needed to set breakpoints there).
  await page.getByRole('button', { name: /Expand Stack memory/i }).click();
  const current = page.locator('.disass tr.current');
  await expect(current).toBeVisible();
  const checkpoint = await current.innerText();
  const registers = await page.locator('.registers').innerText();
  const source = await editor(page).inputValue();
  for (const mode of ['light', 'high-contrast']) {
    await theme(page).selectOption(mode);
    await expect(current).toHaveText(checkpoint);
    await expect(page.locator('.registers')).toHaveText(registers, { useInnerText: true });
    await expect(editor(page)).toHaveValue(source);
    await expect(page.locator('.disass .str').first()).toHaveCSS('color', mode === 'light' ? 'rgb(17, 24, 39)' : 'rgb(255, 255, 255)');
    await expect(current).toHaveCSS('background-color', mode === 'light' ? 'rgb(220, 233, 255)' : 'rgb(32, 32, 32)');
    await page.screenshot({ path: testInfo.outputPath(`${mode}-debugger.png`) });
  }
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.term__codewrap')).toContainText('Hello, Assembly!\nProgrammer: Your Name');
  await expect(page.locator('.term .exitcodeinfo')).toContainText('Exit(0)');
  await expect(page.locator('.term .exitcodeinfo')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await theme(page).selectOption('light');
  await expect(page.locator('.term')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('.term .exitcodeinfo')).toHaveCSS('background-color', 'rgb(255, 240, 235)');
});
