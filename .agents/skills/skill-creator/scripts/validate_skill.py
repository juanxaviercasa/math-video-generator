#!/usr/bin/env python3
"""
Antigravity Skill Validator
Validates skill packages against official Google Antigravity standards.

Usage:
    python validate_skill.py <path-to-skill-directory-or-SKILL.md>
"""

import argparse
import os
import re
import sys
from pathlib import Path

NAME_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
LINK_PATTERN = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def parse_frontmatter(content: str) -> tuple[dict[str, str], str, list[str]]:
    errors = []
    lines = content.splitlines()
    if not lines or lines[0].strip() != "---":
        errors.append("SKILL.md must start with YAML frontmatter delimiter '---' on line 1.")
        return {}, content, errors

    end_idx = -1
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end_idx = i
            break

    if end_idx == -1:
        errors.append("YAML frontmatter closing delimiter '---' not found.")
        return {}, content, errors

    fm_text = "\n".join(lines[1:end_idx])
    body = "\n".join(lines[end_idx + 1 :])

    # Simple YAML key-value parser for name and description
    data = {}
    current_key = None
    accumulated_val = []

    for line in lines[1:end_idx]:
        match = re.match(r"^([a-zA-Z0-9_-]+)\s*:\s*(.*)$", line)
        if match:
            if current_key:
                data[current_key] = " ".join(accumulated_val).strip()
            current_key = match.group(1).strip()
            val = match.group(2).strip()
            if val in (">-", ">", "|"):
                accumulated_val = []
            else:
                # Strip quotes if present
                if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                    val = val[1:-1]
                accumulated_val = [val] if val else []
        elif current_key and line.startswith("  "):
            accumulated_val.append(line.strip())

    if current_key:
        data[current_key] = " ".join(accumulated_val).strip()

    return data, body, errors


def validate_skill(skill_path: Path) -> tuple[list[str], list[str]]:
    errors = []
    warnings = []

    if skill_path.is_file():
        skill_dir = skill_path.parent
        skill_file = skill_path
    else:
        skill_dir = skill_path
        skill_file = skill_dir / "SKILL.md"

    if not skill_file.exists():
        errors.append(f"Required manifest file missing: {skill_file}")
        return errors, warnings

    content = skill_file.read_text(encoding="utf-8")
    fm, body, fm_errors = parse_frontmatter(content)
    errors.extend(fm_errors)

    if not fm_errors:
        # 1. Validate name
        name = fm.get("name")
        if not name:
            warnings.append("Frontmatter 'name' is missing; Antigravity will default to the folder name.")
        else:
            if not NAME_PATTERN.match(name):
                errors.append(
                    f"Invalid 'name': '{name}'. Must be lowercase alphanumeric with hyphens (e.g. 'code-review')."
                )
            if len(name) > 64:
                warnings.append(f"Skill name '{name}' exceeds recommended 64 characters.")
            if name != skill_dir.name:
                warnings.append(
                    f"Skill name '{name}' does not match directory name '{skill_dir.name}'."
                )

    # 2. Validate description
        desc = fm.get("description", "").strip()
        if not desc:
            errors.append("Frontmatter 'description' is required and cannot be empty.")
        else:
            if len(desc) < 30:
                warnings.append("Description is very short (< 30 chars). Include 'what' and 'when to use' triggers.")
            if re.search(r"\b(I can|my job|I am an agent|I will)\b", desc, re.IGNORECASE):
                warnings.append(
                    "Description uses first-person pronouns. Antigravity recommends writing in the third person."
                )
            if not re.search(
                r"\b(use when|use whenever|trigger|reviews|generates|analyzes|manages|handles|builds|creates|designs|scaffolds|validates|develops|guides|orchestrates|úsalo cuando|usalo cuando|usar cuando|resuelve|diseña|disena|construye|analiza|guía|guia|optimiza|explica|audita|planifica)\b",
                desc,
                re.IGNORECASE,
            ):
                warnings.append(
                    "Description lacks explicit action verbs or trigger keywords ('Use when...', 'Analyzes...', 'Designs...', etc.)."
                )

    # 3. Progressive disclosure & length check
    line_count = len(content.splitlines())
    if line_count > 450:
        warnings.append(
            f"SKILL.md has {line_count} lines. Consider moving bulky reference manuals to 'references/' for progressive disclosure."
        )

    # 4. Check relative links inside SKILL.md (excluding code blocks and inline code)
    # Strip fenced code blocks
    body_no_code = re.sub(r"```[\s\S]*?```", "", body)
    # Strip inline code
    body_no_code = re.sub(r"`[^`]*`", "", body_no_code)

    for match in LINK_PATTERN.finditer(body_no_code):
        link_text = match.group(1)
        target = match.group(2).split("#")[0].strip()  # Remove anchors
        if not target or target.startswith("http://") or target.startswith("https://") or target.startswith("file://") or target.startswith("mailto:"):
            continue
        # Check relative file existence
        resolved = (skill_dir / target).resolve()
        if not resolved.exists():
            errors.append(f"Broken relative link in SKILL.md: '{target}' (Link text: '{link_text}')")

    return errors, warnings


def main() -> int:
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
            sys.stderr.reconfigure(encoding="utf-8")
        except Exception:
            pass

    parser = argparse.ArgumentParser(description="Validate Antigravity Agent Skill package.")
    parser.add_argument("path", help="Path to the skill directory or SKILL.md file")
    args = parser.parse_args()

    target_path = Path(args.path).resolve()
    if not target_path.exists():
        sys.stderr.write(f"Error: Target path does not exist: {target_path}\n")
        return 1

    print(f"Validating skill at: {target_path}")
    errors, warnings = validate_skill(target_path)

    if warnings:
        print("\nWarnings:")
        for w in warnings:
            print(f"  [!] {w}")

    if errors:
        print("\nErrors:")
        for e in errors:
            print(f"  [X] {e}")
        print("\nResult: FAILED validation.")
        return 1

    print("\nResult: PASSED validation! Standard compliance verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
