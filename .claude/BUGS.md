# Bugs Log

Discovered bugs across all conversations, tagged by conversation ID.

## Open Bugs

### DateHeader Removed - Day Numbers Not Displaying
**Conv:** conv-20251229-062322
**Severity:** Critical
**Status:** Open
**Description:** Uncommitted changes removed the DateHeader component import and usage from HabitMatrix/index.tsx. The day numbers (1-31) no longer appear above the habit status cells.
**Steps to Reproduce:** Load http://localhost:5173, view Habit Matrix widget
**Resolution:** Pending - either revert changes or re-add DateHeader

### Per-Habit Scoring Not Built
**Conv:** conv-20251229-062322
**Severity:** Medium
**Status:** Open
**Description:** Epic 2.7 specifies per-habit completion percentage should display in each row. Not implemented in HabitRow.tsx.
**Steps to Reproduce:** View any habit row - no percentage shown
**Resolution:** Pending implementation

### Overall Score Not in Widget Header
**Conv:** conv-20251229-062322
**Severity:** Medium
**Status:** Open
**Description:** Epic 2.7 specifies overall score should appear in widget header. Not implemented.
**Steps to Reproduce:** View HabitMatrix widget header - no score shown
**Resolution:** Pending implementation

### 6 AM Day Boundary Logic Not Built
**Conv:** conv-20251229-062322
**Severity:** Medium
**Status:** Open
**Description:** Epic 2.9 specifies unmarked habits should auto-set to pink status after 6 AM boundary. No client-side logic implements this.
**Steps to Reproduce:** Leave habit unmarked past 6 AM - stays empty, not pink
**Resolution:** Pending implementation

### Markdown Habit Import Not Built
**Conv:** conv-20251229-062322
**Severity:** Low
**Status:** Open
**Description:** Epic 2.8 specifies POST /api/habits/import endpoint for bulk markdown import. Endpoint does not exist in server/src/routes/habits.ts.
**Steps to Reproduce:** N/A - endpoint doesn't exist
**Resolution:** Pending implementation

### GitHub-Style Annual Graph Not Built
**Conv:** conv-20251229-062322
**Severity:** Low
**Status:** Open
**Description:** project-preplan.md specifies GitHub contribution graph style view for habit deep-dive. No implementation exists - no yearly view, no contribution graph component.
**Steps to Reproduce:** N/A - feature doesn't exist
**Resolution:** Pending implementation

### Click Habit Name → Detail Modal Not Built
**Conv:** conv-20251229-062322
**Severity:** Low
**Status:** Open
**Description:** project-preplan.md specifies clicking habit name should open a deep-dive modal with stats and GitHub graph. HabitRow.tsx has no onClick handler on habit name.
**Steps to Reproduce:** Click any habit name - nothing happens
**Resolution:** Pending implementation

## Resolved Bugs

(none yet)

---

**Format:**
```markdown
### [Bug Title]
**Conv:** conv-YYYYMMDD-HHMMSS
**Severity:** Critical/High/Medium/Low
**Status:** Open/Investigating/Resolved
**Description:** What's broken
**Steps to Reproduce:** How to trigger
**Resolution:** How it was fixed (if resolved)
```
