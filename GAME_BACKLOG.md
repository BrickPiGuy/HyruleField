# HyruleField Robust Game Backlog

This backlog converts the current interactive site into a robust game product.

## Planning Assumptions

- Team: 1 developer, part-time design/content support.
- Stack: static GitHub Pages with modular JavaScript and JSON content.
- Estimation scale:
  - S = 0.5 to 1.5 days
  - M = 2 to 4 days
  - L = 5 to 8 days

## P0: Core Robustness (Must Have)

Target: 2 to 3 weeks

Current status:
- [x] P0-1 Rules Engine and Central State
- [x] P0-2 Save Versioning and Migration
- [x] P0-3 Mission Data Model
- [x] P0-4 Game HUD and Objective Tracker
- [x] P0-5 Robust Test Baseline

### P0-1 Rules Engine and Central State

- Priority: P0
- Estimate: L
- Goal: Move game rules out of UI handlers into a deterministic engine.
- Refactor files:
  - Create: js/engine/game-state.js
  - Create: js/engine/rules-engine.js
  - Create: js/engine/actions.js
  - Update: js/progress.js
  - Update: js/challenges.js
- Deliverables:
  - Typed-like state schema in plain JS with documented fields.
  - Single action dispatcher for all player actions.
  - Engine returns result events instead of mutating UI directly.
- Acceptance criteria:
  - No direct corruption math in page click handlers.
  - Every state change flows through one dispatcher.

### P0-2 Save Versioning and Migration

- Priority: P0
- Estimate: M
- Goal: Prevent save breakage when features change.
- Refactor files:
  - Create: js/engine/save-schema.js
  - Create: js/engine/migrations.js
  - Update: js/progress.js
  - Create: tests/save-migrations.test.js
- Deliverables:
  - saveVersion added to persisted state.
  - Migration pipeline from old versions to latest.
- Acceptance criteria:
  - Existing localStorage saves load safely after update.

### P0-3 Mission Data Model

- Priority: P0
- Estimate: L
- Goal: Convert hardcoded mission logic to content-driven definitions.
- Refactor files:
  - Create: data/missions/power.json
  - Create: data/missions/wisdom.json
  - Create: data/missions/courage.json
  - Create: data/missions/final-battle.json
  - Create: js/content/mission-loader.js
  - Update: js/challenges.js
- Deliverables:
  - Mission objectives, prerequisites, fail conditions, and rewards stored in JSON.
- Acceptance criteria:
  - At least one temple flow runs from mission data only.

### P0-4 Game HUD and Objective Tracker

- Priority: P0
- Estimate: M
- Goal: Consistent in-game HUD with active objective and status effects.
- Refactor files:
  - Create: js/ui/hud.js
  - Update: index.html
  - Update: power.html
  - Update: wisdom.html
  - Update: courage.html
  - Update: final-battle.html
  - Update: css/style.css
- Deliverables:
  - HUD component with corruption, objective, current mission phase, and rank preview.
- Acceptance criteria:
  - Objective always visible and updated on state transition.

### P0-5 Robust Test Baseline

- Priority: P0
- Estimate: M
- Goal: Test game rules, not only static file presence.
- Refactor files:
  - Update: tests/site.test.js
  - Create: tests/rules-engine.test.js
  - Create: tests/scoring.test.js
  - Update: package.json
- Deliverables:
  - Rules and scoring tests with deterministic fixtures.
- Acceptance criteria:
  - CI fails on rule regressions.

Implemented test files:
- tests/rules-engine.test.js
- tests/reducer-flow.test.js
- tests/reducer-failure-flow.test.js
- tests/save-migrations.test.js
- tests/missions-content.test.js

## P1: Game Depth and Replayability (Should Have)

Target: 2 to 4 weeks after P0

Current status:
- [x] P1-1 Scoring, Ranks, and Unlock Economy (implemented baseline + multiplier expansion)
- [x] P1-2 Branching Narrative Events
- [x] P1-3 Incident Cards and Daily Seed Mode
- [x] P1-4 Accessibility and Reduced Motion Pass
- [x] P1-5 End-to-End Regression Tests

### P1-1 Scoring, Ranks, and Unlock Economy

- Priority: P1
- Estimate: L
- Goal: Add structured progression and replay incentive.
- Refactor files:
  - Create: js/engine/scoring.js
  - Create: js/engine/rewards.js
  - Create: js/ui/rewards-panel.js
  - Update: js/progress.js
  - Update: index.html
  - Update: final-battle.html
  - Update: css/style.css
- Deliverables:
  - Score formula with speed, safety, and security multipliers.
  - Bronze, Silver, Gold, Legend temple ratings.
- Acceptance criteria:
  - Same mission can produce different ranks based on play quality.

### P1-2 Branching Narrative Events

- Priority: P1
- Estimate: M
- Goal: Add decision consequences that alter encounter order and dialogue.
- Refactor files:
  - Create: data/story/events.json
  - Create: js/content/story-engine.js
  - Create: js/ui/story-log.js
  - Update: js/challenges.js
  - Update: index.html
- Deliverables:
  - Branch conditions tied to action outcomes.
- Acceptance criteria:
  - At least 3 branches produce different event logs and outcomes.

### P1-3 Incident Cards and Daily Seed Mode

- Priority: P1
- Estimate: M
- Goal: Add randomized replay challenge mode.
- Refactor files:
  - Create: data/incidents/cards.json
  - Create: js/engine/random-seed.js
  - Create: js/engine/incidents.js
  - Create: js/ui/daily-mode.js
  - Update: index.html
- Deliverables:
  - Daily seed generated from date and mode.
- Acceptance criteria:
  - Same date + mode yields same incident order.

### P1-4 Accessibility and Reduced Motion Pass

- Priority: P1
- Estimate: M
- Goal: Ensure robust keyboard and reduced-motion support.
- Refactor files:
  - Update: css/style.css
  - Update: index.html
  - Update: power.html
  - Update: wisdom.html
  - Update: courage.html
  - Update: final-battle.html
  - Update: js/challenges.js
- Deliverables:
  - Focus-visible clarity, keyboard shortcuts, ARIA labels, reduced-motion media queries.
- Acceptance criteria:
  - Full game loop playable without mouse.

### P1-5 End-to-End Regression Tests

- Priority: P1
- Estimate: L
- Goal: Catch flow breakage across full mission path.
- Refactor files:
  - Create: tests/e2e/game-flow.spec.js
  - Create: tests/e2e/replay.spec.js
  - Create: tests/e2e/accessibility.spec.js
  - Update: package.json
  - Update: .github/workflows/ci.yml
- Deliverables:
  - Browser-based tests for core and failure paths.
- Acceptance criteria:
  - CI validates critical journeys on each pull request.

## P2: Product-Grade Operations (Nice to Have)

Target: 2 to 3 weeks after P1

### P2-1 Performance and Asset Pipeline

- Priority: P2
- Estimate: M
- Goal: Improve load speed and runtime smoothness.
- Refactor files:
  - Create: assets/backgrounds/
  - Create: assets/icons/
  - Update: css/style.css
  - Update: index.html
  - Update: package.json
  - Update: .github/workflows/ci.yml
- Deliverables:
  - Compressed assets, lazy loading where applicable, basic budget checks.
- Acceptance criteria:
  - Home page interactive in under 2 seconds on typical broadband.

### P2-1a Front Image Stretched on Front Page

- Priority: P2
- Estimate: S
- Goal: Make the front page hero image stretch cleanly across the available space.
- Refactor files:
  - Update: index.html
  - Update: css/style.css
- Deliverables:
  - Responsive full-width hero image treatment on the front page.
- Acceptance criteria:
  - The front image fills the intended area without distortion or layout shift.

### P2-2 Telemetry and Balance Dashboard Data

- Priority: P2
- Estimate: L
- Goal: Collect anonymous gameplay metrics for balancing.
- Refactor files:
  - Create: js/telemetry/events.js
  - Create: js/telemetry/session.js
  - Update: js/engine/actions.js
  - Update: js/challenges.js
  - Create: docs/telemetry-events.md
- Deliverables:
  - Event stream for mission starts, failures, retries, completions.
- Acceptance criteria:
  - Can export session metrics for balancing review.

### P2-3 Content Authoring Toolkit

- [x] P2-3 Content Authoring Toolkit (implemented)

### P2-4 Instructor Mode and Analytics View

- [x] P2-4 Instructor Mode and Analytics View

## Execution Order

1. Complete all P0 items before broad content expansion.
2. Start P1 only after rule engine and save migration are stable.
3. Run P2 in parallel with content additions once P1 tests are reliable.

## Suggested Sprint Split

- Sprint 1 (completed): P0-1, P0-2, P0-3, P0-4, P0-5
- Sprint 2 (in progress): P1-1, P1-2, P1-3 complete
- Sprint 3 (completed): P1-4 and P1-5
- Sprint 4 (completed): P2-1, P2-2, P2-3, and P2-4

## Definition of Done for the Robust Game

- All temple and battle rules run through a central engine.
- Mission content is data-driven, not hardcoded per page.
- Save data survives schema changes.
- Core and failure paths are covered by automated tests.
- Accessibility and reduced-motion support are complete.
- Deployment pipeline remains green with CI, security, and Pages deploy checks.
