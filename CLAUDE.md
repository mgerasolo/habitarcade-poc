# CLAUDE.md

This file provides guidance to Claude Code when working with the habitarcade-poc codebase.

## Overview

HabitArcade is a gamified habit tracking web application. Users build and maintain habits through arcade-style game mechanics - streaks, points, achievements, and friendly competition.

**Key Integrations:**
- **Authentik** - SSO login via Helicarrier (low-key integration, optional)
- **Grafana** - Habit analytics dashboards (low-key, embedded panels)

**Target Environment:** Parker (10.0.0.34)
**Reserved Port:** 3451
**Domain:** poc.habitarcade.com

## Technology Stack

| Purpose | Tool |
|---------|------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL (shared AppServices) |
| Auth | Authentik (via Helicarrier) |
| Logging | Loki → Grafana (Coulson) |
| Monitoring | Prometheus → Grafana (Coulson) |
| Secrets | Shared .env files at `/mnt/foundry_project/AppServices/env/` |

## Key Directories

```
habitarcade-poc/
├── .claude/                    # Baton context management
│   ├── CONVERSATION_HISTORY.md # All conversations TLDR
│   ├── BUGS.md                 # Discovered bugs (tagged by conv-id)
│   ├── DECISIONS.md            # Architecture decisions (tagged by conv-id)
│   └── conversations/          # Per-conversation summaries
├── .github/
│   └── ISSUE_TEMPLATE/         # GitHub issue templates
├── src/                        # Application source code
├── docs/                       # Documentation
└── scripts/                    # Utility scripts
```

## Common Commands

```bash
# Development
npm run dev                     # Start development server
npm run build                   # Build for production
npm run test                    # Run tests

# Secrets (from Infrastructure)
source ~/Infrastructure/scripts/secrets.sh
appservices_get POSTGRES_PASSWORD
ai_apps_get OPENAI_API_KEY      # If using AI features

# Deployment (when ready)
# Use /deployment parker habitarcade-poc
```

## Context Management (Baton Protocol)

This project uses structured context management for multi-conversation workflows.

### On Session Start
1. Check `.claude/CURRENT_CONVERSATION_ID`
2. Read `.claude/CONVERSATION_HISTORY.md` for overview
3. Read `.claude/conversations/{conv-id}/SUMMARY.md` for current work

### During Work
- Update SUMMARY.md after significant actions
- Append to BUGS.md when discovering bugs (tag with conv-id)
- Append to DECISIONS.md for architecture decisions (tag with conv-id)

### After Compaction
- IMMEDIATELY read CONVERSATION_HISTORY.md
- Read your conversation's SUMMARY.md
- Resume work with context restored

## Development Workflow (BMAD Integration)

This project uses BMAD agents for 80%+ of development work. Only skip agents for trivial fixes.

### Workflow Types

| Type | When to Use | Labels |
|------|-------------|--------|
| **Full** | Features, complex bugs, UI changes | `workflow:full` |
| **Quick** | Typos, one-liners, config | `workflow:quick` |

### Phase Flow (10 Phases)

| Phase | Label | Primary Agent | Command |
|-------|-------|---------------|---------|
| 0 | `phase:0-backlog` | Human | Triage, apply workflow type |
| 1 | `phase:1-refining` | Analyst/PM | `/bmad:bmm:agents:analyst` |
| 2 | `phase:2-designing` | Architect/UX | `/bmad:bmm:agents:architect` |
| 3 | `phase:3-tests-writing` | TEA | `/bmad:bmm:agents:tea` → [AT] |
| 4 | `phase:4-developing` | Developer | `/bmad:bmm:agents:dev` → [DS] |
| 5 | `phase:5-tea-testing` | TEA | `/bmad:bmm:agents:tea` → Run tests |
| 6 | `phase:6-deployment` | Deploy | `/wf:deploy` |
| 7 | `phase:7-human-review` | Human | `/wf:review` - Test via web |
| 8 | `phase:8-docs-update` | PM | `/bmad:bmm:agents:pm` → Update PRD |
| 9 | `phase:9-done` | - | Merge, cleanup |

### Clarification Gate (Phase 0)
When receiving a new issue/goal, if clarity < 95%, ASK:
- "What does success look like?"
- "What are the acceptance criteria?"
- "What should NOT change?"
Do NOT start work until the goal is crystal clear.

### AC Split Gate (Phases 1-2)
If >3 acceptance criteria → Apply `needs:split` label and split before proceeding.

### TEA Testing Gate (Phase 5)
- PASS → Move to `phase:6-deployment`
- FAIL → Apply `tests:failed-N`, return to `phase:4-developing`

### Human Review Gate (Phase 7)
Human tests via deployed web app:
- APPROVED → Move to `phase:8-docs-update`
- REJECTED → Return to appropriate phase with feedback

### TDD Requirements (Non-Quick)
1. Tests written BEFORE implementation (Phase 3)
2. Tests failing when committed (RED)
3. Implementation makes tests pass (GREEN)
4. Test file: `tests/issue-{number}-{slug}.spec.ts`

### Worktree Management
```bash
git worktree add ../habitarcade-wt-{slug} -b work/{number}-{slug}
.claude/worktrees/{slug}/state.json  # State tracking
git worktree remove ../habitarcade-wt-{slug}  # Cleanup
```

### Quick Path Criteria
Use `workflow:quick` ONLY for: typos, one-liners, config, CSS < 10 lines.
Quick path: Skip phases 1-3, still requires phases 5-9.

### /wf:* Commands
| Command | Purpose |
|---------|---------|
| `/wf:help` | List all workflow commands with descriptions |
| `/wf:status` | Current workflow status by phase |
| `/wf:pending` | List items awaiting human approval |
| `/wf:approve #` | Approve issue by number, advance to next phase |
| `/wf:deny # {reason}` | Reject issue with feedback, return to prior phase |
| `/wf:audit` | Audit recent completions |
| `/wf:dash` | GitHub dashboard links |
| `/wf:issue` | Create new issue with clarification |
| `/wf:q` | Items fixed but not deployed |
| `/wf:deploy` | Deploy pending fixes |
| `/wf:review` | Human review session |

**Conversational Alternatives:**
- "approve 42" or "looks good on #42" → `/wf:approve 42`
- "reject 42 needs more work on styling" → `/wf:deny 42 needs more work on styling`
- "what needs my review?" → `/wf:pending`

### Session Summary (MANDATORY)
End every session with:
- **Issues touched:** #X, #Y
- **Completed:** [list]
- **Blocked:** [list]
- **Next session:** [action]

### Bug Budget Rule
**If 3+ bugs are open, stop new features and fix bugs first.**

### On Session Start (Workflow)
1. Check GitHub for issues with current phase labels
2. Load appropriate BMAD agent for that phase
3. Read worktree state: `.claude/worktrees/{slug}/state.json`
4. Check for `awaiting:human-approval` items

### After Compaction Recovery (Workflow)
1. Read CONVERSATION_HISTORY.md and SUMMARY.md
2. Check GitHub issue labels for current phase
3. Check worktree state.json for progress
4. Resume with appropriate BMAD agent

## Standardized Response Format

**MANDATORY:** All responses must use this format:

```markdown
**Title:**
- [Conversation title, max 60 chars]

**Request:**
- [Up to 120 char summary of request]

**Tasks:**
- ✅ [Owner] [Details...] Completed task
- ⬜ [Owner] [Status] [Details...] Pending task

**Summary:**
- Portfolio manager perspective: features, branding, cost, big picture
- Avoid deep technical specifics

**Next:**
- [Next immediate action or "None"]

**USER ACTION NEEDED:**
- [Actions requiring human decision]

**Context:**
- XX% used, YY% remaining
```

**Emoji Legend:**
- **Owner:** 🤖 Claude | 👨‍🔧 Human | 👤 Other
- **Status:** ⏳ Waiting | 🛑 Blocked | 🏳️ Ready | 💬 Discuss
- **Details:** 🔸 Required | 🔹 Optional | ⚠️ Concern | ∥ Parallel

## GitHub Integration

**Repository:** https://github.com/mgerasolo/habitarcade-poc
**Project Board:** https://github.com/users/mgerasolo/projects/X

**Label Taxonomy:**
| Category | Labels |
|----------|--------|
| Phase | `phase:0-backlog` through `phase:9-done` (10 phases) |
| Workflow | `workflow:full`, `workflow:quick` |
| Type | `type:bug`, `type:feature`, `type:enhancement`, `type:docs` |
| Priority | `priority:critical`, `priority:high`, `priority:medium`, `priority:low` |
| Area | `area:ui`, `area:api`, `area:database`, `area:auth` |
| Tests | `tests:passed`, `tests:failed-1`, `tests:failed-2`, `tests:failed-3+` |
| Deploy | `deploy:pending`, `deploy:staged`, `deploy:production` |
| Needs | `needs:verification`, `needs:demo`, `needs:split` |
| Status | `status:blocked` |
| Resolution | `resolution:fixed`, `resolution:no-longer-needed`, `resolution:deprioritized`, `resolution:replaced` |

**At session start:** Check for `phase:7-human-review` issues (awaiting human approval via web)

## Cross-Project Coordination

**Dependencies:**
- Infrastructure (nlf-infrastructure) - Deployment, secrets, monitoring

**Before breaking changes:**
1. Check dependent projects
2. Create issue with `breaking:next-release` label
3. Notify Infrastructure project

## Security Notes

- Never commit secrets or API keys
- Use Infisical or .env files from shared location
- All external API calls must go through authenticated endpoints

## Related Documentation

- Infrastructure: `~/Infrastructure/CLAUDE.md`
- AppServices Standards: `/mnt/foundry_project/AppServices/`
- Deployment Docs: `/mnt/foundry_project/Forge/deployments/parker/habitarcade-poc/`
