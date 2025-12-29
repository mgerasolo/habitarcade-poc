# Commit and Push Everything

⚠️ **CAUTION:** Use only when confident all changes belong together.

Stage all changes, create commit with conventional commit format, and push to remote repository with comprehensive NLF-specific validations.

## Workflow

### 1. Analyze Changes

Run these in parallel to understand what's being committed:
```bash
git status
git diff --stat
git log -5 --oneline --decorate
git branch -vv  # Show tracking info
```

Check for Baton context:
```bash
# If .claude/CURRENT_CONVERSATION_ID exists, load conversation metadata
# Include conversation ID in commit if this is Baton-tracked work
```

### 2. Enhanced Safety Checks

#### Critical - HALT Immediately

**Secrets Detection:**
- ❌ Shared .env files: `/mnt/foundry_project/AppServices/env/*.env` (NEVER commit these)
- ❌ Old secrets: `~/.secrets/`, `.secrets/`, `*secret*.env`
- ❌ Real API key patterns (NOT placeholders):
  - `[A-Za-z0-9]{20,}` without "example", "test", "demo", "placeholder", "your-", "xxx"
  - `Bearer [A-Za-z0-9-._~+/]+=*`
  - `AKIA[0-9A-Z]{16}` (AWS)
  - `sk-[A-Za-z0-9]{48}` (OpenAI)
  - `xoxb-`, `xoxp-` (Slack)
- ❌ Password patterns: `password=`, `pwd=`, `pass=` followed by actual values
- ❌ Private keys: `-----BEGIN PRIVATE KEY-----`, `-----BEGIN RSA PRIVATE KEY-----`
- ❌ Hardcoded IPs/credentials in code (not in documentation examples)

**Large Files:**
- ❌ Files >10MB (should use Git LFS)
- ❌ Binary files >1MB without LFS tracking

**Build Artifacts:**
- ❌ `dist/`, `build/`, `out/`, `.next/`, `target/`, `__pycache__/`
- ❌ `node_modules/`, `vendor/`, `.venv/`, `venv/`
- ❌ `*.pyc`, `*.pyo`, `*.so`, `*.dylib`, `*.dll`

**Temp Files:**
- ❌ `*.tmp`, `*.temp`, `*.cache`, `*.swp`, `*~`
- ❌ `.DS_Store`, `Thumbs.db`, `desktop.ini`
- ❌ `*.log` files (unless intentionally documenting logs)

#### High Priority - WARN Loudly

**Deprecated References:**
- ⚠️ "Infisical" mentions (now deprecated - check if it should be "shared .env")
- ⚠️ "Phase" mentions (deprecated secrets manager)
- ⚠️ `~/.secrets/` paths (should be `/mnt/foundry_project/AppServices/env/`)
- ⚠️ NPM mentions (replaced by Traefik)

**Code Quality:**
- ⚠️ `TODO`, `FIXME`, `HACK`, `XXX` comments being added (inform user)
- ⚠️ `console.log`, `print()`, `debugger` statements in production code
- ⚠️ Hardcoded URLs/IPs that should be environment variables

**Protected Branches:**
- ⚠️ Pushing to `main`, `master`, `production` (require extra confirmation)
- ⚠️ Merge conflict markers: `<<<<<<<`, `=======`, `>>>>>>>`

#### NLF-Specific Validations

**Infrastructure Changes:**
- If modifying files in `scripts/`, check:
  - ✓ Shell scripts pass `shellcheck` (if available)
  - ✓ Executable permissions set correctly (`chmod +x`)

- If modifying `scripts/secrets.sh`:
  - ✓ Test it works: `source scripts/secrets.sh && verify_secrets_connection`

- If adding new service/deployment:
  - ⚠️ Check if `DEPLOYMENTS.md` needs updating
  - ⚠️ Check if `/mnt/foundry_project/Forge/deployments/inventory.md` updated
  - ⚠️ Port assignment follows standards (no 80, 443, 3000, 5000, 8080, 8443, 9000, 9443)

**Documentation Changes:**
- If modifying `CLAUDE.md`:
  - ⚠️ Check if "Last updated" date is current
  - ⚠️ This might be a breaking change for other projects

- If modifying standards files (`/mnt/foundry_project/Forge/Standards-v2/`):
  - ✓ Has proper header (Purpose, Not for, Canonical for, Last updated)
  - ⚠️ Consider if this affects other NLF projects

- If modifying Docker Compose files:
  - ✓ Valid YAML syntax
  - ✓ No hardcoded secrets
  - ✓ Uses `env_file` or environment variables for secrets
  - ✓ No exposed ports on 0.0.0.0 (unless intentional)

**Baton Integration:**
- If `.claude/conversations/` modified, this is Baton context
- Check if this is a ShepardProtocol rollout:
  - Look for changes in `/mnt/foundry_project/AppServices/ShepardProtocol/rollouts-active/`
  - Include rollout name in commit message

#### Validation Runners

**Shell Scripts:**
```bash
# For each modified .sh file
if command -v shellcheck &> /dev/null; then
  shellcheck path/to/script.sh
  # WARN if issues found, don't block unless critical
fi
```

**YAML/JSON:**
```bash
# For compose files
if command -v yamllint &> /dev/null; then
  yamllint docker-compose.yml
fi

# For JSON files
if command -v jq &> /dev/null; then
  jq empty file.json  # Validates JSON syntax
fi
```

**Markdown:**
```bash
# Check for broken links (basic check)
grep -r '\[.*\](.*)' --include="*.md" | grep -v 'http' | grep '](/'
# WARN about relative links that might be broken
```

### 3. Request Confirmation

Display comprehensive summary:

```
📊 Changes Summary:
   Files changed: X
   Insertions: +XXX
   Deletions: -XXX

   Modified areas:
   • Documentation: X files
   • Scripts: X files
   • Infrastructure: X files
   • Standards: X files

🔒 Safety Status:
   ✅ No secrets detected
   ✅ No large files
   ✅ No build artifacts
   ✅ No deprecated references
   ✅ Shell scripts validated
   ✅ YAML/JSON syntax valid

   ⚠️  Warnings:
   • X TODO comments added
   • Modified protected standards file
   • [List specific warnings]

🌿 Target:
   Branch: [current-branch]
   Remote: origin/[current-branch]
   Upstream: [X commits ahead, Y behind]

🎯 Baton Context:
   Conversation: [conversation-id] (if active)
   Rollout: [rollout-name] (if ShepardProtocol work)

📋 NLF Validations:
   ✅ No DEPLOYMENTS.md update needed
   ✅ Secrets.sh still works
   ⚠️  Consider updating inventory.md

Proceed? Type 'yes' to continue:
```

**Only proceed if user types exactly "yes"**.

### 4. Baton Auto-Save

Before committing, auto-save Baton context if active:

```bash
# Check for active Baton conversation
if [[ -f .claude/CURRENT_CONVERSATION_ID ]]; then
  CONV_ID=$(cat .claude/CURRENT_CONVERSATION_ID)

  # Trigger Baton save
  # This captures the current state before the commit
  echo "💾 Auto-saving Baton context..."
  # (Baton save happens via /baton save command automatically)
fi
```

### 5. Execute After Confirmation

```bash
# Stage all changes
git add .

# Verify what's staged
git status --short

# Double-check no secrets in staged files
git diff --cached | grep -i "password\|secret\|api[_-]key" && {
  echo "❌ Found potential secrets in staged changes!"
  exit 1
}
```

### 6. Generate Smart Commit Message

**Analysis Process:**

1. **Detect change type from files:**
   - `*.md` only → `docs`
   - `Standards-v2/` → `docs(standards)`
   - `scripts/` → `chore(scripts)` or `fix(scripts)`
   - `docker-compose.yml`, `Dockerfile` → `chore(docker)`
   - `.claude/`, `ShepardProtocol/` → `chore(baton)` or `chore(rollout)`
   - Multiple types → Use primary type, mention others in body

2. **Detect scope:**
   - Check git diff for most-changed directory
   - If ShepardProtocol rollout, use rollout name
   - If secrets changes, use `secrets`
   - If infrastructure, use `infra`

3. **Generate summary:**
   - Analyze actual changes with `git diff`
   - Create concise (<50 chars) description
   - Use imperative mood: "add", "update", "fix", not "added", "updated"

4. **Build body:**
   - Bullet points for major changes (max 5)
   - Include breaking changes if detected
   - Reference GitHub issues if mentioned in files
   - Include Baton conversation ID if active

5. **Add metadata:**
   - Include standard Claude footer
   - Add Baton context if applicable
   - Link to conversation or rollout

**Format:**
```
[type]([scope]): [summary]

[body with bullets]

[Breaking changes section if needed]

[Baton context if applicable]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Enhanced Examples:**

```
docs(standards): deprecate Infisical, use shared .env directory

- Rewrote Standards-v2/shared/secrets.md
- Updated AppServices/secrets.md
- Updated security.md and compose-conventions.md
- Created STANDARDS_INFISICAL_DEPRECATION.md

BREAKING CHANGE: Secrets now in /mnt/foundry_project/AppServices/env/
instead of ~/.secrets/. Update secrets.sh to latest version.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

```
chore(rollout): complete Baton deployment to Infrastructure

ShepardProtocol rollout: Baton&PromptResponseFormat

- Created .claude/ directory structure
- Added baton skill implementation
- Updated CLAUDE.md with Context Management Protocol
- Created initial conversation tracking

Baton: conv-20251226-035156

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 7. Commit and Push

```bash
# Commit with generated message
git commit -m "$(cat <<'EOF'
[generated message here]
EOF
)"

# Show what was committed
echo "📝 Committed:"
git log -1 --stat

# Check if remote branch exists
if git rev-parse --verify origin/$(git branch --show-current) >/dev/null 2>&1; then
  echo "Pushing to existing remote branch..."
else
  echo "Creating new remote branch..."
fi

# Push to remote
git push -u origin $(git branch --show-current)
```

**If push fails (non-fast-forward):**
```bash
echo "⚠️  Remote has new commits. Attempting rebase..."

# Pull with rebase
git pull --rebase origin $(git branch --show-current)

# Check for conflicts
if git diff --check | grep "conflict"; then
  echo "❌ Merge conflicts detected. Resolve manually."
  echo ""
  echo "Commands to resolve:"
  echo "  1. Fix conflicts in marked files"
  echo "  2. git add <resolved-files>"
  echo "  3. git rebase --continue"
  echo "  4. git push"
  exit 1
fi

# Push again
git push
```

### 8. Post-Commit Actions

**Update Baton context:**
```bash
# If Baton active, update conversation with commit info
if [[ -f .claude/CURRENT_CONVERSATION_ID ]]; then
  echo "📝 Updating Baton context with commit..."
  # Record commit hash in conversation metadata
fi
```

**Check for follow-up tasks:**
```bash
# If modified infrastructure files, remind about related updates
if git diff HEAD~1 --name-only | grep -q "DEPLOYMENTS.md"; then
  echo ""
  echo "📋 Next steps:"
  echo "  • Update /mnt/foundry_project/Forge/deployments/inventory.md if needed"
fi

if git diff HEAD~1 --name-only | grep -q "secrets.sh"; then
  echo ""
  echo "🔐 Secrets.sh updated:"
  echo "  • Test on all VMs: ssh <vm> 'source ~/Infrastructure/scripts/secrets.sh && verify_secrets_connection'"
fi
```

**GitHub integration (if gh CLI available):**
```bash
if command -v gh &> /dev/null; then
  # Check if there are related open issues
  COMMIT_MSG=$(git log -1 --pretty=%B)
  if echo "$COMMIT_MSG" | grep -q "#[0-9]"; then
    echo ""
    echo "🔗 Related GitHub Issues found in commit"
    echo "$COMMIT_MSG" | grep -o "#[0-9]*" | while read issue; do
      gh issue view "${issue#\#}" --json title,state | jq -r '"\(.state | ascii_upcase): \(.title)"'
    done
  fi

  # Offer to create PR if on feature branch
  CURRENT_BRANCH=$(git branch --show-current)
  if [[ "$CURRENT_BRANCH" != "main" ]] && [[ "$CURRENT_BRANCH" != "master" ]]; then
    echo ""
    echo "💡 Create pull request? (y/N)"
    # Wait for user input, if yes: gh pr create
  fi
fi
```

### 9. Confirm Success

Display comprehensive summary:

```
✅ Committed and pushed successfully

📝 Commit: [hash]
🌿 Branch: [branch]
📊 Changes: X files, +XXX/-XXX lines

🎯 Commit Type: [type]([scope])
💬 Message: [summary]

🔗 Remote: origin/[branch]
📍 Tracking: [X commits ahead of main]

✅ Validations Passed:
   • No secrets committed
   • Standards validated
   • Shell scripts checked
   • No deprecated references

📋 Next:
   [List any recommended follow-up actions]

🎯 Baton: Context saved to [conversation-id]
```

## Error Handling & Recovery

### Secrets Detected
```
❌ SECRETS DETECTED - Commit blocked

Found in: [filename]
Pattern: [what was detected]

🔧 Fix options:
  1. Move to shared .env:
     nano /mnt/foundry_project/AppServices/env/[appropriate].env

  2. Remove from file

  3. Add to .gitignore

After fixing, run /push-all again.
```

### Large Files Detected
```
❌ LARGE FILE DETECTED - Commit blocked

File: [filename] ([size]MB)

🔧 Fix options:
  1. Setup Git LFS:
     git lfs install
     git lfs track "[pattern]"
     git add .gitattributes

  2. Add to .gitignore if not needed

  3. Compress/optimize file
```

### Build Artifacts Detected
```
❌ BUILD ARTIFACTS DETECTED

Files: [list]

🔧 Fix:
  Add to .gitignore:
  echo "[pattern]" >> .gitignore
  git rm --cached [files]
```

### Shell Script Failed Validation
```
⚠️  ShellCheck warnings in: [script]

Issues:
  [shellcheck output]

Continue anyway? (y/N)
```

### Standards Violations
```
⚠️  NLF Standards violations detected:

• Port 8080 used (should avoid)
• DEPLOYMENTS.md not updated
• Standard file missing header

Continue anyway? (y/N)
```

## When to Use

✅ **Excellent for:**
- Baton-tracked work sessions (auto-linked to conversation)
- ShepardProtocol rollouts (auto-detected and labeled)
- Multi-file documentation updates with validations
- Infrastructure changes that passed all checks
- Standards updates with proper headers
- Coordinated changes across scripts and docs

✅ **Good for:**
- Bug fixes with tests
- Refactoring with standards compliance
- Feature completion with documentation

❌ **Never use when:**
- ANY secrets might be present
- Unsure what changed
- Working on protected branch without approval
- Standards violations detected and unresolved
- Merge conflicts present

## Alternatives

**For sensitive changes:**
- Review each file: `git add -p`
- Separate commits: `git add file1 && git commit`
- Feature branch + PR workflow

**For complex features:**
- Break into logical commits
- Use feature flags
- Deploy incrementally

## Integration Notes

**Baton Integration:**
- Auto-saves context before commit
- Links commits to conversations
- Tracks ShepardProtocol rollouts

**NLF Standards:**
- Validates against all active standards
- Checks deprecated patterns
- Enforces secrets policies
- Validates infrastructure changes

**GitHub Integration:**
- Links to issues in commit
- Offers PR creation on feature branches
- Shows issue status

---

**Usage:** `/push-all` when you've made validated, cohesive changes and all safety checks pass.
