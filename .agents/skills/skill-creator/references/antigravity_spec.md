# Official Antigravity Agent Skills Specification

*Source: [Google Antigravity Documentation](https://antigravity.google/docs/skills)*

## What are Agent Skills?

Skills are an **open standard** for extending agent capabilities. A skill is a folder containing a `SKILL.md` file with instructions that the agent can follow when working on specific tasks.

Each skill contains:
- **Instructions**: Explicit protocols for how to approach a specific task.
- **Best Practices**: Conventions, style guidelines, and checklists to follow.
- **Scripts and Resources**: Optional helper scripts, templates, and data schemas the agent can execute.

When a conversation starts, the agent sees a list of available skills with their names and descriptions. If a skill looks relevant to the user's task, the agent reads the full instructions and follows them.

---

## Anatomy of a Skill

Skills are organized as directory bundles containing a required `SKILL.md` file:

```text
my-skill/
├── SKILL.md       # Required: skill instructions and metadata
├── scripts/       # Optional: executable helper scripts
├── examples/      # Optional: reference implementations
└── resources/     # Optional: templates, schemas, or data files
```

---

## Manifest Format (`SKILL.md`)

Every `SKILL.md` file begins with YAML frontmatter defining its name and triggering criteria:

```yaml
---
name: code-review
description: Reviews code changes for bugs, style issues, and best practices. Use when reviewing pull requests or checking code quality.
---
# Code Review Skill

When reviewing code, follow these steps:

## Review checklist
1. **Correctness**: Verify that the code satisfies specifications.
2. **Edge cases**: Ensure error conditions and boundaries are handled.
3. **Style**: Follow project naming and architectural patterns.
4. **Performance**: Identify potential bottlenecks or inefficiencies.
```

### Frontmatter Fields

| Field | Required | Description |
| :--- | :--- | :--- |
| **`name`** | No (Recommended) | A unique identifier for the skill (lowercase, hyphens for spaces). Defaults to the folder name if not provided. |
| **`description`** | **Yes** | A clear description of what the skill does and when to use it. This is what the agent sees when deciding whether to apply the skill. |

> **Tip**: Write your description in the **third person** and include keywords that help the agent recognize when the skill is relevant. For example: *"Generates unit tests for Python code using pytest conventions."*

---

## How the Agent Uses Skills (Progressive Disclosure)

Skills follow a progressive disclosure pattern:

1. **Discovery**: When a conversation starts, the agent sees a list of available skills with their names and descriptions.
2. **Activation**: If a skill looks relevant to your task, the agent reads the full `SKILL.md` content.
3. **Execution**: The agent follows the skill's instructions while working on your task.

You don't need to explicitly tell the agent to use a skill—it decides based on context. However, you can mention a skill by name if you want to ensure it's used.

---

## Antigravity Skill Locations & Scopes

### 1. Antigravity 2.0 / Antigravity IDE

| Location | Scope |
| :--- | :--- |
| `<workspace-root>/.agents/skills/<skill-folder>/` | **Workspace-specific** (Scoped to single project, shared via VCS. Note: backwards compatible with `.agent/skills/`) |
| `~/.gemini/config/skills/<skill-folder>/` | **Global** (All workspaces on workstation; legacy `~/.gemini/antigravity/skills/` is also supported) |

### 2. Antigravity CLI

| Location | Scope |
| :--- | :--- |
| `<workspace-root>/.agents/skills/<skill-folder>/` | Workspace-specific |
| `~/.gemini/antigravity-cli/skills/<skill-folder>/` | Global (all workspaces) |
| `~/.gemini/antigravity-cli/plugins/<name>/skills/` | Plugin-provided skills |

---

## Slash Command Conversion

Whenever you define a skill, Antigravity automatically converts it into a slash command inside the interactive prompt interface. For example, creating a skill named `deploy-staging` immediately makes `/deploy-staging` available in the prompt box.

---

## Best Practices from Official Docs

1. **Keep skills focused**: Each skill should do one thing well. Instead of a "do everything" skill, create separate skills for distinct tasks.
2. **Write clear descriptions**: The description is how the agent decides whether to use your skill. Make it specific about what the skill does and when it's useful.
3. **Use scripts as black boxes**: If your skill includes scripts, encourage the agent to run them with `--help` first rather than reading the entire source code. This keeps the agent's context focused on the task.
4. **Include decision trees**: For complex skills, add a section that helps the agent choose the right approach based on the situation.
