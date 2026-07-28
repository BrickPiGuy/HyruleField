const { test, expect } = require("@playwright/test");

async function resetGame(page) {
  await page.goto("/index.html");
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
}

test("reckless and incomplete path fails final battle", async ({ page }) => {
  await resetGame(page);

  await page.click("#reckless-path");
  await expect(page.locator("#choice-result")).toContainText("chaos", { ignoreCase: true });

  await page.goto("/final-battle.html");
  await page.click("#finish-battle");

  await expect(page.locator("#battle-result")).toContainText("Ganonix resists");
  await expect(page.locator("#certificate")).toHaveClass(/hidden/);
});
