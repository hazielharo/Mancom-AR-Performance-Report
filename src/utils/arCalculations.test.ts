import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BASELINE_AR_DATA } from '../data/baselineData';
import {
  allocateTargetInvoices,
  APPSHEET_CSV_HEADERS,
  buildEmailDraft,
  computeARMetrics,
  computeManagerTargetProjection,
  computePage9Summary,
  filterAllocatedInvoices,
  formatPeso,
  formatPesoMillions,
  generateCSVTemplate,
  generateExecutiveSummaryText,
  getLastUpdatedDay,
  parseAccountingNumber,
  parseARReportCSV,
  parseCSVRows,
  round2,
  STANDARD_MODAL_AGING_OPTIONS,
} from './arCalculations';
import { computeSquarifiedTreemap } from './treemapLayout';
import {
  buildAllReportSheets,
  buildSheetColumnFilters,
  buildWorkbook,
  filterSheetRows,
  formatSheetCellValue,
  isGrandTotalSheetRow,
  RAW_LEDGER_EXCLUDED_COLUMNS,
  sheetToCSV,
  sheetToTSV,
} from './reportSheets';

test('baseline All Portfolios metrics match exact AppSheet AR Monitoring totals', () => {
  const m = computeARMetrics(BASELINE_AR_DATA, 'all', 90.0);

  assert.equal(m.totalBilling, 520_297_537.71);
  assert.equal(m.totalCollections, 399_894_733.05);
  assert.equal(m.arBalance, 120_402_804.66);
  assert.equal(m.collectionEfficiency, 76.86);
  assert.equal(m.priorMonthEfficiency, 73.0);
  assert.equal(m.momDelta, 3.86);
  assert.equal(m.targetAmount, 468_267_783.94);
  assert.equal(m.varianceAgainstTarget, 68_373_050.89);
  assert.equal(m.efficiencyGapToTarget, -13.14);
  assert.equal(m.isAboveOrAtTarget, false);
  assert.equal(m.totalRecoveryImpact, 69_732_205.56);
  assert.ok(m.activeBreakdown);
  assert.equal(m.activeBreakdown!.byCategory.length, 6);
  assert.equal(m.activeBreakdown!.byAreaManager.length, 10);
});

test('portfolio segment filters recalculate KPIs, recovery flows, and breakdowns accurately', () => {
  const ytdSep = computeARMetrics(BASELINE_AR_DATA, 'ytd_sep', 90.0);
  assert.equal(ytdSep.totalBilling, 461_161_161.32);
  assert.equal(ytdSep.totalCollections, 373_566_251.53);
  assert.equal(ytdSep.arBalance, 87_594_909.79);
  assert.equal(ytdSep.collectionEfficiency, 81.01);
  assert.equal(ytdSep.recoveryItems.length, 2);
  assert.equal(ytdSep.totalRecoveryImpact, 34_478_767.23);

  const octAr = computeARMetrics(BASELINE_AR_DATA, 'oct_ar', 90.0);
  assert.equal(octAr.totalBilling, 59_136_376.39);
  assert.equal(octAr.totalCollections, 26_328_481.52);
  assert.equal(octAr.arBalance, 32_807_894.87);
  assert.equal(octAr.collectionEfficiency, 44.52);
  assert.equal(octAr.recoveryItems.length, 1);
  assert.equal(octAr.totalRecoveryImpact, 35_253_438.33);
  assert.equal(octAr.activeBreakdown?.byAging[0]?.name, '1-30 days');
});

test('benchmark simulator switches between shortfall and surplus cleanly', () => {
  const lowTarget = computeARMetrics(BASELINE_AR_DATA, 'all', 75.0);
  assert.equal(lowTarget.isAboveOrAtTarget, true);
  assert.equal(lowTarget.efficiencyGapToTarget, 1.86);
  assert.ok(lowTarget.varianceAgainstTarget < 0);

  const fullTarget = computeARMetrics(BASELINE_AR_DATA, 'all', 100.0);
  assert.equal(fullTarget.isAboveOrAtTarget, false);
  assert.equal(fullTarget.efficiencyGapToTarget, -23.14);
});

test('RFC-4180 CSV parser and accounting number parser handle multi-line quotes and negatives', () => {
  assert.equal(parseAccountingNumber('  -   '), 0);
  assert.equal(parseAccountingNumber('  84,000.00 '), 84_000.0);
  assert.equal(parseAccountingNumber('  (116,976.95)'), -116_976.95);
  assert.equal(parseAccountingNumber('₱399,894,733.05'), 399_894_733.05);

  const rows = parseCSVRows('A,B\n"line1\nline2","""quoted"""\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[1][0], 'line1\nline2');
  assert.equal(rows[1][1], '"quoted"');
});

test('direct ingestion of AR_MONITORING_FOR_APPSHEET populates all 11 report page structures', () => {
  const csvPath = path.resolve(
    process.cwd(),
    'public/assets/aistudio/AR_MONITORING_FOR_APPSHEET_c88dcd7c'
  );
  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const parsed = parseARReportCSV(rawCsv, BASELINE_AR_DATA, BASELINE_AR_DATA.lastUpdated);

  assert.equal(parsed.ok, true);
  assert.equal(parsed.format, 'appsheet');
  assert.ok(parsed.data);
  assert.equal(parsed.stats?.activeRows, 1839);
  assert.equal(parsed.data!.ytdSepBilling, BASELINE_AR_DATA.ytdSepBilling);
  assert.equal(parsed.data!.ytdSepCollections, BASELINE_AR_DATA.ytdSepCollections);
  assert.equal(parsed.data!.octArBilling, BASELINE_AR_DATA.octArBilling);
  assert.equal(parsed.data!.octArCollections, BASELINE_AR_DATA.octArCollections);
  assert.deepEqual(parsed.data!.recoveryFlows, BASELINE_AR_DATA.recoveryFlows);
  assert.equal(parsed.data!.managerSummaries?.length, 10);
  assert.equal(parsed.data!.cohortMatrix?.rows.length, 12);
  assert.equal(parsed.data!.cohortMatrix?.grandTotalBilled, 520_297_537.71);
  assert.equal(parsed.data!.clientAgingRows?.[0]?.client, 'ONE UPTOWN RESIDENCE CONDOMINIUM ASSOC. INC.');
  assert.equal(parsed.data!.serviceBalances?.[0]?.serviceType, 'PMA - STAFF COST');
  assert.ok((parsed.data!.arLineItems?.length ?? 0) > 300);
  assert.equal(
    round2(parsed.data!.arLineItems!.reduce((s, item) => s + item.remainingBalance, 0)),
    120_402_804.66
  );
});

test('pure spreadsheet manager target projection and all 9 report sheets reconcile cleanly', () => {
  const csvPath = path.resolve(
    process.cwd(),
    'public/assets/aistudio/AR_MONITORING_FOR_APPSHEET_c88dcd7c'
  );
  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const parsed = parseARReportCSV(rawCsv, BASELINE_AR_DATA, BASELINE_AR_DATA.lastUpdated);
  assert.ok(parsed.data);

  const mgrSumRemaining = round2(
    parsed.data!.managerSummaries!.reduce((s, m) => s + m.totalRemaining, 0)
  );
  assert.equal(mgrSumRemaining, 120_402_804.66);

  const firstMgr = parsed.data!.managerSummaries![0];
  const proj = computeManagerTargetProjection(firstMgr, 90.0);
  assert.equal(
    round2(proj.additionalNeededForTarget + proj.projectedRemainingAtTarget),
    firstMgr.ytdSepRemainingOpen
  );

  const sheets = buildAllReportSheets(parsed.data!, 90.0, rawCsv);
  assert.equal(sheets.length, 9);
  assert.deepEqual(
    sheets.map((s) => s.sheetName),
    [
      'Executive_KPI_Summary',
      'Portfolio_by_Manager',
      'Weekly_Collections',
      'Target_Projection',
      'AR_Aging_Summary',
      'Collection_Eff_Matrix',
      'Balance_by_Service_Type',
      'Client_Aging_Breakdown',
      'AR_Monitoring_Raw_Ledger',
    ]
  );

  assert.equal(sheets[1].rows.length, 10);
  assert.equal(sheets[4].rows.length, 10);
  assert.deepEqual(sheets[4].columns, [
    '#',
    'ACCOUNT MANAGER',
    'Current',
    '1-30 days',
    '31-60 days',
    '61-90 days',
    '91 days above',
    'Grand Total',
    '% per AM',
  ]);
  assert.equal(sheets[5].rows.length, 12);
  // Service Type sheet includes Grand Total row
  assert.equal(sheets[6].rows.length, 10);
  const svcTotalRow = sheets[6].rows[sheets[6].rows.length - 1];
  assert.equal(svcTotalRow['SERVICE TYPE'], 'Grand Total');
  assert.equal(svcTotalRow['Remaining Balance'], 120_402_804.66);

  // Client Aging sheet includes Grand Total row
  assert.equal(sheets[7].rows.length, 91);
  const clientTotalRow = sheets[7].rows[sheets[7].rows.length - 1];
  assert.equal(clientTotalRow['CLIENT'], 'Grand Total');
  assert.equal(clientTotalRow['Grand Total'], 120_402_804.66);
  assert.deepEqual(sheets[7].columns, [
    '#',
    'CLIENT',
    'Current',
    '1-30 days',
    '31-60 days',
    '61-90 days',
    '91 days above',
    'Grand Total',
  ]);

  // Linked AppSheet Source Ledger excludes the 12 specified columns cleanly
  assert.equal(sheets[8].rows.length, 1839);
  assert.equal(sheets[8].columns.length, 18);
  for (const col of sheets[8].columns) {
    assert.equal(RAW_LEDGER_EXCLUDED_COLUMNS.has(col.trim().toUpperCase()), false);
  }

  const tsv = sheetToTSV(sheets[0]);
  assert.ok(tsv.includes('\t'));
  const csv = sheetToCSV(sheets[4]);
  assert.ok(csv.startsWith('#,ACCOUNT MANAGER,'));

  const wb = buildWorkbook(sheets);
  assert.equal(wb.SheetNames.length, 9);
});

test('squarified treemap preserves 100% area conservation and positive dimensions', () => {
  const rects = computeSquarifiedTreemap(
    [
      { id: 'A', label: 'A', value: 50 },
      { id: 'B', label: 'B', value: 30 },
      { id: 'C', label: 'C', value: 20 },
    ],
    100,
    100
  );
  assert.equal(rects.length, 3);
  const areaSum = rects.reduce((s, r) => s + r.width * r.height, 0);
  assert.ok(Math.abs(areaSum - 10_000) < 0.01);
  assert.ok(rects.every((r) => r.width > 0 && r.height > 0));
});

test('AppSheet CSV template round-trip and validation errors work deterministically', () => {
  const csv = generateCSVTemplate(BASELINE_AR_DATA);
  const firstLine = csv.split('\n')[0];
  assert.equal(firstLine, APPSHEET_CSV_HEADERS.join(','));

  const parsed = parseARReportCSV(csv, BASELINE_AR_DATA, '11/20/2026 2:00:00 PM');
  assert.equal(parsed.ok, true);
  assert.equal(parsed.format, 'appsheet');
  assert.ok(parsed.data);
  assert.equal(parsed.data!.ytdSepBilling, BASELINE_AR_DATA.ytdSepBilling);
  assert.equal(parsed.data!.ytdSepCollections, BASELINE_AR_DATA.ytdSepCollections);
  assert.equal(parsed.data!.octArBilling, BASELINE_AR_DATA.octArBilling);
  assert.equal(parsed.data!.octArCollections, BASELINE_AR_DATA.octArCollections);

  const badCsv = 'CLIENT,OTHER\nABC,100';
  const failed = parseARReportCSV(badCsv, BASELINE_AR_DATA, '11/20/2026 2:05:00 PM');
  assert.equal(failed.ok, false);
  assert.match(failed.errors[0], /Missing required AppSheet column/);
});

test('currency formatting and executive summary text display exact Peso figures', () => {
  assert.equal(formatPeso(399_894_733.05), '₱399,894,733.05');
  assert.equal(formatPesoMillions(520_297_537.71), '₱520.30M');

  const m = computeARMetrics(BASELINE_AR_DATA, 'all', 90.0);
  const text = generateExecutiveSummaryText(BASELINE_AR_DATA, m);
  assert.match(text, /₱520,297,537\.71/);
  assert.match(text, /₱399,894,733\.05/);
  assert.match(text, /76\.86%/);
  assert.match(text, /₱468,267,783\.94/);
  assert.match(text, /₱68,373,050\.89/);
  assert.match(text, /₱69,732,205\.56/);
  assert.match(text, /OCT 1 – NOV 20 CASH INFLOWS/);
  assert.match(text, /Nov 1–20 Collection \(YTD Sep AR\)/);
});

test('dynamic Nov 1-[Date Last Updated] range updates cleanly across metrics and report sheets', () => {
  assert.equal(getLastUpdatedDay('11/20/2026 1:40:56 PM'), 20);
  assert.equal(getLastUpdatedDay('11/25/2026 9:05:10 AM'), 25);

  const customUpdated = { ...BASELINE_AR_DATA, lastUpdated: '11/25/2026 9:05:10 AM' };
  const m = computeARMetrics(customUpdated, 'all', 90.0);
  assert.equal(m.novEndDay, 25);
  assert.equal(m.recoveryItems[1].label, 'Nov 1–25 Collection (YTD Sep AR)');
  assert.equal(m.recoveryItems[1].period, 'Nov 1 – Nov 25');

  const sheets = buildAllReportSheets(customUpdated, 90.0);
  assert.ok(sheets[1].columns.includes('Nov 1-25 Recovery'));
  assert.ok(sheets[2].columns.includes('Nov 1-Nov 25'));
  assert.ok(sheets[3].columns.includes('Nov 1-25 Sep Recovery'));
});

test('Page 5 invoice allocation reconciles exact required collection amount per Account Manager', () => {
  const csvPath = path.resolve(
    process.cwd(),
    'public/assets/aistudio/AR_MONITORING_FOR_APPSHEET_c88dcd7c'
  );
  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const parsed = parseARReportCSV(rawCsv, BASELINE_AR_DATA, BASELINE_AR_DATA.lastUpdated);
  assert.ok(parsed.data);
  assert.ok((parsed.data!.openInvoices?.length ?? 0) > 100);

  for (const mgr of parsed.data!.managerSummaries ?? []) {
    const proj = computeManagerTargetProjection(mgr, 90.0);
    const alloc = allocateTargetInvoices(
      parsed.data!.openInvoices,
      mgr.manager,
      proj.additionalNeededForTarget,
      parsed.data!.arLineItems
    );
    if (proj.additionalNeededForTarget > 0) {
      assert.ok(alloc.rows.length > 0);
      assert.ok(
        alloc.rows.every(
          (r) =>
            r.amountForCollection > 0 &&
            r.amountForCollection <= r.invoiceBalance + 0.005 &&
            r.biNumber.length > 0 &&
            r.clientName.length > 0 &&
            r.serviceType.length > 0 &&
            r.particulars.length > 0
        )
      );
      const partialRows = alloc.rows.filter((r) => r.isPartial);
      assert.ok(partialRows.length <= 1);
      if (partialRows.length === 1) {
        assert.equal(alloc.rows[alloc.rows.length - 1].isPartial, true);
      }
      const totalOpenForMgr = round2(
        (parsed.data!.openInvoices ?? [])
          .filter((inv) => inv.areaManager.toUpperCase() === mgr.manager.toUpperCase())
          .reduce((s, inv) => s + inv.remainingBalance, 0)
      );
      if (totalOpenForMgr >= proj.additionalNeededForTarget) {
        assert.equal(alloc.totalAmount, proj.additionalNeededForTarget);
      }
    } else {
      assert.equal(alloc.rows.length, 0);
      assert.equal(alloc.totalAmount, 0);
    }
  }
});

test('Page 5 modal filterAllocatedInvoices supports search across Client/Service Type/Particulars, dropdown filters, standard aging order, and dynamic subtotal', () => {
  const csvPath = path.resolve(
    process.cwd(),
    'public/assets/aistudio/AR_MONITORING_FOR_APPSHEET_c88dcd7c'
  );
  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const parsed = parseARReportCSV(rawCsv, BASELINE_AR_DATA, BASELINE_AR_DATA.lastUpdated);
  assert.ok(parsed.data);

  const ralph = parsed.data!.managerSummaries!.find((m) => m.manager === 'RALPH')!;
  const proj = computeManagerTargetProjection(ralph, 90.0);
  const alloc = allocateTargetInvoices(
    parsed.data!.openInvoices,
    'RALPH',
    proj.additionalNeededForTarget,
    parsed.data!.arLineItems
  );

  // Unfiltered state matches overall total
  const unfiltered = filterAllocatedInvoices(alloc.rows, {
    searchQuery: '',
    serviceType: 'ALL',
    aging: 'ALL',
  });
  assert.equal(unfiltered.filteredRows.length, alloc.rows.length);
  assert.equal(unfiltered.filteredSubtotal, alloc.totalAmount);
  assert.deepEqual(unfiltered.agingOptions.slice(0, 5), [...STANDARD_MODAL_AGING_OPTIONS]);
  assert.ok(unfiltered.serviceTypeOptions.length >= 2);

  // Filter by Aging = 61-90 days
  const byAging = filterAllocatedInvoices(alloc.rows, {
    searchQuery: '',
    serviceType: 'ALL',
    aging: '61-90 days',
  });
  assert.ok(byAging.filteredRows.length > 0);
  assert.ok(byAging.filteredRows.every((r) => r.aging === '61-90 days'));
  assert.equal(
    byAging.filteredSubtotal,
    round2(byAging.filteredRows.reduce((s, r) => s + r.amountForCollection, 0))
  );
  assert.ok(byAging.filteredSubtotal < alloc.totalAmount);

  // Search by Client, Service Type, or Particulars dynamically recalculates subtotal
  const targetSvc = unfiltered.serviceTypeOptions[0];
  const byServiceAndSearch = filterAllocatedInvoices(alloc.rows, {
    searchQuery: 'STAFF',
    serviceType: targetSvc,
    aging: 'ALL',
  });
  assert.ok(byServiceAndSearch.filteredRows.every((r) => r.serviceType === targetSvc));
  assert.equal(
    byServiceAndSearch.filteredSubtotal,
    round2(byServiceAndSearch.filteredRows.reduce((s, r) => s + r.amountForCollection, 0))
  );
});

test('Page 9 centered summary reconciles billing, collection, projection, and projected efficiency', () => {
  const summary = computePage9Summary(BASELINE_AR_DATA, 90.0);
  assert.equal(summary.totalBilling, 520_297_537.71);
  assert.equal(summary.lessCollection, 399_894_733.05);
  assert.ok(summary.projection > 0);
  assert.equal(summary.totalCollection, round2(summary.lessCollection + summary.projection));
  assert.equal(
    summary.projectedCollectionEfficiency,
    round2((summary.totalCollection / summary.totalBilling) * 100)
  );
});

test('Draft to Email generates pre-filled mailto URI and live structured summary text', () => {
  const draft = buildEmailDraft(BASELINE_AR_DATA, 90.0);
  assert.equal(draft.subject, 'Mancom AR Performance Summary');
  assert.ok(draft.mailtoUrl.startsWith('mailto:?subject=Mancom%20AR%20Performance%20Summary&body='));
  assert.match(draft.body, /KEY METRICS OVERVIEW/);
  assert.match(draft.body, /• YTD Billing: ₱520,297,537\.71/);
  assert.match(draft.body, /• YTD Collection: ₱399,894,733\.05/);
  assert.match(draft.body, /• AR Balance: ₱120,402,804\.66/);
  assert.match(draft.body, /• Collection Efficiency: 76\.86%/);
  assert.match(draft.body, /POST-SEPTEMBER RECOVERY FLOW & COLLECTION COMMITMENT/);
  assert.match(draft.body, /• 90% Collection Target Amount: ₱468,267,783\.94/);
  assert.match(draft.body, /• Actual Collections \(YTD September, incl\. Oct 1–Nov 20\)/);
  assert.match(draft.body, /└ October 1–31 Collection \(YTD Sep AR\)/);
  assert.match(draft.body, /└ November 1–20 Collection \(YTD Sep AR\)/);
  assert.match(draft.body, /└ Collection \(Oct AR\)/);
  assert.match(draft.body, /• Remaining Balance from Target \(90%\)/);
});

test('Target Collection Gap formats Required and Projected Bal as ₱#,##0.00 currency and Raw Ledger column filters work', () => {
  assert.equal(formatSheetCellValue('Required for 85.0% Target', 1234567.89), '₱1,234,567.89');
  assert.equal(formatSheetCellValue('Projected Bal at 85.0%', 987654.3), '₱987,654.30');
  assert.equal(formatSheetCellValue('YTD Sep Eff (%)', 85.0), '85.00%');

  const csvPath = path.resolve(
    process.cwd(),
    'public/assets/aistudio/AR_MONITORING_FOR_APPSHEET_c88dcd7c'
  );
  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const parsed = parseARReportCSV(rawCsv, BASELINE_AR_DATA, BASELINE_AR_DATA.lastUpdated);
  const sheets = buildAllReportSheets(parsed.data!, 85.0, rawCsv);

  const targetSheet = sheets[3];
  assert.ok(targetSheet.columns.includes('Required for 85.0% Target'));
  assert.ok(targetSheet.columns.includes('Projected Bal at 85.0%'));

  const rawSheet = sheets[8];
  const filterCfg = buildSheetColumnFilters(rawSheet);
  assert.equal(filterCfg['AREA MANAGER']?.type, 'dropdown');
  assert.equal(filterCfg['AGING']?.type, 'dropdown');
  assert.equal(filterCfg['CLIENT']?.type, 'search');

  const ralph91Plus = filterSheetRows(
    rawSheet.rows,
    rawSheet.columns,
    '',
    { 'AREA MANAGER': 'RALPH', AGING: '91 days above' },
    filterCfg
  );
  assert.ok(ralph91Plus.length > 0 && ralph91Plus.length < rawSheet.rows.length);
  assert.ok(
    ralph91Plus.every((r) => r['AREA MANAGER'] === 'RALPH' && r['AGING'] === '91 days above')
  );
  assert.equal(isGrandTotalSheetRow(sheets[6].rows[sheets[6].rows.length - 1]), true);
});

