import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { MathValidation } from './math-validation.service.js';

export interface SymbolicVerification {
  status: 'verified' | 'unavailable' | 'off';
  source: 'sympy';
  discriminant?: string;
  equationLatex?: string;
  roots?: number[];
  rootsLatex?: string[];
  warning?: string;
}

interface OracleResponse {
  verified: boolean;
  discriminant: string;
  discriminantValue: number;
  equationLatex: string;
  roots: number[];
  rootsLatex: string[];
  domain: string;
}

const matchQuadratic = /^([+-]?\s*\d*\.?\d*)\s*x\s*\^\s*2\s*([+-]\s*\d*\.?\d*)\s*x\s*([+-]\s*\d*\.?\d*)\s*=\s*0$/i;
const oracleScript = fileURLToPath(new URL('../../python/symbolic_verifier.py', import.meta.url));
const nearly = (left: number, right: number): boolean =>
  Math.abs(left - right) <= 1e-7 * Math.max(1, Math.abs(left), Math.abs(right));

export function extractBoundedQuadraticCoefficients(validation: MathValidation): { a: string; b: string; c: string } {
  if (!validation.valid || validation.kind !== 'quadratic') {
    throw new Error('SYMPY_UNSUPPORTED: El oráculo solo acepta cuadráticas previamente verificadas.');
  }
  const match = validation.normalizedInput.match(matchQuadratic);
  if (!match) throw new Error('SYMPY_PARSE: La cuadrática no coincide con el formato validado.');
  const canonical = (value: string | undefined, defaultValue: number): string => {
    const text = (value || '').replace(/\s/g, '');
    const parsed = text === '' || text === '+' ? defaultValue : text === '-' ? -defaultValue : Number(text);
    if (!Number.isFinite(parsed) || Math.abs(parsed) > 1_000_000) {
      throw new Error('SYMPY_COEFFICIENT_RANGE: Coeficiente fuera del dominio limitado.');
    }
    const formatted = String(parsed);
    if (!/^-?(?:0|[1-9]\d{0,5})(?:\.\d{1,6})?$/.test(formatted)) {
      throw new Error('SYMPY_COEFFICIENT_PRECISION: Solo se admiten decimales finitos con hasta 6 cifras.');
    }
    return formatted;
  };
  return { a: canonical(match[1], 1), b: canonical(match[2], 0), c: canonical(match[3], 0) };
}

/** Reject mathematical disagreements. An optional missing binary is different from a wrong solution. */
export function assertSympyAgreement(coefficients: { a: string; b: string; c: string }, oracle: OracleResponse): void {
  const { a, b, c } = Object.fromEntries(
    Object.entries(coefficients).map(([key, value]) => [key, Number(value)]),
  ) as { a: number; b: number; c: number };
  if (oracle.verified !== true || oracle.domain !== 'real'
      || !Array.isArray(oracle.roots) || !Array.isArray(oracle.rootsLatex)
      || oracle.roots.length !== oracle.rootsLatex.length
      || !oracle.roots.every(Number.isFinite)
      || !Number.isFinite(oracle.discriminantValue)
      || !nearly(oracle.discriminantValue, b * b - 4 * a * c)) {
    throw new Error('SYMPY_DISAGREEMENT: El certificado matemático es inválido.');
  }
  const delta = b * b - 4 * a * c;
  const expected = delta < 0 ? [] : [
    (-b - Math.sqrt(delta)) / (2 * a),
    (-b + Math.sqrt(delta)) / (2 * a),
  ];
  const expectedDistinct = [...new Set(expected.map((value) => Number(value.toPrecision(12))))].sort((x, y) => x - y);
  const observed = [...oracle.roots].sort((x, y) => x - y);
  if (expectedDistinct.length !== observed.length || !expectedDistinct.every((value, i) => nearly(value, observed[i]))) {
    throw new Error('SYMPY_DISAGREEMENT: Las raíces simbólicas no coinciden con el solver determinista.');
  }
}

const runPythonOracle = (coefficients: { a: string; b: string; c: string }): Promise<OracleResponse> =>
  new Promise((resolve, reject) => {
    const command = process.env.SYMPY_PYTHON_COMMAND || (process.platform === 'win32' ? 'py' : 'python3');
    const args = process.platform === 'win32' && command === 'py' ? ['-3', oracleScript] : [oracleScript];
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 7000);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
      if (stdout.length > 32_768) child.kill('SIGKILL');
    });
    child.stderr.on('data', (chunk: string) => {
      stderr = (stderr + chunk).slice(0, 1024);
    });
    child.on('error', (error) => { clearTimeout(timeout); reject(error); });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (timedOut) return reject(new Error('SYMPY_TIMEOUT: El oráculo superó 7 segundos.'));
      if (code !== 0) return reject(new Error('SYMPY_EXECUTION: ' + stderr));
      try { resolve(JSON.parse(stdout) as OracleResponse); }
      catch { reject(new Error('SYMPY_RESPONSE: El oráculo devolvió JSON inválido.')); }
    });
    child.stdin.end(JSON.stringify(coefficients));
  });

/**
 * auto: tolerate only missing SymPy/Python, never a mathematical disagreement.
 * required: fail closed. off: explicit local-only opt-out.
 */
export async function verifyQuadraticSymbolically(validation: MathValidation): Promise<SymbolicVerification> {
  const mode = process.env.SYMPY_VERIFY_MODE || (process.env.NODE_ENV === 'production' ? 'required' : 'auto');
  if (!['required', 'auto', 'off'].includes(mode)) throw new Error('SYMPY_MODE_INVALID');
  if (mode === 'off') return { status: 'off', source: 'sympy', warning: 'Verificación simbólica deshabilitada explícitamente.' };
  const coefficients = extractBoundedQuadraticCoefficients(validation);
  try {
    const oracle = await runPythonOracle(coefficients);
    assertSympyAgreement(coefficients, oracle);
    return {
      status: 'verified', source: 'sympy', discriminant: oracle.discriminant,
      equationLatex: oracle.equationLatex, roots: oracle.roots, rootsLatex: oracle.rootsLatex,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const unavailable = /ENOENT|No module named ['"]sympy['"]/.test(message);
    if (mode === 'auto' && unavailable) {
      return { status: 'unavailable', source: 'sympy', warning: 'SymPy no disponible; se conserva la verificación determinista local.' };
    }
    throw error;
  }
}
