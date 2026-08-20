---
name: git-safety
description: Enforces strict safety rules prohibiting automatic git commit, git push, or git merge without explicit user instructions in prompt.
---

# Git Safety & Non-Automated Commit Rule

## Core Directives

1. **Explicit Prompt Requirement**:

    - The agent must **NEVER** run `git commit`, `git push`, `git merge`, or `git cherry-pick` unless the user explicitly orders a commit or push in their prompt (e.g., "commit these changes", "push to origin", "commit and push").

2. **No Implicit Operations**:

    - File edits, file moves, refactoring, building code, running tests, or creating documentation **DO NOT** give implicit permission to run git commit or push.

3. **Status Reporting Only**:
    - When files are modified, deleted, or moved, report the exact status to the user and wait for their explicit instructions before taking any git commit or push action.
