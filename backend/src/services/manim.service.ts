import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

const manimCandidates = [
  'C:\\Users\\pc\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\manim.exe',
  'C:\\Users\\pc\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\manim.cmd',
  'manim',
];

const resolveManimBinary = () => {
  for (const candidate of manimCandidates) {
    if (candidate.includes('\\') || candidate.includes('/')) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } else {
      return candidate;
    }
  }
  return manimCandidates[manimCandidates.length - 1];
};

const latexBinPaths = [
  'C:\\Users\\pc\\AppData\\Local\\Programs\\MiKTeX\\miktex\\bin\\x64',
  'C:\\Program Files\\MiKTeX\\miktex\\bin\\x64',
  'C:\\Users\\pc\\AppData\\Local\\Programs\\MiKTeX\\miktex\\bin',
  'C:\\Program Files\\MiKTeX\\miktex\\bin',
];

const buildProcessEnv = () => {
  const currentPath = process.env.PATH || '';
  const entries = currentPath.split(path.delimiter).filter(Boolean);
  const merged = [...new Set([...entries, ...latexBinPaths.filter(fs.existsSync)])];
  return { ...process.env, PATH: merged.join(path.delimiter) };
};

/**
 * Manim Service - Generar animaciones matemáticas
 * Requiere: pip install manim
 */

interface ManimScene {
  title: string;
  steps: string[];
  outputDir: string;
}

const escapeForPythonString = (value: string): string => JSON.stringify(value);

const latexEscape = (value: string): string => {
  const replacements: Record<string, string> = {
    '&': '\\&',
    '%': '\\%',
    '$': '\\$',
    '#': '\\#',
    '_': '\\_',
    '{': '\\{',
    '}': '\\}',
    '~': '\\textasciitilde{}',
    '^': '\\textasciicircum{}',
    '\\': '\\textbackslash{}',
    'á': 'a',
    'à': 'a',
    'ä': 'a',
    'é': 'e',
    'è': 'e',
    'ë': 'e',
    'í': 'i',
    'ì': 'i',
    'ï': 'i',
    'ó': 'o',
    'ò': 'o',
    'ö': 'o',
    'ú': 'u',
    'ù': 'u',
    'ü': 'u',
    'ñ': 'n',
    'Á': 'A',
    'À': 'A',
    'Ä': 'A',
    'É': 'E',
    'È': 'E',
    'Ë': 'E',
    'Í': 'I',
    'Ì': 'I',
    'Ï': 'I',
    'Ó': 'O',
    'Ò': 'O',
    'Ö': 'O',
    'Ú': 'U',
    'Ù': 'U',
    'Ü': 'U',
    'Ñ': 'N',
  };

  return Array.from(value)
    .map((char) => replacements[char] ?? char)
    .join('');
};

const normalizeForText = (value: string): string => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const buildMathTextWithSpaces = (value: string): string => {
  const cleaned = normalizeForText(value.trim());

  if (!cleaned) return 'x = 0';

  const tokens = cleaned.split(/(\s+|[=+\-*\/^()]+)/).filter((token) => token !== undefined && token !== null && token.length > 0);

  return tokens
    .map((token) => {
      if (token.trim() === '') return ' ';
      if (/^[=+\-*\/^()]+$/.test(token)) return token;
      if (/^[A-Za-z]+$/.test(token)) return `\\text{${token}}`;
      return token;
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const extractMathFormula = (value: string): string => {
  const cleaned = normalizeForText(value.trim());
  if (!cleaned) return 'x = 0';

  const equationMatch = cleaned.match(/(?:[A-Za-z0-9]+\s*[-+*/^=()\s]+[A-Za-z0-9]+)/);
  if (equationMatch && /[=^]|\\frac|\\sqrt|\\sin|\\cos|\\tan|\\sum|\\int/.test(equationMatch[0])) {
    return equationMatch[0].trim();
  }

  const directMatch = cleaned.match(/[A-Za-z0-9\s+\-*/^=()]+/);
  if (directMatch && /[=^]/.test(directMatch[0])) {
    return directMatch[0].trim();
  }

  return cleaned;
};

const isMathLike = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const normalized = normalizeForText(trimmed);
  const hasMathToken = /\\frac|\\sqrt|\\sin|\\cos|\\tan|\\sum|\\int|\\cdot|\^|=|<|>/.test(normalized);
  const hasVariable = /[a-zA-Z]/.test(normalized);

  if (hasMathToken && hasVariable) {
    return true;
  }

  const hasEquationOperator = /[=+\-*\/^_()\\]/.test(normalized);
  const hasSentenceText = /[A-Za-z]{3,}/.test(normalized);

  return hasMathToken || (hasEquationOperator && !hasSentenceText && normalized.length < 80);
};

const latexCompilerAvailable = (): boolean => {
  const candidates = [
    'pdflatex',
    'xelatex',
    'lualatex',
    'C:\\Program Files\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe',
    'C:\\Users\\pc\\AppData\\Local\\Programs\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe',
    'C:\\Program Files\\MiKTeX\\miktex\\bin\\x64\\miktex.exe',
  ];

  for (const candidate of candidates) {
    if (candidate.includes('\\') || candidate.includes('/')) {
      if (fs.existsSync(candidate)) return true;
      continue;
    }

    const pathEntries = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
    for (const entry of pathEntries) {
      const possibleBinary = path.join(entry, candidate + (process.platform === 'win32' ? '.exe' : ''));
      if (fs.existsSync(possibleBinary)) return true;
    }
  }

  return false;
};

const latexText = (value: string): string => {
  const normalized = normalizeForText(value.trim());
  const escaped = latexEscape(normalized);
  return escaped ? `\\textbf{${escaped}}` : '\\textbf{Tema}';
};

const latexMath = (value: string): string => {
  const trimmed = normalizeForText(value.trim());
  if (!trimmed) return 'x = 0';
  return buildMathTextWithSpaces(trimmed);
};

function findGeneratedVideo(outputDir: string, safeName: string): string | null {
  const stack = [outputDir];
  const normalizedSafeName = safeName.toLowerCase();

  while (stack.length > 0) {
    const currentDir = stack.pop();
    if (!currentDir || !fs.existsSync(currentDir)) continue;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      const lowerName = entry.name.toLowerCase();
      if (!lowerName.endsWith('.mp4')) continue;

      const matchesExact = lowerName === `${normalizedSafeName}.mp4`;
      const matchesEmbedded = lowerName.includes(`${normalizedSafeName}.mp4`) || lowerName.includes(normalizedSafeName);

      if (matchesExact || matchesEmbedded) {
        return fullPath;
      }
    }
  }

  return null;
}

export const manim = {
  getCommand(): string {
    return resolveManimBinary();
  },
  /**
   * Generar script Python de Manim para una animación matemática
   */
  generatePythonScript(scene: ManimScene, useLatex = latexCompilerAvailable()): string {
    const { title, steps, outputDir } = scene;

    // Sanitizar nombre de archivo
    const safeName = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const className = safeName
      .split('_')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('') || 'MathScene';

    const safeTitle = normalizeForText(title);
    const safeFinal = normalizeForText('Listo!');

    const titleObject = useLatex
      ? `Tex(${escapeForPythonString(latexText(safeTitle))}, font_size=48, color=BLUE)`
      : `Text(${escapeForPythonString(safeTitle)}, font_size=48, color=BLUE, font='DejaVu Serif')`;

    const finalObject = useLatex
      ? `Tex(${escapeForPythonString(latexText(safeFinal))}, font_size=48, color=GREEN)`
      : `Text(${escapeForPythonString(safeFinal)}, font_size=48, color=GREEN, font='DejaVu Serif')`;

    const pythonCode = `
# -*- coding: utf-8 -*-
from manim import *

class ${className}(Scene):
    def construct(self):
        # Título científico con estilo tipo revista
        title = ${titleObject}
        title.to_edge(UP)
        self.add(title)
        self.wait(1)
        self.play(FadeOut(title))

        # Contenido
${steps
  .map((step, i) => {
    const safeStep = normalizeForText((step || 'Paso').trim() || 'Paso');
    const mathFormula = extractMathFormula(safeStep);
    const isMath = isMathLike(safeStep) || /[=^]/.test(mathFormula);
    const rendered = useLatex
      ? isMath
        ? `MathTex(${escapeForPythonString(latexMath(mathFormula))}, font_size=36, color=WHITE)`
        : `Tex(${escapeForPythonString(latexText(safeStep))}, font_size=36, color=WHITE)`
      : `Text(${escapeForPythonString(safeStep)}, font_size=36, color=WHITE, font='DejaVu Serif')`;

    return `
        # Paso ${i + 1}
        step_${i} = ${rendered}
        step_${i}.to_edge(UP)
        self.play(Write(step_${i}), run_time=2)
        self.wait(2)
        self.play(FadeOut(step_${i}))
`;
  })
  .join('\n')}

        # Final
        final = ${finalObject}
        self.play(Write(final))
        self.wait(2)
`;

    return pythonCode;
  },

  /**
   * Ejecutar Manim para generar video
   */
  async renderVideo(scene: ManimScene): Promise<string> {
    try {
      const safeName = scene.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const className = safeName
        .split('_')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('') || 'MathScene';
      const scriptPath = path.join(scene.outputDir, `${safeName}_scene.py`);
      const useLatex = latexCompilerAvailable();
      const pythonCode = this.generatePythonScript(scene, useLatex);

      if (!useLatex) {
        console.log('📐 No se detectó un compilador LaTeX; usando render de texto con fuente serif para mantener la estética científica sin romper el video.');
      }

      // Asegurar directorio de salida antes de guardar el script
      fs.mkdirSync(scene.outputDir, { recursive: true });

      // Crear archivo Python
      fs.writeFileSync(scriptPath, pythonCode, 'utf8');
      console.log(`📝 Script Python generado: ${scriptPath}`);

      // Ejecutar Manim y forzar la salida dentro del directorio solicitado
      const manimCommand = this.getCommand();
      const mediaDir = path.resolve(scene.outputDir);
      const { stdout, stderr } = await execAsync(
        `"${manimCommand}" --media_dir "${mediaDir}" -pql -o ${safeName}.mp4 "${scriptPath}" ${className}`,
        { cwd: scene.outputDir, maxBuffer: 1024 * 1024 * 10, env: buildProcessEnv() }
      );

      console.log('📹 Manim output:', stdout);
      if (stderr) console.warn('⚠️  Manim warnings:', stderr);

      const videoPath = findGeneratedVideo(scene.outputDir, safeName);

      if (videoPath && fs.existsSync(videoPath)) {
        console.log(`✓ Video generado: ${videoPath}`);
        return videoPath;
      } else {
        throw new Error('Video file not created by Manim');
      }
    } catch (error) {
      console.error('❌ Manim error:', error);
      throw error;
    }
  },

  /**
   * Verificar si Manim está instalado
   */
  async isInstalled(): Promise<boolean> {
    try {
      const manimCommand = this.getCommand();
      await execAsync(`"${manimCommand}" --version`, { env: buildProcessEnv() });
      return true;
    } catch {
      return false;
    }
  },
};
