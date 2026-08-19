import type { VideoFormatProfile } from './video-format.service.js';
import type { BoundingBox } from './presentation.types.js';

export interface MathDesignTokens {
  version: string;
  colors: { background: string; reference: string; active: string; result: string; muted: string; panel: string; border: string };
  typography: { title: number; header: number; stageLabel: number; reference: number; active: number; result: number; caption: number };
  spacing: { panel: number; block: number; stage: number; caption: number; row: number };
  minContrastRatio: number;
  minFormulaScale: number;
  maxDensity: number;
}

export interface PresentationCanvas {
  profile: VideoFormatProfile;
  safeArea: BoundingBox;
}

export const createMathDesignTokens = (profile: VideoFormatProfile, density: 'comfortable' | 'compact' = 'comfortable'): MathDesignTokens => {
  const compact = density === 'compact';
  const scale = profile.orientation === 'portrait' ? 0.88 : profile.orientation === 'square' ? 0.94 : 1;
  return {
    version: 'math-design-v1',
    colors: {
      background: '#050B16',
      panel: '#101D33',
      border: '#55D6FF',
      reference: '#E2E8F0',
      active: '#FFFFFF',
      result: '#FDE047',
      muted: '#CBD5E1',
    },
    typography: {
      title: Math.round(32 * scale),
      header: Math.round(28 * scale),
      stageLabel: Math.round((compact ? 14 : 16) * scale),
      reference: Math.round(28 * scale),
      active: Math.round(34 * scale),
      result: Math.round(36 * scale),
      caption: Math.round((compact ? 15 : 18) * scale),
    },
    spacing: {
      panel: compact ? 0.28 : 0.42,
      block: compact ? 0.16 : 0.28,
      stage: compact ? 0.12 : 0.22,
      caption: compact ? 0.08 : 0.14,
      row: compact ? 0.22 : 0.36,
    },
    minContrastRatio: 4.5,
    minFormulaScale: profile.orientation === 'portrait' ? 0.48 : 0.56,
    maxDensity: compact ? 0.78 : 0.68,
  };
};

export const createPresentationCanvas = (profile: VideoFormatProfile): PresentationCanvas => ({
  profile,
  safeArea: {
    x: -profile.frameWidth / 2 + profile.safeMargin,
    y: -profile.frameHeight / 2 + profile.safeMargin,
    width: profile.frameWidth - profile.safeMargin * 2,
    height: profile.frameHeight - profile.safeMargin * 2,
  },
});
