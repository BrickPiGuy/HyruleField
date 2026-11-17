const { test, expect } = require("@playwright/test");
const { clearTemple } = require("./helpers");

async function resetGame(page) {
  await page.goto("/index.html");
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
}

async function recoverUnsafeWorkflow(page) {
  await page.getByRole("radio", { name: "Deploy", exact: true }).click();
  await page.getByRole("radio", { name: "every commit", exact: true }).click();
  await page.getByRole("radio", { name: "directly to production", exact: true }).click();
  await page.getByRole("radio", { name: "tests, security scans, and review gates", exact: true }).click();
}

test("core journey restores all temples and wins final battle", async ({ page }) => {
  await resetGame(page);

  await page.click("#safe-path");
  await expect(page.locator("#choice-result")).toContainText("kingdom stabilizes", { ignoreCase: true });

  await page.check('input[name="kingdom-quiz"][value="build-test-scan-review-deploy"]');
  await page.click("#quiz-submit");
  await expect(page.locator("#quiz-result")).toContainText("Correct", { ignoreCase: true });

  await page.goto("/power.html");
  await clearTemple(page, "power");
  await expect(page.locator("#finale")).toBeVisible();
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
  await clearTemple(page, "wisdom");
  const securityFixButtons = page.locator("[data-security-card] button");
  const buttonCount = await securityFixButtons.count();
  for (let i = 0; i < buttonCount; i += 1) {
    await securityFixButtons.nth(i).click();
  }
  await recoverUnsafeWorkflow(page);
  await page.click("#hidden-workflow-check");
  await expect(page.locator("#hidden-workflow-result")).toContainText("Wisdom restored", { ignoreCase: true });

  await page.goto("/courage.html");
  await clearTemple(page, "courage");
  await page.click("#approve-release");
  await page.click("#deploy-release");
  await expect(page.locator("#courage-status")).toContainText("Temple of Courage restored.");

  for (const temple of ["fire", "water", "forest"]) {
    await page.goto(`/${temple}.html`);
    await clearTemple(page, temple);
    await expect(page.locator("#sage-reward")).toBeVisible();
  }

  await page.goto("/index.html");
  await expect(page.locator("#temple-count")).toContainText("6 / 6");

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
