# {{doc_title}}

*Extended Reference Document for `{{skill_name}}` (Progressive Disclosure)*

---

## 1. Technical Specification

Detailed schemas, API payload structures, or extended reference details that are too bulky to fit in `SKILL.md`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ConfigSchema",
  "type": "object",
  "properties": {
    "version": { "type": "string" },
    "enabled": { "type": "boolean" }
  }
}
```

---

## 2. Command Reference & Flags

| Flag | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `--input, -i` | String | Yes | Path to source payload. |
| `--output, -o` | String | No | Target output path. |
| `--dry-run` | Boolean | No | Validate inputs without committing changes. |

---

## 3. Edge Cases & Advanced Configurations

- **Handling large files**: Stream line by line to prevent memory limits.
- **Network timeouts**: Implement exponential backoff when connecting to external endpoints.
