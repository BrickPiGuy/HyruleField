const { test, expect } = require("@playwright/test");
const { solveChamber } = require("./helpers");

async function resetGame(page) {
  await page.goto("/index.html");
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
}

test("map points at the next quest and seals doors that are not open yet", async ({ page }) => {
  await resetGame(page);

  await expect(page.locator('[data-map-node="power"]')).toHaveAttribute("data-state", "next");
  await expect(page.locator('[data-map-node="wisdom"]')).toHaveAttribute("data-state", "locked");
  await expect(page.locator('[data-map-node="fire"]')).toHaveAttribute("data-state", "locked");
  await expect(page.locator('[data-map-node="final"]')).toHaveAttribute("data-state", "locked");

  await page.goto("/fire.html");
  await expect(page.getByRole("heading", { name: "The temple door is sealed" })).toBeVisible();
});

test("restoring Power opens Wisdom and the three sage temples", async ({ page }) => {
  await resetGame(page);
  await page.evaluate(() => {
    window.HyruleEngine.dispatch({ type: window.HyruleActions.TYPES.COMPLETE_TEMPLE, piece: "power" });
  });
  await page.goto("/index.html");

  for (const key of ["wisdom", "fire", "water", "forest"]) {
    await expect(page.locator(`[data-map-node="${key}"]`)).not.toHaveAttribute("data-state", "locked");
  }
});

test("wrong answers show feedback, count a slip, and offer a hint after two misses", async ({ page }) => {
  await resetGame(page);
  await page.evaluate(() => {
    window.HyruleEngine.dispatch({ type: window.HyruleActions.TYPES.COMPLETE_TEMPLE, piece: "power" });
  });
  await page.goto("/fire.html");

  const room = page.locator(".puzzle-room");
  await expect(room).toBeVisible();
  await room.locator("[data-puzzle-check]").click();
  await expect(room.locator("[data-puzzle-feedback]")).toContainText("in the right place");
  await expect(page.locator("[data-trial-slips]")).toHaveText("Slips: 1");
  await expect(room.locator("[data-puzzle-hint-text]")).toBeHidden();

  await room.locator("[data-puzzle-check]").click();
  await expect(page.locator("[data-trial-slips]")).toHaveText("Slips: 2");
  await expect(room.locator("[data-puzzle-hint-text]")).toBeVisible();
});

test("chamber progress is saved across a reload", async ({ page }) => {
  await resetGame(page);
  await page.evaluate(() => {
    window.HyruleEngine.dispatch({ type: window.HyruleActions.TYPES.COMPLETE_TEMPLE, piece: "power" });
  });
  await page.goto("/water.html");

  const mission = await page.evaluate(async () => (await fetch("data/missions/water.json")).json());
  await solveChamber(page, mission.trials[0]);
  await page.locator(".trial-next").click();
  await expect(page.locator('.trial-pip[data-state="current"]')).toHaveAttribute("aria-label", /Chamber 2/);

  await page.reload();
  await expect(page.locator('.trial-pip[data-state="current"]')).toHaveAttribute("aria-label", /Chamber 2/);
  await expect(page.locator('.trial-pip[data-state="done"]')).toHaveCount(1);
});
