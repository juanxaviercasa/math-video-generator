import test from 'node:test';
import assert from 'node:assert/strict';
import { getVideoFormatProfile } from './video-format.service.js';

test('resolves landscape 16:9 with explicit medium dimensions and safe frame', () => {
  const profile = getVideoFormatProfile('16:9', 'medium');
  assert.deepEqual({ width: profile.width, height: profile.height, orientation: profile.orientation }, {
    width: 1280,
    height: 720,
    orientation: 'landscape',
  });
  assert.ok(profile.panelWidth < profile.frameWidth);
  assert.ok(profile.panelHeight < profile.frameHeight);
});

test('resolves square and portrait dimensions without swapping width and height', () => {
  const square = getVideoFormatProfile('1:1', 'low');
  const portrait = getVideoFormatProfile('9:16', 'low');
  assert.deepEqual([square.width, square.height, square.orientation], [480, 480, 'square']);
  assert.deepEqual([portrait.width, portrait.height, portrait.orientation], [480, 854, 'portrait']);
  assert.ok(portrait.contentHeight > portrait.contentWidth);
});
