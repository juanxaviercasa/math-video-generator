# Frontmatter & Description Engineering Guidelines

The YAML frontmatter in `SKILL.md` is the single most important part of any skill because the LLM classifier evaluates it **before** deciding whether to read the rest of the skill.

---

## Frontmatter Schema

```yaml
---
name: my-skill-name
description: >-
  Concise 2 to 4 sentence description written in third person.
  Specifies capabilities, triggers, and anti-triggers.
---
```

---

## 1. Naming Guidelines (`name`)

- **Format**: Lowercase letters, numbers, and hyphens only (`kebab-case`). No underscores or uppercase letters.
- **Match Folder Name**: The `name` property **MUST match the parent directory name** (e.g. folder `data-cleaning` must have `name: data-cleaning`).
- **Slash Command Ready**: In Antigravity CLI and IDE, the skill name becomes a slash command: `/<name>`. Ensure it is concise, memorable, and intuitive to type.
- **Length**: Keep under 40 characters for best usability.

---

## 2. Description Engineering (`description`)

### The 4 Pillars of a High-Trigger Description

1. **Third-Person Perspective**:
   - ✅ *Good*: "Analyzes Kubernetes manifests and checks for security compliance..."
   - ❌ *Bad*: "I can analyze Kubernetes manifests..." or "Use me to..."

2. **Clear Action Capabilities ("WHAT")**:
   - State exactly what the skill can perform (e.g., *"Generates migration scripts, verifies schemas against target database..."*).

3. **Explicit Trigger Phrases ("WHEN")**:
   - Detail the situations, keywords, or queries that should trigger this skill.
   - Example: *"Use when the user asks to create database migrations, upgrade schema versions, or troubleshoot migration rollback failures."*

4. **Negative Boundaries ("WHEN NOT")**:
   - Prevent unintentional activations by explicitly stating boundaries.
   - Example: *"Do NOT use for general SQL querying or data analysis (use bigquery-sql instead)."*

---

## Comparison Examples

| Skill Purpose | Weak Description ❌ | Strong Description ✅ |
| :--- | :--- | :--- |
| **API Documentation Generator** | "Generates API docs from OpenAPI specs." | "Parses OpenAPI and Swagger specifications to produce interactive Markdown API documentation and endpoint catalogs. Use when the user requests API documentation, swagger conversion, or endpoint reference generation." |
| **Docker Optimizer** | "Optimizes Dockerfiles for speed." | "Analyzes Dockerfiles and container configurations to reduce image size, implement multi-stage builds, and optimize layer caching. Use when the user asks to minimize container image sizes, debug slow container builds, or refactor Dockerfiles." |
| **Code Reviewer** | "Helps review code." | "Reviews code changes for security vulnerabilities, edge cases, naming conventions, and performance bottlenecks. Use when reviewing pull requests, conducting pre-commit audits, or assessing code quality." |
