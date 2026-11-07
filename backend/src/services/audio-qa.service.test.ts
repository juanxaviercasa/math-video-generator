import assert from 'node:assert/strict';
import test from 'node:test';
import { parseVolumeReport } from './audio-qa.service.js';

test('rejects a silent MP4 even when FFprobe reports an audio stream', () => {
  const report = parseVolumeReport('[Parsed_volumedetect_0] mean_volume: -91.0 dB\n[Parsed_volumedetect_0] max_volume: -87.0 dB');
  assert.equal(report.passed, false);
  assert.equal(report.reason, 'AUDIO_SILENT_OR_TOO_QUIET');
});

test('accepts audible narration volume and reports the measured levels', () => {
  const report = parseVolumeReport('mean_volume: -26.4 dB\nmax_volume: -4.9 dB');
  assert.equal(report.passed, true);
  assert.equal(report.maxDb, -4.9);
});

test('blocks absent measurements rather than approving unknown audio', () => {
  assert.equal(parseVolumeReport('').passed, false);
});
