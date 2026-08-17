import React from 'react';
import katex from 'katex';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import 'katex/dist/katex.min.css';

const stageSchema = z.object({
  id: z.string(),
  label: z.string(),
  latex: z.string(),
  referenceLatex: z.string().optional(),
  detail: z.string(),
  accent: z.string(),
});

export const quadraticEditorialSchema = z.object({
  title: z.string(),
  problem: z.string(),
  stages: z.array(stageSchema).min(3),
});

type QuadraticEditorialProps = z.infer<typeof quadraticEditorialSchema>;
type Stage = z.infer<typeof stageSchema>;

const COLORS = {
  ink: '#f8fafc',
  muted: '#a8b8d4',
  panel: '#101d34',
  panelRaised: '#152746',
  line: 'rgba(148, 163, 184, 0.24)',
  canvas: '#07111f',
};

const Formula: React.FC<{ latex: string; color?: string; size?: number; align?: 'left' | 'center' }> = ({ latex, color = COLORS.ink, size = 42, align = 'center' }) => {
  const html = katex.renderToString(latex, { displayMode: true, output: 'html', throwOnError: false, strict: false });
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        color,
        fontSize: size,
        lineHeight: 1.2,
        textAlign: align,
        width: '100%',
      }}
    />
  );
};

const GraphConfirmation: React.FC<{ progress: number }> = ({ progress }) => {
  const draw = interpolate(progress, [0, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <svg width="350" height="190" viewBox="0 0 350 190" style={{ display: 'block' }}>
      <line x1="18" y1="142" x2="332" y2="142" stroke="#7285a5" strokeWidth="2" />
      <line x1="65" y1="18" x2="65" y2="174" stroke="#7285a5" strokeWidth="2" />
      <path d="M70 30 C145 250 205 250 315 30" fill="none" stroke="#fb7185" strokeWidth="5" strokeDasharray="420" strokeDashoffset={420 * (1 - draw)} strokeLinecap="round" />
      <circle cx="118" cy="142" r="8" fill="#f7c948" opacity={draw} />
      <circle cx="265" cy="142" r="8" fill="#f7c948" opacity={draw} />
      <text x="102" y="169" fill="#f8fafc" fontSize="17">x₂ = −2</text>
      <text x="246" y="169" fill="#f8fafc" fontSize="17">x₁ = 1.333</text>
    </svg>
  );
};

const ProgressRail: React.FC<{ stages: Stage[]; activeIndex: number }> = ({ stages, activeIndex }) => {
  const { width, height } = useVideoConfig();
  const compact = width < 900 || height > width * 1.2;
  return (
    <div style={{ position: 'absolute', left: compact ? 22 : 42, top: compact ? 128 : 142, bottom: compact ? 82 : 106, width: 4, background: 'rgba(148,163,184,0.22)', borderRadius: 8 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: `${((activeIndex + 1) / stages.length) * 100}%`, background: '#f7c948', borderRadius: 8 }} />
      {stages.map((stage, index) => (
        <div key={stage.id} style={{ position: 'absolute', top: `${(index / Math.max(1, stages.length - 1)) * 100}%`, left: -8, width: 20, height: 20, borderRadius: '50%', background: index <= activeIndex ? '#f7c948' : '#203452', border: `3px solid ${index === activeIndex ? '#fff1a8' : '#486080'}`, boxSizing: 'border-box' }} />
      ))}
    </div>
  );
};

const StageCard: React.FC<{ stage: Stage; index: number; frame: number; activeIndex: number }> = ({ stage, index, frame, activeIndex }) => {
  const start = index * 84;
  const local = frame - start;
  const { width, height } = useVideoConfig();
  const portrait = height > width * 1.2;
  const compact = width < 900 || portrait;
  const enter = spring({ frame: Math.max(0, local), fps: 30, config: { damping: 18, stiffness: 120, mass: 0.7 } });
  const opacity = interpolate(local, [0, 12, 78, 90], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const y = interpolate(enter, [0, 1], [28, 0], { easing: Easing.out(Easing.cubic) });
  const showPrediction = stage.id === 'substitution' && local >= 42 && local < 74;
  const graphProgress = stage.id === 'verify' ? interpolate(local, [20, 75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  const isCurrent = activeIndex === index;

  return (
    <AbsoluteFill style={{ opacity, transform: `translateY(${y}px)`, pointerEvents: isCurrent ? 'auto' : 'none' }}>
      <div style={{ position: 'absolute', left: compact ? 56 : 92, right: compact ? 42 : 74, top: portrait ? 128 : compact ? 124 : 142, bottom: compact ? 84 : 108, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: stage.accent, boxShadow: `0 0 22px ${stage.accent}` }} />
          <div style={{ color: stage.accent, fontFamily: 'Inter, Arial, sans-serif', fontSize: compact ? 16 : 23, fontWeight: 800, letterSpacing: compact ? 0.6 : 1 }}>{stage.label.toUpperCase()}</div>
        </div>
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: stage.id === 'verify' && !compact ? '1.1fr 0.9fr' : '1fr', gap: compact ? 16 : 34, alignItems: 'center', flex: 1 }}>
          <div style={{ background: COLORS.panel, border: `1px solid ${stage.accent}66`, boxShadow: '0 24px 70px rgba(0,0,0,0.28)', borderRadius: 28, padding: compact ? '20px 18px' : '34px 42px', minHeight: compact ? 190 : 250, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {stage.referenceLatex && (
              <div style={{ borderBottom: `1px solid ${COLORS.line}`, paddingBottom: 18, marginBottom: 28 }}>
                <div style={{ color: COLORS.muted, fontFamily: 'Inter, Arial, sans-serif', fontSize: compact ? 11 : 16, letterSpacing: compact ? 1.1 : 1.8, textTransform: 'uppercase', marginBottom: compact ? 5 : 10 }}>Mapa de referencia</div>
                <Formula latex={stage.referenceLatex} color="#bfdbfe" size={27} />
              </div>
            )}
            <Formula latex={stage.latex} color={stage.accent} size={stage.id === 'coefficients' ? (compact ? 31 : 47) : (compact ? 36 : 56)} />
            <div style={{ marginTop: compact ? 14 : 28, color: COLORS.muted, fontFamily: 'Inter, Arial, sans-serif', fontSize: compact ? 16 : 23, lineHeight: 1.35 }}>{stage.detail}</div>
          </div>
          {stage.id === 'verify' && (
            <div style={{ background: COLORS.panelRaised, border: '1px solid rgba(251,113,133,0.45)', borderRadius: 28, padding: compact ? '18px 12px' : '28px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#fda4af', fontFamily: 'Inter, Arial, sans-serif', fontSize: compact ? 11 : 16, textTransform: 'uppercase', letterSpacing: compact ? 1.0 : 1.6, marginBottom: compact ? 7 : 12 }}>Comprobación visual</div>
              <GraphConfirmation progress={graphProgress} />
            </div>
          )}
        </div>
      </div>
      {showPrediction && (
        <div style={{ position: 'absolute', left: compact ? 54 : 92, right: compact ? 42 : 74, bottom: compact ? 28 : 42, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: '#f7c948', color: '#15120a', fontFamily: 'Inter, Arial, sans-serif', fontSize: compact ? 12 : 19, fontWeight: 800, letterSpacing: compact ? 0.3 : 0.8, borderRadius: 999, padding: compact ? '8px 12px' : '12px 25px', boxShadow: '0 12px 35px rgba(247,201,72,0.25)' }}>PAUSA DE PREDICCIÓN · ¿Qué valores reemplazan a, b y Δ?</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const QuadraticEditorial: React.FC<QuadraticEditorialProps> = ({ title, problem, stages }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const portrait = height > width * 1.2;
  const compact = width < 900 || portrait;
  const activeIndex = Math.min(stages.length - 1, Math.floor(frame / 84));
  const titleOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.canvas, color: COLORS.ink, fontFamily: 'Inter, Arial, sans-serif', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 18%, rgba(50,90,150,0.30), transparent 32%), linear-gradient(135deg, #07111f 0%, #0b1930 48%, #07111f 100%)' }} />
      <div style={{ position: 'absolute', left: compact ? 56 : 92, right: compact ? 42 : 74, top: portrait ? 24 : 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', opacity: titleOpacity }}>
        <div>
          <div style={{ color: '#f7c948', fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2.2, marginBottom: 10 }}>Microlección · Álgebra</div>
          <div style={{ fontSize: portrait ? 20 : compact ? 24 : 31, fontWeight: 800, letterSpacing: -0.5 }}>{title}</div>
        </div>
        <div style={{ color: '#93c5fd', fontSize: portrait ? 13 : compact ? 16 : 20, fontWeight: 700, border: '1px solid rgba(147,197,253,0.4)', borderRadius: 999, padding: '10px 17px' }}>{problem}</div>
      </div>
      <ProgressRail stages={stages} activeIndex={activeIndex} />
      {stages.map((stage, index) => <StageCard key={stage.id} stage={stage} index={index} frame={frame} activeIndex={activeIndex} />)}
      <div style={{ position: 'absolute', left: compact ? 56 : 92, right: compact ? 42 : 74, bottom: compact ? 18 : 26, height: 5, borderRadius: 999, background: 'rgba(148,163,184,0.2)' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #f7c948, #fb7185)', borderRadius: 999 }} />
      </div>
    </AbsoluteFill>
  );
};
