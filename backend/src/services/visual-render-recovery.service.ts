export type RenderPass = 'standard' | 'formula-first';
export interface VisualRecoveryAttempt {
  pass: RenderPass;
  status: 'passed' | 'failed';
  errorCode?: string;
}

const RECOVERABLE = /(?:LAYOUT_STAGE_UNREADABLE|LAYOUT_UNREADABLE|VISUAL_QA_FAILED:[^\n]*(?:GEOMETRY_UNREADABLE|GEOMETRY_COLLISION|GEOMETRY_CLIPPING))/;

export function isRecoverableVisualFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return RECOVERABLE.test(message);
}

/**
 * Two passes maximum. Mathematical validity, time synchronization, security
 * and infrastructure failures are never recovered by removing visual content.
 */
export async function renderWithBoundedVisualRecovery<T>(
  renderAndCheck: (pass: RenderPass) => Promise<T>,
  audit: VisualRecoveryAttempt[],
): Promise<T> {
  for (const pass of ['standard', 'formula-first'] as const) {
    try {
      const result = await renderAndCheck(pass);
      audit.push({ pass, status: 'passed' });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      audit.push({ pass, status: 'failed', errorCode: message.slice(0, 500) });
      if (pass === 'formula-first' || !isRecoverableVisualFailure(error)) throw error;
    }
  }
  throw new Error('VISUAL_RECOVERY_EXHAUSTED: No se pudo obtener una escena legible.');
}
