import React from 'react';
import katex from 'katex';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import type { AnimatedDeck, AnimatedSlide } from './timelineAdapter';
import 'katex/dist/katex.min.css';

const blockSchema = z.object({
  id: z.string(),
  type: z.enum(['formula', 'text', 'badge', 'graph', 'callout', 'progress']),
  content: z.string(),
  latex: z.string().optional(),
  role: z.enum(['context', 'data', 'operation', 'result', 'verification', 'reflection']).optional(),
  position: z.enum(['top', 'center', 'side', 'bottom']),
});

export const animatedDeckSchema = z.object({
  id: z.string(),
  problem: z.string(),
  format: z.enum(['16:9', '1:1', '9:16']),
  narrationStyle: z.enum(['warm_teacher', 'neutral_teacher']),
  slides: z.array(z.object({
    id: z.string(),
    index: z.number(),
    kind: z.string(),
    title: z.string(),
    objective: z.string().optional(),
    durationSeconds: z.number(),
    narrationSegmentId: z.string(),
    formulaAnchorIds: z.array(z.string()),
    visualBlocks: z.array(blockSchema),
    cues: z.array(z.object({ id: z.string(), kind: z.string(), targetId: z.string(), startSeconds: z.number(), durationSeconds: z.number(), from: z.string().optional(), to: z.string().optional(), narrationEventId: z.string().optional() })),
    checkpointId: z.string().optional(),
    transition: z.enum(['cut', 'crossfade', 'push', 'morph']),
  })),
  sourceTimelineId: z.string(),
  totalDurationSeconds: z.number(),
});

export type TimelineEditorialProps = { deck: AnimatedDeck };

const COLORS = {
  ink: '#f8fafc',
  muted: '#a8b8d4',
  panel: '#101d34',
  panelRaised: '#152746',
  canvas: '#07111f',
  gold: '#f7c948',
  blue: '#93c5fd',
  green: '#6ee7b7',
  rose: '#fb7185',
};

const accentFor = (slide: AnimatedSlide) => slide.kind === 'verification' || slide.kind === 'graph' ? COLORS.rose : slide.kind === 'checkpoint' ? COLORS.gold : slide.kind === 'summary' ? '#c4b5fd' : COLORS.blue;

const Formula: React.FC<{ latex: string; color?: string; size?: number }> = ({ latex, color = COLORS.ink, size = 48 }) => {
  const html = katex.renderToString(latex || '\\text{Paso}', { displayMode: true, output: 'html', throwOnError: false, strict: false });
  return <div dangerouslySetInnerHTML={{ __html: html }} style={{ color, fontSize: size, lineHeight: 1.15, textAlign: 'center', width: '100%' }} />;
};

const isLatexLike = (block: AnimatedSlide['visualBlocks'][number]) => Boolean(block.latex) || block.type === 'formula';

const GraphPlaceholder: React.FC<{ progress: number; content: string }> = ({ progress, content }) => (
  <div style={{ width: '100%', minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `1px solid ${COLORS.rose}77`, borderRadius: 22, background: COLORS.panelRaised }}>
    <svg width="80%" height="170" viewBox="0 0 360 170" preserveAspectRatio="xMidYMid meet">
      <line x1="25" y1="135" x2="335" y2="135" stroke="#7285a5" strokeWidth="2" />
      <line x1="55" y1="20" x2="55" y2="150" stroke="#7285a5" strokeWidth="2" />
      <path d="M65 30 C135 230 225 230 320 30" fill="none" stroke={COLORS.rose} strokeWidth="5" strokeDasharray="430" strokeDashoffset={430 * (1 - progress)} strokeLinecap="round" />
    </svg>
    <div style={{ color: COLORS.muted, fontSize: 17, textAlign: 'center' }}>{content}</div>
  </div>
);

const Slide: React.FC<{ slide: AnimatedSlide; startFrame: number; frame: number; active: boolean }> = ({ slide, startFrame, frame, active }) => {
  const { width, height } = useVideoConfig();
  const localFrame = frame - startFrame;
  const durationFrames = Math.max(30, Math.round(slide.durationSeconds * 30));
  const portrait = height > width * 1.2;
  const compact = width < 900 || portrait;
  const accent = accentFor(slide);
  const enter = spring({ frame: Math.max(0, localFrame), fps: 30, config: { damping: 18, stiffness: 120, mass: 0.7 } });
  const opacity = interpolate(localFrame, [0, 12, Math.max(13, durationFrames - 12), durationFrames], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const y = interpolate(enter, [0, 1], [24, 0], { easing: Easing.out(Easing.cubic) });
  const graphBlock = slide.visualBlocks.find((block) => block.type === 'graph');
  const primary = slide.visualBlocks.find((block) => block.position === 'center' && (block.type === 'formula' || block.type === 'graph'));
  const reference = slide.visualBlocks.find((block) => block.position === 'top' || block.position === 'side');
  const detail = slide.visualBlocks.find((block) => block.type === 'text' || block.type === 'callout');
  const checkpoint = Boolean(slide.checkpointId) && localFrame > Math.round(durationFrames * 0.42) && localFrame < Math.round(durationFrames * 0.82);
  const graphProgress = interpolate(localFrame, [Math.round(durationFrames * 0.15), Math.round(durationFrames * 0.75)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return <AbsoluteFill style={{ opacity: active ? opacity : 0, transform: `translateY(${y}px)`, pointerEvents: active ? 'auto' : 'none' }}>
    <div style={{ position: 'absolute', left: compact ? 54 : 92, right: compact ? 36 : 74, top: compact ? 112 : 132, bottom: compact ? 70 : 92, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: accent, boxShadow: `0 0 20px ${accent}` }} />
        <div style={{ color: accent, fontSize: compact ? 15 : 22, fontWeight: 800, letterSpacing: 1 }}>{slide.title.toUpperCase()}</div>
      </div>
      <div style={{ marginTop: 20, flex: 1, display: 'grid', gridTemplateColumns: graphBlock && !compact ? '1.05fr 0.95fr' : '1fr', gap: compact ? 14 : 28, alignItems: portrait ? 'stretch' : 'center' }}>
        <div style={{ background: COLORS.panel, border: `1px solid ${accent}66`, boxShadow: '0 24px 70px rgba(0,0,0,0.28)', borderRadius: 26, padding: compact ? '18px 16px' : '32px 38px', minHeight: portrait ? 420 : compact ? 200 : 260, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {reference && <div style={{ borderBottom: `1px solid rgba(148,163,184,0.24)`, paddingBottom: 14, marginBottom: 20 }}>
            <div style={{ color: COLORS.muted, fontSize: compact ? 11 : 15, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Mapa de referencia</div>
            {isLatexLike(reference) ? <Formula latex={reference.latex || reference.content} color={COLORS.blue} size={compact ? 24 : 30} /> : <div style={{ color: COLORS.blue, fontSize: compact ? 16 : 22 }}>{reference.content}</div>}
          </div>}
          {primary && primary.type !== 'graph' && <Formula latex={primary.latex || primary.content} color={accent} size={compact ? 34 : 54} />}
          {primary && primary.type === 'graph' && <div style={{ color: accent, fontSize: compact ? 26 : 40, fontWeight: 800, textAlign: 'center' }}>{primary.content}</div>}
          {detail && <div style={{ marginTop: compact ? 14 : 24, color: COLORS.muted, fontSize: compact ? 15 : 22, lineHeight: 1.35, textAlign: 'center' }}>{detail.content}</div>}
        </div>
        {graphBlock && <GraphPlaceholder progress={graphProgress} content={graphBlock.content} />}
      </div>
    </div>
    {checkpoint && <div style={{ position: 'absolute', left: compact ? 48 : 84, right: compact ? 34 : 72, bottom: compact ? 24 : 34, display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: COLORS.gold, color: '#15120a', borderRadius: 999, padding: compact ? '8px 12px' : '12px 24px', fontSize: compact ? 12 : 18, fontWeight: 800, textAlign: 'center' }}>PAUSA ACTIVA · Predice el siguiente paso</div>
    </div>}
  </AbsoluteFill>;
};

export const TimelineEditorial: React.FC<TimelineEditorialProps> = ({ deck }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const compact = width < 900 || height > width * 1.2;
  const starts = deck.slides.map((_, index) => deck.slides.slice(0, index).reduce((sum, slide) => sum + Math.max(30, Math.round(slide.durationSeconds * 30)), 0));
  const activeIndex = Math.max(0, starts.findIndex((start, index) => frame < start + Math.max(30, Math.round(deck.slides[index].durationSeconds * 30))) === -1 ? deck.slides.length - 1 : starts.findIndex((start, index) => frame < start + Math.max(30, Math.round(deck.slides[index].durationSeconds * 30))));
  const progress = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return <AbsoluteFill style={{ background: `radial-gradient(circle at 80% 18%, rgba(50,90,150,0.30), transparent 32%), linear-gradient(135deg, ${COLORS.canvas} 0%, #0b1930 48%, ${COLORS.canvas} 100%)`, color: COLORS.ink, fontFamily: 'Inter, Arial, sans-serif', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: compact ? 54 : 92, right: compact ? 36 : 74, top: compact ? 26 : 36, display: 'flex', justifyContent: 'space-between', gap: 18 }}>
      <div><div style={{ color: COLORS.gold, fontSize: compact ? 12 : 15, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>Math Video · Animated Deck</div><div style={{ marginTop: 8, fontSize: compact ? 20 : 30, fontWeight: 800 }}>{deck.problem}</div></div>
      <div style={{ color: COLORS.blue, fontSize: compact ? 12 : 17, fontWeight: 700, border: `1px solid ${COLORS.blue}66`, borderRadius: 999, padding: compact ? '8px 11px' : '10px 16px', height: 'fit-content' }}>{deck.narrationStyle === 'warm_teacher' ? 'Voz cálida' : 'Voz neutra'}</div>
    </div>
    <div style={{ position: 'absolute', left: compact ? 26 : 46, top: compact ? 112 : 132, bottom: compact ? 65 : 86, width: 4, borderRadius: 8, background: 'rgba(148,163,184,0.22)' }}><div style={{ width: 4, height: `${((activeIndex + 1) / deck.slides.length) * 100}%`, background: COLORS.gold, borderRadius: 8 }} /></div>
    {deck.slides.map((slide, index) => <Slide key={slide.id} slide={slide} startFrame={starts[index]} frame={frame} active={activeIndex === index} />)}
    <div style={{ position: 'absolute', left: compact ? 54 : 92, right: compact ? 36 : 74, bottom: compact ? 18 : 26, height: 5, borderRadius: 999, background: 'rgba(148,163,184,0.2)' }}><div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.rose})`, borderRadius: 999 }} /></div>
  </AbsoluteFill>;
};
