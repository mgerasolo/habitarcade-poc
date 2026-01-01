# Architecture Decisions Log

Significant decisions made across all conversations, tagged by conversation ID.

## Decisions

### Vite Proxy Configuration for API Requests
**Conv:** conv-20251229-062322
**Date:** 2026-01-01
**Context:** Clicking habit cells in dev mode did nothing - API requests from Vite dev server (port 5173) weren't reaching the backend (port 3451)
**Decision:** Add proxy configuration to vite.config.ts to forward `/api` requests to `http://localhost:3451`
**Alternatives Considered:**
- Use full backend URL in API calls (would require different config for dev/prod)
- Run both on same port (more complex setup)
**Consequences:**
- Dev server now correctly proxies API requests
- Same /api paths work in both dev and production
- No code changes needed in API client

---

**Format:**
```markdown
### [Decision Title]
**Conv:** conv-YYYYMMDD-HHMMSS
**Date:** YYYY-MM-DD
**Context:** Why this decision was needed
**Decision:** What was decided
**Alternatives Considered:** Other options evaluated
**Consequences:** Impact of this decision
```
