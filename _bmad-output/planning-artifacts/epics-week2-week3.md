---
stepsCompleted: ['manual-creation']
workflowComplete: true
completedAt: '2025-12-29'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: 'epics'
---

# HabitArcade POC - Epic Breakdown (Week 2 & Week 3)

## Overview

This document provides the epic and story breakdown for HabitArcade POC Phases 2 and 3, covering Wallboard Mode (Week 2) and Mobile Optimization (Week 3). These epics build upon the Week 1 MVP foundation.

## Requirements Inventory

### Functional Requirements Addressed

**Wallboard Mode (Week 2):**
- FR1-5: Dashboard & Widget Management (extended for wallboard)
- NFR11: Browser compatibility (TV/wallboard displays)

**Mobile Optimization (Week 3):**
- NFR11: Browser compatibility (Safari iOS)
- NFR12: Touch interactions work correctly on mobile Safari

### Phase Timeline

| Phase | Epic | Priority | Timeline |
|-------|------|----------|----------|
| Phase 2 | Epic 7: Wallboard Mode | Medium | Week 2 |
| Phase 3 | Epic 8: Mobile Optimization | Medium | Week 3 |

---

## Epic 7: Wallboard Mode

**Goal:** Create a TV/wallboard-optimized display mode that shows the key dashboard widgets (Habit Matrix, Weekly Kanban, Time Blocks) in a format readable from across the room, with interactive status cycling.

**Priority:** Medium
**Timeline:** Week 2
**Dependencies:** Epic 1-4 (Week 1 MVP core widgets)

**PRD Reference:**
> Week 2 - Wallboard Mode: Full-screen TV/wallboard optimized display, Dark theme, Larger fonts/elements for distance viewing, Interactive (click to cycle statuses)

### Story 7.1: Wallboard Layout Configuration

As a user,
I want to configure which widgets appear in wallboard mode,
So that I can customize what's displayed on my TV/wallboard.

**Acceptance Criteria:**

**Given** I am on the settings page
**When** I navigate to the "Wallboard Settings" section
**Then** I see toggles for each widget (Habit Matrix, Weekly Kanban, Time Block Priorities)
**And** I can enable or disable each widget for wallboard display

**Given** I have configured wallboard widgets
**When** I save the settings
**Then** the wallboard configuration persists to the database
**And** the settings sync across devices

**Given** I enter wallboard mode
**When** the wallboard loads
**Then** only the enabled widgets are displayed
**And** widgets are arranged in a predefined wallboard-optimized layout

**Technical Notes:**
- Add `wallboard_config` field to settings table (JSON)
- Default configuration: all three widgets enabled
- Layout uses CSS Grid optimized for 16:9 aspect ratio

---

### Story 7.2: Responsive Scaling for TV Displays

As a user,
I want the wallboard display to scale appropriately for my TV size,
So that all content is readable from my viewing distance.

**Acceptance Criteria:**

**Given** I am viewing the wallboard on a 1080p TV
**When** the wallboard loads
**Then** all text is legible from 10+ feet away
**And** widget containers scale proportionally to fill the screen

**Given** I am viewing the wallboard on a 4K TV
**When** the wallboard loads
**Then** the UI scales up appropriately
**And** there is no pixelation or blurry text

**Given** the browser window is resized
**When** the window dimensions change
**Then** the wallboard layout reflows smoothly
**And** maintains readable proportions

**Technical Notes:**
- Use CSS `clamp()` for fluid typography scaling
- Base scale calculation: `min(100vw / 1920, 100vh / 1080)`
- Minimum font sizes: headings 32px, body 24px, small 18px
- Widget grid gaps proportional to viewport

---

### Story 7.3: Wallboard-Optimized Typography

As a user,
I want larger, high-contrast text in wallboard mode,
So that I can read the display from across the room.

**Acceptance Criteria:**

**Given** I am viewing the wallboard
**When** I look at the Habit Matrix widget
**Then** habit names use minimum 24px font size
**And** status cells are minimum 40px square
**And** day headers are clearly visible

**Given** I am viewing the wallboard
**When** I look at the Weekly Kanban widget
**Then** task titles use minimum 20px font size
**And** day column headers use minimum 28px font size
**And** task cards have increased padding for readability

**Given** I am viewing the wallboard
**When** I look at the Time Block Priorities widget
**Then** block names use minimum 28px font size
**And** priority items use minimum 22px font size

**Technical Notes:**
- Create `wallboard.css` with typography overrides
- Use CSS custom properties for wallboard scale factor
- Apply `.wallboard-mode` class to root element

---

### Story 7.4: Full-Screen Mode Toggle

As a user,
I want to enter and exit full-screen wallboard mode easily,
So that I can quickly switch between desktop and TV viewing.

**Acceptance Criteria:**

**Given** I am on the main dashboard
**When** I click the "Wallboard Mode" button (or press F11)
**Then** the browser enters full-screen mode
**And** the UI switches to wallboard layout
**And** the dark theme is applied (if enabled)

**Given** I am in wallboard mode
**When** I press Escape or click the exit button
**Then** the browser exits full-screen mode
**And** the UI returns to the standard dashboard layout

**Given** I am in wallboard mode
**When** I move the mouse to the bottom of the screen
**Then** a subtle toolbar appears with exit button and settings
**And** the toolbar auto-hides after 3 seconds of inactivity

**Technical Notes:**
- Use Fullscreen API (`document.documentElement.requestFullscreen()`)
- Store wallboard state in `useUIStore`
- Keyboard shortcut: F11 or Ctrl+Shift+W
- URL route: `/wallboard` for direct access

---

### Story 7.5: Combined Widget View

As a user,
I want to see Habit Matrix, Weekly Kanban, and Time Block Priorities together on the wallboard,
So that I have a complete overview of my habits and tasks at a glance.

**Acceptance Criteria:**

**Given** I am in wallboard mode with all widgets enabled
**When** the wallboard loads
**Then** I see Habit Matrix prominently displayed (largest widget)
**And** Weekly Kanban is displayed showing today and adjacent days
**And** Time Block Priorities shows the active or next block

**Given** I am viewing the combined wallboard
**When** I click on a habit status cell
**Then** the status cycles to the next state
**And** the UI updates immediately with visual feedback
**And** the change persists to the database

**Given** I am viewing the combined wallboard
**When** I click on a task in the Kanban
**Then** the task completion toggles
**And** completed tasks show visual strike-through

**Given** the day boundary passes (6 AM default)
**When** the wallboard is displayed
**Then** unmarked habits from yesterday show pink status
**And** today's column becomes the active/highlighted column

**Technical Notes:**
- Layout: Habit Matrix (60% width), Kanban + Time Blocks stacked (40% width)
- Alternative layout for portrait orientation
- Click handlers work on touch and mouse
- Background polling continues in wallboard mode (30s interval)

---

### Story 7.6: Dark Theme for Wallboard

As a user,
I want a dark theme option for wallboard mode,
So that the display is comfortable to view in low-light environments and reduces screen burn-in.

**Acceptance Criteria:**

**Given** I am configuring wallboard settings
**When** I toggle "Dark Theme"
**Then** the setting is saved to my preferences

**Given** I enter wallboard mode with dark theme enabled
**When** the wallboard loads
**Then** the background is dark (#1a1a2e or similar)
**And** text is light (#f0f0f0 or similar)
**And** status colors remain distinguishable (adjusted for dark background)

**Given** I am using dark theme wallboard
**When** I view habit status cells
**Then** green (complete) is #22c55e
**And** red (missed) is #ef4444
**And** pink (unmarked) is #f472b6
**And** all colors meet WCAG AA contrast ratio

**Technical Notes:**
- Use CSS custom properties for theme colors
- Theme toggle in `useUIStore`
- Consider OLED-friendly pure black option (#000000)
- Status colors adjusted for dark background contrast

---

## Epic 8: Mobile Optimization

**Goal:** Create a responsive, touch-friendly mobile experience with a condensed 3-day matrix view, optimized touch targets, and mobile-appropriate navigation patterns.

**Priority:** Medium
**Timeline:** Week 3
**Dependencies:** Epic 1-4 (Week 1 MVP), Epic 7 (optional - shared responsive patterns)

**PRD Reference:**
> Week 3 - Mobile Optimization: Responsive design for phone/tablet, Touch-friendly interactions, Same data, adapted layout

### Story 8.1: Mobile Breakpoint Detection

As a user,
I want the app to automatically detect my device type,
So that I receive the appropriate layout without manual configuration.

**Acceptance Criteria:**

**Given** I open the app on a mobile device (viewport width < 768px)
**When** the app loads
**Then** the mobile layout is automatically applied
**And** touch-optimized controls are enabled

**Given** I open the app on a tablet (768px <= viewport width < 1024px)
**When** the app loads
**Then** a tablet-optimized layout is applied
**And** hybrid touch/mouse controls are enabled

**Given** I rotate my device from portrait to landscape
**When** the orientation changes
**Then** the layout adapts smoothly
**And** no content is lost or hidden

**Given** I resize my browser window on desktop
**When** I cross the mobile breakpoint threshold
**Then** the layout transitions to/from mobile view
**And** no jarring layout shifts occur

**Technical Notes:**
- Breakpoints: mobile < 768px, tablet 768-1023px, desktop >= 1024px
- Use CSS media queries and `useMediaQuery` hook
- Store device type in `useUIStore`
- Consider `matchMedia` API for JavaScript detection

---

### Story 8.2: 3-Day Matrix View Component

As a mobile user,
I want to see a condensed 3-day habit matrix (today, yesterday, day before),
So that I can track my recent habits without horizontal scrolling.

**Acceptance Criteria:**

**Given** I am viewing the Habit Matrix on mobile
**When** the matrix loads
**Then** I see 3 columns: day-before-yesterday, yesterday, and today
**And** today's column is visually emphasized (border or background)
**And** habit names are truncated with ellipsis if too long

**Given** I am viewing the 3-day matrix
**When** I want to see more days
**Then** I can swipe horizontally to reveal additional days
**And** navigation dots indicate current position in the timeline

**Given** I am viewing the 3-day matrix
**When** I tap a habit name
**Then** the full habit name is shown (tooltip or modal)
**And** I can see the habit's current score/streak

**Technical Notes:**
- Component: `widgets/HabitMatrix/MobileMatrix.tsx`
- Use CSS scroll-snap for swipe navigation
- Calculate visible dates based on day boundary
- Virtualize habit rows if count exceeds 20

---

### Story 8.3: Touch-Optimized StatusCell

As a mobile user,
I want large, touch-friendly status cells,
So that I can easily tap to change habit status without miss-taps.

**Acceptance Criteria:**

**Given** I am viewing the habit matrix on mobile
**When** I look at the status cells
**Then** each cell is minimum 44px x 44px touch target
**And** the visual indicator is 16px (smaller than touch target)
**And** cells have adequate spacing to prevent accidental taps

**Given** I tap a status cell on mobile
**When** the tap is registered
**Then** the status cycles to the next state
**And** visual feedback (ripple/scale) confirms the tap
**And** haptic feedback triggers (if device supports)

**Given** I long-press a status cell on mobile
**When** the press exceeds 500ms
**Then** a tooltip appears showing current status name
**And** the status value and any notes
**And** options to jump to a specific status

**Technical Notes:**
- Touch target: 44px minimum (Apple HIG / Material guidelines)
- Visual cell: 16px centered within touch target
- Use `onTouchStart` / `onTouchEnd` for long-press detection
- Consider `useHapticFeedback` hook for vibration API

---

### Story 8.4: Mobile Kanban Layout

As a mobile user,
I want a touch-friendly Kanban view optimized for small screens,
So that I can manage my weekly tasks on my phone.

**Acceptance Criteria:**

**Given** I am viewing the Weekly Kanban on mobile
**When** the Kanban loads
**Then** I see today's tasks prominently displayed
**And** adjacent days are accessible via tabs or swipe
**And** the Parking Lot is accessible via a tab or button

**Given** I am viewing a day's tasks on mobile Kanban
**When** I want to reschedule a task
**Then** I can tap and hold to drag
**And** day tabs highlight as drop targets
**And** dropping on a tab moves the task to that day

**Given** I am viewing the mobile Kanban
**When** I tap a task card
**Then** I see task details (full title, description, project)
**And** quick actions: complete, reschedule, edit

**Given** I want to add a new task on mobile
**When** I tap the floating action button (+)
**Then** a bottom sheet opens for quick task entry
**And** I can set title, day, and optionally project

**Technical Notes:**
- Single-day view with swipe/tab navigation
- Tabs: Yesterday | Today | Tomorrow | More
- Task cards: title truncated, tap to expand
- FAB for new task (position: bottom-right)

---

### Story 8.5: Mobile Navigation Pattern

As a mobile user,
I want streamlined navigation,
So that I can quickly access different sections of the app.

**Acceptance Criteria:**

**Given** I am using the app on mobile
**When** I look at the navigation
**Then** I see a bottom navigation bar with 4-5 items
**And** icons are large and labeled
**And** the current section is clearly highlighted

**Given** the bottom navigation bar is displayed
**When** I view the navigation options
**Then** I see: Home (Dashboard), Habits, Tasks, Settings
**And** optionally: Timer (Time Blocks) or Quick Add

**Given** I tap a navigation item
**When** the section loads
**Then** the transition is smooth (< 200ms)
**And** the navigation state is preserved (back button works)

**Given** I am in a detailed view (task edit, habit details)
**When** I want to return
**Then** the header shows a back arrow
**And** tapping back returns to the previous view
**And** swipe-right-to-go-back works (iOS Safari)

**Technical Notes:**
- Use React Router for navigation state
- Bottom nav component: `components/mobile/BottomNav.tsx`
- Height: 56-64px (Material) or 49px (iOS)
- Safe area insets for notch devices
- Consider page transition animations

---

### Story 8.6: Mobile Time Block & Priorities View

As a mobile user,
I want to access Time Blocks and start focus sessions on my phone,
So that I can use the timer feature while away from my desktop.

**Acceptance Criteria:**

**Given** I am viewing Time Blocks on mobile
**When** the view loads
**Then** I see a list of my time blocks with duration and linked habit
**And** the current/next block is highlighted
**And** I can tap to expand and see priorities

**Given** I tap a time block on mobile
**When** the block expands
**Then** I see the priority list for that block
**And** a "Start Session" button is prominently displayed
**And** I can reorder priorities via drag handle

**Given** I start a focus session on mobile
**When** the timer begins
**Then** a full-screen focus view appears
**And** the timer is large and centered
**And** the priority list is visible below
**And** I can minimize to a floating timer bubble

**Given** the timer is running and I leave the app
**When** the timer completes
**Then** I receive a notification (if permitted)
**And** the linked habit is auto-marked complete
**And** returning to the app shows completion summary

**Technical Notes:**
- Notification API for timer completion
- Service worker for background timer (or rely on server-side timing)
- Floating timer bubble: position fixed, bottom-right
- Consider keeping screen awake during active session

---

## Epic Dependencies Summary

```
Epic 1-6 (Week 1 MVP)
    │
    ├── Epic 7: Wallboard Mode (Week 2)
    │   └── Stories 7.1-7.6
    │
    └── Epic 8: Mobile Optimization (Week 3)
        └── Stories 8.1-8.6
```

## FR Coverage Map

| Functional Requirement | Epic 7 Stories | Epic 8 Stories |
|------------------------|----------------|----------------|
| FR1: Dashboard widgets | 7.1, 7.5 | - |
| FR4: Full-screen expand | 7.4 | - |
| FR5: Layout persistence | 7.1 | - |
| FR6: Habit Matrix view | 7.3, 7.5 | 8.2 |
| FR7: Cycle habit status | 7.5 | 8.3 |
| FR24: Weekly Kanban | 7.5 | 8.4 |
| FR33: Time block session | 7.5 | 8.6 |
| NFR11: Chrome + Safari | 7.2 | 8.1 |
| NFR12: Touch interactions | 7.5 | 8.3, 8.4 |

---

## Technical Considerations

### Shared Components (Week 2 & Week 3)

Several components can be shared or extended:

1. **Responsive Container** - Base wrapper that detects viewport and applies appropriate styles
2. **TouchHandler HOC** - Wraps interactive elements with touch/click normalization
3. **Theme Provider** - Manages light/dark theme across modes
4. **Scaled Typography** - CSS custom properties for responsive font sizing

### Testing Strategy

**Wallboard Mode (Epic 7):**
- Visual regression tests at 1080p and 4K resolutions
- Interaction tests for status cycling
- Full-screen API compatibility tests

**Mobile Optimization (Epic 8):**
- Playwright mobile device emulation (iPhone 14, iPad)
- Touch gesture simulation
- Responsive breakpoint tests
- Safari-specific behavior tests

### Performance Considerations

**Wallboard:**
- Reduce animation complexity (large screens can be GPU-intensive)
- Consider reduced polling frequency when idle
- Efficient re-renders on status changes

**Mobile:**
- Code splitting per route
- Lazy load non-critical widgets
- Image optimization (if any images used)
- Target < 100ms interaction response

---

## Implementation Notes

### Week 2 Focus (Wallboard)

Start with Story 7.4 (Full-screen toggle) as it establishes the foundation. Then implement 7.2 (Scaling) and 7.3 (Typography) together. Finally, 7.1 (Configuration), 7.5 (Combined view), and 7.6 (Dark theme).

### Week 3 Focus (Mobile)

Start with Story 8.1 (Breakpoint detection) as it gates all other mobile work. Then implement 8.2 (3-day matrix) and 8.3 (Touch cells) together for the Habit Matrix. Follow with 8.4 (Kanban) and 8.5 (Navigation). Story 8.6 (Time blocks) can be implemented last.

---

**Epic Status:** READY FOR IMPLEMENTATION

**Prerequisites:** Week 1 MVP (Epics 1-6) must be complete before starting these epics.
