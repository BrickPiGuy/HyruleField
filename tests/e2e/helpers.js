// Plays temple chambers through the real UI, using each puzzle's own solution from the
// mission JSON. Shared by the e2e specs.

async function solveChamber(page, puzzle) {
  const room = page.locator(`[data-puzzle-id="${puzzle.id}"]`);
  await room.waitFor();

  if (puzzle.type === "order") {
    for (let target = 0; target < puzzle.answer.length; target += 1) {
      const id = puzzle.answer[target];
      for (let guard = 0; guard < 12; guard += 1) {
        const ids = await room.locator("[data-order-id]").evaluateAll((nodes) => nodes.map((node) => node.dataset.orderId));
        const index = ids.indexOf(id);
        if (index <= target) {
          break;
        }
        await room.locator(`button[data-move="up"][data-id="${id}"]`).click();
      }
    }
  } else if (puzzle.type === "spot") {
    for (const index of puzzle.answer) {
      await room.locator(`[data-line="${index}"]`).click();
    }
  } else if (puzzle.type === "match") {
    for (const pair of puzzle.pairs) {
      await room.locator(`[data-left="${pair.left}"]`).click();
      await room.locator(`[data-right="${pair.right}"]`).click();
    }
  } else if (puzzle.type === "switches") {
    for (const entry of puzzle.switches) {
      if (puzzle.target[entry.id]) {
        await room.locator(`[data-switch="${entry.id}"]`).click();
      }
    }
  } else if (puzzle.type === "choice") {
    await room.locator(`[data-choice="${puzzle.answer}"]`).click();
  }

  await room.locator("[data-puzzle-check]").click();
}

async function clearTemple(page, temple) {
  const mission = await page.evaluate(async (name) => {
    const response = await fetch(`data/missions/${name}.json`);
    return response.json();
  }, temple);

  for (let index = 0; index < mission.trials.length; index += 1) {
    await solveChamber(page, mission.trials[index]);
    if (index + 1 < mission.trials.length) {
      await page.locator(".trial-next").click();
    }
  }
}

module.exports = { solveChamber, clearTemple };

// Opens a temple's finale without playing its chambers: restores the temples that open it
// and marks every chamber solved through the game's own dispatcher. For tests that only
// care about the finale. Call after any page of the site has loaded.
async function skipChambers(page, temple) {
  await page.evaluate(async (name) => {
    const response = await fetch(`data/missions/${name}.json`);
    const mission = await response.json();
    const types = window.HyruleActions.TYPES;
    (mission.requires || []).forEach((piece) => {
      window.HyruleEngine.dispatch({ type: types.COMPLETE_TEMPLE, piece });
    });
    mission.trials.forEach((puzzle) => {
      window.HyruleEngine.dispatch({ type: types.PUZZLE_SOLVED, temple: name, puzzleId: puzzle.id });
    });
  }, temple);
}

module.exports.skipChambers = skipChambers;
