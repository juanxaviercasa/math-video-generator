#!/usr/bin/env python3
"""
CLI Helper Script Template for Antigravity Skills.
Follows the CLI Black Box pattern:
- Multi-command argparse interface
- Standard libraries only where possible
- File output by default to preserve agent context
- Clear exit codes and actionable stderr messages
"""

import argparse
import json
import os
import sys
from pathlib import Path


def command_process(args: argparse.Namespace) -> int:
    """Handles the 'process' command."""
    input_path = Path(args.input)
    if not input_path.exists():
        sys.stderr.write(f"Error: Input file does not exist: {input_path}\n")
        return 1

    sys.stderr.write(f"Processing input file: {input_path}...\n")

    # Perform transformation or task
    data = {
        "status": "success",
        "source": str(input_path),
        "result": "Processed data payload",
    }

    # Write output to file if requested, otherwise print summary
    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Success! Output written to: {output_path}")
    else:
        # Avoid dumping long stdout; print brief JSON summary
        print(json.dumps({"status": data["status"], "summary": "Complete"}))

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Helper utility for {{skill_name}}."
    )
    subparsers = parser.add_subparsers(dest="subcommand", required=True)

    # Subcommand: process
    proc_parser = subparsers.add_parser("process", help="Process input data")
    proc_parser.add_argument("--input", "-i", required=True, help="Path to input file")
    proc_parser.add_argument("--output", "-o", help="Path to output file (recommended)")

    args = parser.parse_args()

    if args.subcommand == "process":
        return command_process(args)

    return 0


if __name__ == "__main__":
    sys.exit(main())
