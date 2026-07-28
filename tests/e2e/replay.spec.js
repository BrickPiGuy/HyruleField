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

test("hidden workflow reveal supports repeated submissions", async ({ page }) => {
  await resetGame(page);

  await page.goto("/wisdom.html");
  await page.fill("#hidden-workflow-input", "Deploy every commit directly to production");

  await page.click("#hidden-workflow-check");
  await expect(page.locator("#hidden-workflow-result")).toContainText("clear all wards", { ignoreCase: true });

  await page.click("#hidden-workflow-check");
  await expect(page.locator("#hidden-workflow-result")).toContainText("Attempt 2", { ignoreCase: true });

  const securityFixButtons = page.locator("[data-security-card] button");
  const buttonCount = await securityFixButtons.count();
  for (let i = 0; i < buttonCount; i += 1) {
    await securityFixButtons.nth(i).click();
  }

  await page.click("#hidden-workflow-check");
  await expect(page.locator("#hidden-workflow-result")).toContainText("Wisdom restored", { ignoreCase: true });

  await page.click("#hidden-workflow-check");
  await expect(page.locator("#hidden-workflow-result")).toContainText("confirmed again", { ignoreCase: true });
});
