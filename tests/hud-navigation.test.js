const assert = require("node:assert");

const hud = require("../js/ui/hud.js");
const gameState = require("../js/engine/game-state.js");

const startState = gameState.createDefaultState();

const powerBeforeCompletion = hud.getCampaignGuide("power", startState);
assert.strictEqual(powerBeforeCompletion.message, "Complete Temple of Power to unlock Temple of Wisdom.", "power page should explain the next unlock before completion");
assert.strictEqual(powerBeforeCompletion.bannerTitle, "Next: Temple of Wisdom", "power page should surface the next destination in the banner before completion");
assert.strictEqual(powerBeforeCompletion.bannerKicker, "Recovery Route pending", "power page should show the pending route before completion");
assert.strictEqual(powerBeforeCompletion.actionLabel, "Continue to Temple of Wisdom", "power page should name the next destination before completion");
assert.strictEqual(powerBeforeCompletion.href, "wisdom.html", "power page should point to wisdom as the next destination");
assert.strictEqual(powerBeforeCompletion.showAction, false, "power page should hide the action until completion");
assert.strictEqual(powerBeforeCompletion.complete, false, "power page should not mark the banner as complete before completion");

const afterPower = gameState.cloneState(startState);
afterPower.power = true;
afterPower.rewards.lastTempleAward = { branch: "mastery" };

const powerAfterCompletion = hud.getCampaignGuide("power", afterPower);
assert.strictEqual(powerAfterCompletion.message, "Temple of Power restored on the mastery route. Next destination: Temple of Wisdom.", "power page should point to wisdom after completion");
assert.strictEqual(powerAfterCompletion.bannerTitle, "Next: Temple of Wisdom (Mastery Route)", "power page should surface a larger next-step banner after completion");
assert.strictEqual(powerAfterCompletion.bannerKicker, "Temple of Power restored", "power page should keep the completion kicker after completion");
assert.strictEqual(powerAfterCompletion.actionLabel, "Continue to Temple of Wisdom", "power page should keep the next action label after completion");
assert.strictEqual(powerAfterCompletion.href, "wisdom.html", "power page should keep the next route after completion");
assert.strictEqual(powerAfterCompletion.showAction, true, "power page should show the action after completion");
assert.strictEqual(powerAfterCompletion.complete, true, "power page should mark the banner complete after completion");

const afterVictory = gameState.cloneState(startState);
afterVictory.power = true;
afterVictory.wisdom = true;
afterVictory.courage = true;
afterVictory.rewards.finalVictoryAwarded = true;
afterVictory.rewards.lastTempleAward = { branch: "mastery" };

const finalComplete = hud.getCampaignGuide("final", afterVictory);
assert.strictEqual(finalComplete.message, "Lord Ganonix is defeated. Return to the Kingdom to finish the campaign.", "final battle should point back to the kingdom after victory");
assert.strictEqual(finalComplete.bannerTitle, "Campaign Complete: Return to Kingdom", "final battle should show the end-state banner after victory");
assert.strictEqual(finalComplete.bannerKicker, "Victory", "final battle should keep the victory kicker after completion");
assert.strictEqual(finalComplete.actionLabel, "Return to Kingdom", "final battle should offer a return action after victory");
assert.strictEqual(finalComplete.href, "index.html", "final battle should return to the kingdom after victory");
assert.strictEqual(finalComplete.showAction, true, "final battle should show the return action after victory");
assert.strictEqual(finalComplete.complete, true, "final battle should mark the banner complete after victory");

hud.resetGuideFocusState();
const focusCalls = [];
const mockLinkNode = {
	focus(options) {
		focusCalls.push(options || null);
	}
};

assert.strictEqual(hud.autoFocusGuide("power", powerBeforeCompletion, mockLinkNode), false, "incomplete guides should not auto-focus the next link");
assert.strictEqual(focusCalls.length, 0, "incomplete guides should not trigger focus calls");
assert.strictEqual(hud.autoFocusGuide("power", powerAfterCompletion, mockLinkNode), true, "completed guides should auto-focus the next link once");
assert.strictEqual(focusCalls.length, 1, "completed guides should focus once");
assert.strictEqual(hud.autoFocusGuide("power", powerAfterCompletion, mockLinkNode), false, "repeated updates should not refocus the same guide");
assert.strictEqual(focusCalls.length, 1, "repeated updates should not add more focus calls");

console.log("HUD navigation checks passed.");