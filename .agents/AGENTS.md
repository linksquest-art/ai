# Project Rules & Customizations

## Auto-Register GitHub Skills
**Scope:** Project
**Description:**
Whenever the user asks to download or install a skill from a GitHub repository:
1. Download and extract the repository into the appropriate `.agents/skills/<skill_name>` directory.
2. Search the extracted repository for its main documentation (e.g., `README.md`, `CLAUDE.md`, or `AGENTS.md`).
3. Automatically create a `SKILL.md` file in the root of the extracted skill folder.
4. Add a valid YAML frontmatter to the top of `SKILL.md` containing `name` and `description` (derived from the repo's docs), followed by the content of the main documentation file.
5. This ensures the newly downloaded skill is immediately visible and usable in the IDE's skill list without requiring manual user intervention.
