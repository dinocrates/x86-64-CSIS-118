import { test, expect } from '@playwright/test';

test('built Pages app loads its assets and runs Unit 1 at the repository subpath', async ({ page, context }) => {
  const errors = [];
  const failedAssets = [];
  const loadedAssets = [];
  await context.route('**/analytics.halb.it/**', (route) => route.fulfill({ body: '' }));
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    // The bundled Blink engine logs these unsupported optional Linux calls
    // during NASM/ld startup even when assembly/linking succeed (baseline).
    const knownBlinkWarning = /^warning: unsupported syscall: __syscall_(mprotect|prlimit64|getrusage)\s*$/.test(message.text());
    if (message.type() === 'error' && !knownBlinkWarning) errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.url().startsWith('http://127.0.0.1:4174/')) {
      if (response.status() >= 400) failedAssets.push(response.url());
      if (/\.(wasm|elf)(?:\?|$)/.test(response.url())) loadedAssets.push(response.url());
    }
  });
  await page.goto('index.html?assignment=unit01-hello-assembly');
  await expect(page.locator('#assignment-select')).toHaveValue('unit01-hello-assembly');
  await expect(page.getByRole('button', { name: 'compile', exact: true })).toBeEnabled();
  await page.getByRole('combobox', { name: 'Color theme' }).selectOption('light');
  await expect(page.locator('.prism-code-editor')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.getByRole('button', { name: 'compile', exact: true }).click();
  await expect(page.locator('.term__codewrap')).toContainText('Hello, Assembly!\nProgrammer: Your Name');
  await expect(page.locator('.exitcodeinfo')).toContainText('Exit(0)');
  await page.getByRole('combobox', { name: 'Color theme' }).selectOption('high-contrast');
  await expect(page.locator('.prism-code-editor')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await page.getByRole('button', { name: 'Check My Work', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Check My Work results' })).toContainText('2 / 2');
  await page.getByRole('button', { name: /Instructions, submission, and grading/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Unit 1 — My First Assembly Program' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('region', { name: 'Assignment instructions' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  const source = await page.locator('.prism-code-editor textarea').inputValue();
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const share = page.getByRole('dialog', { name: 'Share', exact: true });
  await share.getByRole('button', { name: 'Copy Code', exact: true }).click();
  await expect(share.getByRole('status')).toHaveText('Code copied to clipboard.');
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(source);
  await page.keyboard.press('Escape');
  await page.getByRole('combobox', { name: 'Editor text size', exact: true }).selectOption('28');
  await expect(page.locator('.prism-code-editor textarea')).toHaveCSS('font-size', '28px');
  await expect(page.locator('.prism-code-editor textarea')).toHaveValue(source);
  await page.getByRole('button', { name: 'Hide assignment details' }).click();
  await expect(page.locator('#assignment-select')).toBeVisible();
  await expect(page.locator('#assignment-results')).toBeHidden();
  await page.getByRole('button', { name: 'Show assignment details' }).click();
  await expect(page.getByRole('region', { name: 'Check My Work results' })).toContainText('2 / 2');
  expect(loadedAssets.some((url) => url.endsWith('.wasm'))).toBe(true);
  expect(loadedAssets.filter((url) => url.endsWith('.elf')).length).toBeGreaterThanOrEqual(2);
  expect(loadedAssets.every((url) => new URL(url).pathname.startsWith('/x86-64-CSIS-118/assets/'))).toBe(true);
  expect(failedAssets).toEqual([]);
  expect(errors).toEqual([]);
});
