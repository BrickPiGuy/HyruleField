# Telemetry Event Contract

This project emits anonymous telemetry for balancing and flow analysis.

## Privacy

- No usernames, email addresses, or account IDs are captured.
- Session IDs are random and local to the browser session.
- Events are stored in browser localStorage only.

## Event Shape

Each event has the following fields:

- `id`: stable event id built from `sessionId:sequence`
- `type`: event name
- `sessionId`: random session id from session storage
- `sequence`: monotonic counter within a session
- `timestamp`: ISO timestamp
- `page`: current page id (`index`, `power`, `wisdom`, `courage`, `final`)
- `path`: current URL path
- `payload`: event-specific metadata

## Event Types

- `mission_started`: player opened a mission page
- `mission_retry`: player retried a flow or reset campaign
- `mission_failed`: rule engine produced a failed outcome
- `mission_completed`: mission milestone completed
- `action_resolved`: any action that reached reducer resolution

## Typical Payload Fields

- `mission`
- `page`
- `trigger`
- `actionType`
- `sourceAction`
- `ok`
- `outcomeReason`
- `corruptionBefore`
- `corruptionAfter`

## Exporting for Balance Review

In browser console:

```javascript
window.HyruleTelemetry.exportEvents();
```

To clear:

```javascript
window.HyruleTelemetry.clearEvents();
```
