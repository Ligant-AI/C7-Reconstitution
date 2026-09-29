# C7 verification agents

Eight Claude Code subagents (`.claude/agents/`) that produce evidence about C7
Reconstitution **independently of whoever built it**. The main session is the
builder. The design rule: no agent checks work it produced, and the checking
agents see as little of the implementation as their job allows.

| Agent | Sees | Blocked from | Writes | Evidence for |
|---|---|---|---|---|
| `c7-spec-auditor` (opus) | `spec/` | code, tests, docs, engine output | `verification/spec-audit/` | §0.3 method note, gate 5a |
| `c7-fixture-author` (sonnet) | `spec/`, PROTOCOL.md | code, tests, docs, engine output | `verification/fixtures/` | C7-FX-12, gate 7 |
| `c7-cleanroom` (sonnet) | `spec/`, PROTOCOL.md, `cases.json` | code, reimpl, tests, docs, every comparison result | `verification/cleanroom/` | acceptance 3 |
| `c7-adversarial-tester` (opus) | `spec/`, the engine as a black box | code, tests, docs, clean-room code | `verification/adversarial/` | C7-IV-02, acceptances 5, 13 |
| `c7-ui-verifier` (sonnet) | `spec/`, the running page (Chrome) | code, tests, docs | `verification/ui/` | acceptances 18, 19, 22, 24; C7-NF-04/05/13 |
| `c7-deploy-verifier` (sonnet) | the deployed URL (Chrome + fetch) | code, tests, docs | `verification/deploy/` | acceptances 16, 17, 25 |
| `c7-contract-checker` (opus) | C1, C3, C4 and C7 source | writes outside its folder | `verification/contract/` | acceptance 4; C7-ST-01/02/08 |
| `c7-evidence-clerk` (sonnet) | everything, read-only | writes outside the ledger | `docs/evidence-ledger.md` | the release claim; the independence audit |

The builder is Opus; the clean-room and fixture agents run on Sonnet, so the
second implementation is written by a different model as well as a fresh context.

## Standing verification rules

These bind every agent, the harness and the builder, in every run.

1. **No agent checks work it produced.** Checking agents see as little of the
   implementation as their job allows; access is fenced and logged, and the
   evidence clerk audits the log.
2. **An invariance test must be confirmed capable of failing** (C7-IV-02): a
   clamp, a floor and a nudge inserted, each caught, each recorded.
3. **A second implementation must distinguish a crash from a decision, and a
   crash always counts as a disagreement.** Added 29 September 2026 at the
   specification owner's direction (NADIRA), after the clean room was found
   reporting its own exceptions as "not-representable": 13 cases had agreed
   with the engine by masked crash. A verifier that reports its own failure as
   agreement invalidates every run it made — the same lesson as rule 2,
   applied to the comparison harness rather than to the test. Enforced by
   PROTOCOL.md convention 7 (a crash is `error`) and by `compare.mjs` (an
   `error` is always a disagreement); an outcome such as "not-representable"
   must be decided explicitly on a named quantity. Checked across the tool set on
   29 September 2026: C4's harness has no catch-all (compliant; 17/17 pass); C1
   and C3 have no second implementation yet — each must meet this rule when it
   gets one.
4. **A disagreement is a finding against both implementations** until the
   specification owner rules; neither side is presumed right, and whether a
   disagreement is an edge case or an engine error is the owner's call.
5. **A claim is never upgraded beyond its evidence** (the ledger's rule).

## How the fences work

Each agent carries a `PreToolUse` hook (`.claude/hooks/deny-paths.mjs`) that
blocks Read/Grep/Glob/Edit/Write on denied paths exactly, blocks Bash commands
that name a denied path or search recursively outside `spec/` and `verification/`,
and fences writes to the agent's own folder. **Every call is logged** to
`verification/access-log.jsonl`, blocked or allowed, and the evidence clerk
audits it. The Bash guard matches the command line: it stops casual access, not
a determined evasion, so independence rests on the fence, the instructions
*and* the audit together. `isolation: worktree` would add a harder boundary but
needs this folder to be a git repository.

## Running the pipeline

In a Claude Code session opened in this folder (restart the session after the
agent files are first added, so they load):

1. **Before code changes:** ask for `c7-spec-auditor`. Its disagreements go to
   A. Modi / NADIRA, not to the builder.
2. `npm run verify:cases` — regenerate `verification/cases.json` (inputs only).
3. Ask for `c7-fixture-author`, then `npm run verify:fixtures` (writes `verification/fixtures/check-report.md`).
4. Ask for `c7-cleanroom`, then `npm run verify:cleanroom` (writes `verification/cleanroom/comparison.md`).
   A disagreement is a finding against **both** implementations until the URS decides.
5. Ask for `c7-adversarial-tester`; then re-run steps 2 and 4 so its cases reach the clean-room comparison.
6. With `npm run dev` running: ask for `c7-ui-verifier`.
7. After a deploy (and after any CDN change): ask for `c7-deploy-verifier` with the URL.
8. Ask for `c7-contract-checker`.
9. Ask for `c7-evidence-clerk` — last, and before any claim of readiness.

Agents 1, 2, 3 and 5 can run in parallel; they share no inputs but `spec/`.

## What no agent can do

Sign the tolerance memo, cite ISO 8655-2, confirm the excipient values (NADIRA);
the legal review of the privacy text (THERON); the one-minute first-use test
(acceptance 21 — a real first-time scientist); decisions the URS reserves for a
named owner (URL slug, shared format version, the `tool` field).

## Harness self-test

`python3 verification/harness-selftest.py` wraps the same-author `reimpl/` to
the protocol purely to show `compare.mjs` reports agreement (572 of 572 values
bit-exact, 28 September 2026); an empty implementation is reported as 58
disagreements. The self-test discharges nothing.
