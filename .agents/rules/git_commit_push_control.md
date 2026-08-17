# Git Commit & Push Rule

-   **Strict Requirement**: The agent MUST NOT execute `git commit`, `git push`, or any command that creates git commits or pushes to remote repositories unless the user explicitly requests or instructs a commit or push in their prompt.
-   **Editing & Testing**: Editing files, creating code, running tests, or building packages does NOT grant permission to commit or push code.
-   **Explicit User Command Only**: Always wait for direct user instructions such as "commit this", "push to origin", "switch branch and push", etc. before executing any git commit or push commands.
