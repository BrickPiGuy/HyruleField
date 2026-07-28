const { test, expect } = require("@playwright/test");

async function resetGame(page) {
  await page.goto("/index.html");
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
}

test("keyboard shortcuts work and skip link targets main landmark", async ({ page }) => {
  await resetGame(page);

  const skipLink = page.locator(".skip-link");
  await skipLink.focus();
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await page.keyboard.press("Alt+Shift+1");
  await expect(page.locator("#choice-result")).toContainText("kingdom stabilizes", { ignoreCase: true });

  await page.keyboard.press("Alt+Shift+Q");
  await expect(page.locator("#quiz-result")).toContainText("Choose an answer first.");
});
