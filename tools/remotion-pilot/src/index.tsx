import React from 'react';
import { Composition } from 'remotion';
import { z } from 'zod';
import { QuadraticEditorial, quadraticEditorialSchema } from './QuadraticEditorial';
import { demoTimeline, deckToEditorialStages, timelineToAnimatedDeck } from './timelineAdapter';
import { TimelineEditorial, animatedDeckSchema } from './TimelineEditorial';

const demoDeck = timelineToAnimatedDeck(demoTimeline, '16:9');
const defaultProps = {
  title: 'La ecuación cuadrática como una presentación animada',
  problem: demoDeck.problem,
  stages: deckToEditorialStages(demoDeck),
};

const zodDeckSchema = animatedDeckSchema.extend({ deck: animatedDeckSchema }).pick({ deck: true });

const timelineCompositionProps = {
  component: TimelineEditorial,
  durationInFrames: Math.round(demoDeck.totalDurationSeconds * 30),
  fps: 30,
  schema: zodDeckSchema,
  defaultProps: { deck: demoDeck },
};

const compositionProps = {
  component: QuadraticEditorial,
  durationInFrames: Math.round(demoDeck.totalDurationSeconds * 30),
  fps: 30,
  schema: quadraticEditorialSchema,
  defaultProps,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="AnimatedQuadraticDeck" {...compositionProps} width={1280} height={720} />
      <Composition id="AnimatedQuadraticDeckSquare" {...compositionProps} width={720} height={720} />
      <Composition id="AnimatedQuadraticDeckPortrait" {...compositionProps} width={720} height={1280} />
      <Composition id="LessonTimelineEditorial" {...timelineCompositionProps} width={1280} height={720} />
      <Composition id="LessonTimelineEditorialSquare" {...timelineCompositionProps} width={720} height={720} />
      <Composition id="LessonTimelineEditorialPortrait" {...timelineCompositionProps} width={720} height={1280} />
    </>
  );
};
