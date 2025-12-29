---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-core-experience', 'step-04-emotional-response', 'step-05-inspiration', 'step-06-design-system', 'step-07-defining-experience', 'step-08-visual-foundation', 'step-09-design-directions', 'step-10-user-journeys', 'step-11-component-strategy', 'step-12-ux-patterns', 'step-13-responsive-accessibility', 'step-14-complete']
workflowComplete: true
completedAt: '2025-12-29'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - imports/images/SampleHabit-Matrix.png
  - imports/images/SampleHabit-Matrix-Tooltip+Highlght.png
  - imports/images/wallboard-filled.jpeg
workflowType: 'ux-design'
project_name: 'habitarcade-poc'
user_name: 'Matt'
date: '2025-12-29'
---

# UX Design Specification: HabitArcade POC

**Author:** Matt
**Date:** 2025-12-29

---

## Executive Summary

### Project Vision

**HabitArcade** is a gamified habit tracking POC that recreates a physical wallboard experience digitally. The core concept: a dense, information-rich dashboard where users can quickly track daily habits, manage tasks, and visualize progress - all with satisfying click-to-cycle interactions and color-coded visual feedback.

**Target User:** Single user (Matt) for 1-2 months of real-world testing before building the full Life OS version on AppBrain architecture.

**Primary Goal:** Validate the digital habit tracking experience before investing in the full production system.

### Target Users

**Primary User Profile:**
- Power user comfortable with dense information displays
- Uses both desktop (Chrome) and mobile (Safari iOS)
- Values quick interactions over guided flows
- Familiar with the physical wallboard system being digitized

**Usage Context:**
- Morning check-in: Review yesterday, plan today
- Throughout day: Quick status updates via mobile
- Evening review: Mark off completed habits, plan tomorrow
- Weekly: Scan patterns, adjust habits

### Key Design Challenges

1. **Information Density** - Packing 30+ habits × 31 days into a scannable matrix without overwhelming
2. **Touch Target Size** - Small cells need to be tappable on mobile Safari while staying dense on desktop
3. **Status Cycling UX** - Making the 9-state cycle intuitive with two-tier interaction model
4. **Widget Dashboard Balance** - 5 widgets (Matrix, Kanban, Time Blocks, Target Graph, Parking Lot) competing for 24-column space
5. **Day Boundary Logic** - 6 AM boundary affects what "today" means visually

### Design Opportunities

1. **Satisfying Micro-interactions** - Click feedback, status transitions, streak celebrations
2. **Glanceable Progress** - Color patterns that tell the story at a glance (like the physical wallboard)
3. **Contextual Actions** - Hover tooltip for edge-case statuses
4. **Smart Defaults** - Pre-fill based on patterns

### Core Interaction Model

**Habit Status Interaction (Two-Tier):**

| Action | Result |
|--------|--------|
| Single click | Cycle through common statuses: Empty → Complete → Missed → Empty |
| Hover (desktop) / Long-press (mobile) | Show tooltip with all 9 statuses |
| Select from tooltip | Set specific status (Partial, N/A, Exempt, Extra, Pink/Unmarked) |

**Status Color Coding:**

| Status | Color | Usage |
|--------|-------|-------|
| Empty | White/Light gray | Not yet marked |
| Complete | Green | Successfully completed |
| Missed | Red | Failed to complete |
| Partial | Blue | Partially completed |
| N/A | Gray | Not applicable for this day |
| Exempt | Yellow | Excused (sick, travel, etc.) |
| Extra | Dark green | Bonus completion |
| Trending-Fail | Orange | At risk of missing |
| Pink/Unmarked | Pink | Accountability reminder (past day boundary, not marked) |

### Phased UX Scope

**Week 1 (MVP):**
- Individual widget functionality
- Basic dashboard with drag-drop layout
- Core habit matrix with full status cycling
- Weekly Kanban (day columns)
- Time Block priorities with timer
- Target Line Graph
- Parking Lot quick capture

**Week 2 (Wallboard Mode):**
- Optimized TV layout showing all widgets together
- Habit Matrix + Task Lists + Command Board on one screen
- "Mission control" view for daily review

**Week 3 (Mobile Optimization):**
- Touch-optimized layouts
- Mobile-specific widget arrangements
- Gesture interactions

## Core User Experience

### Defining Experience

**Core Action:** Click a cell to mark habit status.

Everything else (task management, time blocks, graphs) supports this core loop. The habit matrix is the heart of the experience - if clicking cells feels satisfying and fast, the product succeeds.

**Supporting Actions:**
- Drag tasks between days in Kanban
- Start/stop time block timers
- Quick capture to Parking Lot
- Scan patterns at a glance

### Platform Strategy

| Platform | Priority | Interaction Model |
|----------|----------|-------------------|
| Desktop (Chrome) | Primary | Mouse hover + click, full dashboard, month view |
| Mobile (Safari iOS) | Secondary | Touch tap + long-press, focused widgets, 3-day view |
| TV/Wallboard | Week 2 | Display-optimized, minimal interaction |

**Responsive Matrix Views:**

| Context | View | Days Shown |
|---------|------|------------|
| Desktop (full widget) | Month | 31 days |
| Desktop (smaller widget) | Week | 7 days |
| Mobile | Recent | 3 days (today, yesterday, day before) |

The category rows stay consistent across all views - only the time axis scales.

### Effortless Interactions

**Should feel completely natural:**
1. **Click → Status change** - Instant visual feedback, no loading spinners
2. **Scan the matrix** - Color patterns immediately tell the story
3. **Drag tasks between days** - Fluid movement, no confirmation dialogs
4. **Quick capture to Parking Lot** - Type, enter, done

**Should happen automatically:**
- Pink status applied when day boundary passes with unmarked habits
- Timer completion marks linked habit as complete
- Layout persists across sessions and devices
- 30-second background sync keeps data fresh

### Critical Success Moments

| Moment | Success Criteria |
|--------|------------------|
| First habit marked | Satisfying click, instant color change, no lag |
| Morning scan | See yesterday's pattern in <2 seconds |
| Weekly review | Spot trends without counting cells |
| Day boundary | Pink cells create accountability without guilt |
| Time block complete | Linked habit auto-marks, timer celebration |

**Make-or-Break:** If clicking a habit cell feels laggy or uncertain, the experience fails.

### Experience Principles

1. **Dense but Scannable** - Show everything, but patterns should pop immediately
2. **One-Click Actions** - Common tasks = single interaction, edge cases = tooltip
3. **Immediate Feedback** - No spinners, no waiting, optimistic updates everywhere
4. **Accountability without Punishment** - Pink is a gentle nudge, not shame
5. **Context-Appropriate Density** - Month on desktop, week in small widgets, 3 days on mobile

## Desired Emotional Response

### Primary Emotional Goals

**Satisfaction** - The primary emotion. Every click should feel rewarding - like checking off a physical checkbox but better. The sound/visual feedback of marking a habit complete should be quietly satisfying.

**In Control** - The dense display should feel empowering, not overwhelming. Users should feel like they're at mission control, with everything visible and within reach.

**Clarity** - No cognitive overhead. Patterns should pop immediately. The user should be able to scan their week/month and instantly know their story.

**Accountable** (not guilty) - Pink cells create awareness without shame. The system nudges toward action, never punishes for misses.

### Emotional Journey Mapping

| Stage | Target Emotion | Design Support |
|-------|----------------|----------------|
| First Discovery | "This is exactly what I wanted" | Familiar matrix layout, obvious interactions |
| Morning Scan | Quick clarity, ready to act | Color patterns immediately visible, today highlighted |
| Marking Habits | Micro-satisfaction with each click | Instant color change, subtle feedback |
| Streak in Progress | Quiet pride, momentum | Green patterns visually satisfying |
| Missed Day | Gentle accountability | Pink is soft, not angry red |
| Weekly Review | Pattern recognition, insight | Trends visible without counting |
| Day Boundary | Awareness, not alarm | Automatic pink is informational |

### Micro-Emotions

**Prioritize:**
- **Confidence** over Confusion - Every interaction should have predictable outcomes
- **Accomplishment** over Frustration - One-click actions, no hunting for options
- **Satisfaction** over Delight - Power users prefer utility; whimsy would feel cheap
- **Trust** over Anxiety - Data persists, syncs work, no fear of loss

**Specifically Avoid:**
- Overwhelm from information density (solve with smart visual hierarchy)
- Uncertainty about what will happen when clicking (solve with consistent patterns)
- Guilt from missed habits (solve with gentle pink, not angry red)
- Anxiety about data loss (solve with visible sync status, optimistic updates)

### Design Implications

| Emotion | UX Design Approach |
|---------|-------------------|
| Satisfaction | Instant color change, subtle click feedback, no loading states |
| In Control | Everything visible, no hidden modes, predictable layouts |
| Clarity | Color-coded patterns, consistent visual language, no decoration |
| Accountability | Pink is muted (not alarming), easy to resolve, no judgment messages |
| Trust | Visible sync indicator, data persists, undo available |
| Momentum | Streak visualization, progress patterns, "today" always prominent |

### Emotional Design Principles

1. **Utility Over Whimsy** - This is a power tool, not a toy. Celebrations should be subtle (brief flash, not confetti explosions).

2. **Instant Gratification** - Zero lag between click and visual change. Optimistic updates everywhere.

3. **Pattern-Based Progress** - Users should feel progress through visual patterns, not numbers or badges. A green streak tells its own story.

4. **Gentle Accountability** - Pink means "needs attention," not "you failed." The tone is helpful assistant, not disappointed parent.

5. **Quiet Confidence** - The interface should feel calm and stable, even with dense information. No visual noise, no unnecessary motion.

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**1. Physical Wallboard (Primary Inspiration)**
The user's existing analog system is the primary UX benchmark:
- Dense matrix showing all habits × days at a glance
- Color-coded stickers for instant pattern recognition
- Everything visible simultaneously - no scrolling/navigation
- Physical satisfaction of placing stickers
- Week-at-a-glance for tasks alongside habit tracking

**What to preserve digitally:** Density, color patterns, everything-visible philosophy, satisfying marking action.

**2. GitHub Contribution Graph**
The canonical example of a scannable activity matrix:
- Dense calendar grid with color intensity showing activity levels
- Patterns tell stories at a glance (streaks, gaps, consistency)
- Hover reveals details without cluttering the view
- Minimal chrome around the core visualization
- Colors fade from light (less) to dark (more)

**Applicable patterns:** Matrix layout, color-as-data, hover-for-details, pattern-based storytelling.

**3. Notion**
Power-user productivity tool that handles density well:
- Database views (table, kanban, calendar) for same data
- Slash commands and keyboard shortcuts for power users
- Minimal UI chrome - content is the interface
- Drag-and-drop everything
- Quick capture with immediate inline editing

**Applicable patterns:** Keyboard-first for power users, view flexibility, minimal chrome, fluid drag-and-drop.

**4. Todoist**
Task management with excellent quick-capture UX:
- Natural language parsing for quick entry
- Minimal clicks to add/complete tasks
- Checkmark animations provide micro-satisfaction
- Kanban boards for visual task management
- Subtle, non-intrusive gamification (streaks, karma)

**Applicable patterns:** Quick capture, satisfying completion animations, subtle gamification.

**5. Beaver Habits**
Self-hosted, minimalist habit tracker (inspired by Loop Habit Tracker):
- Matrix layout: habits as rows, dates as columns
- Configurable column count (5 days default, adjustable)
- No goals, no gamification - pure tracking
- Dead simple: click to mark complete
- Self-hosted = complete data ownership
- Lightweight, browser-based, mobile responsive
- GitHub-style contribution graph for pattern visualization

**Applicable patterns:** Matrix orientation matches HabitArcade exactly, configurable date range, zero-friction marking, no punishment mechanics, minimalist aesthetic supporting density.

**Key Insight from Beaver Habits:** The GitHub-style streak/contribution graph view provides a secondary visualization complementing the matrix - useful for pattern recognition over longer time spans. Their mobile adaptation (configurable date columns) directly validates our 31/7/3-day responsive approach.

### Transferable UX Patterns

**Matrix/Grid Patterns:**
| Pattern | Source | HabitArcade Application |
|---------|--------|-------------------------|
| Color-coded cells | GitHub, Physical board | 9 status colors for habit cells |
| Hover-reveal details | GitHub | Status tooltip on hover |
| Row/column headers | Spreadsheets | Habit names (rows) × dates (columns) |
| Sticky headers | Data tables | Category rows stay visible while scrolling |
| Configurable date columns | Beaver Habits | Responsive matrix views (31/7/3 days) |

**Interaction Patterns:**
| Pattern | Source | HabitArcade Application |
|---------|--------|-------------------------|
| Click-to-toggle | Todoist, Beaver Habits | Click cycles through common statuses |
| Long-press for options | iOS context menus | Long-press reveals all 9 status options |
| Drag to reorder/reschedule | Notion, Trello | Drag tasks between Kanban days |
| Quick capture + Enter | Todoist, Notion | Parking Lot quick entry |
| Zero-friction marking | Beaver Habits | Single click completes core action |

**Visual Patterns:**
| Pattern | Source | HabitArcade Application |
|---------|--------|-------------------------|
| Dense but readable | Notion tables, Beaver Habits | Information-rich without overwhelm |
| Color as data | GitHub graph | Status colors carry meaning |
| Today highlighted | Calendar apps | Visual emphasis on current day column |
| Subtle animations | Todoist | Brief flash on status change |
| Minimal chrome | Beaver Habits | Content is the interface |

### Anti-Patterns to Avoid

**Over-Gamification:**
- Excessive confetti/celebrations (distracting for daily use)
- Badge/achievement spam (power users find this patronizing)
- Punishment mechanics for misses (guilt-inducing)
- Goal-setting pressure (Beaver Habits deliberately omits this)

**Hidden Information:**
- Requiring clicks to reveal important data
- Tabbed interfaces that hide related information
- Modal dialogs for simple actions

**Friction in Core Loop:**
- Multiple clicks to mark a habit complete
- Confirmation dialogs for common actions
- Loading spinners on every interaction

**Mobile-First Compromise:**
- Oversized touch targets that reduce density on desktop
- Simplified views that hide power-user features
- Hamburger menus hiding primary navigation

**Social/Sharing Clutter:**
- Sharing prompts interrupting core flow
- Leaderboards creating comparison anxiety
- "Invite friends" modals

### Design Inspiration Strategy

**Adopt Directly:**
- GitHub-style matrix density and color storytelling
- Todoist-style click satisfaction and completion feedback
- Notion-style minimal chrome and drag-and-drop fluidity
- Physical wallboard's "everything visible" philosophy
- Beaver Habits' zero-friction, no-punishment tracking

**Adapt for HabitArcade:**
- GitHub's hover → our two-tier (click cycle + hover tooltip)
- Notion's database views → our responsive matrix (month/week/3-day)
- Todoist's gamification → subtle, power-user appropriate (no badges)
- Beaver Habits' simplicity → enhanced with our 9-status system

**Validate from Beaver Habits:**
- GitHub-style graph confirms pattern-based visualization works for habit tracking
- Configurable date columns = our responsive matrix views
- Mobile-first simplification without losing core functionality
- Proof that minimal, self-hosted habit trackers have an audience

**Explicitly Avoid:**
- Duolingo-style streak guilt ("Your streak is at risk!")
- Complex navigation (everything on dashboard)
- Reward animations that interrupt flow
- Mobile-compromised density on desktop
- Goal-setting mechanics that create pressure

## Design System Foundation

### Design System Choice

**Approach: Tailwind CSS + Custom Components**

Rather than adopting a full component library (MUI, Chakra, etc.), HabitArcade uses Tailwind CSS as the styling foundation with custom-built components optimized for our specific needs.

**Why not a component library:**
- Component libraries add visual opinions that fight our "minimal chrome" goal
- Pre-built components are often designed for general use, not dense data displays
- Our core components (habit matrix, status cells) are too specialized for generic solutions
- POC scope doesn't justify the overhead of learning/configuring a full design system

### Rationale for Selection

| Factor | Decision Rationale |
|--------|-------------------|
| Speed | Tailwind utilities enable rapid prototyping |
| Customization | Full control over every pixel - critical for dense matrix cells |
| Bundle Size | No unused component library code |
| Learning Curve | Matt already familiar with Tailwind patterns |
| Maintenance | Simple utility classes, no library version upgrades |
| Uniqueness | Matches inspiration from physical wallboard - no "generic app" feel |

### Implementation Approach

**Tailwind Configuration:**
```javascript
// tailwind.config.js - key customizations
module.exports = {
  theme: {
    extend: {
      colors: {
        // Habit status colors (semantic)
        status: {
          empty: '#f3f4f6',      // gray-100
          complete: '#22c55e',   // green-500
          missed: '#ef4444',     // red-500
          partial: '#3b82f6',    // blue-500
          na: '#9ca3af',         // gray-400
          exempt: '#eab308',     // yellow-500
          extra: '#15803d',      // green-700
          trending: '#f97316',   // orange-500
          pink: '#f9a8d4',       // pink-300
        }
      },
      // Tight spacing for dense matrix
      spacing: {
        'cell': '1.5rem',        // 24px habit cells
        'cell-sm': '1rem',       // 16px mobile cells
      }
    }
  }
}
```

**Component Strategy:**
| Component Type | Approach |
|----------------|----------|
| Habit Matrix | Fully custom - no equivalent exists |
| Status Cells | Custom with Tailwind utilities |
| Dashboard Layout | react-grid-layout (already decided) |
| Forms | Simple Tailwind styling, React Hook Form |
| Buttons/Inputs | Custom utility classes, consistent patterns |
| Tooltips | Lightweight custom (or Headless UI for a11y) |
| Toasts | react-hot-toast (already decided) |
| Charts | ECharts (already decided) |

### Customization Strategy

**Design Tokens (CSS Custom Properties):**
```css
:root {
  /* Status colors */
  --status-empty: theme('colors.status.empty');
  --status-complete: theme('colors.status.complete');
  /* ... */

  /* Spacing */
  --cell-size: 1.5rem;
  --cell-gap: 1px;

  /* Typography */
  --font-habit: 0.75rem;
  --font-category: 0.875rem;

  /* Timing */
  --transition-click: 100ms;
  --transition-hover: 150ms;
}
```

**Dark Mode Strategy:**
Not prioritized for MVP. If needed later, Tailwind's `dark:` variants enable straightforward implementation.

**Responsive Breakpoints:**
| Breakpoint | Usage |
|------------|-------|
| `sm` (640px) | Mobile 3-day view |
| `md` (768px) | Tablet week view |
| `lg` (1024px) | Desktop month view |
| `xl` (1280px) | Wallboard mode |

### Component Architecture

**Base Components (shared patterns):**
- `StatusCell` - The atomic unit for habit tracking
- `CategoryRow` - Collapsible habit groupings
- `WidgetContainer` - Consistent widget chrome
- `QuickInput` - Shared pattern for Parking Lot, task creation

**Widget Components:**
- `HabitMatrix` - Core tracking grid
- `WeeklyKanban` - Day-column task board
- `TimeBlocks` - Priority timer widget
- `TargetGraph` - ECharts line graph
- `ParkingLot` - Quick capture list

**Utility Components:**
- `Tooltip` - Status selection on hover/long-press
- `SyncIndicator` - Visible sync status
- `Toast` - react-hot-toast wrapper with consistent styling

## Defining Core Experience (Detailed)

### The Defining Experience

**HabitArcade's "Tinder moment":**
> "Click a cell, see it change color instantly."

That's the interaction users will describe. If we get this wrong - laggy feedback, uncertain state, confusing click targets - the entire product fails. If we get it right, everything else (kanban, time blocks, graphs) just works.

**Why this is THE interaction:**
- It happens 30+ times daily (most frequent action)
- It's the moment of accountability (did I do this habit today?)
- The color change IS the reward (visual pattern building)
- It mirrors the physical satisfaction of placing a sticker

### User Mental Model

**What users bring to this task:**
- Physical wallboard experience (stickers, markers)
- Spreadsheet/calendar familiarity (rows × columns)
- Checkbox muscle memory (click = done)
- GitHub contribution graph mental model (color = activity)

**Existing mental shortcuts:**
- "Green = good, red = bad" (universal)
- "Click once = toggle" (checkbox pattern)
- "Hover for more options" (desktop convention)
- "Long-press for menu" (mobile convention)

**Potential confusion points:**
- 9 statuses vs. simple done/not-done (solve with two-tier interaction)
- "Pink" as accountability nudge, not error (color must feel gentle)
- Day boundary at 6 AM (needs clear "today" indicator)
- Which column is "today" when viewing month (visual emphasis needed)

### Success Criteria

| Criteria | Target | Measurement |
|----------|--------|-------------|
| Click-to-color feedback | < 50ms | No perceptible delay |
| Status change visibility | Instant | Color fills immediately, no spinner |
| Interaction confidence | 100% | User always knows what clicking will do |
| Pattern recognition | < 2 seconds | Glance at matrix → know your week |
| Error recovery | Always possible | Undo/re-click available |

**The "just works" test:**
- User clicks → color changes → they move on
- No confirmation dialogs
- No loading states
- No uncertainty about what happened

### Novel vs. Established Patterns

**Established Patterns We're Using:**
| Pattern | Source | Implementation |
|---------|--------|----------------|
| Click-to-toggle | Checkboxes everywhere | Single click cycles status |
| Color-as-data | GitHub graph | 9 semantic colors |
| Rows × columns | Spreadsheets | Habits × dates |
| Hover tooltip | Desktop convention | Full status selector |
| Long-press menu | iOS/Android | Mobile status selector |

**Novel Pattern: Two-Tier Status Cycling**
This is our innovation - not found in competitors:

| Tier | Interaction | Statuses Accessible |
|------|-------------|---------------------|
| Tier 1 (Quick) | Single click | Empty → Complete → Missed → Empty |
| Tier 2 (Full) | Hover/long-press | All 9 statuses via tooltip |

**Why this works:**
- 90%+ of interactions need only 3 statuses (tier 1)
- Edge cases (Partial, Exempt, N/A, Extra, Pink) are accessible but not in the way
- Matches mental model: "usually I'm just checking things off"

**Teaching the pattern:**
- No tutorial needed for tier 1 (click = toggle is universal)
- Tooltip discovery is natural (hover is instinctive on desktop)
- Mobile long-press is learned from iOS context menus

### Experience Mechanics

**1. Initiation:**
- User sees the habit matrix on dashboard load
- "Today" column is visually prominent (highlighted border, slightly larger)
- Unmarked cells for today are pink after 6 AM boundary passes
- Cursor changes to pointer on hover (clickable affordance)

**2. Interaction (Tier 1 - Click Cycle):**
```
User clicks cell
→ Current status: Empty
→ New status: Complete (green)
→ Cell fills with green immediately (< 50ms)
→ Subtle scale animation (100ms, 1.05x → 1.0x)
→ Optional: soft click sound (user preference)

User clicks again
→ Current status: Complete
→ New status: Missed (red)
→ Cell fills with red immediately

User clicks again
→ Current status: Missed
→ New status: Empty (gray/white)
→ Cell clears
```

**3. Interaction (Tier 2 - Full Status):**
```
User hovers (desktop) or long-presses (mobile)
→ Tooltip appears with all 9 status options
→ Each option shows color + label
→ User clicks desired status
→ Tooltip closes, cell updates immediately
```

**4. Feedback:**
- Color change IS the feedback (instant, unmistakable)
- Subtle animation reinforces "something happened"
- No toast/notification for routine status changes
- Sync indicator shows data is saved (background, non-intrusive)

**5. Completion:**
- No explicit "done" state - each click is complete
- Matrix pattern visually shows progress
- User naturally moves to next habit or exits
- Layout persists exactly as left

**6. Error Handling:**
- Wrong status? Click again to cycle, or use tooltip
- Network failure? Optimistic update + background retry
- Data conflict? Last write wins (POC simplicity)

## Visual Design Foundation

### Color System

**Status Colors (Core Palette):**
Already defined in Design System - these are the primary visual language:

| Status | Hex | Tailwind | Usage |
|--------|-----|----------|-------|
| Empty | `#f3f4f6` | gray-100 | Unmarked cells |
| Complete | `#22c55e` | green-500 | Successfully done |
| Missed | `#ef4444` | red-500 | Failed to complete |
| Partial | `#3b82f6` | blue-500 | Partially done |
| N/A | `#9ca3af` | gray-400 | Not applicable |
| Exempt | `#eab308` | yellow-500 | Excused |
| Extra | `#15803d` | green-700 | Bonus completion |
| Trending | `#f97316` | orange-500 | At risk |
| Pink | `#f9a8d4` | pink-300 | Accountability nudge |

**UI Chrome Colors:**
| Element | Light Mode | Notes |
|---------|------------|-------|
| Background | `#ffffff` white | Clean canvas for dense data |
| Surface | `#f9fafb` gray-50 | Widget backgrounds |
| Border | `#e5e7eb` gray-200 | Subtle separation |
| Text Primary | `#111827` gray-900 | High contrast |
| Text Secondary | `#6b7280` gray-500 | Labels, metadata |
| Text Muted | `#9ca3af` gray-400 | Disabled, hints |
| Accent | `#3b82f6` blue-500 | Interactive highlights |
| Today Highlight | `#dbeafe` blue-100 | Today column background |

**Color Principles:**
1. **Status colors are sacred** - Never use green/red/blue for UI chrome
2. **Minimal chrome** - Let status colors dominate the visual field
3. **High contrast text** - Ensure readability at small sizes
4. **Subtle borders** - Separation without visual noise

### Typography System

**Font Stack (Condensed for Density):**
```css
/* Primary - Condensed for data-dense displays */
font-family: 'Arial Narrow', 'Helvetica Neue Condensed',
             'Liberation Sans Narrow', 'Roboto Condensed', sans-serif;

/* Fallback system stack */
font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
```

**Rationale:** Condensed/narrow fonts maximize data density in the habit matrix. Arial Narrow is widely available and renders well at small sizes.

**Google Fonts Alternative:**
- **Roboto Condensed** - Free, excellent rendering, multiple weights
- **PT Sans Narrow** - Good alternative, slightly more readable

**Type Scale:**
| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-xs` | 0.75rem (12px) | 400 | Habit names in matrix, timestamps |
| `text-sm` | 0.875rem (14px) | 400 | Category labels, task items |
| `text-base` | 1rem (16px) | 400 | Body text, widget content |
| `text-lg` | 1.125rem (18px) | 500 | Widget titles |
| `text-xl` | 1.25rem (20px) | 600 | Dashboard title |

**Typography Principles:**
1. **Condensed = more habits per row** - Narrow fonts maximize horizontal space
2. **Dense = small text** - Habit names at 12px with condensed font
3. **Weight for hierarchy** - Semibold for titles, regular for content
4. **Consistent line height** - 1.25 for dense, 1.5 for readable

### Spacing & Layout Foundation

**Base Unit:** 4px (Tailwind default)

**Spacing Scale:**
| Token | Value | Usage |
|-------|-------|-------|
| `space-0.5` | 2px | Cell gaps, micro spacing |
| `space-1` | 4px | Tight padding |
| `space-2` | 8px | Standard inner padding |
| `space-3` | 12px | Content spacing |
| `space-4` | 16px | Widget padding |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Major divisions |

**Matrix-Specific Spacing:**
| Element | Desktop | Mobile |
|---------|---------|--------|
| Cell size | 24px × 24px | 16px × 16px |
| Cell gap | 1px | 1px |
| Row height | 26px | 18px |
| Category padding | 8px | 4px |

**Layout Grid:**
- Dashboard: react-grid-layout with 24 columns
- Gutter: 16px between widgets
- Widget padding: 16px internal
- Mobile: Single column stack

**Layout Principles:**
1. **Dense by default** - Maximize information per pixel on desktop
2. **Breathing room on mobile** - Larger touch targets, less density
3. **Consistent gutters** - 16px between all widgets
4. **Edge-to-edge matrix** - Minimize chrome around the core grid

### Accessibility Considerations

**Color Contrast:**
- All text meets WCAG AA (4.5:1 for normal text, 3:1 for large)
- Status colors differentiated by hue, not just brightness
- Pink (accountability) distinct from red (missed)

**Touch Targets:**
- Minimum 24px × 24px on desktop
- Minimum 44px × 44px on mobile for primary actions
- Matrix cells are exceptions - density prioritized, tooltip assists

**Motion:**
- Reduced motion respected via `prefers-reduced-motion`
- All animations under 200ms
- No essential information conveyed only through animation

**Keyboard Navigation:**
- Tab order follows visual layout
- Arrow keys navigate matrix grid
- Enter/Space toggle status
- Escape closes tooltips

**Screen Reader Support:**
- Semantic HTML structure
- ARIA labels for status cells ("Exercise, Monday, Complete")
- Live regions for status changes

## Design Direction Decision

### Chosen Direction

**Selected: GitHub Contribution Style with Modern Utility elements**

This hybrid approach delivers:
- GitHub's proven pattern recognition through color density
- Modern Utility's confident, clean chrome treatment
- Dense data grid that feels like a power tool, not a toy
- Status colors as heroes with minimal competing visual elements

### Design Rationale

**Why GitHub Contribution Style as base:**
1. **Proven scanability** - GitHub's graph is universally understood for pattern recognition
2. **Color-as-data precedent** - Users already read meaning into colored grid cells
3. **Power-user appropriate** - This aesthetic signals "for people who get things done"
4. **Dense without overwhelming** - Subtle cell rounding (2px) and 1px gaps create visual rhythm

**What we explicitly rejected:**
- Physical wallboard texture (adds noise, doesn't translate well to screens)
- Dark mode dashboard (reduces status color differentiation)
- Heavy borders/shadows (compete with status colors)

### Implementation Tokens

```css
:root {
  --cell-size: 24px;
  --cell-gap: 1px;
  --cell-radius: 2px;
  --widget-padding: 16px;
  --widget-gap: 16px;
  --surface-base: #ffffff;
  --surface-raised: #f9fafb;
  --surface-today: #dbeafe;
  --border-subtle: #e5e7eb;
  --shadow-widget: 0 1px 2px rgba(0,0,0,0.05);
  --transition-instant: 50ms;
  --transition-quick: 100ms;
}
```

## User Journey Flows

### Morning Accountability Scan

**Goal:** Review yesterday's status, clear pink cells, prepare for today
**Trigger:** Wake up, before starting the day
**Duration:** 1-2 minutes

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Open app | Dashboard loads with yesterday visible |
| 2 | Scan for pink cells | Pink cells highlight unmarked habits |
| 3 | Click each pink cell | Cycle to actual status (green/red) |
| 4 | Glance at today | Note empty cells for commitments |
| 5 | Close app | Ready for day |

### Quick Mobile Status Update

**Goal:** Mark habits throughout day as completed
**Trigger:** Completing a habit, brief availability
**Duration:** < 10 seconds

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Open app on mobile | 3-day view loads |
| 2 | Tap today's cell | Green instantly (or long-press for other status) |
| 3 | Close app | Return to activity |

### Evening Review

**Goal:** Mark off completed habits before day boundary
**Trigger:** End of day routine, before 6 AM
**Duration:** 2-5 minutes

Scan today's column → mark remaining habits → glance at tomorrow's tasks → close

### Weekly Planning Session

**Goal:** Organize upcoming week, process Parking Lot
**Trigger:** Sunday/Monday ritual
**Duration:** 10-15 minutes

Review Kanban → process Parking Lot items → drag tasks to days → reorder priorities → close

## Component Strategy

### State Management

| State Type | Tool | Usage |
|------------|------|-------|
| Server State | TanStack Query | Habits, tasks, measurements |
| UI State | Zustand | Layouts, timers, modals |
| Component State | useState | Tooltips, inputs, hover |

### Core Component Interfaces

**StatusCell:**
```typescript
interface StatusCellProps {
  status: HabitStatus;
  habitId: string;
  date: string;
  isToday: boolean;
  size: 'sm' | 'md';
  onStatusChange: (newStatus: HabitStatus) => void;
}
```

**WidgetContainer:**
```typescript
interface WidgetContainerProps {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}
```

### Optimistic Update Pattern

All status changes use optimistic updates:
1. Immediately update UI
2. Fire mutation in background
3. Rollback on error + show toast
4. Invalidate queries on success

## UX Consistency Patterns

### Interaction Patterns

| Pattern | Behavior |
|---------|----------|
| Single Click | Cycle: Empty → Complete → Missed → Empty |
| Hover (Desktop) | Show full status tooltip |
| Long-Press (Mobile) | Show full status tooltip |
| Drag-and-Drop | Reorder tasks in Kanban |
| Quick Capture | Enter submits, Escape clears |

### Feedback Patterns

| Event | Feedback |
|-------|----------|
| Success | Color change + 150ms scale animation |
| Error | Red border flash + inline error text |
| Sync | Background indicator (non-blocking) |
| Loading | Skeleton or pulse after 200ms |

### Error Handling

- **Network:** Optimistic update + retry queue (3 attempts)
- **Validation:** Inline, immediate feedback
- **Offline:** Queue changes, sync on reconnect

## Responsive Design & Accessibility

### Breakpoint Behavior

| Breakpoint | Matrix View | Cell Size |
|------------|-------------|-----------|
| sm (640px) | 3-day | 16px |
| md (768px) | 7-day (week) | 20px |
| lg (1024px) | 14-day | 22px |
| xl (1280px) | 31-day (month) | 24px |

### Touch Targets

- Desktop cells: 24px × 24px (visual)
- Mobile cells: 16px visual, 44px touch area (invisible padding)
- All interactive elements meet 44px minimum touch target

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between widgets |
| Arrow Keys | Navigate within matrix |
| Enter/Space | Toggle status |
| Escape | Close tooltip/modal |

### Screen Reader Support

- ARIA labels: `"Exercise habit, December 15, completed"`
- Live regions for status changes
- Landmark roles for navigation
- Skip links for efficiency

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Workflow Completion Summary

**UX Design Specification completed on 2025-12-29**

**Documents Created:**
- Core experience definition with two-tier interaction model
- Emotional design principles (utility over whimsy)
- Visual foundation with condensed fonts and status color system
- Component strategy with Tailwind + custom components
- User journey flows for all key contexts
- Responsive breakpoints and accessibility compliance

**Key Design Decisions:**
1. Two-tier status cycling (click for common, hover for all 9)
2. GitHub contribution graph visual style
3. Condensed fonts (Arial Narrow/Roboto Condensed) for density
4. Status colors as primary visual language
5. Optimistic updates everywhere (< 50ms feedback)
6. Mobile 3-day view, Desktop 31-day view

**Ready for:** Epic & Story creation, Implementation

