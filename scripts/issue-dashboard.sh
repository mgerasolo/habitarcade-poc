#!/bin/bash
# Issue Dashboard Commands for Terminal
# Usage: Run these in split terminals at bottom of Cursor

# Colors
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

show_help() {
    echo -e "${CYAN}Issue Dashboard Commands${NC}"
    echo ""
    echo "Run in separate terminals with 'watch' for auto-refresh:"
    echo ""
    echo -e "  ${GREEN}watch -n 60 './scripts/issue-dashboard.sh pending'${NC}"
    echo "    Shows issues waiting for your review"
    echo ""
    echo -e "  ${GREEN}watch -n 60 './scripts/issue-dashboard.sh active'${NC}"
    echo "    Shows issues currently being worked on"
    echo ""
    echo -e "  ${GREEN}watch -n 60 './scripts/issue-dashboard.sh blocked'${NC}"
    echo "    Shows blocked issues needing attention"
    echo ""
    echo -e "  ${GREEN}./scripts/issue-dashboard.sh all${NC}"
    echo "    Shows summary of all open issues"
    echo ""
}

show_pending() {
    echo -e "${YELLOW}═══ PENDING YOUR APPROVAL ═══${NC}"
    echo ""
    gh issue list --label "status:pending-approval" --state open --json number,title,labels --template \
'{{range .}}#{{.number}} {{.title}}
{{end}}'
    echo ""
    COUNT=$(gh issue list --label "status:pending-approval" --state open --json number | jq length)
    echo -e "${CYAN}Total: ${COUNT} issues awaiting review${NC}"
}

show_active() {
    echo -e "${GREEN}═══ IN PROGRESS ═══${NC}"
    echo ""
    gh issue list --label "status:active" --state open --json number,title,labels --template \
'{{range .}}#{{.number}} {{.title}}
{{end}}'
    echo ""
    COUNT=$(gh issue list --label "status:active" --state open --json number | jq length)
    echo -e "${CYAN}Total: ${COUNT} issues in progress${NC}"
}

show_blocked() {
    echo -e "${RED}═══ BLOCKED ═══${NC}"
    echo ""
    gh issue list --label "status:blocked" --state open --json number,title,labels --template \
'{{range .}}#{{.number}} {{.title}}
{{end}}'
    echo ""
    COUNT=$(gh issue list --label "status:blocked" --state open --json number | jq length)
    echo -e "${CYAN}Total: ${COUNT} blocked issues${NC}"
}

show_all() {
    echo -e "${CYAN}═══ ISSUE SUMMARY ═══${NC}"
    echo ""

    PENDING=$(gh issue list --label "status:pending-approval" --state open --limit 200 --json number | jq length)
    ACTIVE=$(gh issue list --label "status:active" --state open --limit 200 --json number | jq length)
    BLOCKED=$(gh issue list --label "status:blocked" --state open --limit 200 --json number | jq length)
    NEEDS_VERIFY=$(gh issue list --label "status:needs-verification" --state open --limit 200 --json number | jq length)
    TOTAL=$(gh issue list --state open --limit 200 --json number | jq length)

    echo -e "${YELLOW}Pending Approval:${NC}    $PENDING"
    echo -e "${GREEN}Active:${NC}              $ACTIVE"
    echo -e "${RED}Blocked:${NC}             $BLOCKED"
    echo -e "Needs Verification:  $NEEDS_VERIFY"
    echo -e "${CYAN}────────────────────${NC}"
    echo -e "Total Open:          $TOTAL"
}

case "$1" in
    pending)
        show_pending
        ;;
    active)
        show_active
        ;;
    blocked)
        show_blocked
        ;;
    all)
        show_all
        ;;
    *)
        show_help
        ;;
esac
