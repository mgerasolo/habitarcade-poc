# Epic 5: Target Line Graph (Weight Tracker)

## Epic Overview
Track measurements against a goal line. Initially for weight, but extensible to other metrics.

## Priority
**Medium** - Week 1 MVP

## Stories

### Story 5.1: Measurement Data Model & API
**As a** developer
**I want** measurements and targets tables
**So that** tracking data is stored

**Acceptance Criteria:**
- [ ] measurements table: id, type, value, date, created_at
- [ ] targets table: id, type, start_value, goal_value, start_date, goal_date, created_at
- [ ] GET /api/measurements?type=weight - list measurements
- [ ] POST /api/measurements - create entry
- [ ] DELETE /api/measurements/:id - delete
- [ ] GET /api/targets?type=weight - get target config
- [ ] PUT /api/targets - upsert target

**Technical Notes:**
- type field allows future metrics (weight, steps, etc.)

---

### Story 5.2: Target Configuration
**As a** user
**I want** to set my start weight, goal weight, and target date
**So that** the graph shows my goal line

**Acceptance Criteria:**
- [ ] Form to set: start value, goal value, start date, goal date
- [ ] Calculates daily target (linear interpolation)
- [ ] Saves to targets table
- [ ] Can update existing target

---

### Story 5.3: TargetGraph Widget
**As a** user
**I want** a line graph showing actual vs target
**So that** I can see my progress

**Acceptance Criteria:**
- [ ] ECharts line chart
- [ ] Target line (dashed, gray)
- [ ] Actual measurements line (solid, blue)
- [ ] X-axis: dates
- [ ] Y-axis: weight values
- [ ] Shows if above/below target (color coding)
- [ ] Fits in WidgetContainer

**Technical Notes:**
- Use echarts-for-react wrapper

---

### Story 5.4: Measurement Entry
**As a** user
**I want** to quickly log my weight
**So that** the graph updates

**Acceptance Criteria:**
- [ ] Quick input field in widget
- [ ] Enter to submit
- [ ] Today's date auto-selected
- [ ] Can edit past entries
- [ ] Toast confirmation on save

---

### Story 5.5: Above/Below Indication
**As a** user
**I want** visual feedback on my progress
**So that** I know if I'm on track

**Acceptance Criteria:**
- [ ] Current status: "X lbs above/below target"
- [ ] Color: green if on/below, red if above
- [ ] Shows in widget header or prominently
- [ ] Updates on new measurement

---

## Definition of Done
- Graph renders correctly
- Target line calculates properly
- Measurements persist
