const { test, expect } = require("@playwright/test");

async function resetGame(page) {
  await page.goto("/index.html");
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
}

test("instructor mode reveals answers and hints on the front page", async ({ page }) => {
  await resetGame(page);

  await page.click("#instructor-toggle");
  const panel = page.locator(".instructor-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Expected Answers");
  await expect(panel).toContainText("Risk Mapping");

  await page.click("[data-instructor-next]");
  await expect(page.locator("[data-instructor-hint]")).not.toHaveText("No hints available.");
});
