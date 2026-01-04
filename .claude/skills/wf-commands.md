# Workflow Commands (/wf:*)

> **Skill Definition** - Custom workflow commands for BMAD-integrated development

## Overview

These commands manage the 10-phase development workflow. All commands use the `/wf:` prefix.

---

## Command Reference

### /wf:help

**Purpose:** List all available workflow commands with descriptions.

**Output:**
```
WORKFLOW COMMANDS (/wf:*)
=========================
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

CONVERSATIONAL SHORTCUTS:
- "approve 42" or "looks good" → /wf:approve
- "reject 42" or "needs work" → /wf:deny
- "what needs review?" → /wf:pending
```

---

### /wf:status

**Purpose:** Show current workflow status across all phases.

**Actions:**
1. Query GitHub for issues by phase label
2. Count issues in each phase
3. Check bug budget (3+ bugs = warning)
4. Show test failure summary

**Output Format:**
```markdown
## Workflow Status

| Phase | Count | Issues |
|-------|-------|--------|
| 0-backlog | 3 | #10, #11, #12 |
| 4-developing | 1 | #42 |
| 7-human-review | 2 | #38, #39 |

**Bug Budget:** 2/3 (OK)
**Test Failures:** 1 issue with tests:failed-2
**Deployment Queue:** 2 items ready
```

**gh Commands:**
```bash
gh issue list -l "phase:0-backlog" --json number,title
gh issue list -l "phase:4-developing" --json number,title
gh issue list -l "phase:7-human-review" --json number,title
gh issue list -l "type:bug" --state open --json number
gh issue list -l "tests:failed-1" --json number
gh issue list -l "tests:failed-2" --json number
```

---

### /wf:pending

**Purpose:** List all items awaiting human approval.

**Actions:**
1. Query issues with `phase:6-deployment` or `phase:7-human-review`
2. Query issues with `awaiting:human-approval` label
3. Display issue number, title, and what to test

**Output Format:**
```markdown
## Items Pending Human Approval

### #42 - Fix sidebar menu hover state
**Phase:** phase:7-human-review
**Summary:** Sidebar menu items now highlight on hover
**Test:** Navigate to any page, hover over sidebar items, verify highlight appears

### #38 - Add dark mode toggle
**Phase:** phase:6-deployment
**Summary:** Settings page now has dark mode switch
**Test:** Go to Settings, toggle dark mode, verify colors change

---
Use `/wf:approve #` or `/wf:deny # {reason}` to process.
```

**gh Commands:**
```bash
gh issue list -l "awaiting:human-approval" --json number,title,body,labels
gh issue list -l "phase:7-human-review" --json number,title,body,labels
gh issue list -l "phase:6-deployment" --json number,title,body,labels
```

---

### /wf:approve #

**Purpose:** Approve an issue and advance it to the next phase.

**Arguments:**
- `#` - Issue number (required)

**Actions:**
1. Validate issue exists
2. Validate issue is in `phase:6-deployment` or `phase:7-human-review`
3. Remove `awaiting:human-approval` label
4. Update phase label:
   - `phase:6-deployment` → `phase:7-human-review`
   - `phase:7-human-review` → `phase:8-docs-update`
5. Add comment: "Approved by human review"

**Usage:**
```
/wf:approve 42
```

**Conversational Triggers:**
- "approve 42"
- "looks good on #42"
- "#42 is approved"
- "42 passes"

**gh Commands:**
```bash
gh issue edit 42 --remove-label "awaiting:human-approval"
gh issue edit 42 --remove-label "phase:7-human-review"
gh issue edit 42 --add-label "phase:8-docs-update"
gh issue comment 42 --body "Approved by human review"
```

---

### /wf:deny # {reason}

**Purpose:** Reject an issue and return it to a prior phase with feedback.

**Arguments:**
- `#` - Issue number (required)
- `{reason}` - Feedback explaining the rejection (required)

**Actions:**
1. Validate issue exists
2. Validate issue is in review phase
3. Add rejection feedback as issue comment
4. Return to appropriate phase:
   - If UI issue → `phase:4-developing`
   - If design issue → `phase:2-designing`
   - If requirement unclear → `phase:1-refining`
5. Remove `awaiting:human-approval` label

**Usage:**
```
/wf:deny 42 Button alignment is off on mobile viewport
/wf:deny 38 Dark mode doesn't affect the sidebar
```

**Conversational Triggers:**
- "reject 42 needs more work"
- "#42 failed - the button doesn't work"
- "42 is rejected: styling issues"

**gh Commands:**
```bash
gh issue comment 42 --body "**Rejected:** Button alignment is off on mobile viewport"
gh issue edit 42 --remove-label "phase:7-human-review"
gh issue edit 42 --add-label "phase:4-developing"
gh issue edit 42 --remove-label "awaiting:human-approval"
```

---

### /wf:audit

**Purpose:** Audit recently completed items for compliance.

**Actions:**
1. Query issues closed in last 7 days
2. Check for missing documentation updates
3. Check for items without human verification
4. Show test failure history

**Output Format:**
```markdown
## Workflow Audit (Last 7 Days)

**Completed:** 5 issues
**Missing PRD Update:** #35 - no phase:8-docs-update transition
**No Human Verification:** #33 - went straight to done
**Test Failures:** #42 had 2 failures before passing

### Recommendations:
- Review #35 for documentation
- Add verification note to #33
```

**gh Commands:**
```bash
gh issue list --state closed --search "closed:>2026-01-01" --json number,title,labels,closedAt
```

---

### /wf:dash

**Purpose:** Provide clickable GitHub dashboard links.

**Output Format:**
```markdown
## GitHub Dashboard Links

- [Items Needing Review](https://github.com/mgerasolo/habitarcade-poc/issues?q=is%3Aopen+label%3Aphase%3A7-human-review)
- [Items Deployed](https://github.com/mgerasolo/habitarcade-poc/issues?q=is%3Aopen+label%3Aphase%3A6-deployment)
- [All Open Bugs](https://github.com/mgerasolo/habitarcade-poc/issues?q=is%3Aopen+label%3Atype%3Abug)
- [Test Failures](https://github.com/mgerasolo/habitarcade-poc/issues?q=is%3Aopen+label%3Atests%3Afailed)
- [Blocked Items](https://github.com/mgerasolo/habitarcade-poc/issues?q=is%3Aopen+label%3Astatus%3Ablocked)
- [Needs Split](https://github.com/mgerasolo/habitarcade-poc/issues?q=is%3Aopen+label%3Aneeds%3Asplit)
```

---

### /wf:issue

**Purpose:** Create a new GitHub issue with clarification gate.

**Actions:**
1. Ask: "What problem are you solving?"
2. Ask: "What does success look like?"
3. Ask: "Any constraints or edge cases?"
4. Draft issue with testable ACs (max 3)
5. If >3 ACs, suggest splitting
6. Create GitHub issue with labels:
   - `phase:0-backlog`
   - `type:*` (based on content)
   - `priority:*` (ask if not obvious)

**Usage:**
```
/wf:issue fix the sidebar menu
/wf:issue Add user profile page
```

**gh Commands:**
```bash
gh issue create --title "Fix sidebar menu" --body "..." --label "phase:0-backlog" --label "type:bug"
```

---

### /wf:q

**Purpose:** Show items fixed but not yet deployed (deployment queue).

**Actions:**
1. Query issues with `phase:5-tea-testing` AND `tests:passed`
2. Show count and list

**Output Format:**
```markdown
## Deployment Queue

**3 items ready for deployment:**
- #42 - Fix sidebar menu hover state
- #38 - Add dark mode toggle
- #35 - Update footer links

Run `/wf:deploy` to deploy all pending items.
```

**gh Commands:**
```bash
gh issue list -l "phase:5-tea-testing" -l "tests:passed" --json number,title
```

---

### /wf:deploy

**Purpose:** Deploy all items that passed tests.

**Actions:**
1. List items in `phase:5-tea-testing` with `tests:passed`
2. Confirm deployment with human
3. Run deployment process
4. Update labels:
   - Remove `phase:5-tea-testing`
   - Add `phase:6-deployment`
   - Add `awaiting:human-approval`
5. Notify: "Items deployed - ready for /wf:review"

**Usage:**
```
/wf:deploy
/wf:deploy to staging
```

**gh Commands:**
```bash
# For each issue in queue:
gh issue edit {n} --remove-label "phase:5-tea-testing"
gh issue edit {n} --add-label "phase:6-deployment"
gh issue edit {n} --add-label "awaiting:human-approval"
gh issue comment {n} --body "Deployed for human review"
```

---

### /wf:review

**Purpose:** Start a human review session for deployed items.

**Actions:**
1. List all items in `phase:6-deployment` or `phase:7-human-review`
2. For each: show issue #, title, what to test
3. Wait for human input:
   - "APPROVED #42" → `/wf:approve 42`
   - "REJECTED #42: reason" → `/wf:deny 42 reason`
4. Continue until all items processed or human exits

**Output Format:**
```markdown
## Human Review Session

### Ready for Review:

**#42 - Fix sidebar menu hover state**
Test: Hover over sidebar items, verify highlight appears
Action: Type "approve 42" or "deny 42 {reason}"

**#38 - Add dark mode toggle**
Test: Toggle dark mode in Settings, verify colors change
Action: Type "approve 38" or "deny 38 {reason}"

---
Type your review decisions, or "done" to exit.
```

---

## Conversational Pattern Matching

The agent should recognize these conversational patterns and map them to commands:

| Pattern | Command |
|---------|---------|
| "approve 42", "looks good on #42", "#42 passes" | `/wf:approve 42` |
| "reject 42", "deny 42", "#42 needs work" | `/wf:deny 42 {extract reason}` |
| "what needs review?", "pending items?" | `/wf:pending` |
| "workflow status", "where are we?" | `/wf:status` |
| "deploy everything", "push to staging" | `/wf:deploy` |
| "start review", "review session" | `/wf:review` |
| "create issue for...", "new issue:" | `/wf:issue` |

---

## Label State Transitions

### Approval Flow
```
phase:6-deployment + awaiting:human-approval
    ↓ /wf:approve
phase:7-human-review
    ↓ /wf:approve
phase:8-docs-update
    ↓ (PM updates PRD)
phase:9-done
```

### Rejection Flow
```
phase:7-human-review + awaiting:human-approval
    ↓ /wf:deny
phase:4-developing (or phase:1/2/3 based on feedback)
    ↓ (fix issues)
phase:5-tea-testing
    ↓ (tests pass)
phase:6-deployment
```

---

*Version: 1.0.0*
*Created: 2026-01-03*
