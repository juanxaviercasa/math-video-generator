import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import type { SynchronizedScene } from './synchronization.service.js';
import type { LessonTimeline } from './timeline.types.js';
import { getVideoFormatProfile, type VideoFormatProfile } from './video-format.service.js';
import { buildAdaptiveManimHelpers, selectProblemAnchor } from './adaptive-math-layout.service.js';

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
  pedagogicalScenes?: Array<SynchronizedScene & {
    visualLatex?: string[];
    visualTextLines?: string[];
    visualStages?: Array<{ label: string; latex: string; detail?: string; role?: string; semanticStep?: string; formulaAnchorId?: string }>;
    visualCueDurations?: number[];
    visualCueHighlightOffsets?: number[];
    visualBeatOffsets?: number[];
    formulaAnchor?: { latex: string; label?: string; persistence: 'segment' | 'lesson'; position: 'top' | 'side' };
    checkpoints?: Array<{ kind: 'predict' | 'practice' | 'reflect'; prompt: string; pauseSeconds: number }>;
    graphSpec?: { a: number; b: number; c: number; roots: [number, number] };
    emphasis?: string;
    layout?: string;
  }>;
  formatProfile?: VideoFormatProfile;
  layoutDensity?: 'comfortable' | 'compact';
  narrationStyle?: 'warm_teacher' | 'neutral_teacher';
  lessonTimeline?: LessonTimeline;
  narrationTimeline?: boolean;
  geometryReportPath?: string;
  formulaFirst?: boolean;
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
    const { title, steps, synchronizedScenes = [], pedagogicalScenes = [], lessonTimeline, narrationTimeline = false } = scene;
    const timelineEnabled = narrationTimeline && Boolean(lessonTimeline) && pedagogicalScenes.length > 0;
    const formatProfile = scene.formatProfile || getVideoFormatProfile('16:9', 'medium');
    const problemAnchor = pedagogicalScenes.length ? selectProblemAnchor({ content: scene.content, pedagogicalScenes }) : null;
    const adaptiveHelpers = buildAdaptiveManimHelpers(formatProfile);
    const verifyGraphSpec = (spec: { a: number; b: number; c: number; roots: [number, number] }): void => {
      const values = [spec.a, spec.b, spec.c, ...spec.roots];
      if (!values.every(Number.isFinite) || spec.a === 0) {
        throw new Error('GRAPH_SPEC_INVALID: La gráfica requiere coeficientes y raíces reales finitos.');
      }
      for (const root of spec.roots) {
        const residual = spec.a * root * root + spec.b * root + spec.c;
        const scale = Math.max(1, Math.abs(spec.a * root * root), Math.abs(spec.b * root), Math.abs(spec.c));
        if (Math.abs(residual) > 1e-8 * scale) {
          throw new Error('GRAPH_SPEC_INVALID: Una raíz suministrada no satisface la ecuación.');
        }
      }
    };
    const rootLabel = (value: number): string => {
      const rounded = Number(value.toFixed(3));
      const relation = Math.abs(value - rounded) <= 1e-9 ? '=' : '\\approx';
      return `x${relation}${rounded}`;
    };
    const formatNum = (value: number): string => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
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

    // Never draw a demonstration graph for an arbitrary user equation.
    // Verified quadratic plots must be supplied via pedagogicalScenes.graphSpec.
    const graphBlock = '';

    const introDuration = pedagogicalScenes.length
      ? 1.8
      : Math.max(3, synchronizedScenes[0]?.duration ?? synchronizedScenes[0]?.estimatedDuration ?? 4);
    const legacyPedagogicalBlock = pedagogicalScenes.length
      ? pedagogicalScenes.map((pedScene, i) => {
          const duration = Math.max(4, pedScene.duration ?? pedScene.estimatedDuration);
          const emphasis = pedScene.emphasis || pedScene.visualText || 'Paso matemático';
          const latexLines = pedScene.visualLatex || [];
          const textLines = scene.formulaFirst ? [] : (pedScene.visualTextLines || []);
          const mathObjects = latexLines.map((line, lineIndex) =>
            `self._math(${escapeForPythonString(line)}, font_size=${lineIndex === 0 ? 46 : 38}, color=${lineIndex === latexLines.length - 1 ? 'YELLOW' : 'WHITE'}, role="math-other")`
          );
          const textObjects = textLines.map((line) =>
            `Text(${escapeForPythonString(line)}, font_size=26, color=GREY_B)`
          );
          const allObjects = [...mathObjects, ...textObjects];
          const contentGroup = allObjects.length
            ? `VGroup(${allObjects.join(', ')}).arrange(DOWN, buff=0.24)`
            : `Text(${escapeForPythonString(emphasis)}, font_size=42, color=WHITE)`;
          // A portrait video has much more vertical real estate than a 16:9
          // slide. Use it for legible mathematics instead of a tiny center strip.
          const visualStages = pedScene.visualStages || [];
          const wordBeats = pedScene.visualBeatOffsets || [];

          if (pedScene.layout === 'equation' && visualStages.length > 0) {
            const stageLabelSize = scene.formulaFirst ? 18 : 23;
            const stageObjects = visualStages.map((stage, stageIndex) => {
              const formulaFontSize = stageIndex === visualStages.length - 1 ? 61 : 55;
              const label = `Text(${escapeForPythonString(stage.label)}, font_size=${stageLabelSize}, color=${stageIndex === visualStages.length - 1 ? 'YELLOW' : 'GREY_B'})`;
              const formula = `self._math(${escapeForPythonString(stage.latex)}, font_size=${formulaFontSize}, color=${stageIndex === visualStages.length - 1 ? 'YELLOW' : 'WHITE'})`;
              const detail = !scene.formulaFirst && stage.detail ? `, Text(${escapeForPythonString(stage.detail)}, font_size=21, color=GREY_B)` : '';
              return `VGroup(${label}, ${formula}${detail}).arrange(DOWN, buff=0.10)`;
            });
            const stageArrangement = `VGroup(${stageObjects.join(', ')})`;
            const cueDurations = pedScene.visualCueDurations;
            const cueLocked = cueDurations?.length === visualStages.length
              && cueDurations.every((seconds) => Number.isFinite(seconds) && seconds >= 0.8);
            const wordLocked = !cueLocked && wordBeats.length === visualStages.length;
            const wordAnimation = wordLocked ? `        self.play(FadeIn(panel_${i}), FadeIn(header_${i}), run_time=0.32)
        for step_index in range(len(content_${i])):
            self._wait_spoken_beat(step_index, ${JSON.stringify(wordBeats)}[step_index])
            self._animate_equation_step(content_${i}, step_index, focus_${i}, run_time=0.22)
            self._focus_math(content_${i}[step_index][1], run_time=0.24)
        self._finish_spoken_scene(${duration.toFixed(2)}, 0.35)
        if focus_${i}:
            self.play(FadeOut(content_${i}[-1]), FadeOut(header_${i}), FadeOut(panel_${i}), run_time=0.35)
        else:
            self.play(FadeOut(content_group_${i}), FadeOut(panel_${i}), run_time=0.35)` : null;
            const cueAnimation = cueLocked
              ? `        self.play(FadeIn(panel_${i}), FadeIn(header_${i}), run_time=0.4)
${cueDurations.map((seconds, index) => {
                const stageRef = `content_${i}[${index}]`;
                // Offset comes from Edge TTS WordBoundary metadata where available.
                const requestedOffset = pedScene.visualCueHighlightOffsets?.[index] ?? 0.25;
                const highlightAt = Math.max(0.25, Math.min(requestedOffset, seconds - 0.30));
                const waitBefore = highlightAt > 0.255 ? `        self.wait(${(highlightAt - 0.25).toFixed(3)})\n` : '';
                return `        # Voz neural y resaltado del mismo micro-paso ${index + 1}
        self._animate_equation_step(content_${i}, ${index}, focus_${i}, run_time=0.25)
${waitBefore}        self.play(Indicate(${stageRef}[1], color=YELLOW, scale_factor=1.04), run_time=0.25)
        self.wait(${Math.max(0.05, seconds - highlightAt - 0.25).toFixed(3)})`;
              }).join('\n')}
        if focus_${i}:
            self.play(FadeOut(content_${i}[-1]), FadeOut(header_${i}), FadeOut(panel_${i}), run_time=0.3)
        else:
            self.play(FadeOut(content_group_${i}), FadeOut(panel_${i}), run_time=0.3)`
              : wordAnimation || `        self.play(FadeIn(panel_${i}), FadeIn(header_${i}), run_time=0.4)
        # Split available scene time across verified steps; no long static pause.
        stage_slot_${i} = (${duration.toFixed(2)} - 0.8) / max(len(content_${i}), 1)
        for step_index in range(len(content_${i})):
            self._animate_equation_step(content_${i}, step_index, focus_${i}, run_time=0.25)
            self._focus_math(content_${i}[step_index][1], run_time=0.30)
            self.wait(max(0.05, stage_slot_${i} - 0.55))
        if focus_${i}:
            self.play(FadeOut(content_${i}[-1]), FadeOut(header_${i}), FadeOut(panel_${i}), run_time=0.4)
        else:
            self.play(FadeOut(content_group_${i}), FadeOut(panel_${i}), run_time=0.4)`;
            return `
        # Storyboard pedagógico: micro-pasos de ${pedScene.id}
        panel_${i} = RoundedRectangle(width=${panelWidth}, height=${panelHeight}, corner_radius=0.2, fill_color="#101D33", fill_opacity=1, stroke_color=BLUE, stroke_width=2)
        header_${i} = self._place_heading(Text(${escapeForPythonString(emphasis)}, font_size=34, color=BLUE))
        content_${i} = ${stageArrangement}
        focus_${i} = self._arrange_equation_stages(content_${i})
        content_group_${i} = VGroup(header_${i}, content_${i})
${cueAnimation}
`;
          }

          if (pedScene.layout === 'graph') {
            const graphSpec = pedScene.graphSpec;
            if (!graphSpec) throw new Error('GRAPH_SPEC_MISSING: No se puede dibujar una parábola sin coeficientes validados.');
            verifyGraphSpec(graphSpec);
            const [rootA, rootB] = graphSpec.roots;
            const repeatedRoot = Math.abs(rootA - rootB) < 1e-8;
            const vertexX = -graphSpec.b / (2 * graphSpec.a);
            const vertexY = graphSpec.a * vertexX * vertexX + graphSpec.b * vertexX + graphSpec.c;
            const left = Math.min(rootA, rootB, vertexX) - 1.5;
            const right = Math.max(rootA, rootB, vertexX) + 1.5;
            const yAt = (x: number) => graphSpec.a * x * x + graphSpec.b * x + graphSpec.c;
            const ymin = Math.floor(Math.min(yAt(left), yAt(right), yAt(vertexX), 0) - 1);
            const ymax = Math.ceil(Math.max(yAt(left), yAt(right), yAt(vertexX), 0) + 1);
            const vertexLabelStr = `V(${formatNum(vertexX)}, ${formatNum(vertexY)})`;
            const axisLabelStr = `x = ${formatNum(vertexX)}`;
            const concavityStr = graphSpec.a > 0 ? 'a > 0: cóncava hacia arriba' : 'a < 0: cóncava hacia abajo';
            const smallerRoot = Math.min(rootA, rootB);
            const rootPosA = graphSpec.a > 0
              ? (repeatedRoot ? 'UP' : (rootA === smallerRoot ? 'UP + LEFT * 0.25' : 'UP + RIGHT * 0.25'))
              : (repeatedRoot ? 'DOWN' : (rootA === smallerRoot ? 'DOWN + LEFT * 0.25' : 'DOWN + RIGHT * 0.25'));
            const rootPosB = graphSpec.a > 0
              ? (rootB === smallerRoot ? 'UP + LEFT * 0.25' : 'UP + RIGHT * 0.25')
              : (rootB === smallerRoot ? 'DOWN + LEFT * 0.25' : 'DOWN + RIGHT * 0.25');
            const vertexPos = graphSpec.a > 0 ? 'DOWN' : 'UP';
            return `
        # Storyboard pedagógico: gráfica a pantalla completa
        panel_${i} = RoundedRectangle(width=${panelWidth}, height=${panelHeight}, corner_radius=0.2, fill_color="#101D33", fill_opacity=1, stroke_color=BLUE, stroke_width=2)
        axes_${i} = Axes(x_range=[${left}, ${right}, 1], y_range=[${ymin}, ${ymax}, 1], x_length=${graphXLength}, y_length=${graphYLength}, axis_config={"include_tip": True}).move_to(UP * self._work_bounds()["center_y"])
        curve_${i} = axes_${i}.plot(lambda x: ${graphSpec.a} * x**2 + (${graphSpec.b}) * x + (${graphSpec.c}), x_range=[${left}, ${right}], color=YELLOW)
        x_label_${i} = axes_${i}.get_x_axis_label(MathTex("x", font_size=${formatProfile.orientation === 'square' ? 62 : 50}))
        y_label_${i} = axes_${i}.get_y_axis_label(MathTex("y", font_size=50))
        axis_line_${i} = DashedLine(axes_${i}.c2p(${vertexX}, ${ymin}), axes_${i}.c2p(${vertexX}, ${ymax}), dash_length=0.1, color=TEAL)
        axis_lbl_${i} = MathTex(${escapeForPythonString(axisLabelStr)}, font_size=44, color=TEAL).next_to(axes_${i}.c2p(${vertexX}, ${ymax}), UP, buff=0.1)
        vertex_pt_${i} = Dot(axes_${i}.c2p(${vertexX}, ${vertexY}), color=RED)
        vertex_lbl_${i} = MathTex(${escapeForPythonString(vertexLabelStr)}, font_size=44, color=RED).next_to(vertex_pt_${i}, ${vertexPos}, buff=0.18)
        root_2_${i} = Dot(axes_${i}.c2p(${rootA}, 0), color=GREEN)
        ${repeatedRoot ? '' : `root_3_${i} = Dot(axes_${i}.c2p(${rootB}, 0), color=GREEN)`}
        root_2_label_${i} = MathTex(${escapeForPythonString(rootLabel(rootA))}, font_size=44).next_to(root_2_${i}, ${rootPosA}, buff=0.18)
        ${repeatedRoot ? '' : `root_3_label_${i} = MathTex(${escapeForPythonString(rootLabel(rootB))}, font_size=44).next_to(root_3_${i}, ${rootPosB}, buff=0.18)`}
        concavity_lbl_${i} = Text(${escapeForPythonString(concavityStr)}, font_size=22, color=YELLOW).move_to(UP * self._work_bounds()["bottom"])
        graph_title_${i} = self._place_heading(Text(${escapeForPythonString(emphasis)}, font_size=32, color=BLUE))
        self._sanitize_graph_labels(graph_title_${i}, concavity_lbl_${i}, x_label_${i}, y_label_${i}, axis_lbl_${i}, vertex_lbl_${i}, root_2_label_${i}${repeatedRoot ? '' : `, root_3_label_${i}`})
        graph_group_${i} = VGroup(panel_${i}, axes_${i}, curve_${i}, x_label_${i}, y_label_${i}, axis_line_${i}, axis_lbl_${i}, vertex_pt_${i}, vertex_lbl_${i}, root_2_${i}, ${repeatedRoot ? '' : `root_3_${i}, `}root_2_label_${i}, ${repeatedRoot ? '' : `root_3_label_${i}, `}concavity_lbl_${i}, graph_title_${i})
        self.play(FadeIn(panel_${i}), Create(axes_${i}), Create(curve_${i}), FadeIn(x_label_${i}), FadeIn(y_label_${i}), run_time=1.5)
        self.play(Create(axis_line_${i}), Write(axis_lbl_${i}), FadeIn(vertex_pt_${i}), Write(vertex_lbl_${i}), run_time=1.2)
        self.play(FadeIn(root_2_${i}), ${repeatedRoot ? '' : `FadeIn(root_3_${i}), `}Write(root_2_label_${i}), ${repeatedRoot ? '' : `Write(root_3_label_${i}), `}FadeIn(concavity_lbl_${i}), FadeIn(graph_title_${i}), run_time=1.2)
        # The narration points first to the vertex and then to each real root.
        self.play(Indicate(vertex_pt_${i}, color=RED, scale_factor=1.55), run_time=0.55)
        self.play(Indicate(root_2_${i}, color=GREEN, scale_factor=1.55), run_time=0.55)
        ${repeatedRoot ? '' : `self.play(Indicate(root_3_${i}, color=GREEN, scale_factor=1.55), run_time=0.55)`}
        self.wait(max(0.5, ${duration.toFixed(2)} - 4.3 - ${repeatedRoot ? '1.10' : '1.65'}))
        self.play(FadeOut(graph_group_${i}), run_time=0.4)
`;
          }

          if (pedScene.layout === 'recap' && latexLines.length >= 2) {
            const recapMath = latexLines.map((line) => `self._math(${escapeForPythonString(line)}, font_size=53, color=YELLOW)`);
            const recapLabels = textLines.map((line) => `Text(${escapeForPythonString(line)}, font_size=20, color=GREY_B)`);
            const pairCount = Math.max(recapMath.length, recapLabels.length);
            const pairs = Array.from({ length: pairCount }, (_, k) => {
              const m = recapMath[k] || `Text("", font_size=24)`;
              const l = recapLabels[k] || `Text("", font_size=18)`;
              return `VGroup(${l}, ${m}).arrange(DOWN, buff=0.12)`;
            });
            const recapContent = `VGroup(${pairs.join(', ')})`;
            // Final takeaway uses the last two *verified* expressions; the
            // original exercise remains independently pinned above the canvas.
            const answerLatex = latexLines[latexLines.length - 2];
            const proofLatex = latexLines[latexLines.length - 1];
            return `
        # Storyboard pedagógico: recapitulación progresiva y respuesta final permanente
        panel_${i} = RoundedRectangle(width=${panelWidth}, height=${panelHeight}, corner_radius=0.2, fill_color="#101D33", fill_opacity=1, stroke_color=BLUE, stroke_width=2)
        header_${i} = self._place_heading(Text(${escapeForPythonString(emphasis)}, font_size=34, color=BLUE))
        content_${i} = ${recapContent}
        for pair in content_${i}[:-2]:
            self._fit_recap_pair(pair)
        final_math_${i} = self._make_final_recap_formula(${escapeForPythonString(answerLatex)}, 62, GREEN)
        final_proof_${i} = self._make_final_recap_formula(${escapeForPythonString(proofLatex)}, 48, YELLOW)
        final_answer_${i} = VGroup(final_math_${i}, final_proof_${i})
        self._fit_final_recap(final_answer_${i})
        self.play(FadeIn(panel_${i}), FadeIn(header_${i}), run_time=0.4)
        earlier_${i} = len(content_${i}) - 2
        closing_hold_${i} = (min(3.0, max(1.8, ${duration.toFixed(2)} * 0.36))
                             if earlier_${i} else ${duration.toFixed(2)} - 0.85)
        if earlier_${i}:
            recap_slot_${i} = (${duration.toFixed(2)} - 0.85 - closing_hold_${i}) / earlier_${i}
            for pair in content_${i}[:-2]:
                self.play(FadeIn(pair), run_time=0.22)
                self._focus_math(pair[1], run_time=0.25)
                self.wait(max(0.05, recap_slot_${i} - 0.69))
                self.play(FadeOut(pair), run_time=0.22)
        self.play(FadeIn(final_answer_${i}), run_time=0.45)
        self.wait(max(0.10, closing_hold_${i}))
        # No FadeOut: retain the problem, the solution and its validation until the last frame.
`;
          }

          if (pedScene.layout === 'card' || pedScene.layout === 'split') {
            const pairCount = Math.max(latexLines.length, textLines.length);
            const formulaFontSize = pedScene.id === 'verification' ? 45 : 56;
            const captionFontSize = 25;
            const pairObjects = Array.from({ length: pairCount }, (_, pairIndex) => {
              const formula = latexLines[pairIndex] ? `self._math(${escapeForPythonString(latexLines[pairIndex])}, font_size=${formulaFontSize}, color=YELLOW)` : `Text("", font_size=24)`;
              // Verification captions contain mathematics: keep indices as TeX,
              // not literal underscores in a Pango Text label.
              const mathCaption = textLines[pairIndex]?.match(/^Para (x_[12]) = (.+?): 0 = 0$/);
              const caption = mathCaption
                ? `self._math(${escapeForPythonString(`${mathCaption[1]} = ${mathCaption[2]} \\Rightarrow 0 = 0`)}, font_size=${captionFontSize + 4}, color=GREY_B, role="math-caption")`
                : textLines[pairIndex]
                  ? `Text(${escapeForPythonString(textLines[pairIndex])}, font_size=${captionFontSize}, color=GREY_B)`
                  : `Text("", font_size=${captionFontSize})`;
              return (textLines[pairIndex] || !latexLines[pairIndex]) ? `VGroup(${formula}, ${caption}).arrange(DOWN, buff=0.18)` : `VGroup(${formula})`;
            });
            const wordCardAnimation = wordBeats.length === pairCount ? `
        # Each coefficient/proof appears exactly when the corresponding phrase is spoken.
        self.play(FadeIn(panel_${i}), FadeIn(header_${i}), run_time=0.32)
        for pair_index, pair in enumerate(content_${i}):
            self._wait_spoken_beat(pair_index, ${JSON.stringify(wordBeats)}[pair_index])
            self.play(FadeIn(pair), run_time=0.18)
            self._focus_math(pair[0], run_time=0.20)
            if focus_${i}:
                self.play(FadeOut(pair), run_time=0.16)
        self._finish_spoken_scene(${duration.toFixed(2)}, 0.35)
        if focus_${i}:
            self.play(FadeOut(header_${i}), FadeOut(panel_${i}), run_time=0.35)
        else:
            self.play(FadeOut(content_group_${i}), FadeOut(panel_${i}), run_time=0.35)` : null;
            const arrangement = 'DOWN';
            const compactGroup = `VGroup(${pairObjects.join(', ')}).arrange(${arrangement}, buff=${arrangement === 'DOWN' ? '0.35' : (formatProfile.orientation === 'portrait' ? '0.35' : '0.55')})`;
            return `
        # Storyboard pedagógico: ${pedScene.id}
        panel_${i} = RoundedRectangle(width=${panelWidth}, height=${panelHeight}, corner_radius=0.2, fill_color="#101D33", fill_opacity=1, stroke_color=BLUE, stroke_width=2)
        header_${i} = self._place_heading(Text(${escapeForPythonString(emphasis)}, font_size=34, color=BLUE))
        content_${i} = ${compactGroup}
        focus_${i} = self._arrange_card_pairs(content_${i})
        content_group_${i} = VGroup(header_${i}, content_${i})
${wordCardAnimation || `        # Reveal each coefficient or substitution when the explanation reaches it.
        self.play(FadeIn(panel_${i}), FadeIn(header_${i}), run_time=0.4)
        card_slot_${i} = (${duration.toFixed(2)} - 0.8) / max(len(content_${i}), 1)
        for pair in content_${i}:
            self.play(FadeIn(pair), run_time=0.20)
            self._focus_math(pair[0], run_time=0.30)
            self.wait(max(0.05, card_slot_${i} - (0.70 if focus_${i} else 0.50)))
            if focus_${i}:
                self.play(FadeOut(pair), run_time=0.20)
        if focus_${i}:
            self.play(FadeOut(header_${i}), FadeOut(panel_${i}), run_time=0.4)
        else:
            self.play(FadeOut(content_group_${i}), FadeOut(panel_${i}), run_time=0.4)`}
`;
          }

          return `
        # Storyboard pedagógico: ${pedScene.id}
        panel_${i} = RoundedRectangle(width=${panelWidth}, height=${panelHeight}, corner_radius=0.2, fill_color="#101D33", fill_opacity=1, stroke_color=BLUE, stroke_width=2)
        header_${i} = self._place_heading(Text(${escapeForPythonString(emphasis)}, font_size=34, color=BLUE))
        content_${i} = ${contentGroup}
        self._fit_fallback_group(content_${i})
        content_group_${i} = VGroup(header_${i}, content_${i})
        self.play(FadeIn(panel_${i}), FadeIn(header_${i}), run_time=0.4)
        self.play(FadeIn(content_${i}), run_time=0.6)
        # Two non-destructive spotlights make the introduction follow the voice.
        self._focus_math(content_${i}[0] if isinstance(content_${i}, VGroup) else content_${i}, run_time=0.55)
        self.wait(max(0.05, (${duration.toFixed(2)} - 2.70) / 2))
        self._focus_math(content_${i}[-1] if isinstance(content_${i}, VGroup) else content_${i}, run_time=0.55)
        self.wait(max(0.05, (${duration.toFixed(2)} - 2.70) / 2))
        self.play(FadeOut(content_group_${i}), FadeOut(panel_${i}), run_time=0.6)
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
          const formulaAnchor = pedScene.formulaAnchor;
          const anchorY = Math.max(Number(contentY) + 1.1, Number(headerY) - 0.75).toFixed(2);
          const referenceAnchorCode = formulaAnchor?.latex
            ? `
        reference_${i} = MathTex(${escapeForPythonString(formulaAnchor.latex)}, font_size=30, color=GREY_B)
        reference_${i}.scale(min(0.78, ${contentWidth} / reference_${i}.width, 0.62 / reference_${i}.height))
        reference_${i}.move_to(UP * ${anchorY})
        self.play(FadeIn(reference_${i}), run_time=0.45)
`
            : '';
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
            const graphSpec = pedScene.graphSpec;
            if (!graphSpec) throw new Error('GRAPH_SPEC_MISSING: Falta el modelo matemático validado para la gráfica.');
            verifyGraphSpec(graphSpec);
            const [rootA, rootB] = graphSpec.roots;
            const repeatedRoot = Math.abs(rootA - rootB) < 1e-8;
            const vertexX = graphSpec.a === 0 ? 0 : -graphSpec.b / (2 * graphSpec.a);
            const sampleLeft = Math.min(rootA, rootB, vertexX) - 1;
            const sampleRight = Math.max(rootA, rootB, vertexX) + 1;
            const evaluate = (x: number) => graphSpec.a * x * x + graphSpec.b * x + graphSpec.c;
            const sampleValues = [evaluate(sampleLeft), evaluate(sampleRight), evaluate(vertexX), 0];
            const graphYMin = Math.floor(Math.min(...sampleValues) - 2);
            const graphYMax = Math.ceil(Math.max(...sampleValues) + 2);
            const graphYStep = Math.max(1, Math.ceil((graphYMax - graphYMin) / 8));
            const graphXStep = Math.max(1, Math.ceil((sampleRight - sampleLeft) / 8));
            const curveStart = (sampleLeft - 0.3).toFixed(2);
            const curveEnd = (sampleRight + 0.3).toFixed(2);
            const vertexY = graphSpec.a * vertexX * vertexX + graphSpec.b * vertexX + graphSpec.c;
            const vertexLabelStr = `V(${formatNum(vertexX)}, ${formatNum(vertexY)})`;
            const axisLabelStr = `x = ${formatNum(vertexX)}`;
            const concavityStr = graphSpec.a > 0 ? 'a > 0: cóncava hacia arriba' : 'a < 0: cóncava hacia abajo';
            const smallerRoot = Math.min(rootA, rootB);
            const rootPosA = graphSpec.a > 0
              ? (repeatedRoot ? 'UP' : (rootA === smallerRoot ? 'UP + LEFT * 0.25' : 'UP + RIGHT * 0.25'))
              : (repeatedRoot ? 'DOWN' : (rootA === smallerRoot ? 'DOWN + LEFT * 0.25' : 'DOWN + RIGHT * 0.25'));
            const rootPosB = graphSpec.a > 0
              ? (rootB === smallerRoot ? 'UP + LEFT * 0.25' : 'UP + RIGHT * 0.25')
              : (rootB === smallerRoot ? 'DOWN + LEFT * 0.25' : 'DOWN + RIGHT * 0.25');
            const vertexPos = graphSpec.a > 0 ? 'DOWN' : 'UP';
            return `
        # Timeline pedagógico: gráfica de verificación ${pedScene.id}
        panel_${i} = RoundedRectangle(width=${panelWidth}, height=${panelHeight}, corner_radius=0.2, fill_color="#101D33", fill_opacity=1, stroke_color=BLUE, stroke_width=2)
        axes_${i} = Axes(x_range=[${sampleLeft.toFixed(2)}, ${sampleRight.toFixed(2)}, ${graphXStep}], y_range=[${graphYMin}, ${graphYMax}, ${graphYStep}], x_length=${graphXLength}, y_length=${graphYLength}, axis_config={"include_tip": True}).move_to(UP * self._work_bounds()["center_y"])
        curve_${i} = axes_${i}.plot(lambda x: ${graphSpec.a} * x**2 + ${graphSpec.b} * x + ${graphSpec.c}, x_range=[${curveStart}, ${curveEnd}], color=YELLOW)
        x_label_${i} = axes_${i}.get_x_axis_label(MathTex("x", font_size=50))
        y_label_${i} = axes_${i}.get_y_axis_label(MathTex("y", font_size=50))
        axis_line_${i} = DashedLine(axes_${i}.c2p(${vertexX}, ${graphYMin}), axes_${i}.c2p(${vertexX}, ${graphYMax}), dash_length=0.1, color=TEAL)
        axis_lbl_${i} = MathTex(${escapeForPythonString(axisLabelStr)}, font_size=44, color=TEAL).next_to(axes_${i}.c2p(${vertexX}, ${graphYMax}), UP, buff=0.1)
        vertex_pt_${i} = Dot(axes_${i}.c2p(${vertexX}, ${vertexY}), color=RED)
        vertex_lbl_${i} = MathTex(${escapeForPythonString(vertexLabelStr)}, font_size=44, color=RED).next_to(vertex_pt_${i}, ${vertexPos}, buff=0.18)
        root_a_${i} = Dot(axes_${i}.c2p(${rootA}, 0), color=GREEN)
        ${repeatedRoot ? '' : `root_b_${i} = Dot(axes_${i}.c2p(${rootB}, 0), color=GREEN)`}
        root_a_label_${i} = MathTex(${escapeForPythonString(rootLabel(rootA))}, font_size=44).next_to(root_a_${i}, ${rootPosA}, buff=0.18)
        ${repeatedRoot ? '' : `root_b_label_${i} = MathTex(${escapeForPythonString(rootLabel(rootB))}, font_size=44).next_to(root_b_${i}, ${rootPosB}, buff=0.18)`}
        concavity_lbl_${i} = Text(${escapeForPythonString(concavityStr)}, font_size=22, color=YELLOW).to_edge(DOWN, buff=${(formatProfile.safeMargin + 0.12).toFixed(3)})
        graph_title_${i} = self._place_heading(Text(${escapeForPythonString(emphasis)}, font_size=32, color=BLUE))
        self._sanitize_graph_labels(graph_title_${i}, concavity_lbl_${i}, x_label_${i}, y_label_${i}, axis_lbl_${i}, vertex_lbl_${i}, root_a_label_${i}${repeatedRoot ? '' : `, root_b_label_${i}`})
        graph_group_${i} = VGroup(panel_${i}, axes_${i}, curve_${i}, x_label_${i}, y_label_${i}, axis_line_${i}, axis_lbl_${i}, vertex_pt_${i}, vertex_lbl_${i}, root_a_${i}, ${repeatedRoot ? '' : `root_b_${i}, `}root_a_label_${i}, ${repeatedRoot ? '' : `root_b_label_${i}, `}concavity_lbl_${i}, graph_title_${i})
        self.play(FadeIn(panel_${i}), Create(axes_${i}), Create(curve_${i}), FadeIn(x_label_${i}), FadeIn(y_label_${i}), run_time=1.5)
        self.play(Create(axis_line_${i}), Write(axis_lbl_${i}), FadeIn(vertex_pt_${i}), Write(vertex_lbl_${i}), run_time=1.2)
        self.play(FadeIn(root_a_${i}), ${repeatedRoot ? '' : `FadeIn(root_b_${i}), `}Write(root_a_label_${i}), ${repeatedRoot ? '' : `Write(root_b_label_${i}), `}FadeIn(concavity_lbl_${i}), FadeIn(graph_title_${i}), run_time=1.2)
        self.wait(max(0.5, ${duration.toFixed(2)} - 4.3))
        self.play(FadeOut(graph_group_${i}), run_time=0.4)
`;
          }
          const checkpoint = pedScene.checkpoints?.[0];
          const checkpointCode = checkpoint
            ? `
        checkpoint_${i} = Text(${escapeForPythonString(checkpoint.prompt)}, font_size=24, color=YELLOW)
        checkpoint_${i}.scale(min(0.82, ${contentWidth} / checkpoint_${i}.width, 0.5 / checkpoint_${i}.height))
        checkpoint_${i}.to_edge(DOWN, buff=0.42)
        self.play(FadeIn(checkpoint_${i}), run_time=0.35)
        self.wait(${Math.max(0.5, Number(checkpoint.pauseSeconds)).toFixed(2)})
        self.play(FadeOut(checkpoint_${i}), run_time=0.35)
`
            : '';
          const eventCode = eventGroups.map((group, eventIndex) => {
            const variable = `timeline_${i}_${eventIndex}`;
            const previous = eventIndex > 0 ? `timeline_${i}_${eventIndex - 1}` : undefined;
            const transitionDuration = Math.max(0.18, group.event.duration / 2);
            const transition = previous
              ? `self.play(FadeOut(${previous}), run_time=${transitionDuration.toFixed(2)})\n        self.play(FadeIn(${variable}), run_time=${transitionDuration.toFixed(2)})`
              : `self.play(FadeIn(${variable}), run_time=${group.event.duration.toFixed(2)})`;
            const checkpointAfterEvent = checkpoint && eventIndex === 0 ? checkpointCode : '';
            const holdAfter = Math.max(0.2, group.event.holdAfter - (checkpoint && eventIndex === 0 ? Number(checkpoint.pauseSeconds) : 0));
            return `        ${variable} = ${group.code}\n        ${transition}\n        self.wait(${holdAfter.toFixed(2)})${checkpointAfterEvent}`;
          }).join('\n');
          const occupied = eventGroups.reduce((sum, group) => sum + group.event.duration + group.event.holdAfter, 0);
          const lastVariable = eventGroups.length ? `timeline_${i}_${eventGroups.length - 1}` : 'None';
          return `
        # Timeline pedagógico: microeventos de ${pedScene.id}
        panel_${i} = RoundedRectangle(width=${panelWidth}, height=${panelHeight}, corner_radius=0.2, fill_color="#101D33", fill_opacity=1, stroke_color=BLUE, stroke_width=2)
        header_${i} = self._place_heading(Text(${escapeForPythonString(emphasis)}, font_size=34, color=BLUE))
        self.play(FadeIn(panel_${i}), FadeIn(header_${i}), run_time=0.6)
${referenceAnchorCode}${eventCode}
        self.wait(max(0.2, ${Math.max(0.2, duration - occupied - 1.2).toFixed(2)}))
        self.play(FadeOut(${lastVariable}), ${formulaAnchor?.latex ? `FadeOut(reference_${i}), ` : ''}FadeOut(header_${i}), FadeOut(panel_${i}), run_time=0.6)
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
            throw new Error('GRAPH_SPEC_MISSING: Una escena gráfica requiere una función validada; no se permite usar una parábola de ejemplo.');
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

    // Each human-visible pedagogical scene receives an explicit timecode.
    // This is distinct from the estimated PresentationPlan geometry.
    let stageIndex = 0;
    const sceneBlockAudited = pedagogicalScenes.length
      ? sceneBlock.replace(/^(\s*)# (?:Storyboard pedagógico|Timeline pedagógico):[^\n]*/gm, (line, indent: string) => {
          const pedScene = pedagogicalScenes[stageIndex++];
          if (!pedScene) throw new Error('GEOMETRY_STAGE_MISMATCH: sobran escenas generadas.');
          return `${indent}self._qa_start(${escapeForPythonString(pedScene.id)})\n${line}`;
        })
      : sceneBlock;
    if (pedagogicalScenes.length && stageIndex !== pedagogicalScenes.length) {
      throw new Error(`GEOMETRY_STAGE_MISMATCH: ${stageIndex}/${pedagogicalScenes.length} escenas instrumentadas.`);
    }
    const geometryReportPath = scene.geometryReportPath || path.join(scene.outputDir, `${safeName}-geometry.json`);

    const pythonCode = `
# -*- coding: utf-8 -*-
from manim import *
import json
from pathlib import Path

class ${className}(Scene):
${adaptiveHelpers}
    def _qa_now(self):
        return float(getattr(self, "time", getattr(self.renderer, "time", 0.0)))

    def _qa_start(self, stage_id):
        self._qa_finish()
        self._qa_current = {"id": stage_id, "start": self._qa_now(), "snapshots": [], "beats": []}
        self._qa_capture()

    def _wait_spoken_beat(self, index, offset_seconds):
        if self._qa_current is None:
            raise ValueError("VOICE_BEAT_WITHOUT_SCENE")
        elapsed = self._qa_now() - self._qa_current["start"]
        if elapsed > offset_seconds + 0.17:
            raise ValueError("VOICE_BEAT_LATE: animación " + str(index)
                             + " llegó " + str(round(elapsed - offset_seconds, 3)) + " s después de la palabra")
        if offset_seconds - elapsed > 0.012:
            self.wait(offset_seconds - elapsed)
        actual = self._qa_now() - self._qa_current["start"]
        self._qa_current["beats"].append({
            "index": index, "expectedSeconds": offset_seconds,
            "actualSeconds": float(actual)
        })

    def _finish_spoken_scene(self, duration, closing=0.0):
        if self._qa_current is None:
            raise ValueError("VOICE_SCENE_MISSING")
        elapsed = self._qa_now() - self._qa_current["start"]
        remainder = duration - closing - elapsed
        if remainder < -0.17:
            raise ValueError("VOICE_SCENE_OVERRUN: " + self._qa_current["id"]
                             + " se excedió " + str(round(-remainder, 3)) + " segundos")
        if remainder > 0.012:
            self.wait(remainder)

    def _qa_finish(self):
        if self._qa_current is not None:
            self._qa_capture()
            self._qa_current["end"] = self._qa_now()
            self._qa_stages.append(self._qa_current)
            self._qa_current = None

    def _qa_capture(self):
        if self._qa_current is None:
            return
        objects = []
        seen = set()
        for top in self.mobjects:
            for obj in top.get_family():
                if id(obj) in seen or not isinstance(obj, (Text, Tex, MathTex)):
                    continue
                seen.add(id(obj))
                try:
                    left = float(obj.get_left()[0])
                    right = float(obj.get_right()[0])
                    bottom = float(obj.get_bottom()[1])
                    upper = float(obj.get_top()[1])
                    if not all(map(lambda v: abs(v) < 1e7, [left, right, bottom, upper])):
                        continue
                    if right <= left or upper <= bottom:
                        continue
                    content = str(getattr(obj, "tex_string", getattr(obj, "text", "")))[:180]
                    objects.append({"kind": type(obj).__name__, "content": content, "role": getattr(obj, "qa_role", None), "bbox": {
                        "x": left, "y": bottom, "width": right - left, "height": upper - bottom}})
                except (ValueError, TypeError, AttributeError) as exc:
                    self._qa_errors.append(str(exc))
        if objects:
            self._qa_current["snapshots"].append({"time": self._qa_now(), "objects": objects})

    def play(self, *animations, **kwargs):
        result = super().play(*animations, **kwargs)
        self._qa_capture()
        return result

    def _qa_write(self):
        payload = {"version": 1, "canvas": {
            "pixelWidth": ${formatProfile.width}, "pixelHeight": ${formatProfile.height},
            "frameWidth": ${formatProfile.frameWidth}, "frameHeight": ${formatProfile.frameHeight},
            "safeMargin": ${formatProfile.safeMargin}},
            "stages": self._qa_stages, "captureErrors": self._qa_errors}
        target = Path(${escapeForPythonString(geometryReportPath)})
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    def construct(self):
        self._qa_current = None
        self._qa_stages = []
        self._qa_errors = []
        self.camera.frame_width = ${formatProfile.frameWidth}
        self.camera.frame_height = ${formatProfile.frameHeight}
        # A persistent editorial canvas prevents full-black inter-scene frames.
        editorial_background = Rectangle(
            width=${(formatProfile.frameWidth + 0.2).toFixed(3)},
            height=${(formatProfile.frameHeight + 0.2).toFixed(3)},
            fill_color="#101D33", fill_opacity=1, stroke_width=0)
        editorial_background.set_z_index(-100)
        self.add(editorial_background)
${problemAnchor ? `        self._create_problem_anchor(${escapeForPythonString(problemAnchor)})\n` : ''}        # Apertura segura: la ruta experimental evita comenzar sobre fondo negro.
${timelineEnabled ? `        opening_panel = RoundedRectangle(width=${panelWidth}, height=${panelHeight}, corner_radius=0.2, fill_color="#101D33", fill_opacity=1, stroke_color=BLUE, stroke_width=2)\n        opening_panel.set_z_index(-10)\n        self.add(opening_panel)\n` : ''}        # The storyboard already contains the introduction; a second title
        # adds unplanned seconds and shifts the narration from every scene.
${pedagogicalScenes.length ? '' : `        title = ${titleObject}
        title.to_edge(UP)
        self.add(title)
        self.play(Write(title), run_time=1)
        self.wait(max(0.5, ${introDuration.toFixed(2)} - 2))
        self.play(FadeOut(title), run_time=1)`}

        # Contenido sincronizado con la narración
${sceneBlockAudited}
        self._qa_finish()
        self._qa_write()
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
      const qualityFlag = formatProfile.height >= 2160 ? '-qk' : formatProfile.height >= 1080 ? '-qh' : formatProfile.height >= 720 ? '-qm' : '-ql';
      const { stdout, stderr } = await execAsync(
        `"${manimCommand}" --media_dir "${mediaDir}" ${qualityFlag} -r ${formatProfile.width},${formatProfile.height} --fps 30 -o ${safeName}.mp4 "${scriptPath}" ${className}`,
        { cwd: scene.outputDir, maxBuffer: 1024 * 1024 * 10, env: buildProcessEnv() }
      );

      console.log('📹 Manim output:', stdout);
      if (stderr) console.warn('⚠️  Manim warnings:', stderr);

      const geometryPath = scene.geometryReportPath || path.join(scene.outputDir, `${safeName}-geometry.json`);
      if (!fs.existsSync(geometryPath) || fs.statSync(geometryPath).size === 0) {
        throw new Error('GEOMETRY_REPORT_MISSING: Manim no entregó las medidas reales del render.');
      }
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
