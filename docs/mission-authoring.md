# Mission Authoring Guide

Use the mission JSON files in `data/missions/` as the source of truth for temple and battle flows.

## Required Fields

Every mission must define:

- `id`
- `title`
- `objective`
- `reward`

## Supported Optional Fields

- `ciSteps`
- `securityCards`
- `hiddenWorkflow`
- `requiredStateKeys`
- `prereqsDisplay`
- `checklist`
- `pipelineStages`
- `messages`
- `requires`
- `dependsOn`
- `prerequisites`

## Validation Rules

- `id`, `title`, and `objective` must be non-empty strings.
- `reward` must define either `temple` or `victory`.
- Array fields must contain non-empty strings.
- `securityCards` entries must define `id`, `title`, and `description`.
- `hiddenWorkflow.previewTemplate`, `hiddenWorkflow.requiredWords`, and `hiddenWorkflow.anyPhrases` are required when `hiddenWorkflow` is present.
- `hiddenWorkflow.segments` must define each dropdown part with `id`, `label`, `correctValue`, and exactly 5 string `options`.
- Any dependency fields must point at existing mission ids.
- Dependency loops are rejected.

## Workflow

Run the validator locally before opening a PR:

```bash
npm run test:validate-missions
```

CI runs the same validator before unit and browser tests.
