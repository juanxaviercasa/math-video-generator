import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import type { SynchronizedScene } from './synchronization.service.js';
import type { LessonTimeline } from './timeline.types.js';
import { getVideoFormatProfile, type VideoFormatProfile } from './video-format.service.js';

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
  pedagogicalScenes?: Array<SynchronizedScene & { visualLatex?: string[]; visualTextLines?: string[]; visualStages?: Array<{ label: string; latex: string; detail?: string }>; emphasis?: string; layout?: string }>;
  formatProfile?: VideoFormatProfile;
  layoutDensity?: 'comfortable' | 'compact';
  narrationStyle?: 'warm_teacher' | 'neutral_teacher';
  lessonTimeline?: LessonTimeline;
  narrationTimeline?: boolean;
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
    const { title, steps, content = '', synchronizedScenes = [], pedagogicalScenes = [], lessonTimeline, narrationTimeline = false } = scene;
    const timelineEnabled = narrationTimeline && Boolean(lessonTimeline) && pedagogicalScenes.length > 0;
    const formatProfile = scene.formatProfile || getVideoFormatProfile('16:9', 'medium');
    const panelWidth = formatProfile.panelWidth.toFixed(2);
    const panelHeight = formatProfile.panelHeight.toFixed(2);
    const contentWidth = formatProfile.contentWidth.toFixed(2);
    const headerY = Math.max(0.8, formatProfile.panelHeight / 2 - 0.45).toFixed(2);
    const contentY = Math.min(0.5, formatProfile.panelHeight * 0.05).toFixed(2);
    const graphXLength = Math.max(3.8, Math.min(formatProfile.panelWidth - 1.0, formatProfile.frameWidth * 0.72)).toFixed(2);
    const graphYLength = Math.max(4.0, Math.min(formatProfile.panelHeight - 1.8, formatProfile.frameHeight * 0.54)).toFixed(2);

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

    const introDuration = pedagogicalScenes.length
      ? 1.8
      : Math.max(3, synchronizedScenes[0]?.duration ?? synchronizedScenes[0]?.estimatedDuration ?? 4);
    const legacyPedagogicalBlock = pedagogicalScenes.length
      ? pedagogicalScenes.map((pedScene, i) => {
          const duration = Math.max(4, pedScene.duration ?? pedScene.estimatedDuration);
          const emphasis = pedScene.emphasis || pedScene.visualText || 'Paso matemático';
          const latexLines = pedScene.visualLatex || [];
          const textLines = pedScene.visualTextLines || [];
          const mathObjects = latexLines.map((line, lineIndex) =>
            `MathTex(${escapeForPythonString(line)}, font_size=${lineIndex === 0 ? 46 : 38}, color=${lineIndex === latexLines.length - 1 ? 'YELLOW' : 'WHITE'})`
          );
          const textObjects = textLines.map((line) =>
            `Text(${escapeForPythonString(line)}, font_size=26, color=GREY_B)`
          );
          const allObjects = [...mathObjects, ...textObjects];
          const contentGroup = allObjects.length
            ? `VGroup(${allObjects.join(', ')}).arrange(DOWN, buff=0.18).scale_to_fit_width(${contentWidth})`
            : `Text(${escapeForPythonString(emphasis)}, font_size=42, color=WHITE)`;
          const compactScale = pedScene.layout === 'hero'
            ? '0.9'
            : pedScene.layout === 'recap'
              ? '0.82'
              : pedScene.layout === 'equation' && latexLines.length > 1
                ? '0.88'
                : '1';
          const compactY = contentY;
          const contentHeight = pedScene.layout === 'equation'
            ? Math.min(formatProfile.orientation === 'portrait' ? 4.5 : 2.35, formatProfile.contentHeight).toFixed(2)
            : pedScene.layout === 'hero'
              ? Math.min(3.7, formatProfile.contentHeight).toFixed(2)
              : Math.min(4.0, formatProfile.contentHeight).toFixed(2);
          const visualStages = pedScene.visualStages || [];

          if (pedScene.layout === 'equation' && visualStages.length > 0) {
            const stageLabelSize = visualStages.length >= 4 ? 15 : 17;
            const stageObjects = visualStages.map((stage, stageIndex) => {
              const formulaFontSize = visualStages.length >= 4 ? (stageIndex === 0 ? 30 : 24) : 34;
              const label = `Text(${escapeForPythonString(stage.label)}, font_size=${stageLabelSize}, color=${stageIndex === visualStages.length - 1 ? 'YELLOW' : 'GREY_B'})`;
              const formula = `MathTex(${escapeForPythonString(stage.latex)}, font_size=${formulaFontSize}, color=${stageIndex === visualStages.length - 1 ? 'YELLOW' : 'WHITE'})`;
              const detail = stage.detail ? `, Text(${escapeForPythonString(stage.detail)}, font_size=13, color=GREY_B)` : '';
              return `VGroup(${label}, ${formula}${detail}).arrange(DOWN, buff=0.10)`;
            });
            const stageContentY = formatProfile.orientation === 'portrait' ? 0.50 : 0.42;
            const stageArrangement = visualStages.length >= 4
              ? `VGroup(${stageObjects[0]}, VGroup(${stageObjects.slice(1).join(', ')}).arrange(RIGHT, buff=0.28)).arrange(DOWN, buff=0.30)`
              : `VGroup(${stageObjects.join(', ')}).arrange(DOWN, buff=0.30)`;
            return `
        # Storyboard pedagógico: micro-pasos de ${pedScene.id}
        panel_${i} = RoundedRectangle(width=${panelWidth}, height=${panelHeight}, corner_radius=0.2, fill_color="#101D33", fill_opacity=1, stroke_color=BLUE, stroke_width=2)
        header_${i} = Text(${escapeForPythonString(emphasis)}, font_size=32, color=BLUE).move_to(UP * ${headerY})
        content_${i} = ${stageArrangement}
        content_${i}.scale(min(${contentWidth} / content_${i}.width, ${contentHeight} / content_${i}.height))
        content_${i}.move_to(DOWN * ${stageContentY.toFixed(2)})
        content_group_${i} = VGroup(header_${i}, content_${i})
        self.play(FadeIn(panel_${i}), FadeIn(content_group_${i}), run_time=1.2)
        self.wait(max(0.5, ${duration.toFixed(2)} - 2.2))
        self.play(FadeOut(content_group_${i}), FadeOut(panel_${i}), run_time=1)
`;
          }

          if (pedScene.layout === 'graph') {
            return `
        # Storyboard pedagógico: gráfica a pantalla completa
        panel_${i} = RoundedRectangle(width=${panelWidth}, height=${panelHeight}, corner_radius=0.2, fill_color="#101D33", fill_opacity=1, stroke_color=BLUE, stroke_width=2)
        axes_${i} = Axes(x_range=[-1, 6, 1], y_range=[-4, 5, 1], x_length=${graphXLength}, y_length=${graphYLength}, axis_config={"include_tip": True}).shift(DOWN * 0.2)
        curve_${i} = axes_${i}.plot(lambda x: (x - 2) * (x - 3), x_range=[-0.5, 5.5], color=YELLOW)
        x_label_${i} = axes_${i}.get_x_axis_label(MathTex("x"))
        y_label_${i} = axes_${i}.get_y_axis_label(MathTex("y"))
        root_2_${i} = Dot(axes_${i}.c2p(2, 0), color=GREEN)
        root_3_${i} = Dot(axes_${i}.c2p(3, 0), color=GREEN)
        root_2_label_${i} = MathTex("x=2", font_size=26).next_to(root_2_${i}, DOWN)
        root_3_label_${i} = MathTex("x=3", font_size=26).next_to(root_3_${i}, DOWN)
        graph_title_${i} = Text(${escapeForPythonString(emphasis)}, font_size=32, color=BLUE).to_edge(UP)
        graph_group_${i} = VGroup(panel_${i}, axes_${i}, curve_${i}, x_label_${i}, y_label_${i}, root_2_${i}, root_3_${i}, root_2_label_${i}, root_3_label_${i}, graph_title_${i})
        self.play(FadeIn(panel_${i}), Create(axes_${i}), Create(curve_${i}), FadeIn(x_label_${i}), FadeIn(y_label_${i}), run_time=2.5)
        self.play(FadeIn(root_2_${i}), FadeIn(root_3_${i}), Write(root_2_label_${i}), Write(root_3_label_${i}), FadeIn(graph_title_${i}), run_time=2)
        self.wait(max(0.5, ${duration.toFixed(2)} - 5.5))
        self.play(FadeOut(graph_group_${i}), run_time=1)
`;
          }

          if (pedScene.layout === 'recap') {
            const recapMath = latexLines.map((line) => `MathTex(${escapeForPythonString(line)}, font_size=40, color=YELLOW)`);
            const recapLabels = textLines.map((line) => `Text(${escapeForPythonString(line)}, font_size=18, color=GREY_B)`);
            const recapMathDirection = formatProfile.orientation === 'portrait' ? 'DOWN' : 'RIGHT';
            const recapLabelsDirection = formatProfile.orientation === 'portrait' ? 'DOWN' : 'RIGHT';
            const recapFit = formatProfile.orientation === 'portrait' ? `.scale_to_fit_height(${contentHeight})` : `.scale_to_fit_width(${contentWidth})`;
            const recapContent = `VGroup(VGroup(${recapMath.join(', ')}).arrange(${recapMathDirection}, buff=0.55), VGroup(${recapLabels.join(', ')}).arrange(${recapLabelsDirection}, buff=0.25)).arrange(DOWN, buff=0.5)${recapFit}.move_to(DOWN * ${contentY})`;
            return `
        # Storyboard pedagógico: recapitulación
        panel_${i} = RoundedRectangle(width=${panelWidth}, height=${panelHeight}, corner_radius=0.2, fill_color="#101D33", fill_opacity=1, stroke_color=BLUE, stroke_width=2)
        header_${i} = Text(${escapeForPythonString(emphasis)}, font_size=32, color=BLUE).move_to(UP * ${headerY})
        content_${i} = ${recapContent}
        content_group_${i} = VGroup(header_${i}, content_${i})
        self.play(FadeIn(panel_${i}), FadeIn(content_group_${i}), run_time=1.2)
        self.wait(max(0.5, ${duration.toFixed(2)} - 2.2))
        self.play(FadeOut(content_group_${i}), FadeOut(panel_${i}), run_time=1)
`;
          }

          if (pedScene.layout === 'card' || pedScene.layout === 'split') {
            const pairCount = Math.max(latexLines.length, textLines.length);
            const formulaFontSize = pedScene.id === 'coefficients' ? 32 : pedScene.id === 'solution-branches' ? 30 : 40;
            const captionFontSize = pedScene.id === 'coefficients' ? 16 : pedScene.id === 'solution-branches' ? 18 : 22;
            const pairObjects = Array.from({ length: pairCount }, (_, pairIndex) => {
              const formula = latexLines[pairIndex] ? `MathTex(${escapeForPythonString(latexLines[pairIndex])}, font_size=${formulaFontSize}, color=YELLOW)` : `Text("", font_size=24)`;
              const caption = textLines[pairIndex] ? `Text(${escapeForPythonString(textLines[pairIndex])}, font_size=${captionFontSize}, color=GREY_B)` : `Text("", font_size=${captionFontSize})`;
              return `VGroup(${formula}, ${caption}).arrange(DOWN, buff=0.18)`;
            });
            const arrangement = formatProfile.orientation === 'portrait' ? 'DOWN' : 'RIGHT';
            const cardFit = formatProfile.orientation === 'portrait' ? `.scale_to_fit_height(${contentHeight})` : `.scale_to_fit_width(${contentWidth})`;
            const compactGroup = `VGroup(${pairObjects.join(', ')}).arrange(${arrangement}, buff=${formatProfile.orientation === 'portrait' ? '0.35' : '0.55'})${cardFit}.move_to(DOWN * ${contentY})`;
            return `
        # Storyboard pedagógico: ${pedScene.id}
        panel_${i} = RoundedRectangle(width=${panelWidth}, height=${panelHeight}, corner_radius=0.2, fill_color="#101D33", fill_opacity=1, stroke_color=BLUE, stroke_width=2)
        header_${i} = Text(${escapeForPythonString(emphasis)}, font_size=32, color=BLUE).move_to(UP * ${headerY})
        content_${i} = ${compactGroup}
        content_group_${i} = VGroup(header_${i}, content_${i})
        self.play(FadeIn(panel_${i}), FadeIn(content_group_${i}), run_time=1.2)
        self.wait(max(0.5, ${duration.toFixed(2)} - 2.2))
        self.play(FadeOut(content_group_${i}), FadeOut(panel_${i}), run_time=1)
`;
          }

          return `
        # Storyboard pedagógico: ${pedScene.id}
        panel_${i} = RoundedRectangle(width=${panelWidth}, height=${panelHeight}, corner_radius=0.2, fill_color="#101D33", fill_opacity=1, stroke_color=BLUE, stroke_width=2)
        header_${i} = Text(${escapeForPythonString(emphasis)}, font_size=32, color=BLUE).move_to(UP * ${headerY})
        content_${i} = ${contentGroup}.scale_to_fit_height(${contentHeight}).scale(${compactScale}).move_to(DOWN * ${compactY})
        content_group_${i} = VGroup(header_${i}, content_${i})
        self.play(FadeIn(panel_${i}), FadeIn(content_group_${i}), run_time=1.2)
        self.wait(max(0.5, ${duration.toFixed(2)} - 2.2))
        self.play(FadeOut(content_group_${i}), FadeOut(panel_${i}), run_time=1)
`;
        }).join('\n')
      : '';

    const activeTimeline = timelineEnabled ? lessonTimeline : undefined;
    const timelinePedagogicalBlock = timelineEnabled && activeTimeline
      ? pedagogicalScenes.map((pedScene, i) => {
          const duration = Math.max(4, pedScene.duration ?? pedScene.estimatedDuration);
          const emphasis = pedScene.emphasis || pedScene.visualText || 'Paso matemático';
          const timelineContentHeight = pedScene.layout === 'equation'
            ? Math.min(formatProfile.orientation === 'portrait' ? 4.5 : 2.35, formatProfile.contentHeight).toFixed(2)
            : Math.min(4.0, formatProfile.contentHeight).toFixed(2);
          const segmentEvents = activeTimeline.events.filter((event) => event.segmentId === `segment-${pedScene.id}`);
          const eventGroups = segmentEvents.map((event, eventIndex) => {
            const stage = pedScene.visualStages?.[eventIndex];
            const label = event.label || stage?.label || (eventIndex === 0 ? emphasis : 'Siguiente transformación');
            const value = stage?.latex || event.to || pedScene.visualText || 'Paso matemático';
            const mathValue = stage?.latex || isMathLike(value) || /[=^\\/]/.test(value);
            const rawFormula = stage?.latex || value;
            const rendered = useLatex && mathValue
              ? `MathTex(${escapeForPythonString(rawFormula)}, font_size=${stage ? 46 : 50}, color=${eventIndex === segmentEvents.length - 1 ? 'YELLOW' : 'WHITE'})`
              : `Text(${escapeForPythonString(value)}, font_size=34, color=${eventIndex === segmentEvents.length - 1 ? 'YELLOW' : 'WHITE'})`;
            return {
              event,
              code: `VGroup(Text(${escapeForPythonString(label)}, font_size=19, color=GREY_B), ${rendered}).arrange(DOWN, buff=0.20).scale(min(1.18, ${contentWidth} / VGroup(Text(${escapeForPythonString(label)}, font_size=19, color=GREY_B), ${rendered}).arrange(DOWN, buff=0.20).width, ${timelineContentHeight} / VGroup(Text(${escapeForPythonString(label)}, font_size=19, color=GREY_B), ${rendered}).arrange(DOWN, buff=0.20).height)).move_to(DOWN * ${contentY})`,
            };
          });
          if (pedScene.layout === 'graph') {
            return `
        # Timeline pedagógico: gráfica de verificación ${pedScene.id}
        panel_${i} = RoundedRectangle(width=${panelWidth}, height=${panelHeight}, corner_radius=0.2, fill_color="#101D33", fill_opacity=1, stroke_color=BLUE, stroke_width=2)
        axes_${i} = Axes(x_range=[-1, 6, 1], y_range=[-4, 5, 1], x_length=${graphXLength}, y_length=${graphYLength}, axis_config={"include_tip": True}).shift(DOWN * 0.2)
        curve_${i} = axes_${i}.plot(lambda x: (x - 2) * (x - 3), x_range=[-0.5, 5.5], color=YELLOW)
        x_label_${i} = axes_${i}.get_x_axis_label(MathTex("x"))
        y_label_${i} = axes_${i}.get_y_axis_label(MathTex("y"))
        root_2_${i} = Dot(axes_${i}.c2p(2, 0), color=GREEN)
        root_3_${i} = Dot(axes_${i}.c2p(3, 0), color=GREEN)
        root_2_label_${i} = MathTex("x=2", font_size=26).next_to(root_2_${i}, DOWN)
        root_3_label_${i} = MathTex("x=3", font_size=26).next_to(root_3_${i}, DOWN)
        graph_title_${i} = Text(${escapeForPythonString(emphasis)}, font_size=32, color=BLUE).to_edge(UP)
        graph_group_${i} = VGroup(panel_${i}, axes_${i}, curve_${i}, x_label_${i}, y_label_${i}, root_2_${i}, root_3_${i}, root_2_label_${i}, root_3_label_${i}, graph_title_${i})
        self.play(FadeIn(panel_${i}), Create(axes_${i}), Create(curve_${i}), FadeIn(x_label_${i}), FadeIn(y_label_${i}), run_time=2.5)
        self.play(FadeIn(root_2_${i}), FadeIn(root_3_${i}), Write(root_2_label_${i}), Write(root_3_label_${i}), FadeIn(graph_title_${i}), run_time=2)
        self.wait(max(0.5, ${duration.toFixed(2)} - 5.5))
        self.play(FadeOut(graph_group_${i}), run_time=1)
`;
          }
          const eventCode = eventGroups.map((group, eventIndex) => {
            const variable = `timeline_${i}_${eventIndex}`;
            const previous = eventIndex > 0 ? `timeline_${i}_${eventIndex - 1}` : undefined;
            const transition = previous ? `FadeOut(${previous}), FadeIn(${variable})` : `FadeIn(${variable})`;
            return `        ${variable} = ${group.code}\n        self.play(${transition}, run_time=${group.event.duration.toFixed(2)})\n        self.wait(${group.event.holdAfter.toFixed(2)})`;
          }).join('\n');
          const occupied = eventGroups.reduce((sum, group) => sum + group.event.duration + group.event.holdAfter, 0);
          const lastVariable = eventGroups.length ? `timeline_${i}_${eventGroups.length - 1}` : 'None';
          return `
        # Timeline pedagógico: microeventos de ${pedScene.id}
        panel_${i} = RoundedRectangle(width=${panelWidth}, height=${panelHeight}, corner_radius=0.2, fill_color="#101D33", fill_opacity=1, stroke_color=BLUE, stroke_width=2)
        header_${i} = Text(${escapeForPythonString(emphasis)}, font_size=32, color=BLUE).move_to(UP * ${headerY})
        self.play(FadeIn(panel_${i}), FadeIn(header_${i}), run_time=0.6)
${eventCode}
        self.wait(max(0.2, ${Math.max(0.2, duration - occupied - 1.2).toFixed(2)}))
        self.play(FadeOut(${lastVariable}), FadeOut(header_${i}), FadeOut(panel_${i}), run_time=0.6)
`;
        }).join('\n')
      : '';
    const pedagogicalBlock = timelineEnabled ? timelinePedagogicalBlock : legacyPedagogicalBlock;

    const synchronizedBlock = !pedagogicalScenes.length && synchronizedScenes.length
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

    const sceneBlock = pedagogicalScenes.length
      ? pedagogicalBlock
      : synchronizedScenes.length
        ? synchronizedBlock
        : legacyBlock;

    const pythonCode = `
# -*- coding: utf-8 -*-
from manim import *

class ${className}(Scene):
    def construct(self):
        self.camera.frame_width = ${formatProfile.frameWidth}
        self.camera.frame_height = ${formatProfile.frameHeight}
        # Título científico con estilo tipo revista
        title = ${titleObject}
        title.to_edge(UP)
        self.add(title)
        self.play(Write(title), run_time=${pedagogicalScenes.length ? '0.6' : '1'})
        self.wait(${pedagogicalScenes.length ? '0.2' : `max(0.5, ${introDuration.toFixed(2)} - 2)`})
        self.play(FadeOut(title), run_time=${pedagogicalScenes.length ? '0.5' : '1'})

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
      const formatProfile = scene.formatProfile || getVideoFormatProfile('16:9', 'medium');
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
        `"${manimCommand}" --media_dir "${mediaDir}" -ql -r ${formatProfile.width},${formatProfile.height} -o ${safeName}.mp4 "${scriptPath}" ${className}`,
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
