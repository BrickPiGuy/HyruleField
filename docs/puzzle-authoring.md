# Puzzle Authoring

How to add or change chambers (puzzles) inside a temple. Each temple's chambers live in its mission file at `data/missions/<temple>.json` under `trials`.

The shared logic is in `js/puzzles/puzzle-engine.js` (checking answers, validation), the rendering is in `js/ui/puzzle-ui.js`, and the chamber flow is in `js/ui/temple-runner.js`.

## Puzzle types

| Type | Player does | Extra fields | `answer` shape |
|---|---|---|---|
| `order` | Reorders steps by drag or arrow buttons | `items` (id, text) | list of item ids |
| `spot` | Flags the flawed lines of a file | `lines`, optional `fileName` | list of line indexes (0-based) |
| `match` | Pairs terms with meanings | `pairs` (left, right) | none (pairs are the answer) |
| `switches` | Turns sigils on or off using clues | `clues`, `switches` (id, label), `target` | none (`target` is the answer) |
| `choice` | Picks the best response | `options` (id, text, optional `why`), `answer` | the option id |

Every puzzle also needs `id` (unique within the temple), `type`, `title`, `prompt`, `hint` and `success`.

## Rules the validator enforces

`npm run test:validate-missions` and `npm run test:unit` fail when:

- a temple has fewer than 4 chambers, or has no `intro`
- a puzzle is missing a field, has duplicate ids, or has an answer that does not match its items
- a puzzle rejects its own stored solution

## Writing good chambers

- Teach one idea per chamber and say why in `success`.
- Give wrong `choice` options a `why`, so a mistake teaches something.
- Keep `hint` useful but not a giveaway. It shows automatically after two wrong answers.
- Mix at least three puzzle types in each temple.
- Keep the Zelda theme in `title`, `intro` and `success`; keep the DevOps content accurate.

## Adding a temple

1. Create `data/missions/<id>.json` with `id`, `title`, `objective`, `requires`, `intro`, `reward` and `trials`.
2. Add the id to `TEMPLE_PIECES`, `TEMPLE_REQUIREMENTS` and the default state in `js/engine/game-state.js`, and bump the save version with a migration.
3. Copy `fire.html` for the page, and add the temple to the nav in every page, to `js/ui/hub-map.js` and to `js/ui/hud.js`.
4. Add the temple to `final` in `TEMPLE_REQUIREMENTS` and to `requiredStateKeys` in `data/missions/final-battle.json` if it should gate the final battle.
