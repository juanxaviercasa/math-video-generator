#!/usr/bin/env python3
"""Constrained SymPy oracle for validated quadratic coefficients.

Never parse user input as Python, LaTeX or a SymPy expression. The TypeScript
validator passes only three bounded decimal coefficient strings in JSON.
"""
import json
import re
import sys

from sympy import FiniteSet, Rational, S, Symbol, latex, solveset


def decimal(value):
    if not isinstance(value, str) or len(value) > 16:
        raise ValueError("INVALID_COEFFICIENT")
    if not re.fullmatch(r"-?(?:0|[1-9][0-9]{0,5})(?:\.[0-9]{1,6})?", value):
        raise ValueError("INVALID_COEFFICIENT")
    result = Rational(value)
    if abs(result) > 1000000:
        raise ValueError("COEFFICIENT_OUT_OF_RANGE")
    return result


def main():
    data = sys.stdin.buffer.read(4097)
    if len(data) > 4096:
        raise ValueError("INPUT_TOO_LARGE")
    payload = json.loads(data)
    if not isinstance(payload, dict) or set(payload) != {"a", "b", "c"}:
        raise ValueError("INVALID_PAYLOAD")
    a, b, c = (decimal(payload[key]) for key in ("a", "b", "c"))
    if a == 0:
        raise ValueError("NOT_QUADRATIC")
    x = Symbol("x", real=True)
    polynomial = a * x ** 2 + b * x + c
    discriminant = b ** 2 - 4 * a * c
    roots = solveset(polynomial, x, domain=S.Reals)
    if roots is S.EmptySet:
        ordered = []
    elif isinstance(roots, FiniteSet):
        ordered = sorted(roots, key=lambda value: float(value.evalf(15)))
    else:
        raise ValueError("UNSUPPORTED_SOLUTION_SET")
    if len(ordered) > 2:
        raise ValueError("INVALID_ROOT_COUNT")
    for root in ordered:
        if (polynomial.subs(x, root).simplify()) != 0:
            raise ValueError("SYMBOLIC_RESIDUAL_NONZERO")
    result = {
        "verified": True,
        "discriminant": str(discriminant),
        "discriminantValue": float(discriminant),
        "equationLatex": latex(polynomial) + " = 0",
        "roots": [float(value.evalf(15)) for value in ordered],
        "rootsLatex": [latex(value) for value in ordered],
        "domain": "real",
    }
    sys.stdout.write(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        sys.stderr.write(type(exc).__name__ + ": " + str(exc)[:160])
        sys.exit(2)
