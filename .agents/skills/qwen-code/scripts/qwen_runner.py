#!/usr/bin/env python3
"""
Wrapper para Qwen Code en Antigravity.
Ejecuta Qwen Code en modo headless, captura su salida y la guarda en disco de forma segura.
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

# UTF-8 en Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def run_qwen(prompt: str, cwd: str | None, mode: str, output: str | None, model: str | None) -> int:
    cmd = ["qwen", "-p", prompt, "--approval-mode", mode]

    if model:
        cmd.extend(["-m", model])

    work_dir = Path(cwd).resolve() if cwd else Path.cwd()
    sys.stderr.write(f"Iniciando Qwen Code en: {work_dir}\n")
    sys.stderr.write(f"Modo de aprobación: {mode}\n")

    try:
        # Ejecutar Qwen
        proc = subprocess.run(
            cmd,
            cwd=str(work_dir),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )

        stdout = proc.stdout
        stderr = proc.stderr

        if output:
            out_path = Path(output).resolve()
            out_path.parent.mkdir(parents=True, exist_ok=True)
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(stdout)
            print(f"Salida de Qwen guardada en: {out_path}")
        else:
            # Imprimir salida
            if stdout:
                print(stdout)

        if stderr and proc.returncode != 0:
            sys.stderr.write(f"Stderr de Qwen:\n{stderr}\n")

        return proc.returncode

    except FileNotFoundError:
        sys.stderr.write("Error: El comando 'qwen' no se encontró en el PATH del sistema.\n")
        return 1
    except Exception as e:
        sys.stderr.write(f"Error al ejecutar Qwen: {e}\n")
        return 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Ejecutor de Qwen Code para Antigravity")
    parser.add_argument("--prompt", "-p", required=True, help="Instrucción para Qwen Code")
    parser.add_argument("--cwd", help="Directorio de trabajo (por defecto: actual)")
    parser.add_argument(
        "--mode",
        choices=["plan", "auto-edit", "auto", "yolo"],
        default="plan",
        help="Modo de aprobación: 'plan' (solo lectura), 'auto-edit' (edición), 'auto', 'yolo'"
    )
    parser.add_argument("--output", "-o", help="Archivo para guardar el resultado")
    parser.add_argument("--model", "-m", help="Modelo específico a usar")

    args = parser.parse_args()
    return run_qwen(
        prompt=args.prompt,
        cwd=args.cwd,
        mode=args.mode,
        output=args.output,
        model=args.model
    )


if __name__ == "__main__":
    sys.exit(main())
