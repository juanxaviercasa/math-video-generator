import assert from 'node:assert/strict';
import test from 'node:test';
import { assertPersonalModeConfigured, isOwner, personalModeEnabled } from './personal-mode.service.js';

const originalMode = process.env.PERSONAL_MODE;
const originalOwner = process.env.OWNER_USER_ID;
const validOwner = 'e233caa1-3a71-4c2c-a731-71af5e6d84b0';

test('private mode rejects startup without a valid owner UUID', () => {
  process.env.PERSONAL_MODE = 'true';
  delete process.env.OWNER_USER_ID;
  assert.throws(() => assertPersonalModeConfigured(), /OWNER_USER_ID/);
  process.env.OWNER_USER_ID = 'not-a-uuid';
  assert.throws(() => assertPersonalModeConfigured(), /OWNER_USER_ID/);
});

test('private mode admits exactly one existing Supabase Auth user', () => {
  process.env.PERSONAL_MODE = 'true';
  process.env.OWNER_USER_ID = validOwner;
  assert.equal(personalModeEnabled(), true);
  assert.doesNotThrow(() => assertPersonalModeConfigured());
  assert.equal(isOwner(validOwner), true);
  assert.equal(isOwner('ddff4e9a-f3dd-4f9e-b898-63b9f8f03ed0'), false);
});

test('existing multi-user development installs are unaffected when private mode is disabled', () => {
  process.env.PERSONAL_MODE = 'false';
  delete process.env.OWNER_USER_ID;
  assert.equal(personalModeEnabled(), false);
  assert.doesNotThrow(() => assertPersonalModeConfigured());
  assert.equal(isOwner('test'), true);
});

test.after(() => {
  if (originalMode === undefined) delete process.env.PERSONAL_MODE;
  else process.env.PERSONAL_MODE = originalMode;
  if (originalOwner === undefined) delete process.env.OWNER_USER_ID;
  else process.env.OWNER_USER_ID = originalOwner;
});
