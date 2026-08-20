# Workspace Guidelines & Rules

## 1. Artifact Storage & Mirroring

Whenever any artifact (e.g. `implementation_plan.md`, `walkthrough.md`, guides, reports, architecture designs) is generated or updated:

-   The agent must always store a copy directly in the workspace `artifacts/` directory (`/media/rumon/PLANT/devxhub/workflow agent/Flowise/artifacts/`).
-   If the `artifacts/` folder does not exist, create it automatically.
-   Keep the workspace `artifacts/` directory synchronized with any created artifacts.

## 2. Strict Rule: No Unauthorized Git Commit or Push

-   **NEVER** run `git commit`, `git push`, `git merge`, or any command that creates commits or pushes to a remote repository UNLESS the user explicitly instructs you to commit or push in their prompt.
-   Editing files, moving files, creating code, running tests, or building code does NOT grant permission to commit or push.
-   Always wait for an explicit user command (e.g. "commit these changes", "push to origin", "commit and push", etc.) before executing any git commit or push commands.
-   When file changes or file moves occur, present the status to the user and wait for explicit instructions before running git commit/push.
