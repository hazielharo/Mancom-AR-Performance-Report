import * as XLSX from 'xlsx';
import { ARReportData } from '../types/arReport';
import {
  computeARMetrics,
  computeManagerTargetProjection,
  formatNumber,
  formatPeso,
  getLastUpdatedDay,
  parseAccountingNumber,
  parseCSVRows,
  round2,
} from './arCalculations';

export type SheetCellValue = string | number;

export interface ReportSheet {
  id: string;
  sheetName: string;
  title: string;
  description: string;
  columns: string[];
  rows: Array<Record<string, SheetCellValue>>;
}

export function buildSupplementalArSheet(csv: string): ReportSheet {
  const [header = [], ...body] = parseCSVRows(csv).filter((row) => row.some((cell) => cell.trim()));
  const width = body.reduce((max, row) => Math.max(max, row.length), header.length);
  const usedNames = new Set<string>();
  const columns = Array.from({ length: width }, (_, index) => {
    const name = header[index]?.trim() || `Column ${index + 1}`;
    let uniqueName = name;
    let suffix = 2;
    while (usedNames.has(uniqueName)) uniqueName = `${name} (${suffix++})`;
    usedNames.add(uniqueName);
    return uniqueName;
  });

  return {
    id: 'supplemental_ar',
    sheetName: 'Supplemental AR',
    title: 'Supplemental AR',
    description: 'A separate read-only tab from Google Sheets. These rows are not included in dashboard totals.',
    columns,
    rows: body.map((row) =>
      Object.fromEntries(columns.map((column, index) => [column, row[index] ?? '']))
    ),
  };
}

export const RAW_LEDGER_EXCLUDED_COLUMNS = new Set([
  'COLLEFFTAG (FOR COLL)',
  'TEMP INV #',
  'SOA DATE',
  'INVOICE #',
  'BI DATE',
  'VAT SALES',
  'VAT',
  'TOTAL AMOUNT DUE',
  'CM#',
  'GROSS ADJUSTMENT',
  'TAX ADJ',
  'NET ADJ',
]);

const STANDARD_AGING_RANK: Record<string, number> = {
  Current: 1,
  '1-30 days': 2,
  '31-60 days': 3,
  '61-90 days': 4,
  '91 days above': 5,
};

const MONTH_INDEX_MAP: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function tryParseMonthOrder(val: string): number | null {
  const parts = val.trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const m = MONTH_INDEX_MAP[parts[0].toLowerCase()];
  const y = Number(parts[1]);
  if (m === undefined || !Number.isInteger(y)) return null;
  return y * 12 + m;
}

export function isCurrencyTargetColumn(col: string): boolean {
  return /^Required for .+ Target/i.test(col) || /^Projected Bal at /i.test(col);
}

export function isPercentageSheetColumn(col: string): boolean {
  if (isCurrencyTargetColumn(col)) return false;
  const lower = col.toLowerCase();
  return (
    col.includes('(%)') ||
    col.startsWith('%') ||
    lower.includes('efficiency') ||
    lower.includes('eff (') ||
    lower.endsWith(' eff')
  );
}

export function formatSheetCellValue(col: string, val: SheetCellValue): string {
  if (val === '' || val === null || val === undefined) return '-';
  if (typeof val === 'number') {
    if (col === '#') return String(val);
    if (isCurrencyTargetColumn(col)) {
      return formatPeso(val);
    }
    if (isPercentageSheetColumn(col)) {
      return `${val.toFixed(2)}%`;
    }
    if (Number.isInteger(val) && Math.abs(val) < 100 && col.toLowerCase().includes('row')) {
      return String(val);
    }
    return formatNumber(val);
  }
  return String(val);
}

export function isGrandTotalSheetRow(row: Record<string, SheetCellValue>): boolean {
  return (
    row['SERVICE TYPE'] === 'Grand Total' ||
    row['CLIENT'] === 'Grand Total' ||
    row['ACCOUNT MANAGER'] === 'Grand Total'
  );
}

export interface ColumnFilterConfig {
  column: string;
  type: 'dropdown' | 'search';
  options?: string[];
}

export function buildSheetColumnFilters(
  sheet: ReportSheet
): Record<string, ColumnFilterConfig> {
  const configs: Record<string, ColumnFilterConfig> = {};
  for (const col of sheet.columns) {
    const distinct = new Set<string>();
    for (const row of sheet.rows) {
      if (isGrandTotalSheetRow(row)) continue;
      const v = String(row[col] ?? '').trim();
      if (v) distinct.add(v);
      if (distinct.size > 40) break;
    }

    const forceSearch =
      col.toUpperCase() === 'BI/SOA' ||
      col.toUpperCase() === 'CLIENT' ||
      col.toUpperCase() === 'PARTICULARS' ||
      col.toUpperCase() === 'OR#' ||
      col.toUpperCase().includes('AMOUNT') ||
      col.toUpperCase().includes('COLLECTION') ||
      col.toUpperCase().includes('BALANCE') ||
      col.toUpperCase() === 'EWT' ||
      col.toUpperCase() === 'CWT';

    if (!forceSearch && distinct.size > 0 && distinct.size <= 40) {
      const options = Array.from(distinct).sort((a, b) => {
        if (col.toUpperCase() === 'AGING') {
          const rA = STANDARD_AGING_RANK[a] ?? 50;
          const rB = STANDARD_AGING_RANK[b] ?? 50;
          if (rA !== rB) return rA - rB;
        }
        const mA = tryParseMonthOrder(a);
        const mB = tryParseMonthOrder(b);
        if (mA !== null && mB !== null) return mA - mB;
        return a.localeCompare(b);
      });
      configs[col] = { column: col, type: 'dropdown', options };
    } else {
      configs[col] = { column: col, type: 'search' };
    }
  }
  return configs;
}

export function filterSheetRows(
  rows: Array<Record<string, SheetCellValue>>,
  columns: string[],
  searchQuery: string,
  columnFilters: Record<string, string>,
  columnConfigs?: Record<string, ColumnFilterConfig>
): Array<Record<string, SheetCellValue>> {
  const q = searchQuery.trim().toLowerCase();
  const activeColFilters = Object.entries(columnFilters).filter(
    ([, val]) => val.trim() !== '' && val !== 'ALL'
  );

  if (!q && activeColFilters.length === 0) return rows;

  return rows.filter((row) => {
    for (const [col, filterVal] of activeColFilters) {
      const cellStr = String(row[col] ?? '').trim();
      const cfg = columnConfigs?.[col];
      if (cfg?.type === 'dropdown') {
        if (cellStr !== filterVal) return false;
      } else {
        if (!cellStr.toLowerCase().includes(filterVal.trim().toLowerCase())) {
          return false;
        }
      }
    }

    if (q) {
      const matchesGlobal = columns.some((col) =>
        String(row[col] ?? '')
          .toLowerCase()
          .includes(q)
      );
      if (!matchesGlobal) return false;
    }

    return true;
  });
}

function csvEscape(value: SheetCellValue): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function tsvEscape(value: SheetCellValue): string {
  return String(value ?? '')
    .replace(/\t/g, ' ')
    .replace(/\r?\n/g, ' ');
}

export function sheetToCSV(sheet: ReportSheet): string {
  const header = sheet.columns.map(csvEscape).join(',');
  const lines = sheet.rows.map((row) =>
    sheet.columns.map((col) => csvEscape(row[col] ?? '')).join(',')
  );
  return [header, ...lines].join('\n');
}

export function sheetToTSV(sheet: ReportSheet): string {
  const header = sheet.columns.map(tsvEscape).join('\t');
  const lines = sheet.rows.map((row) =>
    sheet.columns.map((col) => tsvEscape(row[col] ?? '')).join('\t')
  );
  return [header, ...lines].join('\n');
}

export function downloadSheetCSV(sheet: ReportSheet): void {
  const csv = sheetToCSV(sheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sheet.sheetName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildWorkbook(sheets: ReportSheet[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    // Excel sheet names max 31 chars, disallow : \ / ? * [ ]
    const safeName = sheet.sheetName.replace(/[:\\/?*[\]]/g, '_').slice(0, 31);
    const aoa: SheetCellValue[][] = [
      sheet.columns,
      ...sheet.rows.map((r) => sheet.columns.map((col) => r[col] ?? '')),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    sheet.columns.forEach((col, colIdx) => {
      if (isCurrencyTargetColumn(col)) {
        for (let rIdx = 1; rIdx <= sheet.rows.length; rIdx += 1) {
          const cellRef = XLSX.utils.encode_cell({ r: rIdx, c: colIdx });
          if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
            ws[cellRef].z = '₱#,##0.00';
          }
        }
      }
    });
    ws['!cols'] = sheet.columns.map((col) => {
      const sampleMax = sheet.rows
        .slice(0, 50)
        .reduce((max, r) => Math.max(max, String(r[col] ?? '').length), col.length);
      return { wch: Math.min(42, Math.max(12, sampleMax + 3)) };
    });
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  }
  return wb;
}

export function downloadAllSheetsXLSX(
  sheets: ReportSheet[],
  filename = 'Mancom_AR_Report_All_Sheets.xlsx'
): void {
  const wb = buildWorkbook(sheets);
  XLSX.writeFile(wb, filename);
}

export function buildAllReportSheets(
  data: ARReportData,
  targetBenchmark: number,
  rawCsvText?: string,
  supplementalSheet?: ReportSheet | null
): ReportSheet[] {
  const clampedTarget = Math.min(100, Math.max(75, targetBenchmark));
  const managers = data.managerSummaries ?? [];
  const novEndDay = getLastUpdatedDay(data.lastUpdated);
  const allMetrics = computeARMetrics(data, 'all', clampedTarget);
  const sepMetrics = computeARMetrics(data, 'ytd_sep', clampedTarget);
  const octMetrics = computeARMetrics(data, 'oct_ar', clampedTarget);

  // Sheet 1: Executive_KPI_Summary
  const ytdAugBilled = round2(managers.reduce((s, m) => s + m.ytdAugBilled, 0));
  const sepBilled = round2(managers.reduce((s, m) => s + m.sepBilled, 0));
  const sepOnlyBilling =
    ytdAugBilled + sepBilled > 0 ? round2(ytdAugBilled + sepBilled) : sepMetrics.totalBilling;
  const sepOnlyCollected =
    managers.length > 0
      ? round2(managers.reduce((s, m) => s + m.ytdAugCollected + m.sepCollected, 0))
      : sepMetrics.totalCollections;
  const sepOnlyBalance = round2(sepOnlyBilling - sepOnlyCollected);
  const sepOnlyEff =
    sepOnlyBilling > 0 ? round2((sepOnlyCollected / sepOnlyBilling) * 100) : 0;
  const sepTargetAmt = round2(sepOnlyBilling * (clampedTarget / 100));
  const sepVariance = round2(sepTargetAmt - sepOnlyCollected);

  const execRows: Array<Record<string, SheetCellValue>> = [
    {
      Section: 'YTD October (All Portfolios)',
      Metric: 'Total Billing YTD',
      'Amount / Value': allMetrics.totalBilling,
      Unit: 'PHP',
      Notes: `YTD Sep: ${allMetrics.billingBreakdown.ytdSep.toFixed(2)} | Oct AR: ${allMetrics.billingBreakdown.octAr.toFixed(2)}`,
    },
    {
      Section: 'YTD October (All Portfolios)',
      Metric: 'Total Collections',
      'Amount / Value': allMetrics.totalCollections,
      Unit: 'PHP',
      Notes: `YTD Sep: ${allMetrics.collectionsBreakdown.ytdSep.toFixed(2)} | Oct AR: ${allMetrics.collectionsBreakdown.octAr.toFixed(2)}`,
    },
    {
      Section: 'YTD October (All Portfolios)',
      Metric: 'YTD AR Balance',
      'Amount / Value': allMetrics.arBalance,
      Unit: 'PHP',
      Notes: `YTD Sep: ${allMetrics.arBalanceBreakdown.ytdSep.toFixed(2)} | Oct AR: ${allMetrics.arBalanceBreakdown.octAr.toFixed(2)}`,
    },
    {
      Section: 'YTD October (All Portfolios)',
      Metric: 'Collection Efficiency (%)',
      'Amount / Value': allMetrics.collectionEfficiency,
      Unit: '%',
      Notes: `${Math.abs(allMetrics.efficiencyGapToTarget).toFixed(2)}% ${allMetrics.isAboveOrAtTarget ? 'above' : 'below'} ${clampedTarget.toFixed(1)}% target (Sep: ${allMetrics.priorMonthEfficiency.toFixed(2)}%)`,
    },
    {
      Section: 'YTD October (All Portfolios)',
      Metric: `${clampedTarget.toFixed(1)}% Collection Target Amount`,
      'Amount / Value': allMetrics.targetAmount,
      Unit: 'PHP',
      Notes: 'Total Billing YTD × Target Benchmark %',
    },
    {
      Section: 'YTD October (All Portfolios)',
      Metric: allMetrics.isAboveOrAtTarget ? 'Surplus Above Target' : 'Variance Against Target',
      'Amount / Value': allMetrics.isAboveOrAtTarget
        ? allMetrics.absoluteVariance
        : allMetrics.varianceAgainstTarget,
      Unit: 'PHP',
      Notes: 'Target Amount minus Actual Collections',
    },
    {
      Section: 'YTD September (Excl. Oct/Nov New AR)',
      Metric: 'YTD Sep Billing',
      'Amount / Value': sepOnlyBilling,
      Unit: 'PHP',
      Notes: `YTD Aug: ${ytdAugBilled.toFixed(2)} | Sep AR: ${sepBilled.toFixed(2)}`,
    },
    {
      Section: 'YTD September (Excl. Oct/Nov New AR)',
      Metric: 'YTD Sep Collection',
      'Amount / Value': sepOnlyCollected,
      Unit: 'PHP',
      Notes: 'Realized cash inflow on YTD September Billing',
    },
    {
      Section: 'YTD September (Excl. Oct/Nov New AR)',
      Metric: 'YTD Sep AR Balance',
      'Amount / Value': sepOnlyBalance,
      Unit: 'PHP',
      Notes: 'Remaining Open Balance of YTD September Billing',
    },
    {
      Section: 'YTD September (Excl. Oct/Nov New AR)',
      Metric: 'YTD Sep Collection Efficiency (%)',
      'Amount / Value': sepOnlyEff,
      Unit: '%',
      Notes: `Target ${clampedTarget.toFixed(1)}% = ${sepTargetAmt.toFixed(2)} | Variance = ${sepVariance.toFixed(2)}`,
    },
    {
      Section: 'October AR (FTM New Billing)',
      Metric: 'October AR Billing',
      'Amount / Value': octMetrics.totalBilling,
      Unit: 'PHP',
      Notes: 'Billed Amount tagged October 2026',
    },
    {
      Section: 'October AR (FTM New Billing)',
      Metric: 'October AR Collections',
      'Amount / Value': octMetrics.totalCollections,
      Unit: 'PHP',
      Notes: 'Collections on October 2026 AR',
    },
    {
      Section: 'October AR (FTM New Billing)',
      Metric: 'October AR Remaining Balance',
      'Amount / Value': octMetrics.arBalance,
      Unit: 'PHP',
      Notes: `Efficiency: ${octMetrics.collectionEfficiency.toFixed(2)}%`,
    },
    {
      Section: `Post-Sept Recovery Flow (Oct 1 - Nov ${novEndDay})`,
      Metric: 'Oct 1-31 Collection (YTD Sep AR)',
      'Amount / Value': round2(data.recoveryFlows.oct1To31SepAr),
      Unit: 'PHP',
      Notes: 'AR TAG < Focus Month & OR DATE in Focus Month',
    },
    {
      Section: `Post-Sept Recovery Flow (Oct 1 - Nov ${novEndDay})`,
      Metric: `Nov 1-${novEndDay} Collection (YTD Sep AR)`,
      'Amount / Value': round2(data.recoveryFlows.nov1To9SepAr),
      Unit: 'PHP',
      Notes: 'AR TAG < Focus Month & OR DATE in Nov',
    },
    {
      Section: `Post-Sept Recovery Flow (Oct 1 - Nov ${novEndDay})`,
      Metric: 'Collection (Oct & Nov AR)',
      'Amount / Value': round2(data.recoveryFlows.collectionOctAr),
      Unit: 'PHP',
      Notes: 'AR TAG >= Focus Month & OR DATE >= Focus Month',
    },
    {
      Section: `Post-Sept Recovery Flow (Oct 1 - Nov ${novEndDay})`,
      Metric: 'Total Early Oct - Nov Impact',
      'Amount / Value': allMetrics.totalRecoveryImpact,
      Unit: 'PHP',
      Notes: `${allMetrics.recoveryShareOfCollectionsPct.toFixed(2)}% of total collections`,
    },
  ];

  const sheet1: ReportSheet = {
    id: 'exec_summary',
    sheetName: 'Executive_KPI_Summary',
    title: 'Executive KPI & Recovery Summary (Pages 1, 2, 7)',
    description:
      'High-level YTD October, YTD September, October FTM, Target Benchmark Variance, and Post-Sept Cash Inflow KPIs derived directly from the linked AppSheet spreadsheet.',
    columns: ['Section', 'Metric', 'Amount / Value', 'Unit', 'Notes'],
    rows: execRows,
  };

  // Sheet 2: Portfolio_by_Manager (Pages 3 & 8)
  const portfolioRows = managers.map((m) => {
    const proj = computeManagerTargetProjection(m, clampedTarget);
    const ytdArWithOctNov = round2(m.ytdSepPreOctOpen + m.octBilled + m.novBilled);
    const octAndNovColl = round2(m.octCollected + m.novCollected);
    const overallEff =
      m.totalBilled > 0 ? round2((m.totalCollected / m.totalBilled) * 100) : 0;

    return {
      MANCOM: m.mancom,
      'Account Manager': m.manager,
      'YTD Aug Pre-Oct A/R': m.ytdAugOpen,
      'Sept Pre-Oct A/R': m.sepOpen,
      'YTD Sept Pre-Oct Balance': m.ytdSepPreOctOpen,
      'Oct 1-31 Recovery': m.oct1To31SepColl,
      [`Nov 1-${novEndDay} Recovery`]: m.nov1To9SepColl,
      'Total Sep Recovery Colln': m.totalSepRecoveryColl,
      'AR YTD Sept Remaining': m.ytdSepRemainingOpen,
      'Oct Billing (New AR)': m.octBilled,
      'Oct AR Collected': m.octCollected,
      'Nov Billing (New AR)': m.novBilled,
      'Nov AR Collected': m.novCollected,
      'YTD AR (Pre-Oct + Oct/Nov)': ytdArWithOctNov,
      'Oct & Nov New AR Colln': octAndNovColl,
      'Total Billed YTD': m.totalBilled,
      'Total Collected YTD': m.totalCollected,
      'Total Remaining Balance': m.totalRemaining,
      [`Required for ${clampedTarget.toFixed(1)}% Target (YTD Sep)`]:
        proj.additionalNeededForTarget,
      'YTD Sep Efficiency (%)': proj.ytdSepEfficiencyPct ?? 0,
      'Overall Efficiency (%)': overallEff,
    };
  });

  const sheet2: ReportSheet = {
    id: 'portfolio_manager',
    sheetName: 'Portfolio_by_Manager',
    title: 'Portfolio by MANCOM & Account Manager (Pages 3 & 8)',
    description:
      'Complete manager-level billing, pre-Oct open A/R, subsequent Oct/Nov recoveries, new Oct/Nov billings, remaining open balances, and target gap.',
    columns:
      portfolioRows.length > 0
        ? Object.keys(portfolioRows[0])
        : [
            'MANCOM',
            'Account Manager',
            'YTD Aug Pre-Oct A/R',
            'Sept Pre-Oct A/R',
            'YTD Sept Pre-Oct Balance',
            'Oct 1-31 Recovery',
            `Nov 1-${novEndDay} Recovery`,
            'Total Sep Recovery Colln',
            'AR YTD Sept Remaining',
            'Oct Billing (New AR)',
            'Oct AR Collected',
            'Total Remaining Balance',
          ],
    rows: portfolioRows,
  };

  // Sheet 3: Weekly_Collections (Page 4)
  const weeklyRows = [...managers]
    .sort((a, b) => b.ytdSepPreOctOpen - a.ytdSepPreOctOpen)
    .map((m) => ({
      'AREA MANAGER': m.manager,
      MANCOM: m.mancom,
      'YTD SEPTEMBER BALANCE': m.ytdSepPreOctOpen,
      'Oct 1-Oct 31': m.oct1To31SepColl,
      [`Nov 1-Nov ${novEndDay}`]: m.nov1To9SepColl,
      'TOTAL COLLECTED (SEP AR)': m.totalSepRecoveryColl,
      'YTD SEP AR BALANCE': m.ytdSepRemainingOpen,
      'OCTOBER BILLINGS': m.octBilled,
      'OCTOBER COLLECTIONS': m.octCollected,
      'YTD BALANCE': m.totalRemaining,
    }));

  const sheet3: ReportSheet = {
    id: 'weekly_collections',
    sheetName: 'Weekly_Collections',
    title: 'Weekly & Period Collections Monitoring (Page 4)',
    description: `Area Manager monitoring of YTD September Balance, Oct 1-31 and Nov 1-${novEndDay} recoveries, October New Billings & Collections, and YTD Remaining Balance.`,
    columns: [
      'AREA MANAGER',
      'MANCOM',
      'YTD SEPTEMBER BALANCE',
      'Oct 1-Oct 31',
      `Nov 1-Nov ${novEndDay}`,
      'TOTAL COLLECTED (SEP AR)',
      'YTD SEP AR BALANCE',
      'OCTOBER BILLINGS',
      'OCTOBER COLLECTIONS',
      'YTD BALANCE',
    ],
    rows: weeklyRows,
  };

  // Sheet 4: Target_Projection (Pages 5 & 6)
  const targetColLabel = `Required for ${clampedTarget.toFixed(1)}% Target`;
  const projBalColLabel = `Projected Bal at ${clampedTarget.toFixed(1)}%`;
  const targetRows = managers.map((m) => {
    const proj = computeManagerTargetProjection(m, clampedTarget);
    const octNovNewColln = round2(m.octCollected + m.novCollected);
    return {
      MANCOM: m.mancom,
      'Account Manager': m.manager,
      'YTD Sep Billed': proj.ytdSepOnlyBilled,
      'YTD Sep Collected': proj.ytdSepOnlyCollected,
      'AR YTD Sept Bal': m.ytdSepRemainingOpen,
      [targetColLabel]: proj.additionalNeededForTarget,
      [projBalColLabel]: proj.projectedRemainingAtTarget,
      'YTD Sep Eff (%)': proj.ytdSepEfficiencyPct ?? 0,
      'Oct 1-31 Sep Recovery': m.oct1To31SepColl,
      [`Nov 1-${novEndDay} Sep Recovery`]: m.nov1To9SepColl,
      'Oct & Nov New AR Colln': octNovNewColln,
      'Total Remaining Balance': m.totalRemaining,
    };
  });

  const sheet4: ReportSheet = {
    id: 'target_projection',
    sheetName: 'Target_Projection',
    title: 'Target Collection Gap & Recovery Schedule (Pages 5 & 6)',
    description:
      'Spreadsheet-derived target collection shortfall per Account Manager at the active efficiency benchmark, alongside period cash recoveries.',
    columns: [
      'MANCOM',
      'Account Manager',
      'YTD Sep Billed',
      'YTD Sep Collected',
      'AR YTD Sept Bal',
      targetColLabel,
      projBalColLabel,
      'YTD Sep Eff (%)',
      'Oct 1-31 Sep Recovery',
      `Nov 1-${novEndDay} Sep Recovery`,
      'Oct & Nov New AR Colln',
      'Total Remaining Balance',
    ],
    rows: targetRows,
  };

  // Sheet 5: AR_Aging_Summary (Page 9)
  const agingGrandTotal = round2(managers.reduce((s, m) => s + m.totalRemaining, 0));
  const agingRows = [...managers]
    .sort((a, b) => b.totalRemaining - a.totalRemaining)
    .map((m, i) => ({
      '#': i + 1,
      'ACCOUNT MANAGER': m.manager,
      Current: m.agingCurrent,
      '1-30 days': m.aging1To30,
      '31-60 days': m.aging31To60,
      '61-90 days': m.aging61To90,
      '91 days above': m.aging91Above,
      'Grand Total': m.totalRemaining,
      '% per AM':
        agingGrandTotal > 0 ? round2((m.totalRemaining / agingGrandTotal) * 100) : 0,
    }));

  const sheet5: ReportSheet = {
    id: 'aging_summary',
    sheetName: 'AR_Aging_Summary',
    title: 'AR Aging Summary by Account Manager (Page 9)',
    description:
      'Remaining open balance bucketed across Current, 1-30 days, 31-60 days, 61-90 days, and 91 days above per Account Manager.',
    columns: [
      '#',
      'ACCOUNT MANAGER',
      'Current',
      '1-30 days',
      '31-60 days',
      '61-90 days',
      '91 days above',
      'Grand Total',
      '% per AM',
    ],
    rows: agingRows,
  };

  // Sheet 6: Collection_Eff_Matrix (Page 10)
  const matrix = data.cohortMatrix;
  const orCols = matrix?.orMonthColumns ?? [];
  const cohortColumns = [
    '#',
    'Month (AR TAG)',
    'Target Billed',
    ...orCols,
    'Total Collection',
    'Remaining Balance',
    'YTD Coll Eff Per Target (%)',
    'YTD Coll Eff (All) (%)',
  ];
  const cohortSheetRows: Array<Record<string, SheetCellValue>> = (matrix?.rows ?? []).map(
    (row, idx) => {
      const rec: Record<string, SheetCellValue> = {
        '#': idx + 1,
        'Month (AR TAG)': row.arTag,
        'Target Billed': row.billedTarget,
      };
      orCols.forEach((col) => {
        rec[col] = row.monthlyCollections[col] ?? 0;
      });
      rec['Total Collection'] = row.totalCollection;
      rec['Remaining Balance'] = row.remainingBalance;
      rec['YTD Coll Eff Per Target (%)'] = row.effPerTargetPct ?? '';
      rec['YTD Coll Eff (All) (%)'] = row.ytdCumEffPct ?? '';
      return rec;
    }
  );

  const sheet6: ReportSheet = {
    id: 'cohort_matrix',
    sheetName: 'Collection_Eff_Matrix',
    title: 'Collection Efficiency Matrix (Page 10)',
    description:
      'Billing month (AR TAG) × OR Collection month (OR DATE) matrix tracking monthly cash realization and cumulative YTD collection efficiency.',
    columns: cohortColumns,
    rows: cohortSheetRows,
  };

  // Sheet 7: Balance_by_Service_Type (Page 11 Treemap)
  const services = data.serviceBalances ?? [];
  const svcTotalBilled = round2(services.reduce((s, item) => s + item.billed, 0));
  const svcTotalCollections = round2(services.reduce((s, item) => s + item.collections, 0));
  const svcTotalRemaining = round2(
    services.reduce((s, item) => s + item.remainingBalance, 0)
  );
  const serviceRows: Array<Record<string, SheetCellValue>> = services.map((s, idx) => ({
    '#': idx + 1,
    'SERVICE TYPE': s.serviceType,
    'Billed Amount': s.billed,
    Collections: s.collections,
    'Remaining Balance': s.remainingBalance,
    '% of Open AR':
      svcTotalRemaining > 0 ? round2((s.remainingBalance / svcTotalRemaining) * 100) : 0,
  }));
  if (serviceRows.length > 0) {
    serviceRows.push({
      '#': '',
      'SERVICE TYPE': 'Grand Total',
      'Billed Amount': svcTotalBilled,
      Collections: svcTotalCollections,
      'Remaining Balance': svcTotalRemaining,
      '% of Open AR': svcTotalRemaining > 0 ? 100 : 0,
    });
  }

  const sheet7: ReportSheet = {
    id: 'service_balances',
    sheetName: 'Balance_by_Service_Type',
    title: 'AR Balance by Service Type (Page 11 Treemap)',
    description:
      'Billed amount, collections, and remaining open balance segmented by Service Type.',
    columns: [
      '#',
      'SERVICE TYPE',
      'Billed Amount',
      'Collections',
      'Remaining Balance',
      '% of Open AR',
    ],
    rows: serviceRows,
  };

  // Sheet 8: Client_Aging_Breakdown (Page 11 Client Table)
  const rawClients = data.clientAgingRows ?? [];
  const clientRows: Array<Record<string, SheetCellValue>> = rawClients.map((c, idx) => ({
    '#': idx + 1,
    CLIENT: c.client,
    Current: c.agingCurrent,
    '1-30 days': c.aging1To30,
    '31-60 days': c.aging31To60,
    '61-90 days': c.aging61To90,
    '91 days above': c.aging91Above,
    'Grand Total': c.grandTotal,
  }));
  if (clientRows.length > 0) {
    clientRows.push({
      '#': '',
      CLIENT: 'Grand Total',
      Current: round2(rawClients.reduce((s, c) => s + c.agingCurrent, 0)),
      '1-30 days': round2(rawClients.reduce((s, c) => s + c.aging1To30, 0)),
      '31-60 days': round2(rawClients.reduce((s, c) => s + c.aging31To60, 0)),
      '61-90 days': round2(rawClients.reduce((s, c) => s + c.aging61To90, 0)),
      '91 days above': round2(rawClients.reduce((s, c) => s + c.aging91Above, 0)),
      'Grand Total': round2(rawClients.reduce((s, c) => s + c.grandTotal, 0)),
    });
  }

  const sheet8: ReportSheet = {
    id: 'client_aging',
    sheetName: 'Client_Aging_Breakdown',
    title: 'Client × Aging Remaining Balance Breakdown (Page 11)',
    description:
      'All active clients sorted by remaining open AR balance across aging buckets.',
    columns: [
      '#',
      'CLIENT',
      'Current',
      '1-30 days',
      '31-60 days',
      '61-90 days',
      '91 days above',
      'Grand Total',
    ],
    rows: clientRows,
  };

  // Sheet 9: AR_Monitoring_Raw_Ledger (Direct Linked AppSheet Ledger Rows)
  let rawColumns: string[] = ['Notice'];
  let rawLedgerRows: Array<Record<string, SheetCellValue>> = [
    {
      Notice:
        'Raw ledger rows will appear automatically once the linked AR_MONITORING_FOR_APPSHEET CSV is loaded.',
    },
  ];

  if (rawCsvText && rawCsvText.trim()) {
    const parsedGrid = parseCSVRows(rawCsvText);
    if (parsedGrid.length >= 2) {
      const rawHeaderCells = [...parsedGrid[0]];
      while (rawHeaderCells.length > 0 && !rawHeaderCells[rawHeaderCells.length - 1].trim()) {
        rawHeaderCells.pop();
      }
      const allHeaders = rawHeaderCells.map((h, i) => {
        const clean = h.trim();
        return clean || `Column_${i + 1}`;
      });
      const headerUpper = allHeaders.map((h) => h.toUpperCase());
      const billedCol = headerUpper.indexOf('BILLED AMOUNT');
      const collCol = headerUpper.indexOf('COLLECTION');
      const remCol = headerUpper.indexOf('REMAINING BALANCE');
      const arTagCol = headerUpper.indexOf('AR TAG');
      const biDateCol = headerUpper.indexOf('BI DATE');

      const visibleColumns = allHeaders
        .map((name, idx) => ({ name, idx }))
        .filter(({ name }) => !RAW_LEDGER_EXCLUDED_COLUMNS.has(name.trim().toUpperCase()));

      const activeRows: Array<Record<string, SheetCellValue>> = [];
      for (let r = 1; r < parsedGrid.length; r += 1) {
        const line = parsedGrid[r];
        if (line.every((cell) => !cell.trim())) continue;

        if (billedCol >= 0 && collCol >= 0) {
          const b = parseAccountingNumber(line[billedCol]);
          const c = parseAccountingNumber(line[collCol]);
          const rem = remCol >= 0 ? parseAccountingNumber(line[remCol]) : 0;
          const arVal = (
            (arTagCol >= 0 ? line[arTagCol] : '') ||
            (biDateCol >= 0 ? line[biDateCol] : '') ||
            ''
          ).trim();
          if (b === 0 && c === 0 && rem === 0 && !arVal) {
            continue;
          }
        }

        const rowObj: Record<string, SheetCellValue> = {};
        visibleColumns.forEach(({ name, idx }) => {
          rowObj[name] = (line[idx] ?? '').trim();
        });
        activeRows.push(rowObj);
      }

      rawColumns = visibleColumns.map((c) => c.name);
      rawLedgerRows = activeRows;
    }
  }

  const sheet9: ReportSheet = {
    id: 'raw_ledger',
    sheetName: 'AR_Monitoring_Raw_Ledger',
    title: 'Linked AppSheet Source Ledger (AR_MONITORING_FOR_APPSHEET)',
    description:
      'Active invoice & collection rows directly from the linked AppSheet AR Monitoring spreadsheet (internal tax/adjustment reference columns hidden).',
    columns: rawColumns,
    rows: rawLedgerRows,
  };

  return [
    sheet1,
    sheet2,
    sheet3,
    sheet4,
    sheet5,
    sheet6,
    sheet7,
    sheet8,
    sheet9,
    ...(supplementalSheet ? [supplementalSheet] : []),
  ];
}
