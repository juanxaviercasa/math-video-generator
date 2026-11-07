# Remotion editorial pilot

Este directorio contiene un piloto aislado de Remotion 4 para probar la capa editorial del generador sin sustituir Manim ni el pipeline de producción. La composición actual puede tratarse como una **presentación animada**: siete diapositivas, cada una con una duración, una idea central y microeventos derivados de un `TimelineLike`.

## Qué demuestra

La composición `QuadraticEditorial` recibe props validadas con Zod y presenta una microlección de ecuación cuadrática con hook, rail de progreso, fórmula de referencia persistente, sustitución, pausa de predicción, tarjetas de explicación y una comprobación gráfica. KaTeX se usa únicamente para el render de fórmulas dentro de la composición Remotion.

## Ejecución

```bash
cd tools/remotion-pilot
npm install
npm run type-check
npm run dev
npm run render
```

Para generar la presentación animada derivada del demo timeline:

```bash
npx remotion render src/registerRoot.tsx AnimatedQuadraticDeck out/animated-quadratic-16x9.mp4
npx remotion render src/registerRoot.tsx AnimatedQuadraticDeckSquare out/animated-quadratic-1x1.mp4
npx remotion render src/registerRoot.tsx AnimatedQuadraticDeckPortrait out/animated-quadratic-9x16.mp4
```

El render editorial corto se genera en `out/quadratic-editorial.mp4`; la presentación animada se genera en los archivos `animated-quadratic-*`. El piloto actual es visual y editorial: no reemplaza el audio neural, el solver, Manim ni FFmpeg. La próxima integración deberá leer un `LessonTimeline` exportado por el backend en lugar de mantener el `demoTimeline` dentro del piloto. La demo narrada actual concatena segmentos generados con la voz neural aprobada y sirve para validar el concepto; todavía no activa `video-processing.service.ts`.

## Límites deliberados

El piloto no se activa desde `video-processing.service.ts`, no cambia `NARRATION_TIMELINE`, no modifica la ruta estable y no convierte Remotion en fuente de verdad matemática. Antes de conectar el render editorial al pipeline se debe medir la sincronización con audio, la equivalencia tipográfica con MathTex, el rendimiento, la licencia de componentes y la calidad en 16:9, 1:1 y 9:16.
