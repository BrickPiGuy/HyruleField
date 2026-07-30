const { test, expect } = require("@playwright/test");

async function resetGame(page) {
  await page.goto("/index.html");
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
}

test("core journey restores all temples and wins final battle", async ({ page }) => {
  await resetGame(page);

  await page.click("#safe-path");
  await expect(page.locator("#choice-result")).toContainText("kingdom stabilizes", { ignoreCase: true });

  await page.check('input[name="kingdom-quiz"][value="build-test-scan-review-deploy"]');
  await page.click("#quiz-submit");
  await expect(page.locator("#quiz-result")).toContainText("Correct", { ignoreCase: true });

  await page.goto("/power.html");
  await page.click("#run-ci");
  await expect.poll(async () => page.evaluate(() => {
    const raw = localStorage.getItem("devopsTriforceState");
    if (!raw) {
      return false;
    }

    try {
      const parsed = JSON.parse(raw);
      return Boolean(parsed.power);
    } catch (_error) {
      return false;
    }
  }), { timeout: 15000 }).toBe(true);
  await expect(page.locator("#power-status")).toContainText("Temple of Power restored.", { timeout: 5000 });

  await page.goto("/wisdom.html");
  const securityFixButtons = page.locator("[data-security-card] button");
  const buttonCount = await securityFixButtons.count();
  for (let i = 0; i < buttonCount; i += 1) {
    await securityFixButtons.nth(i).click();
  }
  await page.selectOption("#hidden-workflow-action", "Deploy");
  await page.selectOption("#hidden-workflow-frequency", "every commit");
  await page.selectOption("#hidden-workflow-destination", "directly to production");
  await page.selectOption("#hidden-workflow-gates", "tests, security scans, and review gates");
  await page.click("#hidden-workflow-check");
  await expect(page.locator("#hidden-workflow-result")).toContainText("Wisdom restored", { ignoreCase: true });

  await page.goto("/courage.html");
  await page.click("#approve-release");
  await page.click("#deploy-release");
  await expect(page.locator("#courage-status")).toContainText("Temple of Courage restored.");

  await page.goto("/final-battle.html");
  const checklist = page.locator("input[data-final-task]");
  const checklistCount = await checklist.count();
  for (let i = 0; i < checklistCount; i += 1) {
    await checklist.nth(i).check();
  }
  await page.click("#finish-battle");

  await expect(page.locator("#battle-result")).toContainText("Victory", { ignoreCase: true });
  await expect(page.locator("#certificate")).not.toHaveClass(/hidden/);
});
