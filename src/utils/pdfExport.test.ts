import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computePdfSlideFit,
  formatReportPdfFilename,
  selectOptimalPdfOrientation,
} from './pdfExport';

test('formatReportPdfFilename formats Mancom AR Performance as of YYYY-MM-DD HH-mm.pdf', () => {
  const sampleDate = new Date(2026, 10, 23, 13, 5, 42); // Nov 23, 2026 13:05:42
  assert.equal(
    formatReportPdfFilename(sampleDate),
    'Mancom AR Performance as of 2026-11-23 13-05.pdf'
  );

  const midnightDate = new Date(2026, 0, 4, 0, 9, 0); // Jan 4, 2026 00:09:00
  assert.equal(
    formatReportPdfFilename(midnightDate),
    'Mancom AR Performance as of 2026-01-04 00-09.pdf'
  );
});

test('computePdfSlideFit preserves aspect ratio inside A4 landscape and portrait printable margins', () => {
  const fitLandscape = computePdfSlideFit(1400, 800, 297, 210, 6);
  assert.ok(fitLandscape.widthMm <= 285 + 0.01);
  assert.ok(fitLandscape.heightMm <= 198 + 0.01);
  assert.ok(Math.abs(fitLandscape.widthMm / fitLandscape.heightMm - 1400 / 800) < 0.001);
  assert.ok(fitLandscape.xMm >= 6 - 0.001);
  assert.ok(fitLandscape.yMm >= 6 - 0.001);

  const fitPortrait = computePdfSlideFit(1100, 1550, 210, 297, 6);
  assert.ok(fitPortrait.widthMm <= 198 + 0.01);
  assert.ok(fitPortrait.heightMm <= 285 + 0.01);
  assert.ok(Math.abs(fitPortrait.widthMm / fitPortrait.heightMm - 1100 / 1550) < 0.001);
});

test('selectOptimalPdfOrientation picks landscape for wide slides and portrait for tall slides', () => {
  assert.equal(selectOptimalPdfOrientation(1300, 740), 'landscape');
  assert.equal(selectOptimalPdfOrientation(1280, 1600), 'portrait');
});
