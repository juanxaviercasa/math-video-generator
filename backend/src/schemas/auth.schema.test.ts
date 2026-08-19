import test from 'node:test';
import assert from 'node:assert/strict';
import { loginSchema, registerSchema } from './auth.schema.js';

test('normalizes a valid registration email', () => {
  const result = registerSchema.parse({
    email: '  Teacher@Example.COM ',
    password: 'correct-horse-battery-staple',
    name: 'Teacher',
  });

  assert.equal(result.email, 'teacher@example.com');
});

test('rejects weak registration passwords', () => {
  const result = registerSchema.safeParse({
    email: 'teacher@example.com',
    password: 'short',
    name: 'Teacher',
  });

  assert.equal(result.success, false);
});

test('rejects unknown login fields', () => {
  const result = loginSchema.safeParse({
    email: 'teacher@example.com',
    password: 'correct-horse-battery-staple',
    admin: true,
  });

  assert.equal(result.success, false);
});
