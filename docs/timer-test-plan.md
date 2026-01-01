# Timer Block Widget - Test Plan

## Issue Reference
GitHub Issue #33: Timer Block widget complete redesign for HabitArcade

## Overview
This document outlines the test plan for the redesigned Timer Block widget, which includes Pomodoro timer mode, Stopwatch mode, Countdown timer mode, and enhanced visual feedback.

## Test Coverage

### 1. Mode Selection Tests
| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Mode display | Verify all three modes are visible | Pomodoro, Stopwatch, Countdown buttons shown |
| Default mode | Check Pomodoro is selected by default | Pomodoro button has active styling |
| Mode switching | Switch between modes when idle | Mode changes and UI updates accordingly |
| Mode lock | Cannot switch modes while timer running | Buttons disabled with visual feedback |

### 2. Pomodoro Mode Tests
| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Preset display | Show 25/5 and 50/10 presets | Both preset buttons visible |
| Preset selection | Switch between presets | Timer duration updates to match preset |
| Session indicators | Display session progress dots | 4 dots shown, filled based on completed sessions |
| Phase labels | Show current phase | "Focus", "Break", or "Long Break" displayed |
| Auto-advance | Timer advances to break after work | Phase changes and UI updates |

### 3. Stopwatch Mode Tests
| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Initial display | Show 00:00 on load | Time displays 00:00 |
| No presets | Preset buttons hidden | 25/5 and 50/10 buttons not visible |
| Count up | Timer counts up from 00:00 | Elapsed time increases each second |

### 4. Countdown Mode Tests
| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Input field | Show minutes input | Number input field visible |
| Custom duration | Enter custom duration | Timer starts with entered duration |
| Helper text | Show instruction | "Set duration and press play" visible |

### 5. Timer Controls Tests
| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Play button | Start idle timer | Timer begins, pause button shown |
| Pause button | Pause running timer | Timer stops, "Paused" status shown |
| Reset button | Reset timer to initial | Time returns to starting value |
| Stop button | Fully stop timer | Timer resets, controls hidden |
| Skip button | Skip to next phase (Pomodoro) | Advances to break/work phase |

### 6. Audio Controls Tests
| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Toggle visibility | Audio button visible | Sound toggle button shown |
| Default state | Audio on by default | "On" label displayed |
| Toggle off | Click to disable sound | "Off" label shown, no sound on complete |
| Toggle on | Click to enable sound | "On" label shown, sound plays on complete |

### 7. Visual Feedback Tests
| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Progress ring | SVG ring visible | Circular progress indicator shown |
| Running color | Teal color when running | Time display and ring are teal |
| Paused color | Yellow color when paused | Time display and ring are yellow |
| Complete color | Green color when complete | Time display and ring are green |
| Glow effect | Ambient glow when running | Radial gradient glow visible |

### 8. State Persistence Tests
| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Mode persistence | Mode saved across sessions | Same mode selected after reload |
| Preset persistence | Preset saved across sessions | Same preset active after reload |
| Session count | Sessions saved across sessions | Completed sessions preserved |
| Audio preference | Audio setting saved | Same audio state after reload |

## Manual Testing Checklist

- [ ] Start Pomodoro timer and verify countdown works
- [ ] Pause and resume timer, verify state transitions
- [ ] Complete a full work session, verify break phase starts
- [ ] Complete 4 sessions, verify long break triggers
- [ ] Test stopwatch mode counts up correctly
- [ ] Test countdown mode with custom duration
- [ ] Verify audio notification plays on completion
- [ ] Verify audio can be toggled off
- [ ] Test on mobile viewport (responsive design)
- [ ] Verify state persists after page refresh

## Automated Tests Location
Tests are located at: `/tests/timer-block.spec.ts`

## Running Tests
```bash
# Run all tests
npm run test

# Run timer-specific tests
npx playwright test timer-block.spec.ts

# Run with UI
npx playwright test --ui
```

## Known Limitations
- Audio notification requires user interaction before first play (browser autoplay policy)
- Full session completion tests require long waits, so store logic is tested separately
- Web Audio API may not be available in all test environments
