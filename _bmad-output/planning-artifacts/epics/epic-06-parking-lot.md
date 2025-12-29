# Epic 6: Parking Lot

## Epic Overview
Quick capture inbox for tasks and ideas. Brain dump, process later.

## Priority
**Medium** - Week 1 MVP

## Stories

### Story 6.1: ParkingLot Data Model & API
**As a** developer
**I want** a parking_lot table
**So that** captured items are stored

**Acceptance Criteria:**
- [ ] parking_lot table: id, content, created_at, deleted_at
- [ ] GET /api/parking-lot - list items
- [ ] POST /api/parking-lot - create item
- [ ] DELETE /api/parking-lot/:id - delete item

**Technical Notes:**
- Simple text content, no status
- Ordered by created_at DESC (newest first)

---

### Story 6.2: QuickInput Component
**As a** user
**I want** a fast text input
**So that** I can capture thoughts instantly

**Acceptance Criteria:**
- [ ] Single-line input field
- [ ] Placeholder: "Quick capture..."
- [ ] Enter submits and clears
- [ ] Escape clears without submitting
- [ ] Auto-focus option

---

### Story 6.3: ParkingLot Widget
**As a** user
**I want** to see and manage my captured items
**So that** I can process them later

**Acceptance Criteria:**
- [ ] QuickInput at top
- [ ] List of items below
- [ ] Delete button per item (X icon)
- [ ] Scrollable if many items
- [ ] Fits in WidgetContainer
- [ ] Shows newest items first

---

### Story 6.4: Delete Item
**As a** user
**I want** to delete processed items
**So that** my list stays clean

**Acceptance Criteria:**
- [ ] Click X to delete
- [ ] No confirmation (quick action)
- [ ] Item disappears immediately
- [ ] Soft delete in database

---

## Definition of Done
- Quick capture works instantly
- Items persist
- Delete works
