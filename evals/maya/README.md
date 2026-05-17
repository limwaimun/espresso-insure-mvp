# Maya Eval Harness

Regression testing for Maya. Each scenario is a TypeScript file defining a
fixed conversation + mock specialist responses + assertions on what Maya
should say. The runner replays the conversation through `runMaya()` with
mocks (no DB, no real Relay calls, no cross-test bleed) and checks
assertions.

## Why this exists

Maya's prompt evolves rapidly as we add specialist agents and refine her
voice. Without a regression test, a change that fixes one behavior can
silently break another. Today's failure mode (2026-05-17) was Maya quoting
the AIA hotline number and MyAIA app name from her training data — the
eval harness catches that with `reply_does_not_contain` assertions.

Scenarios live as TS modules (not YAML / JSON) so:
- Mock dispatchers can be functions, not just strings
- Type-checked, no parse errors at runtime
- No new dependency

## Running

```bash
npx tsx evals/maya/runner.ts evals/maya/scenarios/01-wei-ming-knee-surgery.ts
```

Requires `ANTHROPIC_API_KEY` in env.

Exit code 0 = all turns passed. Non-zero = at least one assertion failed.

Results are written to `evals/maya/runs/<scenarioId>-<timestamp>.json`.

## Adding a scenario

1. Drop a new file under `evals/maya/scenarios/` named `NN-short-description.ts`
2. Export a `scenario` const matching the `Scenario` interface from `../types.ts`
3. Build the mock dispatcher to handle the queries Maya will plausibly send.
   For most scenarios, only `call_relay` needs mocking; `update_claim` rarely
   appears in client-side scenarios.
4. Define turns + assertions.

### Assertion types

- **`called_tool` / `did_not_call_tool`**: Maya must / must-not invoke a tool this turn.
- **`tool_input_matches`**: Validate the structure of a tool call (regex on a specific input field).
- **`reply_contains` / `reply_does_not_contain`**: Substring check (case-insensitive). Use `does_not_contain` for hallucination forbids.
- **`reply_contains_all`**: All needles must be present.
- **`reply_matches`**: Regex against the reply.
- **`reply_min_length` / `reply_max_length`**: Character count bounds.
- **`reply_max_words`**: Word count cap (WhatsApp tone enforcement).

### Tips

- **Anti-hallucination forbids are crucial.** When Maya fabricates a fact,
  it's almost always from training-data leakage. Forbid specific strings
  Maya tends to invent (`1800`, brand-name apps, hospital chain names).
- **Don't over-assert.** Each assertion should be a property Maya MUST satisfy
  or MUST avoid, not preference. Style drift between equivalent answers is
  noise, not signal.
- **Mock realistically.** Mock dispatcher responses should mirror what Brief
  / Compass / etc. actually return — same JSON shape, same level of
  specificity. Otherwise the eval passes but production fails.

## Interpreting results

The result JSON has per-turn detail:

```json
{
  "scenarioId": "01-wei-ming-knee-surgery",
  "passed": false,
  "turns": [
    {
      "turnIndex": 1,
      "reply": "Wei Ming, here's...",
      "toolCallsExecuted": [{ "name": "call_relay", "input": {...}, "result": "..." }],
      "assertions": [
        { "passed": true, "detail": "tool 'call_relay' was called" },
        { "passed": false, "detail": "unexpectedly contains \"1800\"" }
      ],
      "passed": false
    }
  ]
}
```

Look at:
1. Which assertions failed
2. The `reply` text — was it actually wrong or is the assertion too strict?
3. The `toolCallsExecuted` — did Maya call the right tool with a sensible query?

When prompted to change Maya's prompt, ALWAYS re-run the eval harness before
committing. If `01-wei-ming-knee-surgery` regresses, debug it before merging
the prompt change.

## Future

- CI integration (GitHub Actions job that runs all scenarios on PRs touching `lib/maya/` or `app/api/{brief,relay,compass,...}/`)
- LLM-as-judge assertions for things harder to grep (tone, empathy)
- Multi-scenario aggregate run (run all scenarios in one invocation, aggregate report)
- Snapshot mode (compare reply against a stored "good" reply; flag drift)

## Files

- `evals/maya/types.ts` — Scenario, Turn, Assertion type definitions
- `evals/maya/runner.ts` — CLI runner
- `evals/maya/scenarios/*.ts` — individual scenarios
- `evals/maya/runs/*.json` — historical run output (gitignore'd; transient)
