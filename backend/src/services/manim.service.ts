import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import type { SynchronizedScene } from './synchronization.service.js';

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
  content?: string;
  synchronizedScenes?: SynchronizedScene[];
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
    // Símbolos matemáticos Unicode frecuentes en pasos pedagógicos. Se
    // convierten a ASCII en texto libre para mantener compatibilidad con
    // pdfLaTeX incluso cuando el modelo devuelve Unicode.
    'Δ': 'Delta',
    'δ': 'delta',
    'α': 'alpha',
    'β': 'beta',
    'γ': 'gamma',
    'θ': 'theta',
    'λ': 'lambda',
    'μ': 'mu',
    'π': 'pi',
    'σ': 'sigma',
    'ω': 'omega',
    '∞': 'infinito',
    '±': '+/-',
    '√': 'sqrt',
    '≤': '<=',
    '≥': '>=',
    '≠': '!=',
    '→': '->',
    '²': '2',
    '³': '3',
    '⁰': '0',
    '¹': '1',
    '⁴': '4',
    '⁵': '5',
    '⁶': '6',
    '⁷': '7',
    '⁸': '8',
    '⁹': '9',
    '₀': '0',
    '₁': '1',
    '₂': '2',
    '₃': '3',
    '₄': '4',
    '₅': '5',
    '₆': '6',
    '₇': '7',
    '₈': '8',
    '₉': '9',
  };

  return Array.from(value)
    .map((char) => replacements[char] ?? char)
    .join('');
};

const normalizeForText = (value: string): string => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const buildMathTextWithSpaces = (value: string): string => {
  const cleaned = normalizeForText(value.trim());

  if (!cleaned) return 'x = 0';

  const tokens = cleaned
    .split(/(\s+|[=+\-*\/^()]+)/)
    .filter((token) => token !== undefined && token !== null && token.trim().length > 0);

  const mapped = tokens.map((token) => {
    if (/^[=+\-*\/^()]+$/.test(token)) return token;
    if (/^[A-Za-z]+$/.test(token)) return `\\text{${token}}`;
    return token;
  });

  return mapped.reduce((result, token, index) => {
    if (index === 0) return token;
    const previous = mapped[index - 1];
    const tight = token === '^' || previous === '^';
    return `${result}${tight ? '' : '\\quad '}${token}`;
  }, '').trim();
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

const normalizeMathUnicode = (value: string): string => value
  .replace(/Δ/g, '\\Delta')
  .replace(/δ/g, '\\delta')
  .replace(/α/g, '\\alpha')
  .replace(/β/g, '\\beta')
  .replace(/γ/g, '\\gamma')
  .replace(/θ/g, '\\theta')
  .replace(/λ/g, '\\lambda')
  .replace(/μ/g, '\\mu')
  .replace(/π/g, '\\pi')
  .replace(/σ/g, '\\sigma')
  .replace(/ω/g, '\\omega')
  .replace(/∞/g, '\\infty')
  .replace(/±/g, '\\pm')
  .replace(/≤/g, '\\leq')
  .replace(/≥/g, '\\geq')
  .replace(/≠/g, '\\neq')
  .replace(/→/g, '\\to')
  .replace(/√\s*(\\[A-Za-z]+|[A-Za-z0-9]+)/g, '\\sqrt{$1}')
  .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (char) => `_${'₀₁₂₃₄₅₆₇₈₉'.indexOf(char)}`)
  .replace(/²/g, '^2')
  .replace(/³/g, '^3')
  .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (char) => `_${'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(char)}`);

const latexMath = (value: string): string => {
  const trimmed = normalizeMathUnicode(normalizeForText(value.trim()));
  if (!trimmed) return 'x = 0';

  const withVerticalFraction = trimmed.replace(
    /\(\s*([^()]+?)\s*\)\s*\/\s*\(\s*([^()]+?)\s*\)/,
    '\\frac{$1}{$2}'
  );

  return buildMathTextWithSpaces(withVerticalFraction);
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
    const { title, steps, content = '', synchronizedScenes = [] } = scene;

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

    const hasQuadraticGraph = /x\s*\^?\s*2/i.test(normalizeForText(content));
    const graphBlock = hasQuadraticGraph && synchronizedScenes.length === 0 ? `
        # Grafica didactica de la parabola y sus raices
        axes = Axes(
            x_range=[-1, 6, 1],
            y_range=[-4, 5, 1],
            x_length=9,
            y_length=5,
            axis_config={"include_tip": True},
        )
        curve = axes.plot(lambda x: (x - 2) * (x - 3), x_range=[-0.5, 5.5], color=YELLOW)
        x_label = axes.get_x_axis_label(MathTex("x"))
        y_label = axes.get_y_axis_label(MathTex("y"))
        root_2 = Dot(axes.c2p(2, 0), color=GREEN)
        root_3 = Dot(axes.c2p(3, 0), color=GREEN)
        root_2_label = MathTex("x=2", font_size=24).next_to(root_2, DOWN)
        root_3_label = MathTex("x=3", font_size=24).next_to(root_3, DOWN)
        graph_title = Text("Raices de la parabola", font_size=28, color=BLUE).to_edge(UP)
        graph_group = VGroup(axes, curve, x_label, y_label, root_2, root_3, root_2_label, root_3_label, graph_title)
        self.play(Create(axes), Create(curve), FadeIn(x_label), FadeIn(y_label), run_time=3)
        self.play(FadeIn(root_2), FadeIn(root_3), Write(root_2_label), Write(root_3_label), FadeIn(graph_title), run_time=2)
        self.wait(3)
        self.play(FadeOut(graph_group))
` : '';

    const introDuration = Math.max(3, synchronizedScenes[0]?.duration ?? synchronizedScenes[0]?.estimatedDuration ?? 4);
    const synchronizedBlock = synchronizedScenes.length
      ? synchronizedScenes.slice(1).map((syncScene, i) => {
          const duration = Math.max(3, syncScene.duration ?? syncScene.estimatedDuration);
          const safeStep = normalizeForText(syncScene.visualText || 'Paso');
          const mathFormula = extractMathFormula(safeStep);
          const isMath = isMathLike(safeStep) || /[=^]/.test(mathFormula);
          const isQuadraticFormula = /(formula|fórmula).*x.*=/i.test(safeStep) && (safeStep.includes('/') || safeStep.includes('√'));

          if (syncScene.kind === 'graph') {
            return `
        # Escena sincronizada: gráfica
        axes_${i} = Axes(x_range=[-1, 6, 1], y_range=[-4, 5, 1], x_length=9, y_length=5, axis_config={"include_tip": True})
        curve_${i} = axes_${i}.plot(lambda x: (x - 2) * (x - 3), x_range=[-0.5, 5.5], color=YELLOW)
        x_label_${i} = axes_${i}.get_x_axis_label(MathTex("x"))
        y_label_${i} = axes_${i}.get_y_axis_label(MathTex("y"))
        root_2_${i} = Dot(axes_${i}.c2p(2, 0), color=GREEN)
        root_3_${i} = Dot(axes_${i}.c2p(3, 0), color=GREEN)
        root_2_label_${i} = MathTex("x=2", font_size=24).next_to(root_2_${i}, DOWN)
        root_3_label_${i} = MathTex("x=3", font_size=24).next_to(root_3_${i}, DOWN)
        graph_title_${i} = Text("Raices de la parabola", font_size=28, color=BLUE).to_edge(UP)
        graph_group_${i} = VGroup(axes_${i}, curve_${i}, x_label_${i}, y_label_${i}, root_2_${i}, root_3_${i}, root_2_label_${i}, root_3_label_${i}, graph_title_${i})
        self.play(Create(axes_${i}), Create(curve_${i}), FadeIn(x_label_${i}), FadeIn(y_label_${i}), run_time=3)
        self.play(FadeIn(root_2_${i}), FadeIn(root_3_${i}), Write(root_2_label_${i}), Write(root_3_label_${i}), FadeIn(graph_title_${i}), run_time=2)
        self.wait(max(0.5, ${duration.toFixed(2)} - 6))
        self.play(FadeOut(graph_group_${i}), run_time=1)
`;
          }

          if (syncScene.kind === 'conclusion') {
            return `
        # Escena sincronizada: conclusión
        final = Tex(r"\\textbf{Solucion comprobada}", font_size=42, color=GREEN)
        self.play(Write(final), run_time=1)
        self.wait(max(0.5, ${duration.toFixed(2)} - 1))
`;
          }

          const rendered = useLatex
            ? isQuadraticFormula
              ? `VGroup(Tex(${escapeForPythonString('\\text{Aplicamos la fórmula general:}')}, font_size=30, color=WHITE), MathTex(${escapeForPythonString('x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}')}, font_size=54, color=YELLOW)).arrange(DOWN, buff=0.45)`
              : isMath
                ? `MathTex(${escapeForPythonString(latexMath(mathFormula))}, font_size=36, color=WHITE)`
                : `Tex(${escapeForPythonString(latexText(safeStep))}, font_size=36, color=WHITE)`
            : `Text(${escapeForPythonString(safeStep)}, font_size=36, color=WHITE, font='DejaVu Serif')`;

          return `
        # Escena sincronizada: ${syncScene.id}
        scene_${i} = ${rendered}
        scene_${i}.to_edge(UP)
        self.play(Write(scene_${i}), run_time=1.2)
        self.wait(max(0.5, ${duration.toFixed(2)} - 2.2))
        self.play(FadeOut(scene_${i}), run_time=1)
`;
        }).join('\n')
      : '';

    const legacyBlock = `${steps
  .map((step, i) => {
    const safeStep = normalizeForText((step || 'Paso').trim() || 'Paso');
    const mathFormula = extractMathFormula(safeStep);
    const isMath = isMathLike(safeStep) || /[=^]/.test(mathFormula);
    const isQuadraticFormula = /(formula|fórmula).*x.*=/i.test(safeStep) && (safeStep.includes('/') || safeStep.includes('√') || safeStep.includes('\\\\sqrt'));
    const rendered = useLatex
      ? isQuadraticFormula
        ? `VGroup(Tex(${escapeForPythonString('\\\\text{Aplicamos la fórmula general:}')}, font_size=30, color=WHITE), MathTex(${escapeForPythonString('x = \\\\frac{-b \\\\pm \\\\sqrt{\\\\Delta}}{2a}')}, font_size=54, color=YELLOW)).arrange(DOWN, buff=0.45)`
        : isMath
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
  .join('\\n')}
${graphBlock}
        # Final
        final = ${finalObject}
        self.play(Write(final))
        self.wait(2)`;

    const sceneBlock = synchronizedScenes.length ? synchronizedBlock : legacyBlock;

    const pythonCode = `
# -*- coding: utf-8 -*-
from manim import *

class ${className}(Scene):
    def construct(self):
        # Título científico con estilo tipo revista
        title = ${titleObject}
        title.to_edge(UP)
        self.add(title)
        self.play(Write(title), run_time=1)
        self.wait(max(0.5, ${introDuration.toFixed(2)} - 2))
        self.play(FadeOut(title), run_time=1)

        # Contenido sincronizado con la narración
${sceneBlock}
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
        `"${manimCommand}" --media_dir "${mediaDir}" -ql -o ${safeName}.mp4 "${scriptPath}" ${className}`,
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
