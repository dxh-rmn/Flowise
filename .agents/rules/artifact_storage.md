# Artifact Storage Rule

Whenever an artifact (such as markdown reports, implementation plans, architecture guides, walkthroughs, or analysis documents) is created or updated in the system artifact directory (`<appDataDir>/brain/<conversation-id>/...`), the agent MUST also save or mirror a copy to the workspace's local `artifacts/` folder:

-   Target Workspace Path: `/media/rumon/PLANT/devxhub/workflow agent/Flowise/artifacts/`
-   Rule:
    1. Whenever creating or modifying any artifact file (`.md`, `.json`, etc.), immediately copy/write the identical content into `/media/rumon/PLANT/devxhub/workflow agent/Flowise/artifacts/<artifact_filename>`.
    2. Keep all project documentation and generated plans easily accessible and backed up in the workspace `artifacts/` directory.
