# Baton - Context Management Protocol

Context management system for solving compaction problems. Provides TLDR summaries, conversation tracking, and efficient post-compaction recovery.

## Usage

```
/baton              # Show current context status
/baton start        # Start a new tracked conversation
/baton save         # Save current progress snapshot
/baton close        # Complete and archive conversation
/baton recover      # Recover context after compaction
/baton history      # Show all conversations
```

## Workflow

### Detect Subcommand

Parse the argument to determine action:
- No argument or "status" → Show Status
- "start" → Start Conversation
- "save" → Save Progress
- "close" → Close Conversation
- "recover" → Recover After Compaction
- "history" → Show History

---

## Action: Show Status (default)

Check current conversation state and display context.

```bash
# Check for active conversation
if [[ -f .claude/CURRENT_CONVERSATION_ID ]]; then
  CONV_ID=$(cat .claude/CURRENT_CONVERSATION_ID)
  echo "🎯 Active Conversation: $CONV_ID"
else
  echo "📭 No active conversation"
fi
```

**Display:**
```
🎯 Baton Status
═══════════════════════════════════════

📋 Active Conversation: [conv-id]
   Title: [title from SUMMARY.md]
   Started: [date]
   Last Updated: [date]

📊 Progress:
   [Context in 3 Lines from SUMMARY.md]

✅ Completed Tasks: X
⬜ Pending Tasks: Y

📁 Key Files:
   [List from SUMMARY.md]

🔄 Next Actions:
   [From SUMMARY.md]

═══════════════════════════════════════
💡 Commands: /baton save | /baton close | /baton history
```

---

## Action: Start Conversation

Generate a new conversation ID and create tracking files.

### 1. Generate Conversation ID
```bash
# Format: conv-YYYYMMDD-HHMMSS
CONV_ID="conv-$(date +%Y%m%d-%H%M%S)"
echo "$CONV_ID" > .claude/CURRENT_CONVERSATION_ID
```

### 2. Create Conversation Directory
```bash
mkdir -p .claude/conversations/$CONV_ID
```

### 3. Initialize SUMMARY.md
Create `.claude/conversations/$CONV_ID/SUMMARY.md` using the template:

```markdown
# SUMMARY.md

## Context in 3 Lines
- Line 1: [User describes purpose of this conversation]
- Line 2: Just started
- Line 3: [Key goal or constraint]

## Task Checklist
- [ ] Initial setup complete

## Decisions Made
(none yet)

## Key Files Created/Modified
(none yet)

## Failed Attempts (Don't Retry)
(none yet)

## Next Actions
1. Define scope and goals
2. Begin implementation

## State Snapshot
Conversation just started. Awaiting user direction.
```

### 4. Update CONVERSATION_HISTORY.md
Add entry to Active Conversations table.

### 5. Confirm Start
```
✅ Baton Started
═══════════════════════════════════════

📋 Conversation ID: [conv-id]
📁 Tracking: .claude/conversations/[conv-id]/

💡 I'll track progress in SUMMARY.md
💡 Use /baton save periodically
💡 Use /baton close when done

What would you like to work on?
═══════════════════════════════════════
```

---

## Action: Save Progress

Update SUMMARY.md with current state. This should be done:
- After significant milestones
- Before potentially risky operations
- When context is getting long
- Before ending a session

### 1. Read Current Context
```bash
CONV_ID=$(cat .claude/CURRENT_CONVERSATION_ID)
SUMMARY_FILE=".claude/conversations/$CONV_ID/SUMMARY.md"
```

### 2. Analyze Conversation
Review the current conversation and extract:
- What we've accomplished (completed tasks)
- What's still pending (open tasks)
- Key decisions made
- Files created or modified
- Any failed approaches
- Current state

### 3. Update SUMMARY.md
Rewrite the SUMMARY.md file with current state:

```markdown
# SUMMARY.md

## Context in 3 Lines
- [Concise description of conversation purpose]
- [Current progress status]
- [Key constraint or blocking issue if any]

## Task Checklist
- [x] Completed tasks...
- [ ] Pending tasks...

## Decisions Made
- [Decision]: [Brief rationale]

## Key Files Created/Modified
- `path/file` - What was done

## Failed Attempts (Don't Retry)
- [Approach]: [Why it failed]

## Next Actions
1. [Most immediate next step]
2. [Following step]

## State Snapshot
[Exact current state - what's running, what's deployed, what's pending]
```

### 4. Confirm Save
```
💾 Baton Saved
═══════════════════════════════════════

📋 Conversation: [conv-id]
📅 Saved: [timestamp]

📊 Summary:
   ✅ Completed: X tasks
   ⬜ Pending: Y tasks
   📁 Files: Z modified

🔄 Next Actions:
   1. [Next action]

═══════════════════════════════════════
```

---

## Action: Close Conversation

Complete the conversation and archive it.

### 1. Final Save
Execute the Save action first.

### 2. Update CONVERSATION_HISTORY.md
- Move from Active to Completed table
- Add final summary

### 3. Clear Active Conversation
```bash
rm .claude/CURRENT_CONVERSATION_ID
```

### 4. Confirm Close
```
✅ Baton Closed
═══════════════════════════════════════

📋 Archived: [conv-id]
📝 Title: [title]
📊 Final: X tasks completed

📁 Summary preserved at:
   .claude/conversations/[conv-id]/SUMMARY.md

💡 Start new conversation: /baton start
═══════════════════════════════════════
```

---

## Action: Recover After Compaction

⚠️ **CRITICAL**: Use this immediately after conversation compaction to restore context.

### 1. Check for Active Conversation
```bash
if [[ -f .claude/CURRENT_CONVERSATION_ID ]]; then
  CONV_ID=$(cat .claude/CURRENT_CONVERSATION_ID)
else
  echo "No active conversation to recover"
  exit 0
fi
```

### 2. Read Context Files
Read these files in order:
1. `.claude/CONVERSATION_HISTORY.md` - Overview of all conversations
2. `.claude/conversations/$CONV_ID/SUMMARY.md` - Current conversation state
3. `.claude/BUGS.md` - Any bugs discovered (filter by conv-id)
4. `.claude/DECISIONS.md` - Architecture decisions (filter by conv-id)

### 3. Display Recovery Summary
```
🔄 Baton Recovery Complete
═══════════════════════════════════════

📋 Restored Conversation: [conv-id]

## Context in 3 Lines
[From SUMMARY.md]

## Current Task Status
✅ Completed: [list]
⬜ Pending: [list]

## Key Decisions This Session
[From DECISIONS.md filtered by conv-id]

## Known Bugs
[From BUGS.md filtered by conv-id]

## Files We're Working With
[From SUMMARY.md]

## Next Actions
[From SUMMARY.md]

## Current State
[From SUMMARY.md State Snapshot]

═══════════════════════════════════════
Ready to continue. What's next?
```

---

## Action: Show History

Display all conversations from CONVERSATION_HISTORY.md.

```
📚 Conversation History
═══════════════════════════════════════

🟢 Active Conversations:
[Table from CONVERSATION_HISTORY.md]

📦 Completed Conversations:
[Table from CONVERSATION_HISTORY.md]

═══════════════════════════════════════
💡 View details: Read .claude/conversations/[conv-id]/SUMMARY.md
```

---

## Auto-Behaviors

### On Bug Discovery
When discovering a bug during work, append to `.claude/BUGS.md`:

```markdown
## [conv-id] - [date]
**Bug:** [description]
**Location:** [file:line if known]
**Severity:** [critical/high/medium/low]
**Status:** [open/fixed]
```

### On Architecture Decision
When making significant decisions, append to `.claude/DECISIONS.md`:

```markdown
## [conv-id] - [date]
**Decision:** [what was decided]
**Context:** [why this came up]
**Alternatives:** [what else was considered]
**Rationale:** [why this choice]
```

---

## File Structure Reference

```
.claude/
├── CURRENT_CONVERSATION_ID     # Contains active conv-id
├── CONVERSATION_HISTORY.md     # Index of all conversations
├── BUGS.md                     # Bugs tagged by conv-id
├── DECISIONS.md                # Decisions tagged by conv-id
├── conversations/
│   └── conv-YYYYMMDD-HHMMSS/
│       └── SUMMARY.md          # Per-conversation state
└── templates/
    └── standard.md             # SUMMARY.md template
```

---

## When to Use

**Start a conversation (`/baton start`) when:**
- Beginning significant work
- Working on a multi-session task
- Context might get long

**Save progress (`/baton save`) when:**
- Completed a milestone
- Before risky operations
- Context getting long
- Before ending session

**Recover (`/baton recover`) when:**
- After "[Context compacted]" message
- Starting a new session with existing work
- Returning after a break

**Close (`/baton close`) when:**
- Work is complete
- Switching to different project
- Archiving for future reference
