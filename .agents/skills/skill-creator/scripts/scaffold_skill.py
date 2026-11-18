#!/usr/bin/env python3
"""
Antigravity Skill Scaffolder
Automates the creation of standard-compliant Antigravity Agent Skills.

Usage:
    python scaffold_skill.py --name <skill-name> --description "<description>" [options]
"""

import argparse
import os
import re
import sys
from pathlib import Path

NAME_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

SKILL_TEMPLATE = """---
name: {name}
description: >-
  {description}
---

# {title}

## Overview
{overview}

---

## When to Use & When NOT to Use

- **Use when**:
  - The user requests to {action_example_1}.
  - Working with {action_example_2}.
- **Do NOT use when**:
  - The task is solely focused on another domain (use relevant specialized skill instead).

---

## Prerequisites & Dependencies

- Required tools or environment dependencies:
  - Python 3.10+ / Node.js (if applicable)

---

## Step-by-Step Workflow

### Phase 1: Inspection & Planning
1. Identify target inputs and verify project context.
2. Formulate a structured plan before taking mutating actions.

### Phase 2: Execution
1. Follow standard procedures.
{execution_instructions}

### Phase 3: Verification & Quality Assurance
Check each item before completing the task:
- [ ] Outputs meet quality criteria and are non-empty.
- [ ] No unhandled exceptions or syntax errors.
- [ ] All generated files conform to workspace guidelines.

---

## Common Pitfalls & Troubleshooting

1. **Vague outputs / truncation**: Direct extensive outputs to files instead of flooding the terminal.
2. **Missing prerequisites**: Ensure necessary CLI tools are installed prior to execution.

---

## Reference Documentation
- [Reference Manual](./references/reference.md)
"""

CLI_SCRIPT_TEMPLATE = """#!/usr/bin/env python3
\"\"\"
Helper utility for {name}.
Designed as a black-box tool supporting `--help` discovery and file-based outputs.
\"\"\"

import argparse
import json
import sys
from pathlib import Path


def run_action(args: argparse.Namespace) -> int:
    \"\"\"Execute primary skill action.\"\"\"
    input_file = Path(args.input)
    if not input_file.exists():
        sys.stderr.write(f"Error: Target file not found: {input_file}\\n")
        return 1

    # Simulate / execute processing
    result = {{
        "status": "success",
        "file": str(input_file),
        "message": "Processed successfully by {name}",
    }}

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)
        print(f"Success! Output written to: {out_path}")
    else:
        print(json.dumps(result, indent=2))

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="CLI automation tool for {name}")
    subparsers = parser.add_subparsers(dest="command", required=True)

    action_cmd = subparsers.add_parser("run", help="Run standard processing")
    action_cmd.add_argument("--input", "-i", required=True, help="Input file path")
    action_cmd.add_argument("--output", "-o", help="Target output file path")

    args = parser.parse_args()
    if args.command == "run":
        return run_action(args)

    return 0


if __name__ == "__main__":
    sys.exit(main())
"""

REF_DOC_TEMPLATE = """# {title} Reference Manual

*Extended reference documentation for `{name}` (Progressive Disclosure).*

## Technical Specifications
Detailed schema, API configurations, or exhaustive tables go here so that `SKILL.md` remains lean and context-efficient.

## Parameter Options
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `--input` | string | yes | Target input path |
| `--output` | string | no | Destination output path |
"""


def to_title(name: str) -> str:
    return " ".join(word.capitalize() for word in name.split("-"))


def resolve_target_dir(name: str, scope: str, custom_dest: str | None) -> Path:
    if custom_dest:
        dest_root = Path(custom_dest).resolve()
        return dest_root / name if dest_root.name != name else dest_root

    if scope == "global":
        home = Path.home()
        return home / ".gemini" / "config" / "skills" / name

    # Default: workspace-level .agents/skills/
    cwd = Path.cwd()
    return cwd / ".agents" / "skills" / name


def scaffold_skill(name: str, description: str, scope: str, skill_type: str, custom_dest: str | None) -> Path:
    if not NAME_PATTERN.match(name):
        raise ValueError(
            f"Invalid skill name '{name}'. Name must be lowercase alphanumeric with hyphens (e.g., 'docker-optimizer')."
        )

    target_dir = resolve_target_dir(name, scope, custom_dest)
    target_dir.mkdir(parents=True, exist_ok=True)

    # Determine execution instructions
    if skill_type in ("cli", "full"):
        execution_instructions = f"""2. Use the bundled automation tool with `--help` discovery:
   ```bash
   python scripts/helper.py --help
   ```
3. Direct execution results to a file (e.g. `--output results.json`)."""
    else:
        execution_instructions = """2. Follow instructions sequentially, documenting progress and checkpoints."""

    title = to_title(name)
    skill_md_content = SKILL_TEMPLATE.format(
        name=name,
        description=description,
        title=title,
        overview=f"Automated procedures and protocols for {name.replace('-', ' ')}.",
        action_example_1=f"perform tasks related to {name.replace('-', ' ')}",
        action_example_2=f"{name.replace('-', ' ')} resources",
        execution_instructions=execution_instructions,
    )

    skill_md_path = target_dir / "SKILL.md"
    with open(skill_md_path, "w", encoding="utf-8") as f:
        f.write(skill_md_content.strip() + "\n")

    # Create references directory
    refs_dir = target_dir / "references"
    refs_dir.mkdir(exist_ok=True)
    ref_file = refs_dir / "reference.md"
    with open(ref_file, "w", encoding="utf-8") as f:
        f.write(REF_DOC_TEMPLATE.format(title=title, name=name).strip() + "\n")

    # If cli or full, add scripts/
    if skill_type in ("cli", "full"):
        scripts_dir = target_dir / "scripts"
        scripts_dir.mkdir(exist_ok=True)
        script_file = scripts_dir / "helper.py"
        script_content = CLI_SCRIPT_TEMPLATE.replace("{name}", name)
        with open(script_file, "w", encoding="utf-8") as f:
            f.write(script_content.strip() + "\n")

    # If full, add resources/ and examples/
    if skill_type == "full":
        (target_dir / "resources").mkdir(exist_ok=True)
        (target_dir / "examples").mkdir(exist_ok=True)
        with open(target_dir / "examples" / "example_usage.md", "w", encoding="utf-8") as f:
            f.write(f"# Example Usage for {title}\n\nWalkthrough demonstrating typical use cases.\n")

    return target_dir


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Scaffold an Antigravity Agent Skill according to official standards."
    )
    parser.add_argument("--name", "-n", required=True, help="Skill name in kebab-case (e.g. code-auditor)")
    parser.add_argument("--description", "-d", required=True, help="Skill description for YAML frontmatter")
    parser.add_argument(
        "--scope",
        "-s",
        choices=["workspace", "global"],
        default="workspace",
        help="Target scope: 'workspace' (.agents/skills/) or 'global' (~/.gemini/config/skills/)",
    )
    parser.add_argument(
        "--type",
        "-t",
        choices=["instruction", "cli", "full"],
        default="cli",
        help="Skill architecture type: 'instruction' (lean docs), 'cli' (with helper script), or 'full' (all subfolders)",
    )
    parser.add_argument(
        "--dest",
        help="Optional custom destination directory. If omitted, derives from --scope.",
    )

    args = parser.parse_args()

    try:
        if sys.platform == "win32":
            try:
                sys.stdout.reconfigure(encoding="utf-8")
                sys.stderr.reconfigure(encoding="utf-8")
            except Exception:
                pass

        target = scaffold_skill(
            name=args.name,
            description=args.description,
            scope=args.scope,
            skill_type=args.type,
            custom_dest=args.dest,
        )
        print(f"Successfully scaffolded skill '{args.name}' at:\n  {target}")
        print("\nGenerated structure:")
        for item in sorted(target.rglob("*")):
            rel = item.relative_to(target)
            marker = "/" if item.is_dir() else ""
            print(f"  |-- {rel}{marker}")
        return 0
    except Exception as e:
        sys.stderr.write(f"Scaffolding error: {e}\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
