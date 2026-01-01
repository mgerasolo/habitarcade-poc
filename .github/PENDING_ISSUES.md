# Pending GitHub Issues

These issues need to be created in GitHub. They document missing features identified from the project-preplan.md and PRD.

---

## Issue 1: [HabitMatrix] Per-Habit Completion Scoring Display

**Labels:** `type:feature`, `area:ui`, `priority:medium`, `status:ai-ready`

### Summary
Display per-habit completion percentage/score at the end of each habit row.

### From PRD/Spec
- Epic 2.7 specifies per-habit completion percentage should display in each row
- project-preplan.md: "We will do 'Roll up' Metrics like what percentage of the days the user completed the task"
- project-preplan.md: "We want to be able to have an annual view on habits and you see the percent for the month absolute and percent for month out of target"

### Acceptance Criteria
- [ ] Each habit row displays completion percentage for current month
- [ ] Percentage calculation: `(complete + extra) / (total - na - exempt) * 100`
- [ ] Score displayed in a compact format (e.g., "78%") at end of row
- [ ] Visual indicator (color gradient) based on score
- [ ] Habits with targets (e.g., "8 days/month") show progress toward target, not just raw percentage

### Technical Notes
- Modify `HabitRow.tsx` to calculate and display score
- Use `entriesByDate` Map to calculate status counts
- Consider memoization for performance

### Location
`client/src/widgets/HabitMatrix/HabitRow.tsx`

---

## Issue 2: [HabitMatrix] Overall Score in Widget Header

**Labels:** `type:feature`, `area:ui`, `priority:medium`, `status:ai-ready`

### Summary
Display overall habit completion score in the HabitMatrix widget header.

### From PRD/Spec
- Epic 2.7 specifies overall score should appear in widget header
- project-preplan.md: "We want to use the Rollup so at least the person can track well I hit only 50% of my habits each day last month. but this month I hit 62% so I made progress."

### Acceptance Criteria
- [ ] Widget header displays overall completion percentage
- [ ] Format: "Today: 65% | Month: 72%"
- [ ] Color coding based on score (green > 80%, yellow 50-80%, red < 50%)
- [ ] Clicking score could expand to show breakdown by category

### Technical Notes
- Add to header bar in `index.tsx` (near habit count)
- Calculate from `categoryGroups` data
- Consider separate "today" vs "month" scores

### Location
`client/src/widgets/HabitMatrix/index.tsx` header section

---

## Issue 3: [HabitMatrix] 6 AM Day Boundary (Offset Days)

**Labels:** `type:feature`, `area:api`, `area:ui`, `priority:medium`, `status:ai-ready`

### Summary
Implement user-configurable day boundary for habits instead of using midnight.

### From PRD/Spec
- Epic 2.9 specifies day boundary logic
- project-preplan.md: "For Habits Allow the user to do 'offset days'. By this I mean we don't just treat midnight local to the user as always the end of a day. Some items the user might want tied to their 'awake' days. For example I usually go to bed between 1 AM and 5 AM. And get up between 9AM and 1 PM. So for me for many items my day would reset at 6 AM instead of midnight when practical/possible."

### Acceptance Criteria
- [ ] User can set global day boundary time (default: midnight, option for 6 AM)
- [ ] Individual habits can override global setting
- [ ] Date calculations use boundary time, not midnight
- [ ] UI shows "today" based on boundary (e.g., at 2 AM, still shows yesterday as "today")
- [ ] Entry creation respects boundary time

### Database Changes
- Add `dayBoundaryTime` to Settings table (default: "00:00")
- Add `useDayBoundary` boolean to Habits table (default: true)

### Technical Notes
- Modify `useHabitMatrix.ts` date generation logic
- Update `getEffectiveDate()` helper function
- Server-side: ensure entries are created with correct date based on boundary

### Location
- `client/src/widgets/HabitMatrix/useHabitMatrix.ts`
- `client/src/stores/settingsStore.ts`
- `server/src/routes/settings.ts`

---

## Issue 4: [HabitMatrix] GitHub-Style Annual Contribution Graph

**Labels:** `type:feature`, `area:ui`, `priority:low`, `status:ai-ready`

### Summary
Create a GitHub-style contribution graph for habit deep-dive view showing annual performance.

### From PRD/Spec
- project-preplan.md: "Deep Dive of the habit will have a Github style graph view of the performance"
- Reference image: `imports/images/PNG image 2.png`
- Shows full year of habit data in compact grid format

### Acceptance Criteria
- [ ] 52 columns (weeks) × 7 rows (days) grid
- [ ] Color intensity based on completion status (darker = complete, lighter = partial)
- [ ] Hover shows date and status details
- [ ] Week/month labels at top
- [ ] Scrollable if viewing multiple years
- [ ] Legend showing color meanings

### Design
```
     Jan       Feb       Mar       Apr ...
Mon  ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪
Tue  ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪
Wed  ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪
...
```

### Technical Notes
- Create new component `ContributionGraph.tsx`
- Fetch full year of entries for selected habit
- Use CSS grid for layout
- Consider SVG for better scaling

### Location
`client/src/widgets/HabitMatrix/ContributionGraph.tsx` (new file)

---

## Issue 5: [HabitMatrix] Click Habit Name → Detail Modal

**Labels:** `type:feature`, `area:ui`, `priority:medium`, `status:ai-ready`

### Summary
Clicking on a habit name should open a deep-dive modal with detailed stats and the GitHub-style contribution graph.

### From PRD/Spec
- project-preplan.md: "When hovering on the name of the habit there will be a 'deep dive' action link to see the deeper dive stats."
- project-preplan.md: "It will have details like when it was added, what it is linked to, ability to edit the habit"

### Acceptance Criteria
- [ ] Clicking habit name opens modal
- [ ] Modal shows:
  - [ ] Habit name, icon, category
  - [ ] Creation date
  - [ ] Linked goals/projects (if any)
  - [ ] Current streak count
  - [ ] Best streak ever
  - [ ] Completion stats (this month, this year, all-time)
  - [ ] GitHub-style contribution graph (Issue #4)
  - [ ] Edit button to modify habit
- [ ] Close on Escape key or click outside
- [ ] Smooth open/close animations

### UI Design
```
┌─────────────────────────────────────────┐
│ 🏃 Morning Exercise          [Edit] [X] │
├─────────────────────────────────────────┤
│ Category: Activity                      │
│ Created: Dec 15, 2024                   │
│                                         │
│ Current Streak: 5 days 🔥               │
│ Best Streak: 12 days                    │
│                                         │
│ This Month: 78% (18/23 days)            │
│ This Year: 72%                          │
│                                         │
│ [===== Contribution Graph =====]        │
│                                         │
└─────────────────────────────────────────┘
```

### Technical Notes
- Add `onClick` handler to habit name in `HabitRow.tsx`
- Create `HabitDetailModal.tsx` component
- Register in `ModalManager.tsx` as 'habit-detail'
- Fetch extended habit data on modal open

### Location
- `client/src/widgets/HabitMatrix/HabitRow.tsx` (add onClick)
- `client/src/widgets/HabitMatrix/HabitDetailModal.tsx` (new)
- `client/src/components/ModalManager.tsx` (register modal)

---

## Issue 6: [HabitMatrix] Markdown Bulk Habit Import

**Labels:** `type:feature`, `area:api`, `priority:low`, `status:ai-ready`

### Summary
Allow users to bulk import habits via markdown format.

### From PRD/Spec
- Epic 2.8 specifies POST /api/habits/import endpoint
- project-preplan.md: "We also want to let users bulk manage and load/update them in an easy format. I like the idea of Markdown"
- Reference: `imports/sample-habits.md` for format

### Acceptance Criteria
- [ ] POST `/api/habits/import` endpoint accepts markdown
- [ ] Parse markdown format like:
```markdown
## Category: Health
- [ ] Morning Pills @icon:Medication @color:#fbbf24
- [ ] Evening Pills @icon:Medication @color:#ea580c

## Category: Activity
- [ ] 3,000+ Steps @icon:DirectionsWalk
- [ ] DDPY or GYM @icon:FitnessCenter
```
- [ ] Create categories if they don't exist
- [ ] Create habits under appropriate categories
- [ ] Support @icon, @color, @frequency tags
- [ ] Return summary of what was created
- [ ] UI: Import button in settings or habit management

### API Specification
```typescript
POST /api/habits/import
Content-Type: text/markdown

Request Body: (raw markdown)

Response: {
  created: { categories: 3, habits: 15 },
  skipped: { habits: 2 }, // duplicates
  errors: []
}
```

### Location
- `server/src/routes/habits.ts` (add import endpoint)
- `client/src/components/Forms/HabitImport.tsx` (new)

---

## Issue 7: [HabitMatrix] Pink Auto-Status for Unfilled Days

**Labels:** `type:feature`, `area:ui`, `priority:medium`, `status:ai-ready`

### Summary
Automatically set unfilled habit cells to "pink" status after the day boundary passes.

### From PRD/Spec
- project-preplan.md: "Pink - User can enable a if I don't fill out by end of the day set it to pink to mark it as I likely missed it. Hoping this encourages them to go back and make sure they fill in the ones they did at least."

### Acceptance Criteria
- [ ] Global setting to enable/disable pink auto-status
- [ ] Per-habit override option
- [ ] After day boundary (midnight or 6 AM), unfilled cells become pink
- [ ] Pink status is distinct from "missed" (red) - it means "forgot to log"
- [ ] User can still click to change from pink to actual status
- [ ] Background job or client-side logic to apply pink status

### Technical Notes
- Add `pinkAutoStatus` to Settings table
- Add `enablePinkAutoStatus` to Habits table
- Client-side: check on load if previous day is past and empty → show as pink
- Optionally: server-side cron to create pink entries

### Location
- `client/src/widgets/HabitMatrix/StatusCell.tsx`
- `client/src/widgets/HabitMatrix/useHabitMatrix.ts`
- `server/src/routes/settings.ts`

---

## Issue 8: [HabitMatrix] Row/Column Highlight on Hover

**Labels:** `type:feature`, `area:ui`, `priority:low`, `status:ai-ready`

### Summary
Highlight the current row and column with a subtle overlay when mousing over any cell.

### From PRD/Spec
- project-preplan.md: "Mousing Over should highlight row and column like a 20% yellow to help keep track of where you are."
- Reference image: `imports/images/SampleHabit-Matrix-Tooltip+Highlght copy.png`

### Acceptance Criteria
- [ ] Hovering over any cell highlights entire row
- [ ] Hovering over any cell highlights entire column
- [ ] Highlight is subtle (20% yellow or similar)
- [ ] Highlight follows mouse as user moves
- [ ] Performance optimized (no lag on hover)

### Technical Notes
- Use CSS hover states with `:has()` selector or React state
- Consider CSS custom properties for highlight color
- May need context to share hover state between cells

### Location
- `client/src/widgets/HabitMatrix/HabitRow.tsx`
- `client/src/widgets/HabitMatrix/StatusCell.tsx`
- `client/src/widgets/HabitMatrix/index.tsx` (for column context)

---

## Issue 9: [HabitMatrix] Long-Press Status Tooltip

**Labels:** `type:feature`, `area:ui`, `priority:medium`, `status:ai-ready`

### Summary
Show a tooltip with all status options when hovering over a cell for more than 1 second.

### From PRD/Spec
- project-preplan.md: "By default clicking on the date cell for a habit should cycle it through (started as White) Completed, Missed, Blank. But hovering over it for more than a second should give a pop up tooltip below it."
- Reference image: `imports/images/SampleHabit-Matrix-Tooltip+Highlght copy.png`

### Acceptance Criteria
- [ ] Quick click cycles through: Complete → Missed → Empty
- [ ] Hover > 1 second shows tooltip below cell
- [ ] Tooltip shows all status options: Complete, Missed, Exempt, N/A, Extra, Partial, Pink
- [ ] Each option has icon and color preview
- [ ] Clicking option in tooltip sets that status
- [ ] Tooltip dismisses on mouse leave

### UI Design
```
         ┌──────────────────────┐
   [🟢]  │ ✅ Complete          │
         │ ❌ Missed            │
         │ 🟡 Exempt            │
         │ ⬜ N/A               │
         │ 🟢 Extra             │
         │ 🔵 Partial           │
         │ 🩷 Pink (unfilled)   │
         └──────────────────────┘
```

### Technical Notes
- Use `setTimeout` for hover delay
- Position tooltip below cell, flip if near bottom edge
- Use portal for z-index management

### Location
- `client/src/widgets/HabitMatrix/StatusCell.tsx`
- `client/src/widgets/HabitMatrix/StatusTooltip.tsx` (new)

---

## Issue 10: [HabitMatrix] Extra Status (Dark Green) Support

**Labels:** `type:feature`, `area:ui`, `priority:low`, `status:ai-ready`

### Summary
Add "Extra" status for days when user went above and beyond.

### From PRD/Spec
- project-preplan.md: "Extra - Dark Green - User went above and beyond that day. like did double exercise target"

### Acceptance Criteria
- [ ] "Extra" status option available in status picker
- [ ] Dark green color (#047857) for extra status
- [ ] Counts toward completion percentage
- [ ] Visual distinction from regular "complete" (emerald green)

### Technical Notes
- Already in StatusCell.tsx color map, verify it works in cycle

### Location
- `client/src/widgets/HabitMatrix/StatusCell.tsx`

---

## Issue 11: [HabitMatrix] Trending Status (Target Warning)

**Labels:** `type:feature`, `area:ui`, `priority:low`, `status:ai-ready`

### Summary
Show visual warning when user is trending to miss their target for habits with frequency goals.

### From PRD/Spec
- project-preplan.md: "Dark Gray/Red - Some items will have lower targets like Fasting the goal is 8 days per month. so there will be a lot of Dark Grays, but if it gets to the point where I am trending to not make the target, these start becoming red instead until the trend improves."

### Acceptance Criteria
- [ ] Habits can have target frequency (e.g., 8 days/month)
- [ ] Calculate if user is on track to meet target
- [ ] If behind pace, show warning indicator on habit row
- [ ] "Trending to miss" could show in row or as status color shift

### Technical Notes
- Add `targetFrequency` to Habits table
- Calculate pace: `(completedDays / daysSoFar) * daysInMonth`
- Compare to target

### Location
- `client/src/widgets/HabitMatrix/HabitRow.tsx`
- `client/src/widgets/HabitMatrix/useHabitMatrix.ts`

---

## Issue 12: [HabitMatrix] Count-Based Status Colors

**Labels:** `type:feature`, `area:ui`, `priority:low`, `status:ai-ready`

### Summary
Support habits with numbered targets that show progressive color shading.

### From PRD/Spec
- project-preplan.md: "Number - Some items might have a target Number and the color might be shades of green up to the number. For example on a Fasting Day, I should have 3 LMNT supplements. so varying shade of green building up until the count is complete."

### Acceptance Criteria
- [ ] Habits can have `dailyTarget` count (e.g., 3 for 3 supplements)
- [ ] Clicking increments count instead of cycling status
- [ ] Cell shows count number
- [ ] Color intensity increases with count (light green → dark green)
- [ ] Full target = full green, partial = lighter shade

### Technical Notes
- Add `dailyTarget` to Habits table
- Add `count` field to HabitEntry table
- StatusCell shows number if habit has daily target

### Location
- `client/src/widgets/HabitMatrix/StatusCell.tsx`
- `server/src/routes/habitEntries.ts`

---

## Issue 13: [Sidebar] Add "Manage" Section

**Labels:** `type:feature`, `area:ui`, `priority:high`, `status:ai-ready`

### Summary
Add "Manage" section to sidebar for managing habits, categories, projects, and settings.

### From User Feedback
- User noted "Manage" section is missing from sidebar
- Needed for accessing habit/category/project management without modal hunting

### Acceptance Criteria
- [ ] "Manage" section in sidebar (collapsible)
- [ ] Sub-items:
  - [ ] Habits - Opens habit list/management view
  - [ ] Categories - Opens category management
  - [ ] Projects - Opens project management
  - [ ] Tags - Opens tag management
  - [ ] Settings - Opens settings modal
- [ ] Active state shows which management view is open
- [ ] Icons for each sub-item

### UI Design
```
DASHBOARD
  Home
  Analytics

WIDGETS
  Habit Matrix
  Weekly Kanban
  Time Blocks
  ...

MANAGE           ← NEW SECTION
  📋 Habits
  📁 Categories
  📂 Projects
  🏷️ Tags
  ⚙️ Settings
```

### Location
- `client/src/layouts/Sidebar.tsx`
- `client/src/pages/ManageHabits.tsx` (new)
- `client/src/pages/ManageCategories.tsx` (new)

---

## Quick Create Instructions

To create these issues in GitHub:

1. Go to https://github.com/mgerasolo/habitarcade-poc/issues/new
2. Copy each issue's title, body, and labels
3. Create each issue

Or install `gh` CLI:
```bash
sudo apt install gh
gh auth login
```

Then run:
```bash
cd /home/mgerasolo/Dev/habitarcade-poc
# Create each issue with gh issue create
```
