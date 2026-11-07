/**
 * Personal installation policy. Enable PERSONAL_MODE=true and pin the existing
 * Supabase Auth user UUID in OWNER_USER_ID. No passwords or provider secrets here.
 */
export const personalModeEnabled = (): boolean => process.env.PERSONAL_MODE === 'true' || (process.env.NODE_ENV === 'production' && process.env.PERSONAL_MODE !== 'false');

export const ownerUserId = (): string | undefined => process.env.OWNER_USER_ID?.trim() || undefined;

export function assertPersonalModeConfigured(): void {
  if (!personalModeEnabled()) return;
  const id = ownerUserId();
  // Supabase Auth user IDs are UUIDs. Fail closed rather than start a public app.
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('PERSONAL_MODE_CONFIG_INVALID: configura OWNER_USER_ID con el UUID de tu usuario Supabase existente.');
  }
}

export function isOwner(userId: string): boolean {
  if (!personalModeEnabled()) return true;
  const id = ownerUserId();
  return Boolean(id && userId === id);
}
