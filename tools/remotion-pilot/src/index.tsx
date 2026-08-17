import React from 'react';
import { Composition } from 'remotion';
import { QuadraticEditorial, quadraticEditorialSchema } from './QuadraticEditorial';

const defaultProps = {
  title: 'La fórmula cuadrática, sin saltarnos pasos',
  problem: '3x^2 + 2x - 8 = 0',
  stages: [
    { id: 'hook', label: 'Primero, mira la ruta', latex: '3x^2 + 2x - 8 = 0', detail: 'Identificar → sustituir → calcular → comprobar', accent: '#f7c948' },
    { id: 'coefficients', label: 'Identificamos los tres valores', latex: 'a = 3,\\quad b = 2,\\quad c = -8', detail: 'Nada queda implícito: cada coeficiente permanece visible.', accent: '#6ee7b7' },
    { id: 'substitution', label: 'La fórmula queda arriba como mapa', latex: '\\Delta = (2)^2 - 4(3)(-8)', referenceLatex: '\\Delta = b^2 - 4ac', detail: 'Reemplazamos b, a y c antes de operar.', accent: '#93c5fd' },
    { id: 'compute', label: 'Operamos en tres movimientos', latex: '\\Delta = 4 + 96 = 100', referenceLatex: '\\Delta = b^2 - 4ac', detail: 'Primero elevamos, luego multiplicamos y finalmente sumamos.', accent: '#c4b5fd' },
    { id: 'verify', label: 'Dos raíces y una comprobación', latex: 'x_1 = 1.333,\\quad x_2 = -2', referenceLatex: 'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}', detail: 'La gráfica confirma que ambas raíces vuelven a tocar el eje x.', accent: '#fb7185' },
  ],
};

const compositionProps = {
  component: QuadraticEditorial,
  durationInFrames: 426,
  fps: 30,
  schema: quadraticEditorialSchema,
  defaultProps,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="QuadraticEditorial" {...compositionProps} width={1280} height={720} />
      <Composition id="QuadraticEditorialSquare" {...compositionProps} width={720} height={720} />
      <Composition id="QuadraticEditorialPortrait" {...compositionProps} width={720} height={1280} />
    </>
  );
};
