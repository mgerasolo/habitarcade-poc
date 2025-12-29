# Epic 8: Mobile Optimization

## Epic Overview
Touch-friendly responsive design for phone usage.

## Priority
**Medium** - Week 3

## Stories

### Story 8.1: Mobile Breakpoint Detection
**As a** developer
**I want** responsive breakpoints
**So that** mobile views load appropriately

**Acceptance Criteria:**
- [ ] Breakpoint hook (useBreakpoint)
- [ ] sm: 640px, md: 768px, lg: 1024px, xl: 1280px
- [ ] Components conditionally render based on breakpoint
- [ ] Mobile-first CSS

---

### Story 8.2: 3-Day Matrix View
**As a** mobile user
**I want** a compact habit matrix
**So that** I can see recent days on my phone

**Acceptance Criteria:**
- [ ] Show only 3 columns: today, yesterday, day before
- [ ] Larger cells (touch-friendly)
- [ ] Horizontal swipe to see more days
- [ ] Same status cycling behavior

---

### Story 8.3: Touch-Optimized StatusCell
**As a** mobile user
**I want** cells I can easily tap
**So that** I don't mis-tap

**Acceptance Criteria:**
- [ ] Visual size: 16px
- [ ] Touch target: 44px (invisible padding)
- [ ] Long-press (300ms) opens status tooltip
- [ ] Haptic feedback if available

---

### Story 8.4: Mobile Kanban Layout
**As a** mobile user
**I want** a usable kanban on phone
**So that** I can manage tasks on the go

**Acceptance Criteria:**
- [ ] Single column view (today focus)
- [ ] Swipe to navigate days
- [ ] Or stacked accordion (expand one day at a time)
- [ ] Task cards full-width

---

### Story 8.5: Mobile Navigation
**As a** mobile user
**I want** easy navigation
**So that** I can switch between views

**Acceptance Criteria:**
- [ ] Bottom tab bar or hamburger menu
- [ ] Quick access: Habits, Tasks, Capture
- [ ] Current view indicator
- [ ] Thumb-friendly placement

---

## Definition of Done
- Works on iPhone SE (smallest)
- Touch targets are 44px+
- No horizontal scroll issues
