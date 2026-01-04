# BMAD-Integrated Development Workflow Strategy

> **Portable Strategy Document** - Can be copied to any project with BMAD installed.

## Overview

This workflow integrates BMAD agents with GitHub labels to create a structured, test-driven development process optimized for solopreneurs who are more PM-level than coder-level.

**Key Principles:**
- BMAD agents engaged 80%+ of the time (experts do their roles)
- 10-phase workflow with clear handoffs
- TDD: Tests written BEFORE code
- Human verification via deployed web app (not code review)
- Compaction-resilient via CLAUDE.md + Baton protocol
- Multi-session support (dev in one session, review in another)

---

## Phase Flow (10 Phases)

```
Phase 0: Backlog       -> Human triages, applies workflow type
Phase 1: Refining      -> Analyst/PM gather requirements, PRD
                          GATE: Split if >3 ACs
Phase 2: Designing     -> Architect/UX design solution
                          GATE: Split if >3 ACs
Phase 3: Tests Writing -> TEA writes ATDD failing tests
Phase 4: Developing    -> Developer implements (red-green-refactor)
Phase 5: TEA Testing   -> TEA runs automated tests
                          PASS -> phase:6
                          FAIL -> back to phase:4 with tests:failed-N
Phase 6: Deployment    -> Deploy to web for human testing
Phase 7: Human Review  -> Human tests via deployed web app
                          APPROVED -> phase:8
                          REJECTED -> back to phase:1/2/3/4
Phase 8: Docs Update   -> PM updates PRD as as-built documentation
Phase 9: Done          -> Complete, worktree cleaned
```

### Quick Path (workflow:quick)
For trivial fixes only: typos, one-liners, config changes, CSS < 10 lines.
Skips phases 1-3, still requires phases 5-9.

---

## GitHub Labels

### Phase Labels (Primary Workflow State)
```bash
gh label create "phase:0-backlog" --color "f9d0c4" --description "Unrefined, awaiting triage"
gh label create "phase:1-refining" --color "fbca04" --description "Requirements being gathered"
gh label create "phase:2-designing" --color "c5def5" --description "Architecture/UX in progress"
gh label create "phase:3-tests-writing" --color "5319e7" --description "ATDD tests being created"
gh label create "phase:4-developing" --color "1d76db" --description "Implementation in worktree"
gh label create "phase:5-tea-testing" --color "d4c5f9" --description "TEA running automated tests"
gh label create "phase:6-deployment" --color "0075ca" --description "Deployed for human web testing"
gh label create "phase:7-human-review" --color "d93f0b" --description "Human testing via web app"
gh label create "phase:8-docs-update" --color "c2e0c6" --description "PM updating PRD as as-built"
gh label create "phase:9-done" --color "0e8a16" --description "Complete, worktree cleaned"
```

### Workflow Type Labels
```bash
gh label create "workflow:full" --color "5319e7" --description "Full BMAD orchestration"
gh label create "workflow:quick" --color "0e8a16" --description "Quick path - skip agents"
```

### Test Status Labels
```bash
gh label create "tests:passed" --color "0e8a16" --description "All tests passing"
gh label create "tests:failed-1" --color "fbca04" --description "Tests failed 1 time"
gh label create "tests:failed-2" --color "d93f0b" --description "Tests failed 2 times"
gh label create "tests:failed-3+" --color "b60205" --description "Tests failed 3+ times - needs review"
```

### Deployment Labels
```bash
gh label create "deploy:pending" --color "fbca04" --description "Ready for deployment batch"
gh label create "deploy:staged" --color "1d76db" --description "In staging environment"
gh label create "deploy:production" --color "0e8a16" --description "Deployed to production"
```

### Needs Labels
```bash
gh label create "awaiting:human-approval" --color "d93f0b" --description "Ready for human verification"
gh label create "needs:demo" --color "d93f0b" --description "Visual proof required (UI changes)"
gh label create "needs:split" --color "fbca04" --description "Issue has >3 ACs, needs splitting"
gh label create "needs:verification" --color "d93f0b" --description "Human testing required"
```

---

## BMAD Agent Mapping

| Phase | Agent | BMAD Command | Action |
|-------|-------|--------------|--------|
| 1 | Analyst (Mary) | `/bmad:bmm:agents:analyst` | Research, Product Brief |
| 1 | PM (John) | `/bmad:bmm:agents:pm` | PRD creation |
| 2 | Architect (Winston) | `/bmad:bmm:agents:architect` | Architecture design |
| 2 | UX Designer (Sally) | `/bmad:bmm:agents:ux-designer` | UX design |
| 3 | TEA (Murat) | `/bmad:bmm:agents:tea` -> [AT] | ATDD test writing |
| 4 | Developer (Amelia) | `/bmad:bmm:agents:dev` -> [DS] | Story execution |
| 5 | TEA (Murat) | `/bmad:bmm:agents:tea` | Run automated tests |
| 8 | PM (John) | `/bmad:bmm:agents:pm` | Update PRD as as-built |

---

## /wf:* Commands

All workflow commands use `/wf:*` prefix for easy discovery.

### /wf:help
Lists all available workflow commands with descriptions:
```
/wf:help       - Show this help message
/wf:status     - Current workflow status by phase
/wf:pending    - List items awaiting human approval
/wf:approve #  - Approve issue, advance to next phase
/wf:deny # ... - Reject issue with feedback
/wf:audit      - Audit recent completions
/wf:dash       - GitHub dashboard links
/wf:issue      - Create new issue with clarification
/wf:q          - Items fixed but not deployed
/wf:deploy     - Deploy pending fixes
/wf:review     - Human review session
```

### /wf:pending
Shows all items awaiting human approval:
- Lists issues in `phase:6-deployment` or `phase:7-human-review`
- Shows: Issue #, Title, Summary, What to test
- Query: `gh issue list -l "phase:7-human-review" -l "awaiting:human-approval"`

### /wf:approve #
Approves an issue and advances it to the next phase:
1. Validate issue exists and is in review phase
2. Remove `awaiting:human-approval` label
3. Update phase label to next phase
4. Add approval note to issue
5. If phase:7 → phase:8-docs-update

**Usage:**
- `/wf:approve 42` - Approve issue #42
- Conversational: "looks good on #42", "approve 42", "#42 is approved"

### /wf:deny # {reason}
Rejects an issue and returns it to a prior phase:
1. Validate issue exists and is in review phase
2. Add rejection feedback as issue comment
3. Return to appropriate phase (usually phase:4-developing)
4. Keep `awaiting:human-approval` removed
5. Increment rejection count if tracked

**Usage:**
- `/wf:deny 42 styling needs work on mobile` - Reject with feedback
- Conversational: "reject 42 needs more work", "#42 failed - button alignment off"

### /wf:status
Shows summary of all issues by phase:
- Issues awaiting human review: `phase:7-human-review`
- Issues deployed, pending review: `phase:6-deployment`
- Issues in development: `phase:4-developing`
- Issues with test failures: `tests:failed-*`
- Bug budget status
- Deployment queue count

### /wf:audit
Reviews recently completed items:
- Items completed in last 7 days
- Items missing documentation updates
- Items without human verification
- Test failure history

### /wf:dash
Provides clickable links to GitHub filtered views:
- Items needing human review
- Items deployed and ready to test
- All open bugs
- Test failures
- Blocked items

### /wf:issue
Interactive issue creation with Clarification Gate:
1. Ask: "What problem are you solving?"
2. Ask: "What does success look like?"
3. Ask: "Any constraints or edge cases?"
4. Draft issue with testable ACs (max 3)
5. If >3 ACs, suggest splitting
6. Create GitHub issue with appropriate labels

### /wf:q
Shows items fixed but not deployed:
- Items in `phase:5-tea-testing` with `tests:passed`
- Items awaiting deployment

### /wf:deploy
Deploys all items that passed tests:
1. List items in phase:5 with tests:passed
2. Confirm with human
3. Run deployment process
4. Move items to `phase:6-deployment`

### /wf:review
Human review session for deployed items:
1. Show all items in `phase:6-deployment` or `phase:7-human-review`
2. For each: show issue #, title, what to test
3. Human tests via web app
4. Human responds: "APPROVED #42" or "REJECTED #42: reason"
5. Agent updates labels accordingly

---

## Multi-Session Workflow

Designed for parallel Cursor/Claude Code sessions:
- **Session A (Dev):** Working through phases 1-5 (coding, tests)
- **Session B (Review):** Human reviewing deployed items in phases 6-7

Each session can independently:
- Query items awaiting action via `/wf:*` commands
- Update labels when work completes
- Hand off to next phase without blocking other work

---

## Solopreneur Optimizations

### Concurrency Limit
**Maximum 5 issues in-flight** at any time across all worktrees.

### Clarification Gate (Phase 0)
Before accepting any issue, agent MUST ask clarifying questions if goal is not 95% clear:
- "What does success look like?"
- "What are the acceptance criteria?"
- "What should NOT change?"
- "Any edge cases I should know about?"

### Pre-Flight Checklist (Before Phase 4)
- [ ] AC count ≤3 (should have been split in phases 1-2)
- [ ] Acceptance criteria are testable ("User can X" not "Improve X")
- [ ] I can verify this manually without reading code
- [ ] Success looks like: [describe visual/functional outcome]
- [ ] Tests from Phase 3 exist and are failing (RED state)
- [ ] Worktree created and state.json initialized

### Visual Verification Gates
For UI changes, Phase 6 requires:
- Before/after screenshots attached to PR
- Brief demo description of how to verify

### Session Summary (MANDATORY)
End every session with:
- **Issues touched:** #X, #Y, #Z
- **Completed:** [list what's done]
- **Blocked:** [list blockers]
- **Next session:** [specific action to start with]

### Definition of Done Checklist
Before closing ANY issue:
- [ ] All acceptance criteria pass (human verified manually via web)
- [ ] No new bugs introduced (tested adjacent features)
- [ ] Screenshot/demo provided (for UI changes)
- [ ] Tests pass in CI (green checkmark)
- [ ] Human understands what changed (brief explanation)

### Bug Budget Rule
**If 3+ bugs are open, stop new features and fix bugs first.**

---

## Compaction Survival Strategy

| Storage | What | Recovery |
|---------|------|----------|
| GitHub Labels | Phase state (source of truth) | `gh issue view {n} --json labels` |
| Baton SUMMARY.md | Current issue, agent, progress | Read on session start |
| state.json | Tasks, tests, worktree path | Read from worktree dir |

**Recovery Order:** Baton -> GitHub -> state.json -> Resume with agent

### On Session Start
1. Check GitHub for issues with current phase labels
2. Load appropriate BMAD agent for that phase
3. Read worktree state: `.claude/worktrees/{slug}/state.json`
4. Check for `awaiting:human-approval` items needing attention

### After Compaction
1. Read CONVERSATION_HISTORY.md and SUMMARY.md
2. Check GitHub issue labels for current phase
3. Check worktree state.json for progress
4. Resume with appropriate BMAD agent

---

## Worktree State Schema

`.claude/worktrees/{slug}/state.json`:
```json
{
  "name": "{slug}",
  "description": "Issue title",
  "issueNumber": 42,
  "branch": "work/{number}-{slug}",
  "directory": "/path/to/project-wt-{slug}",
  "phase": "developing",
  "workflow": "full",
  "agent": "dev",
  "created": "2026-01-03T00:00:00Z",
  "tests": {
    "written": true,
    "passing": false,
    "files": ["tests/issue-42-slug.spec.ts"],
    "lastRun": "2026-01-03T10:00:00Z"
  },
  "tasks": [
    { "id": "AC1", "description": "Task description", "complete": true }
  ],
  "pr": { "number": null, "url": null, "approved": false },
  "blockers": [],
  "notes": []
}
```

---

## Quick Query Commands (gh CLI)

```bash
# Items awaiting human review (deployed, ready to test)
gh issue list -l "phase:7-human-review"

# Items deployed but not yet reviewed
gh issue list -l "phase:6-deployment"

# Items fixed but not deployed (queue)
gh issue list -l "phase:5-tea-testing" -l "tests:passed"

# Items with test failures
gh issue list -l "tests:failed-1"
gh issue list -l "tests:failed-2"
gh issue list -l "tests:failed-3+"

# Current bug count (bug budget check)
gh issue list -l "type:bug" --state open | wc -l

# Items needing split
gh issue list -l "needs:split"
```

---

## Installation Checklist

To install this workflow in a new project:

1. [ ] Copy this file to `docs/BMAD-WORKFLOW-STRATEGY.md`
2. [ ] Run all `gh label create` commands above
3. [ ] Add workflow section to project's CLAUDE.md
4. [ ] Create `.claude/skills/wf-commands.md` with command definitions
5. [ ] Create `.claude/worktrees/` directory structure
6. [ ] Test with a sample issue through full workflow

---

*Version: 1.0.0*
*Created: 2026-01-03*
*Designed for: Solopreneur PM-level users with BMAD integration*
