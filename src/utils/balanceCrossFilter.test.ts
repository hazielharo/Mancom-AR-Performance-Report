import test from 'node:test';
import assert from 'node:assert/strict';
import { BASELINE_AR_DATA } from '../data/baselineData';
import { round2 } from './arCalculations';
import {
  AGING_BUCKETS,
  computeCrossFilteredView,
  EMPTY_CROSS_FILTERS,
  parseConsolidatedARCSV,
  toggleCrossFilterValue,
} from './balanceCrossFilter';

test('AGING_BUCKETS strictly enforces Current to 91 days above order', () => {
  assert.deepEqual(AGING_BUCKETS, [
    'Current',
    '1-30 days',
    '31-60 days',
    '61-90 days',
    '91 days above',
  ]);
});

test('toggleCrossFilterValue supports single-select toggle-off and multi-select accumulation', () => {
  assert.deepEqual(toggleCrossFilterValue([], 'RALPH', false), ['RALPH']);
  assert.deepEqual(toggleCrossFilterValue(['RALPH'], 'RALPH', false), []);
  assert.deepEqual(toggleCrossFilterValue(['RALPH'], 'HARVEY', false), ['HARVEY']);

  assert.deepEqual(toggleCrossFilterValue(['RALPH'], 'HARVEY', true), ['RALPH', 'HARVEY']);
  assert.deepEqual(toggleCrossFilterValue(['RALPH', 'HARVEY'], 'RALPH', true), ['HARVEY']);
});

test('computeCrossFilteredView reconciles unfiltered baseline and cross-filters bidirectionally', () => {
  const items = BASELINE_AR_DATA.arLineItems ?? [];
  assert.ok(items.length > 300);

  // Unfiltered view
  const all = computeCrossFilteredView(items, EMPTY_CROSS_FILTERS);
  assert.equal(all.overallGrandTotal, 120_402_804.66);
  assert.equal(all.managerHeaderTotal, 120_402_804.66);
  assert.equal(all.serviceHeaderTotal, 120_402_804.66);
  assert.equal(all.agingTotals.grandTotal, 120_402_804.66);
  assert.equal(all.activeFilterCount, 0);
  assert.equal(all.managerTiles.length, 9);

  // Single Area Manager filter: RALPH (20,180,358.10)
  const ralphOnly = computeCrossFilteredView(items, {
    ...EMPTY_CROSS_FILTERS,
    areaManagers: ['RALPH'],
  });
  assert.equal(ralphOnly.overallGrandTotal, 20_180_358.1);
  assert.equal(ralphOnly.managerHeaderTotal, 20_180_358.1);
  assert.equal(ralphOnly.serviceHeaderTotal, 20_180_358.1);
  assert.equal(ralphOnly.agingTotals.grandTotal, 20_180_358.1);
  // Manager tiles stay populated so unselected tiles render at 35% opacity
  assert.equal(ralphOnly.managerTiles.length, 9);
  assert.ok(ralphOnly.clientRows.length < all.clientRows.length);

  // Multi-select Area Managers: RALPH + HARVEY
  const ralphHarvey = computeCrossFilteredView(items, {
    ...EMPTY_CROSS_FILTERS,
    areaManagers: ['RALPH', 'HARVEY'],
  });
  assert.equal(
    ralphHarvey.overallGrandTotal,
    round2(20_180_358.1 + 19_538_372.22)
  );
  assert.equal(ralphHarvey.agingTotals.grandTotal, ralphHarvey.overallGrandTotal);

  // Aging bucket filter: 91 days above
  const aging91 = computeCrossFilteredView(items, {
    ...EMPTY_CROSS_FILTERS,
    agingBuckets: ['91 days above'],
  });
  assert.equal(aging91.agingTotals.aging1To30, 0);
  assert.equal(aging91.agingTotals.aging31To60, 0);
  assert.equal(aging91.agingTotals.aging61To90, 0);
  assert.equal(aging91.agingTotals.agingCurrent, 0);
  assert.equal(aging91.agingTotals.aging91Above, aging91.agingTotals.grandTotal);
  assert.equal(aging91.overallGrandTotal, aging91.agingTotals.grandTotal);

  // Client filter: MREIT, INC.
  const mreit = computeCrossFilteredView(items, {
    ...EMPTY_CROSS_FILTERS,
    clients: ['MREIT, INC.'],
  });
  assert.equal(mreit.overallGrandTotal, 10_990_906.21);
  assert.equal(mreit.managerHeaderTotal, 10_990_906.21);
  assert.equal(mreit.serviceHeaderTotal, 10_990_906.21);
  assert.equal(mreit.agingTotals.grandTotal, 10_990_906.21);
});

test('parseConsolidatedARCSV groups line items and reports validation errors clearly', () => {
  const validCsv = [
    'AREA MANAGER,SERVICE TYPE,CLIENT,AGING,REMAINING BALANCE',
    'RALPH,PMA - STAFF COST,MREIT INC.,91 days above,"1,500,000.50"',
    'RALPH,PMA - STAFF COST,MREIT INC.,91 days above,500000.25',
    'HARVEY,AC CLEANING,ONE UPTOWN,1-30 days,250000',
  ].join('\n');

  const okRes = parseConsolidatedARCSV(validCsv);
  assert.equal(okRes.ok, true);
  assert.ok(okRes.items);
  assert.equal(okRes.items!.length, 2);
  assert.equal(okRes.items![0].remainingBalance, 2_000_000.75);

  const missingCol = parseConsolidatedARCSV('MANAGER,CLIENT\nRALPH,MREIT');
  assert.equal(missingCol.ok, false);
  assert.match(missingCol.error!, /Missing required Consolidated AR column/);

  const badNum = parseConsolidatedARCSV(
    'AREA MANAGER,SERVICE TYPE,CLIENT,AGING,REMAINING BALANCE\nRALPH,PMA,CLIENT A,Current,NOT_A_NUM'
  );
  assert.equal(badNum.ok, false);
  assert.match(badNum.error!, /invalid REMAINING BALANCE/);
});
