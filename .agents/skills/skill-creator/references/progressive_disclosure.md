# Progressive Disclosure Architecture in Antigravity

## What is Progressive Disclosure?

In large codebases and complex multi-agent workflows, flooding the LLM's context window with every possible instruction, schema, and API manual simultaneously leads to:
1. **Context Saturation**: Slower inference times and higher token costs.
2. **Instruction Drift / Distraction**: The model loses focus on the primary user request.
3. **Truncation Risk**: Relevant task details get pushed out of the model's active window.

To prevent this, Antigravity uses a 3-tier **Progressive Disclosure** architecture:

```text
Level 1: System Index (Startup)
└── Metadata only: name + description (~20-50 tokens per skill)
       │
       ▼ (Skill selected by model or slash command)
Level 2: Skill Runbook (Activation)
└── SKILL.md body (~300-600 tokens: core steps, checklists, entry points)
       │
       ▼ (Deep detail requested by step)
Level 3: Auxiliary Assets (On-Demand)
├── references/doc.md      (Deep schemas, detailed specifications)
├── scripts/helper.py      (Executed via CLI with --help, output to file)
└── resources/template.json (Loaded only when generating target output)
```

---

## Architectural Rules for Skill Authors

### 1. The 400-Line Rule for `SKILL.md`
- Keep `SKILL.md` under 400 lines.
- It should act as an orchestration guide, containing high-level phases, decision gates, and checklists.
- If a section contains an exhaustive table of 50 API endpoints, move that table into `references/api_reference.md` and link to it:
  ```markdown
  For complete query parameters and endpoint specifications, refer to
  [API Reference](./references/api_reference.md).
  ```

### 2. Scripts as Black Boxes
- Avoid embedding large scripts directly into `SKILL.md` code blocks.
- Save the script in `scripts/my_script.py`.
- Instruct the agent to run `python scripts/my_script.py --help` to discover parameters rather than reading all the script's implementation details into context.

### 3. File Output Over Standard Output
- Long terminal outputs (e.g. 500 lines of JSON) flood the transcript and burn tokens.
- Always write tool outputs to disk:
  ```bash
  python scripts/query_data.py --output results.json
  ```
- Then instruct the agent to inspect only summary fields or targeted lines.
