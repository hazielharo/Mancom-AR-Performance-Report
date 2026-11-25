import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BASELINE_AR_DATA } from '../data/baselineData';
import { round2 } from './arCalculations';
import {
  computeComparativeSummary,
  extractComparativePeriods,
  getComparativeManagerTargetInvoices,
  parseComparativeLedgerEntries,
  parseComparativeMonthKey,
} from './comparativeReport';

test('parseComparativeMonthKey parses month-year labels chronologically', () => {
  const dec = parseComparativeMonthKey('December 2025');
  const jan = parseComparativeMonthKey('January 2026');
  const nov = parseComparativeMonthKey('November 2026');

  assert.ok(dec && jan && nov);
  assert.ok(dec.key < jan.key);
  assert.ok(jan.key < nov.key);
  assert.equal(jan.shortLabel, 'Jan 2026');
  assert.equal(parseComparativeMonthKey('invalid'), null);
});

test('extractComparativePeriods and computeComparativeSummary reconcile full YTD and narrowed period windows', () => {
  const csvPath = path.resolve(
    process.cwd(),
    'public/assets/aistudio/AR_MONITORING_FOR_APPSHEET_c88dcd7c'
  );
  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const entries = parseComparativeLedgerEntries(rawCsv);
  assert.equal(entries.length, 1839);

  const { billingMonths, collectionMonths, defaultRange } = extractComparativePeriods(
    BASELINE_AR_DATA,
    entries
  );
  assert.equal(billingMonths.length, 12);
  assert.equal(collectionMonths.length, 11);
  assert.equal(billingMonths[0].label, 'December 2025');
  assert.equal(billingMonths[billingMonths.length - 1].label, 'November 2026');

  // Full YTD period range matches overall totals
  const fullSummary = computeComparativeSummary(
    BASELINE_AR_DATA,
    {
      billingFromKey: billingMonths[0].key,
      billingToKey: billingMonths[billingMonths.length - 1].key,
      collectionFromKey: collectionMonths[0].key,
      collectionToKey: collectionMonths[collectionMonths.length - 1].key,
    },
    entries
  );
  assert.equal(fullSummary.kpis.selectedArBilled, 520_297_537.71);
  assert.equal(fullSummary.kpis.collectionsWithinWindow, 399_894_733.05);
  assert.equal(fullSummary.kpis.remainingBalance, 120_402_804.66);
  assert.equal(fullSummary.kpis.cohortEfficiencyPct, 76.86);
  assert.equal(fullSummary.hasManagerBreakdown, true);
  assert.equal(
    round2(fullSummary.managerRows.reduce((s, m) => s + m.billedAmount, 0)),
    520_297_537.71
  );

  // Default Jan 2026 - Oct 2026 AR Billing vs Jan 2026 - Nov 2026 Collections excludes Dec 2025 and Nov 2026 AR tags
  const defaultSummary = computeComparativeSummary(BASELINE_AR_DATA, defaultRange, entries);
  assert.equal(defaultSummary.kpis.billingMonthCount, 10);
  assert.equal(defaultSummary.kpis.collectionMonthCount, 11);
  assert.equal(
    defaultSummary.kpis.remainingBalance,
    round2(defaultSummary.kpis.selectedArBilled - defaultSummary.kpis.collectionsWithinWindow)
  );

  // Narrowing Collection Period reduces Collections Within Window and increases Remaining Balance for same AR period
  const octKey = collectionMonths.find((c) => c.label === 'October 2026')!.key;
  const narrowedSummary = computeComparativeSummary(
    BASELINE_AR_DATA,
    {
      ...defaultRange,
      collectionToKey: octKey,
    },
    entries
  );
  assert.equal(narrowedSummary.kpis.selectedArBilled, defaultSummary.kpis.selectedArBilled);
  assert.ok(narrowedSummary.kpis.collectionsWithinWindow < defaultSummary.kpis.collectionsWithinWindow);
  assert.ok(narrowedSummary.kpis.remainingBalance > defaultSummary.kpis.remainingBalance);

  // Fallback without rawCsvText uses matrix cleanly for monthly breakdown
  const matrixFallback = computeComparativeSummary(BASELINE_AR_DATA, defaultRange);
  assert.equal(matrixFallback.kpis.selectedArBilled, defaultSummary.kpis.selectedArBilled);
  assert.equal(
    matrixFallback.kpis.collectionsWithinWindow,
    defaultSummary.kpis.collectionsWithinWindow
  );
  assert.equal(matrixFallback.hasManagerBreakdown, false);

  // Metric Breakdown: 90% Collection Target Amount, Actual Collections, Variance Against Target
  const customBenchmarkSummary = computeComparativeSummary(
    BASELINE_AR_DATA,
    defaultRange,
    entries,
    90
  );
  assert.equal(
    customBenchmarkSummary.metricBreakdown.targetAmount,
    round2(customBenchmarkSummary.kpis.selectedArBilled * 0.9)
  );
  assert.equal(
    customBenchmarkSummary.metricBreakdown.actualCollections,
    customBenchmarkSummary.kpis.collectionsWithinWindow
  );
  assert.equal(
    customBenchmarkSummary.metricBreakdown.varianceAgainstTarget,
    round2(
      customBenchmarkSummary.metricBreakdown.targetAmount -
        customBenchmarkSummary.metricBreakdown.actualCollections
    )
  );

  // Lowering target below current efficiency flips isAboveOrAtTarget to true
  const lowTargetSummary = computeComparativeSummary(
    BASELINE_AR_DATA,
    defaultRange,
    entries,
    70
  );
  assert.equal(lowTargetSummary.metricBreakdown.targetBenchmarkPct, 70);
  assert.equal(lowTargetSummary.metricBreakdown.isAboveOrAtTarget, true);
  assert.ok(lowTargetSummary.metricBreakdown.varianceAgainstTarget <= 0);

  // Target Collection Projection per AM clamps high performers to 0.00 (no negative shortfalls)
  assert.ok(customBenchmarkSummary.managerTargetGroups.length >= 6);
  const allTargetRows = customBenchmarkSummary.managerTargetGroups.flatMap((g) => g.rows);
  assert.equal(
    round2(allTargetRows.reduce((s, r) => s + r.remainingBalance, 0)),
    customBenchmarkSummary.kpis.remainingBalance
  );
  assert.ok(allTargetRows.every((r) => r.additionalNeededForTarget >= 0));
  const cezarDefault = allTargetRows.find((r) => r.manager === 'CEZAR');
  const sandherDefault = allTargetRows.find((r) => r.manager === 'SANDHER');
  assert.ok(cezarDefault && sandherDefault);
  assert.equal(cezarDefault.additionalNeededForTarget, 0);
  assert.equal(sandherDefault.additionalNeededForTarget, 0);
  assert.equal(
    customBenchmarkSummary.managerTargetTotals.additionalNeededForTarget,
    round2(allTargetRows.reduce((s, r) => s + r.additionalNeededForTarget, 0))
  );
  assert.equal(
    round2(
      customBenchmarkSummary.managerTargetTotals.additionalNeededForTarget +
        customBenchmarkSummary.managerTargetTotals.projectedRemainingAtTarget
    ),
    customBenchmarkSummary.managerTargetTotals.remainingBalance
  );

  // Across all benchmark sliders (including 70%), no AM ever has a negative Required amount
  for (const pct of [85, 80, 70, 95]) {
    const scaled = computeComparativeSummary(BASELINE_AR_DATA, defaultRange, entries, pct);
    const scaledRows = scaled.managerTargetGroups.flatMap((g) => g.rows);
    assert.ok(scaledRows.every((r) => r.additionalNeededForTarget >= 0));
    assert.equal(
      scaled.managerTargetTotals.additionalNeededForTarget,
      round2(scaledRows.reduce((s, r) => s + r.additionalNeededForTarget, 0))
    );
  }

  for (const row of allTargetRows) {
    assert.equal(
      round2(row.additionalNeededForTarget + row.projectedRemainingAtTarget),
      row.remainingBalance
    );
    const alloc = getComparativeManagerTargetInvoices(
      row.manager,
      row.additionalNeededForTarget,
      defaultRange,
      entries
    );
    if (row.additionalNeededForTarget > 0) {
      assert.ok(alloc.rows.length > 0);
      assert.ok(
        alloc.rows.every(
          (item) =>
            item.amountForCollection > 0 &&
            item.amountForCollection <= item.invoiceBalance + 0.005 &&
            item.serviceType.length > 0 &&
            item.clientName.length > 0 &&
            item.particulars.length > 0
        )
      );
      const partialRows = alloc.rows.filter((item) => item.isPartial);
      assert.ok(partialRows.length <= 1);
      if (partialRows.length === 1) {
        assert.equal(alloc.rows[alloc.rows.length - 1].isPartial, true);
      }
      assert.equal(alloc.totalAmount, row.additionalNeededForTarget);
    } else {
      assert.equal(alloc.rows.length, 0);
      assert.equal(alloc.totalAmount, 0);
    }
  }

  // Manager table aging buckets reconcile exactly with manager remaining balances and Grand Total column/row
  for (const summaryToCheck of [fullSummary, defaultSummary]) {
    for (const mgr of summaryToCheck.managerRows) {
      const agingSum = round2(
        mgr.agingCurrent + mgr.aging1To30 + mgr.aging31To60 + mgr.aging61To90 + mgr.aging91Above
      );
      assert.equal(agingSum, mgr.remainingBalance);
    }
    const agingGrandTotal = round2(
      summaryToCheck.totals.agingCurrent +
        summaryToCheck.totals.aging1To30 +
        summaryToCheck.totals.aging31To60 +
        summaryToCheck.totals.aging61To90 +
        summaryToCheck.totals.aging91Above
    );
    assert.equal(agingGrandTotal, summaryToCheck.totals.remainingBalance);
  }
});
