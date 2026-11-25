import test from 'node:test';
import assert from 'node:assert/strict';
import { computePptSlidePlacement, formatReportPptFilename } from './pptExport';

test('formatReportPptFilename formats Mancom AR Performance as of YYYY-MM-DD HH-mm.pptx', () => {
  const sampleDate = new Date(2026, 10, 24, 9, 7, 15); // Nov 24, 2026 09:07:15
  assert.equal(
    formatReportPptFilename(sampleDate),
    'Mancom AR Performance as of 2026-11-24 09-07.pptx'
  );
});

test('computePptSlidePlacement centers slide image within 16:9 margins preserving aspect ratio', () => {
  const wideFit = computePptSlidePlacement(1400, 780);
  assert.ok(wideFit.widthIn <= 13.333 - 0.5 + 0.001);
  assert.ok(wideFit.heightIn <= 7.5 - 0.5 + 0.001);
  assert.ok(Math.abs(wideFit.widthIn / wideFit.heightIn - 1400 / 780) < 0.001);
  assert.ok(wideFit.xIn >= 0.25 - 0.001);
  assert.ok(wideFit.yIn >= 0.25 - 0.001);

  const tallFit = computePptSlidePlacement(1100, 1200);
  assert.ok(tallFit.heightIn <= 7.0 + 0.001);
  assert.ok(Math.abs(tallFit.widthIn / tallFit.heightIn - 1100 / 1200) < 0.001);
  assert.ok(tallFit.xIn > 0.25);
});
