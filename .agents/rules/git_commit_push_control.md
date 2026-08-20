# Git Commit & Push Safety Rule

-   **STRICT ABSOLUTE RULE**: The agent MUST NEVER execute `git commit`, `git push`, `git merge`, or any git command that creates commits or pushes code to remote repositories UNLESS the user explicitly instructs a commit or push in their prompt.
-   **NO IMPLICIT PERMISSION**: Moving files, editing code, creating artifacts, running tests, or building packages DOES NOT grant permission to run `git commit` or `git push`.
-   **EXPLICIT USER COMMAND ONLY**: Always wait for direct user commands like "commit these changes", "push to origin", "commit and push", etc. before executing any git commit or push commands.
-   **NEVER STAGE/COMMIT FILE MOVES AUTOMATICALLY**: If files are moved or edited, describe the status to the user and ask for instructions rather than automatically committing or pushing.
