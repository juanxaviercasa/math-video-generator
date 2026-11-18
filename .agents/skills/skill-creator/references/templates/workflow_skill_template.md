---
name: {{skill_name}}
description: >-
  {{skill_description}}
---

# {{skill_title}}

{{skill_summary}}

---

## When to Use & When NOT to Use

- **Use when**:
  - {{trigger_case_1}}
  - {{trigger_case_2}}
- **Do NOT use when**:
  - {{anti_trigger_case_1}}

---

## Prerequisites & Dependencies

- {{dependency_or_tool_1}}
- {{dependency_or_tool_2}}

---

## Step-by-Step Workflow

### Phase 1: Preparation & Inspection
1. Verify the necessary environment and input assets.
2. Read required configuration files.

### Phase 2: Execution & Transformation
1. Execute the primary procedure.
2. If scripts are available, run with `--help` first:
   ```bash
   python scripts/helper.py --help
   ```

### Phase 3: Verification & Quality Assurance
Follow this verification checklist before reporting completion:
- [ ] Output files exist and are non-empty.
- [ ] No unhandled errors or syntax violations.
- [ ] Relevant tests or linters pass.

---

## Decision Tree

```text
Are inputs structured as JSON or YAML?
├── JSON  ──> Run standard parser
└── YAML  ──> Convert or load with PyYAML
```

---

## Common Pitfalls & Troubleshooting

1. **Issue**: {{common_issue_1}}
   - **Fix**: {{common_fix_1}}
2. **Issue**: {{common_issue_2}}
   - **Fix**: {{common_fix_2}}

---

## Reference Documentation

- [Detailed Specifications](./references/spec.md)
