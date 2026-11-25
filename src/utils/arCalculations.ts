import {
  ARLineItem,
  ARReportData,
  ClientAgingRow,
  CohortMatrixData,
  CohortMatrixRow,
  ComputedARMetrics,
  CSVParseResult,
  DimensionSummary,
  ManagerLedgerSummary,
  OpenInvoiceItem,
  PortfolioBreakdowns,
  PortfolioSegment,
  RecoveryFlowItem,
  SegmentBreakdowns,
  ServiceBalanceSummary,
} from '../types/arReport';

export const APPSHEET_CSV_HEADERS = [
  'COLLEFFTAG (FOR COLL)',
  'BI/SOA',
  'CATEGORY',
  'SERVICE TYPE',
  'AREA MANAGER',
  'TEMP INV #',
  'SOA DATE',
  ' INVOICE #',
  'BI DATE',
  'AR TAG',
  'CLIENT',
  'PARTICULARS',
  'DUE DATE',
  'AGING',
  'VAT SALES',
  'VAT',
  'TOTAL AMOUNT DUE',
  'CM#',
  'GROSS ADJUSTMENT',
  'TAX ADJ',
  'NET ADJ',
  'BILLED AMOUNT',
  'OR#',
  'OR DATE',
  'Check Amount',
  'EWT',
  'COLLECTION',
  'REMAINING BALANCE',
  'CWT',
  ' NET AMOUNT DUE ',
] as const;

export const DEFAULT_MANCOM_BY_MANAGER: Record<string, string> = {
  LYKA: 'LTM',
  JANINE: 'LTM',
  CEZAR: 'LTM',
  ROWENA: 'JOVEN',
  NORIEL: 'JOVEN',
  HARVEY: 'ACC',
  RALPH: 'AMB/RBD',
  ANGIE: 'GHIE',
  KING: 'RBD',
  SANDHER: 'RBD',
};

export interface ManagerTargetProjection {
  ytdSepOnlyBilled: number;
  ytdSepOnlyCollected: number;
  ytdSepPreOctCollected: number;
  targetCollectionRequired: number;
  additionalNeededForTarget: number;
  projectedRemainingAtTarget: number;
  ytdSepEfficiencyPct: number | null;
}

export function computeManagerTargetProjection(
  m: ManagerLedgerSummary,
  targetBenchmark: number
): ManagerTargetProjection {
  const clampedTarget = Math.min(100, Math.max(75, targetBenchmark));
  const ytdSepOnlyBilled = round2(m.ytdAugBilled + m.sepBilled);
  const ytdSepOnlyCollected = round2(m.ytdAugCollected + m.sepCollected);
  const ytdSepPreOctCollected = round2(ytdSepOnlyCollected - m.totalSepRecoveryColl);
  const targetCollectionRequired = round2(ytdSepOnlyBilled * (clampedTarget / 100));
  const rawShortfall = round2(targetCollectionRequired - ytdSepOnlyCollected);
  const additionalNeededForTarget = round2(
    Math.min(Math.max(0, m.ytdSepRemainingOpen), Math.max(0, rawShortfall))
  );
  const projectedRemainingAtTarget = round2(m.ytdSepRemainingOpen - additionalNeededForTarget);
  const ytdSepEfficiencyPct =
    ytdSepOnlyBilled > 0 ? round2((ytdSepOnlyCollected / ytdSepOnlyBilled) * 100) : null;

  return {
    ytdSepOnlyBilled,
    ytdSepOnlyCollected,
    ytdSepPreOctCollected,
    targetCollectionRequired,
    additionalNeededForTarget,
    projectedRemainingAtTarget,
    ytdSepEfficiencyPct,
  };
}

const MONTH_NAMES: Record<string, number> = {
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

const AGING_ORDER: Record<string, number> = {
  Current: 1,
  '1-30 days': 2,
  '31-60 days': 3,
  '61-90 days': 4,
  '91 days above': 5,
  Unspecified: 99,
};

export const COLLECTION_PRIORITY_ORDER: Record<string, number> = {
  '91 days above': 1,
  '61-90 days': 2,
  '31-60 days': 3,
  '1-30 days': 4,
  Current: 5,
  Unspecified: 99,
};

export const STANDARD_MODAL_AGING_OPTIONS = [
  'Current',
  '1-30 days',
  '31-60 days',
  '61-90 days',
  '91 days above',
] as const;

export interface AllocatedTargetInvoiceRow {
  serviceType: string;
  clientName: string;
  biNumber: string;
  aging: string;
  particulars: string;
  amountForCollection: number;
  invoiceBalance: number;
  isPartial: boolean;
}

export interface AllocatedTargetInvoiceResult {
  manager: string;
  requiredAmount: number;
  rows: AllocatedTargetInvoiceRow[];
  totalAmount: number;
}

export function allocateTargetInvoices(
  openInvoices: OpenInvoiceItem[] | undefined,
  managerName: string,
  requiredAmount: number,
  fallbackLineItems?: ARLineItem[]
): AllocatedTargetInvoiceResult {
  const target = round2(Math.max(0, requiredAmount));
  if (target <= 0.005) {
    return {
      manager: managerName,
      requiredAmount: 0,
      rows: [],
      totalAmount: 0,
    };
  }

  const normalizedMgr = managerName.trim().toUpperCase();
  const sortOldestFirst = (a: OpenInvoiceItem, b: OpenInvoiceItem) => {
    const actionableA = a.remainingBalance >= 1.0 ? 0 : 1;
    const actionableB = b.remainingBalance >= 1.0 ? 0 : 1;
    if (actionableA !== actionableB) return actionableA - actionableB;
    const pA = COLLECTION_PRIORITY_ORDER[a.aging] ?? 50;
    const pB = COLLECTION_PRIORITY_ORDER[b.aging] ?? 50;
    if (pA !== pB) return pA - pB;
    if (Math.abs(b.remainingBalance - a.remainingBalance) > 0.005) {
      return b.remainingBalance - a.remainingBalance;
    }
    return a.biNumber.localeCompare(b.biNumber);
  };

  const mgrInvoices = (openInvoices ?? []).filter(
    (inv) => inv.areaManager.trim().toUpperCase() === normalizedMgr && inv.remainingBalance > 0.005
  );
  const priorInvoices = mgrInvoices.filter((inv) => inv.isPriorAr).sort(sortOldestFirst);
  const laterInvoices = mgrInvoices.filter((inv) => !inv.isPriorAr).sort(sortOldestFirst);
  const orderedPool = [...priorInvoices, ...laterInvoices];

  const rows: AllocatedTargetInvoiceRow[] = [];
  let remainingNeeded = target;

  for (const inv of orderedPool) {
    if (remainingNeeded <= 0.005) break;
    const fullAmount = round2(inv.remainingBalance);
    if (fullAmount <= 0.005) continue;
    const take = round2(Math.min(fullAmount, remainingNeeded));
    rows.push({
      serviceType: inv.serviceType || 'Unspecified',
      clientName: inv.client,
      biNumber: inv.biNumber,
      aging: inv.aging,
      particulars: inv.particulars || '—',
      amountForCollection: take,
      invoiceBalance: fullAmount,
      isPartial: take + 0.005 < fullAmount,
    });
    remainingNeeded = round2(remainingNeeded - take);
  }

  // Fallback for summary-only datasets or pre-fetch snapshots where openInvoices is absent
  if (rows.length === 0 && (fallbackLineItems?.length ?? 0) > 0) {
    const mgrLines = fallbackLineItems!
      .filter((item) => item.areaManager.trim().toUpperCase() === normalizedMgr && item.remainingBalance > 0.005)
      .sort((a, b) => {
        const pA = COLLECTION_PRIORITY_ORDER[a.agingBucket] ?? 50;
        const pB = COLLECTION_PRIORITY_ORDER[b.agingBucket] ?? 50;
        if (pA !== pB) return pA - pB;
        return b.remainingBalance - a.remainingBalance;
      });
    for (const line of mgrLines) {
      if (remainingNeeded <= 0.005) break;
      const fullAmount = round2(line.remainingBalance);
      if (fullAmount <= 0.005) continue;
      const take = round2(Math.min(fullAmount, remainingNeeded));
      rows.push({
        serviceType: line.serviceType || 'Unspecified',
        clientName: line.client,
        biNumber: 'Summary',
        aging: line.agingBucket,
        particulars: 'Consolidated AR balance',
        amountForCollection: take,
        invoiceBalance: fullAmount,
        isPartial: take + 0.005 < fullAmount,
      });
      remainingNeeded = round2(remainingNeeded - take);
    }
  }

  const totalAmount = round2(rows.reduce((sum, r) => sum + r.amountForCollection, 0));
  return {
    manager: managerName,
    requiredAmount: target,
    rows,
    totalAmount,
  };
}

export interface TargetInvoiceFilterCriteria {
  searchQuery: string;
  serviceType: string;
  aging: string;
}

export interface FilteredTargetInvoicesResult {
  filteredRows: AllocatedTargetInvoiceRow[];
  filteredSubtotal: number;
  serviceTypeOptions: string[];
  agingOptions: string[];
}

export function filterAllocatedInvoices(
  rows: AllocatedTargetInvoiceRow[],
  criteria: TargetInvoiceFilterCriteria
): FilteredTargetInvoicesResult {
  const uniqueServiceTypes = Array.from(
    new Set(rows.map((r) => r.serviceType.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const presentExtraAgings = Array.from(
    new Set(
      rows
        .map((r) => r.aging.trim())
        .filter(
          (ag) =>
            ag &&
            !(STANDARD_MODAL_AGING_OPTIONS as readonly string[]).includes(ag)
        )
    )
  ).sort((a, b) => a.localeCompare(b));

  const agingOptions = [...STANDARD_MODAL_AGING_OPTIONS, ...presentExtraAgings];

  const q = criteria.searchQuery.trim().toLowerCase();
  const svcFilter = criteria.serviceType;
  const agingFilter = criteria.aging;

  const filteredRows = rows.filter((row) => {
    if (svcFilter && svcFilter !== 'ALL' && row.serviceType !== svcFilter) {
      return false;
    }
    if (agingFilter && agingFilter !== 'ALL' && row.aging !== agingFilter) {
      return false;
    }
    if (q) {
      const haystack = `${row.clientName}\n${row.serviceType}\n${row.particulars}`.toLowerCase();
      if (!haystack.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const filteredSubtotal = round2(
    filteredRows.reduce((sum, r) => sum + r.amountForCollection, 0)
  );

  return {
    filteredRows,
    filteredSubtotal,
    serviceTypeOptions: uniqueServiceTypes,
    agingOptions,
  };
}

export interface Page9SummaryMetrics {
  totalBilling: number;
  lessCollection: number;
  projection: number;
  totalCollection: number;
  projectedCollectionEfficiency: number;
}

export function computePage9Summary(
  data: ARReportData,
  targetBenchmark: number
): Page9SummaryMetrics {
  const allMetrics = computeARMetrics(data, 'all', targetBenchmark);
  const projection = round2(
    (data.managerSummaries ?? []).reduce(
      (sum, m) => sum + computeManagerTargetProjection(m, targetBenchmark).additionalNeededForTarget,
      0
    )
  );
  const totalBilling = allMetrics.totalBilling;
  const lessCollection = allMetrics.totalCollections;
  const totalCollection = round2(lessCollection + projection);
  const projectedCollectionEfficiency =
    totalBilling > 0 ? round2((totalCollection / totalBilling) * 100) : 0;

  return {
    totalBilling,
    lessCollection,
    projection,
    totalCollection,
    projectedCollectionEfficiency,
  };
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatPeso(amount: number, showSign = false): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (showSign && amount > 0) return `+₱${formatted}`;
  if (amount < 0) return `-₱${formatted}`;
  return `₱${formatted}`;
}

export function formatNumber(amount: number, decimals = 2): string {
  const rounded = round2(amount);
  return rounded.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatWholeNumber(amount: number): string {
  const rounded = Math.round(amount);
  const normalized = Object.is(rounded, -0) ? 0 : rounded;
  return normalized.toLocaleString('en-PH');
}

export function formatPesoMillions(amount: number): string {
  const millions = amount / 1_000_000;
  const absM = Math.abs(millions).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-₱${absM}M` : `₱${absM}M`;
}

export function formatPercent(value: number, showSign = false): string {
  const rounded = round2(value);
  const absStr = Math.abs(rounded).toFixed(2);
  if (showSign && rounded > 0) return `+${absStr}%`;
  if (rounded < 0) return `-${absStr}%`;
  return `${absStr}%`;
}

export function getSegmentLabel(segment: PortfolioSegment, focusMonth = 'October'): string {
  const shortFocus = focusMonth.split(' ')[0] || 'October';
  switch (segment) {
    case 'ytd_sep':
      return 'YTD September AR';
    case 'oct_ar':
      return `${shortFocus} AR`;
    case 'all':
    default:
      return 'All Portfolios';
  }
}

/**
 * Extracts the day-of-month from `lastUpdated` (e.g. "11/20/2026 1:40:56 PM" -> 20)
 * so recovery date ranges render dynamically as "Nov 1-20" instead of a fixed day.
 */
export function getLastUpdatedDay(lastUpdated: string): number {
  const trimmed = (lastUpdated || '').trim();
  const mdy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdy) {
    const month = Number(mdy[1]);
    const day = Number(mdy[2]);
    if (month === 12) return 30;
    if (day >= 1 && day <= 31) return day;
  }

  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    if (month === 12) return 30;
    if (day >= 1 && day <= 31) return day;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    if (parsed.getMonth() === 11) return 30;
    return parsed.getDate();
  }

  return 20;
}

export function computeARMetrics(
  data: ARReportData,
  segment: PortfolioSegment,
  targetBenchmark: number
): ComputedARMetrics {
  const clampedTarget = Math.min(100, Math.max(75, targetBenchmark));

  const ytdSepArBalance = round2(data.ytdSepBilling - data.ytdSepCollections);
  const octArBalance = round2(data.octArBilling - data.octArCollections);

  let totalBilling = 0;
  let totalCollections = 0;
  let targetBillingBasis = 0;

  if (segment === 'ytd_sep') {
    totalBilling = round2(data.ytdSepBilling);
    totalCollections = round2(data.ytdSepCollections);
    targetBillingBasis = totalBilling;
  } else if (segment === 'oct_ar') {
    totalBilling = round2(data.octArBilling);
    totalCollections = round2(data.octArCollections);
    targetBillingBasis = totalBilling;
  } else {
    totalBilling = round2(data.ytdSepBilling + data.octArBilling);
    totalCollections = round2(data.ytdSepCollections + data.octArCollections);
    targetBillingBasis =
      data.baselineTargetBillingBasis !== undefined
        ? data.baselineTargetBillingBasis
        : totalBilling;
  }

  const arBalance = round2(totalBilling - totalCollections);
  const collectionEfficiency =
    totalBilling > 0 ? round2((totalCollections / totalBilling) * 100) : 0;

  const momDelta = round2(collectionEfficiency - data.priorMonthEfficiency);
  const targetAmount = round2(targetBillingBasis * (clampedTarget / 100));
  const varianceAgainstTarget = round2(targetAmount - totalCollections);
  const absoluteVariance = round2(Math.abs(varianceAgainstTarget));
  const efficiencyGapToTarget = round2(collectionEfficiency - clampedTarget);
  const isAboveOrAtTarget = varianceAgainstTarget <= 0;

  const novEndDay = getLastUpdatedDay(data.lastUpdated);

  const allRecoveryItems: RecoveryFlowItem[] = [
    {
      id: 'oct_1_31_sep',
      label: 'Oct 1–31 Collection (YTD Sep AR)',
      segment: 'ytd_sep',
      period: 'Oct 1 – Oct 31',
      amount: round2(data.recoveryFlows.oct1To31SepAr),
    },
    {
      id: 'nov_1_9_sep',
      label: `Nov 1–${novEndDay} Collection (YTD Sep AR)`,
      segment: 'ytd_sep',
      period: `Nov 1 – Nov ${novEndDay}`,
      amount: round2(data.recoveryFlows.nov1To9SepAr),
    },
    {
      id: 'oct_ar_collection',
      label: 'Collection (Oct & Nov AR)',
      segment: 'oct_ar',
      period: `Oct – Nov ${novEndDay}`,
      amount: round2(data.recoveryFlows.collectionOctAr),
    },
  ];

  const activeRecoveryItems =
    segment === 'all'
      ? allRecoveryItems
      : allRecoveryItems.filter((item) => item.segment === segment);

  const totalRecoveryImpact = round2(
    activeRecoveryItems.reduce((sum, item) => sum + item.amount, 0)
  );

  const recoveryItems = activeRecoveryItems.map((item) => ({
    ...item,
    sharePct:
      totalRecoveryImpact > 0
        ? round2((item.amount / totalRecoveryImpact) * 100)
        : 0,
  }));

  const recoveryYtdSepSubtotal = round2(
    activeRecoveryItems
      .filter((i) => i.segment === 'ytd_sep')
      .reduce((sum, i) => sum + i.amount, 0)
  );

  const recoveryOctArSubtotal = round2(
    activeRecoveryItems
      .filter((i) => i.segment === 'oct_ar')
      .reduce((sum, i) => sum + i.amount, 0)
  );

  const recoveryShareOfCollectionsPct =
    totalCollections > 0
      ? round2((totalRecoveryImpact / totalCollections) * 100)
      : 0;

  const activeBreakdown = data.breakdowns ? data.breakdowns[segment] : undefined;

  return {
    segment,
    segmentLabel: getSegmentLabel(segment, data.focusMonthLabel),
    totalBilling,
    totalCollections,
    arBalance,
    collectionEfficiency,
    priorMonthEfficiency: round2(data.priorMonthEfficiency),
    momDelta,
    targetBenchmark: round2(clampedTarget),
    targetAmount,
    varianceAgainstTarget,
    absoluteVariance,
    efficiencyGapToTarget,
    isAboveOrAtTarget,
    billingBreakdown: {
      ytdSep: round2(data.ytdSepBilling),
      octAr: round2(data.octArBilling),
    },
    collectionsBreakdown: {
      ytdSep: round2(data.ytdSepCollections),
      octAr: round2(data.octArCollections),
    },
    arBalanceBreakdown: {
      ytdSep: ytdSepArBalance,
      octAr: octArBalance,
    },
    recoveryItems,
    totalRecoveryImpact,
    recoveryYtdSepSubtotal,
    recoveryOctArSubtotal,
    recoveryShareOfCollectionsPct,
    novEndDay,
    activeBreakdown,
  };
}

/**
 * Parses an RFC-4180 CSV string supporting multi-line quoted fields and escaped quotes.
 */
export function parseCSVRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const cleanInput = input.replace(/^\uFEFF/, '');

  for (let i = 0; i < cleanInput.length; i += 1) {
    const ch = cleanInput[i];
    if (inQuotes) {
      if (ch === '"') {
        if (cleanInput[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r') {
      if (cleanInput[i + 1] === '\n') {
        i += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function parseAccountingNumber(raw: string | undefined): number {
  if (!raw) return 0;
  let t = raw.trim();
  if (!t || t === '-' || t === '₱-' || t === '₱ -') return 0;

  let isNegative = false;
  if (t.startsWith('(') && t.endsWith(')')) {
    isNegative = true;
    t = t.slice(1, -1).trim();
  }

  t = t.replace(/[₱,\s]/g, '');
  if (!t || t === '-') return 0;

  const parsed = Number(t);
  if (!Number.isFinite(parsed)) return NaN;
  return isNegative ? -parsed : parsed;
}

function parseMonthYearTag(
  tag: string
): { year: number; month: number; key: number; label: string } | null {
  const cleaned = tag.trim();
  if (!cleaned) return null;
  const parts = cleaned.split(/\s+/);
  if (parts.length !== 2) return null;
  const month = MONTH_NAMES[parts[0].toLowerCase()];
  const year = Number(parts[1]);
  if (month === undefined || !Number.isInteger(year) || year < 2000 || year > 2100) {
    return null;
  }
  const canonicalMonth = parts[0][0].toUpperCase() + parts[0].slice(1).toLowerCase();
  return {
    year,
    month,
    key: year * 12 + month,
    label: `${canonicalMonth} ${year}`,
  };
}

function accumulateDimension(
  map: Map<string, { count: number; billed: number; collections: number }>,
  key: string,
  billed: number,
  collections: number
) {
  const label = key.trim() || 'Unspecified';
  const entry = map.get(label) ?? { count: 0, billed: 0, collections: 0 };
  entry.count += 1;
  entry.billed += billed;
  entry.collections += collections;
  map.set(label, entry);
}

function finalizeDimensionList(
  map: Map<string, { count: number; billed: number; collections: number }>,
  mode: 'amount' | 'aging'
): DimensionSummary[] {
  const list: DimensionSummary[] = Array.from(map.entries()).map(([name, val]) => {
    const billed = round2(val.billed);
    const collections = round2(val.collections);
    const balance = round2(billed - collections);
    const efficiency = billed > 0 ? round2((collections / billed) * 100) : 0;
    return {
      name,
      count: val.count,
      billed,
      collections,
      balance,
      efficiency,
    };
  });

  if (mode === 'aging') {
    list.sort((a, b) => (AGING_ORDER[a.name] ?? 50) - (AGING_ORDER[b.name] ?? 50));
  } else {
    list.sort((a, b) => b.billed - a.billed);
  }
  return list;
}

interface ParsedLedgerRow {
  biNumber: string;
  arTag: string;
  arTagKey: number | null;
  orDate: string;
  orDateKey: number | null;
  category: string;
  serviceType: string;
  areaManager: string;
  client: string;
  particulars: string;
  aging: string;
  billed: number;
  collections: number;
  remaining: number;
}

export function parseAppSheetARCSV(
  csvText: string,
  baseData: ARReportData,
  timestamp: string
): CSVParseResult {
  const rows = parseCSVRows(csvText);
  if (rows.length < 2) {
    return {
      ok: false,
      errors: ['CSV must include the AppSheet header row and at least one data row.'],
    };
  }

  const headerIndex = new Map<string, number>();
  rows[0].forEach((cell, idx) => {
    const normalized = cell.trim().toUpperCase();
    if (normalized && !headerIndex.has(normalized)) {
      headerIndex.set(normalized, idx);
    }
  });

  const colIdx = (name: string) => headerIndex.get(name.toUpperCase()) ?? -1;

  const biSoaIdx = colIdx('BI/SOA');
  const invoiceIdx = colIdx('INVOICE #');
  const tempInvIdx = colIdx('TEMP INV #');
  const billedIdx = colIdx('BILLED AMOUNT');
  const collIdx = colIdx('COLLECTION');
  const remIdx = colIdx('REMAINING BALANCE');
  const arTagIdx = colIdx('AR TAG');
  const biDateIdx = colIdx('BI DATE');
  const orDateIdx = colIdx('OR DATE');
  const categoryIdx = colIdx('CATEGORY');
  const serviceIdx = colIdx('SERVICE TYPE');
  const managerIdx = colIdx('AREA MANAGER');
  const clientIdx = colIdx('CLIENT');
  const particularsIdx = colIdx('PARTICULARS');
  const agingIdx = colIdx('AGING');

  const missingHeaders: string[] = [];
  if (billedIdx === -1) missingHeaders.push('BILLED AMOUNT');
  if (collIdx === -1) missingHeaders.push('COLLECTION');
  if (arTagIdx === -1 && biDateIdx === -1) missingHeaders.push('AR TAG');

  if (missingHeaders.length > 0) {
    return {
      ok: false,
      errors: [
        `Missing required AppSheet column(s): ${missingHeaders.join(', ')}. Expected AppSheet AR Monitoring CSV format.`,
      ],
    };
  }

  const ledgerRows: ParsedLedgerRow[] = [];
  const errors: string[] = [];
  let totalNonEmptyRows = 0;

  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r];
    if (row.every((c) => !c.trim())) continue;
    totalNonEmptyRows += 1;

    const rawBilled = row[billedIdx];
    const rawColl = row[collIdx];
    const rawRem = remIdx >= 0 ? row[remIdx] : undefined;

    const billed = parseAccountingNumber(rawBilled);
    const collections = parseAccountingNumber(rawColl);
    const remaining = remIdx >= 0 ? parseAccountingNumber(rawRem) : round2(billed - collections);

    if (Number.isNaN(billed) || Number.isNaN(collections)) {
      if (errors.length < 5) {
        errors.push(`Row ${r + 1} has an invalid numeric value in BILLED AMOUNT or COLLECTION.`);
      }
      continue;
    }

    const biNumber =
      (biSoaIdx >= 0 ? row[biSoaIdx] : '')?.trim() ||
      (invoiceIdx >= 0 ? row[invoiceIdx] : '')?.trim() ||
      (tempInvIdx >= 0 ? row[tempInvIdx] : '')?.trim() ||
      'UNASSIGNED';
    const arTagRaw = ((arTagIdx >= 0 ? row[arTagIdx] : '') || (biDateIdx >= 0 ? row[biDateIdx] : '') || '').trim();
    const orDateRaw = (orDateIdx >= 0 ? row[orDateIdx] : '')?.trim() || '';
    const category = (categoryIdx >= 0 ? row[categoryIdx] : '')?.trim() || 'Unspecified';
    const serviceType = (serviceIdx >= 0 ? row[serviceIdx] : '')?.trim() || 'Unspecified';
    const areaManager = (managerIdx >= 0 ? row[managerIdx] : '')?.trim() || 'Unspecified';
    const client = (clientIdx >= 0 ? row[clientIdx] : '')?.trim() || 'Unspecified';
    const particulars = (particularsIdx >= 0 ? row[particularsIdx] : '')?.trim() || '—';
    const aging = (agingIdx >= 0 ? row[agingIdx] : '')?.trim() || 'Unspecified';

    if (billed === 0 && collections === 0 && remaining === 0 && !arTagRaw) {
      continue;
    }

    const arParsed = parseMonthYearTag(arTagRaw);
    const orParsed = parseMonthYearTag(orDateRaw);

    ledgerRows.push({
      biNumber,
      arTag: arParsed ? arParsed.label : arTagRaw,
      arTagKey: arParsed ? arParsed.key : null,
      orDate: orParsed ? orParsed.label : orDateRaw,
      orDateKey: orParsed ? orParsed.key : null,
      category,
      serviceType,
      areaManager,
      client,
      particulars,
      aging,
      billed,
      collections,
      remaining: Number.isNaN(remaining) ? round2(billed - collections) : remaining,
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  if (ledgerRows.length === 0) {
    return {
      ok: false,
      errors: ['No active financial rows were found in the uploaded AppSheet CSV.'],
    };
  }

  const tagCounts = new Map<number, { label: string; count: number }>();
  for (const row of ledgerRows) {
    if (row.arTagKey !== null) {
      const existing = tagCounts.get(row.arTagKey) ?? { label: row.arTag, count: 0 };
      existing.count += 1;
      tagCounts.set(row.arTagKey, existing);
    }
  }

  const sortedTagKeys = Array.from(tagCounts.keys()).sort((a, b) => a - b);
  let focusMonthKey: number | null = null;
  let focusMonthLabel = 'October 2026';

  if (sortedTagKeys.length >= 2) {
    const latestKey = sortedTagKeys[sortedTagKeys.length - 1];
    const prevKey = sortedTagKeys[sortedTagKeys.length - 2];
    const latestCount = tagCounts.get(latestKey)!.count;
    const prevCount = tagCounts.get(prevKey)!.count;

    if (latestCount < prevCount * 0.25) {
      focusMonthKey = prevKey;
      focusMonthLabel = tagCounts.get(prevKey)!.label;
    } else {
      focusMonthKey = latestKey;
      focusMonthLabel = tagCounts.get(latestKey)!.label;
    }
  } else if (sortedTagKeys.length === 1) {
    focusMonthKey = sortedTagKeys[0];
    focusMonthLabel = tagCounts.get(focusMonthKey)!.label;
  }

  const priorFocusKey = focusMonthKey !== null ? focusMonthKey - 1 : null;
  const nextMonthKey = focusMonthKey !== null ? focusMonthKey + 1 : null;

  let ytdSepBilling = 0;
  let ytdSepCollections = 0;
  let octArBilling = 0;
  let octArCollections = 0;

  let oct1To31SepAr = 0;
  let nov1To9SepAr = 0;
  let collectionOctAr = 0;

  let priorMonthBilled = 0;
  let priorMonthPreFocusCollected = 0;

  const makeDimAccumulators = () => ({
    cat: new Map<string, { count: number; billed: number; collections: number }>(),
    aging: new Map<string, { count: number; billed: number; collections: number }>(),
    mgr: new Map<string, { count: number; billed: number; collections: number }>(),
  });

  const accAll = makeDimAccumulators();
  const accYtdSep = makeDimAccumulators();
  const accOctAr = makeDimAccumulators();

  // Manager Summaries
  const mgrMap = new Map<string, ManagerLedgerSummary>();
  const ensureMgr = (name: string): ManagerLedgerSummary => {
    const existing = mgrMap.get(name);
    if (existing) return existing;
    const item: ManagerLedgerSummary = {
      manager: name,
      mancom: DEFAULT_MANCOM_BY_MANAGER[name.toUpperCase()] ?? 'OTHER',
      ytdAugBilled: 0,
      ytdAugCollected: 0,
      ytdAugOpen: 0,
      sepBilled: 0,
      sepCollected: 0,
      sepOpen: 0,
      ytdSepPreOctOpen: 0,
      oct1To31SepColl: 0,
      nov1To9SepColl: 0,
      totalSepRecoveryColl: 0,
      ytdSepRemainingOpen: 0,
      octBilled: 0,
      octCollected: 0,
      octOpen: 0,
      novBilled: 0,
      novCollected: 0,
      novOpen: 0,
      totalBilled: 0,
      totalCollected: 0,
      totalRemaining: 0,
      agingCurrent: 0,
      aging1To30: 0,
      aging31To60: 0,
      aging61To90: 0,
      aging91Above: 0,
    };
    mgrMap.set(name, item);
    return item;
  };
  // Pre-seed known managers (including SANDHER = 0) so order/presence matches Looker Studio
  Object.keys(DEFAULT_MANCOM_BY_MANAGER).forEach((m) => ensureMgr(m));

  // Cohort Matrix accumulators
  const orKeysSet = new Map<number, string>();
  const cohortRowsMap = new Map<
    number,
    {
      arTag: string;
      billedTarget: number;
      monthlyCollections: Record<string, number>;
      totalCollection: number;
      remainingBalance: number;
    }
  >();

  // Service Type Balance accumulators (for Page 11 treemap)
  const serviceMap = new Map<string, { billed: number; collections: number; remaining: number }>();

  // Client × Aging accumulators (for Page 11 table)
  const clientMap = new Map<string, ClientAgingRow>();

  // Cross-filtering line-item accumulators (client × areaManager × serviceType × agingBucket)
  const lineItemsMap = new Map<string, ARLineItem>();

  // Individual open invoices for Page 5 target collection drill-downs
  const openInvoices: OpenInvoiceItem[] = [];

  for (const row of ledgerRows) {
    const isFocusMonth = focusMonthKey !== null && row.arTagKey === focusMonthKey;
    const isPriorAr = focusMonthKey !== null && row.arTagKey !== null && row.arTagKey < focusMonthKey;
    const isNextMonthAr = nextMonthKey !== null && row.arTagKey === nextMonthKey;

    if (isFocusMonth) {
      octArBilling += row.billed;
      octArCollections += row.collections;
    } else {
      ytdSepBilling += row.billed;
      ytdSepCollections += row.collections;
    }

    if (focusMonthKey !== null && row.orDateKey !== null) {
      if (isPriorAr) {
        if (row.orDateKey === focusMonthKey) {
          oct1To31SepAr += row.collections;
        } else if (nextMonthKey !== null && row.orDateKey === nextMonthKey) {
          nov1To9SepAr += row.collections;
        }
      } else if (
        row.arTagKey !== null &&
        row.arTagKey >= focusMonthKey &&
        row.orDateKey >= focusMonthKey
      ) {
        collectionOctAr += row.collections;
      }
    }

    if (isPriorAr) {
      priorMonthBilled += row.billed;
      if (row.orDateKey === null || (focusMonthKey !== null && row.orDateKey < focusMonthKey)) {
        priorMonthPreFocusCollected += row.collections;
      }
    }

    accumulateDimension(accAll.cat, row.category, row.billed, row.collections);
    accumulateDimension(accAll.aging, row.aging, row.billed, row.collections);
    accumulateDimension(accAll.mgr, row.areaManager, row.billed, row.collections);

    const targetAcc = isFocusMonth ? accOctAr : accYtdSep;
    accumulateDimension(targetAcc.cat, row.category, row.billed, row.collections);
    accumulateDimension(targetAcc.aging, row.aging, row.billed, row.collections);
    accumulateDimension(targetAcc.mgr, row.areaManager, row.billed, row.collections);

    // Manager ledger aggregation
    if (row.areaManager !== 'Unspecified') {
      const m = ensureMgr(row.areaManager);
      m.totalBilled += row.billed;
      m.totalCollected += row.collections;
      m.totalRemaining += row.remaining;

      if (isPriorAr) {
        const isSepAr = priorFocusKey !== null && row.arTagKey === priorFocusKey;
        const collectedPreOct =
          row.orDateKey === null || (focusMonthKey !== null && row.orDateKey < focusMonthKey);

        if (isSepAr) {
          m.sepBilled += row.billed;
          m.sepCollected += row.collections;
          m.sepOpen += row.billed - (collectedPreOct ? row.collections : 0);
        } else {
          m.ytdAugBilled += row.billed;
          m.ytdAugCollected += row.collections;
          m.ytdAugOpen += row.billed - (collectedPreOct ? row.collections : 0);
        }

        if (focusMonthKey !== null && row.orDateKey === focusMonthKey) {
          m.oct1To31SepColl += row.collections;
        } else if (nextMonthKey !== null && row.orDateKey === nextMonthKey) {
          m.nov1To9SepColl += row.collections;
        }
        m.ytdSepRemainingOpen += row.remaining;
      } else if (isFocusMonth) {
        m.octBilled += row.billed;
        m.octCollected += row.collections;
        m.octOpen += row.remaining;
      } else if (isNextMonthAr) {
        m.novBilled += row.billed;
        m.novCollected += row.collections;
        m.novOpen += row.remaining;
      }

      if (row.aging === 'Current') m.agingCurrent += row.remaining;
      else if (row.aging === '1-30 days') m.aging1To30 += row.remaining;
      else if (row.aging === '31-60 days') m.aging31To60 += row.remaining;
      else if (row.aging === '61-90 days') m.aging61To90 += row.remaining;
      else if (row.aging === '91 days above') m.aging91Above += row.remaining;
    }

    // Cohort Matrix (AR TAG × OR DATE)
    if (row.arTagKey !== null) {
      let cohort = cohortRowsMap.get(row.arTagKey);
      if (!cohort) {
        cohort = {
          arTag: row.arTag,
          billedTarget: 0,
          monthlyCollections: {},
          totalCollection: 0,
          remainingBalance: 0,
        };
        cohortRowsMap.set(row.arTagKey, cohort);
      }
      cohort.billedTarget += row.billed;
      cohort.totalCollection += row.collections;
      cohort.remainingBalance += row.remaining;

      if (row.orDateKey !== null && row.orDate) {
        orKeysSet.set(row.orDateKey, row.orDate);
        cohort.monthlyCollections[row.orDate] =
          (cohort.monthlyCollections[row.orDate] ?? 0) + row.collections;
      }
    }

    // Service Type balances
    const svcEntry = serviceMap.get(row.serviceType) ?? {
      billed: 0,
      collections: 0,
      remaining: 0,
    };
    svcEntry.billed += row.billed;
    svcEntry.collections += row.collections;
    svcEntry.remaining += row.remaining;
    serviceMap.set(row.serviceType, svcEntry);

    // Client × Aging pivot
    if (row.client !== 'Unspecified') {
      let cRow = clientMap.get(row.client);
      if (!cRow) {
        cRow = {
          client: row.client,
          aging91Above: 0,
          agingCurrent: 0,
          aging1To30: 0,
          aging31To60: 0,
          aging61To90: 0,
          grandTotal: 0,
        };
        clientMap.set(row.client, cRow);
      }
      if (row.aging === '91 days above') cRow.aging91Above += row.remaining;
      else if (row.aging === 'Current') cRow.agingCurrent += row.remaining;
      else if (row.aging === '1-30 days') cRow.aging1To30 += row.remaining;
      else if (row.aging === '31-60 days') cRow.aging31To60 += row.remaining;
      else if (row.aging === '61-90 days') cRow.aging61To90 += row.remaining;
      cRow.grandTotal += row.remaining;
    }

    // Cross-filtering tuple accumulation
    const lineKey = `${row.client}\u0000${row.areaManager}\u0000${row.serviceType}\u0000${row.aging}`;
    const existingLine = lineItemsMap.get(lineKey);
    if (existingLine) {
      existingLine.remainingBalance += row.remaining;
    } else {
      lineItemsMap.set(lineKey, {
        client: row.client,
        areaManager: row.areaManager,
        serviceType: row.serviceType,
        agingBucket: row.aging,
        remainingBalance: row.remaining,
      });
    }

    if (row.remaining > 0.005) {
      openInvoices.push({
        biNumber: row.biNumber,
        serviceType: row.serviceType,
        client: row.client,
        areaManager: row.areaManager,
        aging: row.aging,
        particulars: row.particulars,
        arTag: row.arTag,
        isPriorAr,
        billed: round2(row.billed),
        collected: round2(row.collections),
        remainingBalance: round2(row.remaining),
      });
    }
  }

  const totalBilling = round2(ytdSepBilling + octArBilling);
  const totalCollections = round2(ytdSepCollections + octArCollections);
  if (totalBilling <= 0) {
    return {
      ok: false,
      errors: ['Combined BILLED AMOUNT across the uploaded CSV must be greater than zero.'],
    };
  }

  const priorMonthEfficiency =
    priorMonthBilled > 0
      ? round2((priorMonthPreFocusCollected / priorMonthBilled) * 100)
      : baseData.priorMonthEfficiency;

  const toSegmentBreakdowns = (acc: ReturnType<typeof makeDimAccumulators>): SegmentBreakdowns => ({
    byCategory: finalizeDimensionList(acc.cat, 'amount'),
    byAging: finalizeDimensionList(acc.aging, 'aging'),
    byAreaManager: finalizeDimensionList(acc.mgr, 'amount'),
  });

  const breakdowns: PortfolioBreakdowns = {
    all: toSegmentBreakdowns(accAll),
    ytd_sep: toSegmentBreakdowns(accYtdSep),
    oct_ar: toSegmentBreakdowns(accOctAr),
  };

  const managerSummaries: ManagerLedgerSummary[] = Array.from(mgrMap.values()).map((m) => ({
    ...m,
    ytdAugBilled: round2(m.ytdAugBilled),
    ytdAugCollected: round2(m.ytdAugCollected),
    ytdAugOpen: round2(m.ytdAugOpen),
    sepBilled: round2(m.sepBilled),
    sepCollected: round2(m.sepCollected),
    sepOpen: round2(m.sepOpen),
    ytdSepPreOctOpen: round2(m.ytdAugOpen + m.sepOpen),
    oct1To31SepColl: round2(m.oct1To31SepColl),
    nov1To9SepColl: round2(m.nov1To9SepColl),
    totalSepRecoveryColl: round2(m.oct1To31SepColl + m.nov1To9SepColl),
    ytdSepRemainingOpen: round2(m.ytdSepRemainingOpen),
    octBilled: round2(m.octBilled),
    octCollected: round2(m.octCollected),
    octOpen: round2(m.octOpen),
    novBilled: round2(m.novBilled),
    novCollected: round2(m.novCollected),
    novOpen: round2(m.novOpen),
    totalBilled: round2(m.totalBilled),
    totalCollected: round2(m.totalCollected),
    totalRemaining: round2(m.totalRemaining),
    agingCurrent: round2(m.agingCurrent),
    aging1To30: round2(m.aging1To30),
    aging31To60: round2(m.aging31To60),
    aging61To90: round2(m.aging61To90),
    aging91Above: round2(m.aging91Above),
  }));

  // Finalize Cohort Matrix
  const sortedOrMonthCols = Array.from(orKeysSet.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, label]) => label);

  const sortedCohortKeys = Array.from(cohortRowsMap.keys()).sort((a, b) => a - b);
  let cumBilled = 0;
  let cumCollected = 0;
  const columnTotals: Record<string, number> = {};
  sortedOrMonthCols.forEach((col) => {
    columnTotals[col] = 0;
  });

  const cohortRows: CohortMatrixRow[] = sortedCohortKeys.map((k) => {
    const raw = cohortRowsMap.get(k)!;
    const billedTarget = round2(raw.billedTarget);
    const totalCollection = round2(raw.totalCollection);
    const remainingBalance = round2(raw.remainingBalance);
    cumBilled += raw.billedTarget;
    cumCollected += raw.totalCollection;

    const monthlyCollections: Record<string, number> = {};
    sortedOrMonthCols.forEach((col) => {
      const val = round2(raw.monthlyCollections[col] ?? 0);
      monthlyCollections[col] = val;
      columnTotals[col] = round2((columnTotals[col] ?? 0) + val);
    });

    return {
      arTag: raw.arTag,
      billedTarget,
      monthlyCollections,
      totalCollection,
      remainingBalance,
      effPerTargetPct: billedTarget > 0 ? round2((totalCollection / billedTarget) * 100) : null,
      ytdCumEffPct: cumBilled > 0 ? round2((cumCollected / cumBilled) * 100) : null,
    };
  });

  const cohortMatrix: CohortMatrixData = {
    orMonthColumns: sortedOrMonthCols,
    rows: cohortRows,
    columnTotals,
    grandTotalBilled: round2(cumBilled),
    grandTotalCollected: round2(cumCollected),
    grandTotalRemaining: round2(cumBilled - cumCollected),
    grandTotalEffPct: cumBilled > 0 ? round2((cumCollected / cumBilled) * 100) : 0,
  };

  const serviceBalances: ServiceBalanceSummary[] = Array.from(serviceMap.entries())
    .map(([serviceType, val]) => ({
      serviceType,
      billed: round2(val.billed),
      collections: round2(val.collections),
      remainingBalance: round2(val.remaining),
    }))
    .filter((s) => s.remainingBalance > 0 || s.billed > 0)
    .sort((a, b) => b.remainingBalance - a.remainingBalance);

  const clientAgingRows: ClientAgingRow[] = Array.from(clientMap.values())
    .map((c) => ({
      ...c,
      aging91Above: round2(c.aging91Above),
      agingCurrent: round2(c.agingCurrent),
      aging1To30: round2(c.aging1To30),
      aging31To60: round2(c.aging31To60),
      aging61To90: round2(c.aging61To90),
      grandTotal: round2(c.grandTotal),
    }))
    .filter((c) => Math.abs(c.grandTotal) >= 0.01)
    .sort((a, b) => b.grandTotal - a.grandTotal);

  const arLineItems: ARLineItem[] = Array.from(lineItemsMap.values())
    .map((item) => ({
      ...item,
      remainingBalance: round2(item.remainingBalance),
    }))
    .filter((item) => Math.abs(item.remainingBalance) >= 0.01)
    .sort((a, b) => b.remainingBalance - a.remainingBalance);

  openInvoices.sort((a, b) => {
    const pA = COLLECTION_PRIORITY_ORDER[a.aging] ?? 50;
    const pB = COLLECTION_PRIORITY_ORDER[b.aging] ?? 50;
    if (pA !== pB) return pA - pB;
    if (Math.abs(b.remainingBalance - a.remainingBalance) > 0.005) {
      return b.remainingBalance - a.remainingBalance;
    }
    return a.biNumber.localeCompare(b.biNumber);
  });

  const data: ARReportData = {
    ...baseData,
    lastUpdated: timestamp,
    ytdSepBilling: round2(ytdSepBilling),
    ytdSepCollections: round2(ytdSepCollections),
    octArBilling: round2(octArBilling),
    octArCollections: round2(octArCollections),
    priorMonthEfficiency,
    baselineTargetBillingBasis: undefined,
    recoveryFlows: {
      oct1To31SepAr: round2(oct1To31SepAr),
      nov1To9SepAr: round2(nov1To9SepAr),
      collectionOctAr: round2(collectionOctAr),
    },
    sourceFormat: 'appsheet',
    sourceRowCount: totalNonEmptyRows,
    sourceActiveRowCount: ledgerRows.length,
    focusMonthLabel,
    breakdowns,
    managerSummaries,
    cohortMatrix,
    serviceBalances,
    clientAgingRows,
    arLineItems,
    openInvoices,
  };

  return {
    ok: true,
    errors: [],
    format: 'appsheet',
    data,
    stats: {
      totalRows: totalNonEmptyRows,
      activeRows: ledgerRows.length,
      totalBilling,
      totalCollections,
      arBalance: round2(totalBilling - totalCollections),
      focusMonthLabel,
    },
  };
}

export function generateCSVTemplate(data: ARReportData): string {
  const header = APPSHEET_CSV_HEADERS.join(',');
  const focus = data.focusMonthLabel || 'October 2026';

  const makeRow = (fields: Partial<Record<(typeof APPSHEET_CSV_HEADERS)[number], string>>) =>
    APPSHEET_CSV_HEADERS.map((col) => {
      const val = fields[col] ?? '';
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(',');

  const ytdSepOpen = Math.max(0, round2(data.ytdSepBilling - data.ytdSepCollections));
  const octOpen = Math.max(0, round2(data.octArBilling - data.octArCollections));
  const ytdPreOctColl = Math.max(
    0,
    round2(
      data.ytdSepCollections -
        data.recoveryFlows.oct1To31SepAr -
        data.recoveryFlows.nov1To9SepAr
    )
  );

  const sampleRows = [
    makeRow({
      'BI/SOA': 'BI-01001',
      CATEGORY: 'AAPMI',
      'SERVICE TYPE': 'PMA - MNGMT FEE',
      'AREA MANAGER': 'CEZAR',
      ' INVOICE #': 'BI-01001',
      'BI DATE': 'September 2026',
      'AR TAG': 'September 2026',
      CLIENT: 'SAMPLE CLIENT A',
      PARTICULARS: 'YTD Sep Prior Collections',
      'DUE DATE': 'September 2026',
      AGING: '91 days above',
      'BILLED AMOUNT': ytdPreOctColl.toFixed(2),
      'OR#': 'OR-1001',
      'OR DATE': 'September 2026',
      COLLECTION: ytdPreOctColl.toFixed(2),
      'REMAINING BALANCE': '0.00',
    }),
    makeRow({
      'BI/SOA': 'BI-01002',
      CATEGORY: 'OTHERS',
      'SERVICE TYPE': 'PMA - STAFF COST',
      'AREA MANAGER': 'KING',
      ' INVOICE #': 'BI-01002',
      'BI DATE': 'August 2026',
      'AR TAG': 'August 2026',
      CLIENT: 'SAMPLE CLIENT B',
      PARTICULARS: 'Oct 1-31 Recovery on YTD Sep AR',
      'DUE DATE': 'August 2026',
      AGING: '61-90 days',
      'BILLED AMOUNT': data.recoveryFlows.oct1To31SepAr.toFixed(2),
      'OR#': 'OR-2001',
      'OR DATE': focus,
      COLLECTION: data.recoveryFlows.oct1To31SepAr.toFixed(2),
      'REMAINING BALANCE': '0.00',
    }),
    makeRow({
      'BI/SOA': 'BI-01003',
      CATEGORY: 'MREIT',
      'SERVICE TYPE': 'PMA - MNGMT FEE',
      'AREA MANAGER': 'ROWENA',
      ' INVOICE #': 'BI-01003',
      'BI DATE': 'September 2026',
      'AR TAG': 'September 2026',
      CLIENT: 'SAMPLE CLIENT C',
      PARTICULARS: `Nov 1-${getLastUpdatedDay(data.lastUpdated)} Recovery + Open YTD Sep AR`,
      'DUE DATE': 'September 2026',
      AGING: '31-60 days',
      'BILLED AMOUNT': round2(data.recoveryFlows.nov1To9SepAr + ytdSepOpen).toFixed(2),
      'OR#': 'OR-3001',
      'OR DATE': 'November 2026',
      COLLECTION: data.recoveryFlows.nov1To9SepAr.toFixed(2),
      'REMAINING BALANCE': ytdSepOpen.toFixed(2),
    }),
    makeRow({
      'BI/SOA': 'BI-02001',
      CATEGORY: 'AAPMI',
      'SERVICE TYPE': 'PMA - MNGMT FEE',
      'AREA MANAGER': 'HARVEY',
      ' INVOICE #': 'BI-02001',
      'BI DATE': focus,
      'AR TAG': focus,
      CLIENT: 'SAMPLE CLIENT D',
      PARTICULARS: 'October AR Billing & Collections',
      'DUE DATE': focus,
      AGING: '1-30 days',
      'BILLED AMOUNT': data.octArBilling.toFixed(2),
      'OR#': 'OR-4001',
      'OR DATE': focus,
      COLLECTION: data.octArCollections.toFixed(2),
      'REMAINING BALANCE': octOpen.toFixed(2),
    }),
  ];

  return [header, ...sampleRows].join('\n');
}

function parseSimpleMetricCSV(
  csvText: string,
  baseData: ARReportData,
  timestamp: string
): CSVParseResult {
  const rows = parseCSVRows(csvText).filter((r) => r.some((c) => c.trim().length > 0));
  if (rows.length < 2) {
    return {
      ok: false,
      errors: ['CSV must include a header row and at least one data row.'],
    };
  }

  const map = new Map<string, number>();
  const errors: string[] = [];

  for (let idx = 0; idx < rows.length; idx += 1) {
    const cells = rows[idx].map((c) => c.trim());
    if (idx === 0 && cells[0]?.toLowerCase().includes('metric')) {
      continue;
    }
    if (cells.length < 2) {
      errors.push(`Row ${idx + 1} is malformed.`);
      continue;
    }

    const key = cells[0].toLowerCase().replace(/^"|"$/g, '').trim();
    const rawVal = cells.length >= 3 ? cells[2] : cells[1];
    const parsedVal = parseAccountingNumber(rawVal);

    if (!Number.isFinite(parsedVal) || parsedVal < 0) {
      errors.push(`Row ${idx + 1} ("${key}") has an invalid numeric value: "${rawVal}".`);
      continue;
    }
    map.set(key, parsedVal);
  }

  const requiredKeys = [
    'ytd_sep_billing',
    'ytd_sep_collections',
    'oct_ar_billing',
    'oct_ar_collections',
    'prior_month_efficiency',
    'oct_1_31_sep_recovery',
    'nov_1_9_sep_recovery',
    'oct_ar_recovery',
  ];

  const missingKeys = requiredKeys.filter((k) => !map.has(k));
  if (missingKeys.length > 0) {
    errors.push(`Missing required metric keys: ${missingKeys.join(', ')}.`);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const ytdSepBilling = map.get('ytd_sep_billing')!;
  const ytdSepCollections = map.get('ytd_sep_collections')!;
  const octArBilling = map.get('oct_ar_billing')!;
  const octArCollections = map.get('oct_ar_collections')!;
  const priorMonthEfficiency = map.get('prior_month_efficiency')!;

  if (ytdSepBilling + octArBilling <= 0) {
    return { ok: false, errors: ['Combined Total Billing must be greater than zero.'] };
  }
  if (priorMonthEfficiency > 100) {
    return { ok: false, errors: ['Prior Month Efficiency (%) cannot exceed 100%.'] };
  }

  return {
    ok: true,
    errors: [],
    format: 'metric_summary',
    data: {
      ...baseData,
      lastUpdated: timestamp,
      ytdSepBilling: round2(ytdSepBilling),
      ytdSepCollections: round2(ytdSepCollections),
      octArBilling: round2(octArBilling),
      octArCollections: round2(octArCollections),
      priorMonthEfficiency: round2(priorMonthEfficiency),
      baselineTargetBillingBasis: undefined,
      sourceFormat: 'manual',
      breakdowns: undefined,
      recoveryFlows: {
        oct1To31SepAr: round2(map.get('oct_1_31_sep_recovery')!),
        nov1To9SepAr: round2(map.get('nov_1_9_sep_recovery')!),
        collectionOctAr: round2(map.get('oct_ar_recovery')!),
      },
    },
  };
}

export function parseARReportCSV(
  csvText: string,
  baseData: ARReportData,
  timestamp: string
): CSVParseResult {
  const trimmed = csvText.trim();
  if (!trimmed) {
    return {
      ok: false,
      errors: ['CSV input is empty. Upload an AppSheet AR Monitoring .csv file or paste CSV rows.'],
    };
  }

  const firstRows = parseCSVRows(trimmed);
  if (firstRows.length < 2) {
    return {
      ok: false,
      errors: ['CSV must include a header row and at least one data row.'],
    };
  }

  const normalizedHeaders = firstRows[0].map((h) => h.trim().toUpperCase());
  const looksLikeMetricSummary =
    normalizedHeaders[0] === 'METRIC_KEY' ||
    (normalizedHeaders.length <= 4 && normalizedHeaders.some((h) => h.includes('METRIC')));

  if (looksLikeMetricSummary) {
    return parseSimpleMetricCSV(trimmed, baseData, timestamp);
  }

  return parseAppSheetARCSV(trimmed, baseData, timestamp);
}

export function generateExecutiveSummaryText(
  data: ARReportData,
  metrics: ComputedARMetrics
): string {
  const varianceDirection = metrics.isAboveOrAtTarget
    ? 'Surplus above Target'
    : 'Variance Against Target (Gap)';
  const gapPhrase = metrics.isAboveOrAtTarget
    ? `${formatPercent(Math.abs(metrics.efficiencyGapToTarget))} above ${metrics.targetBenchmark.toFixed(1)}% target`
    : `${formatPercent(Math.abs(metrics.efficiencyGapToTarget))} below ${metrics.targetBenchmark.toFixed(1)}% target`;

  const recoveryLines = metrics.recoveryItems
    .map((item) => `• ${item.label}: ${formatPeso(item.amount)} (${item.sharePct.toFixed(1)}%)`)
    .join('\n');

  return [
    `${data.title.toUpperCase()}`,
    `${data.subtitle} · Scope: ${metrics.segmentLabel}`,
    `Benchmark Target: ${metrics.targetBenchmark.toFixed(1)}% · Updated: ${data.lastUpdated}`,
    ``,
    `KEY PERFORMANCE INDICATORS`,
    `• Total Billing YTD: ${formatPeso(metrics.totalBilling)} (${formatPesoMillions(metrics.totalBilling)})`,
    `• Total Collections: ${formatPeso(metrics.totalCollections)} (${formatPesoMillions(metrics.totalCollections)})`,
    `• Remaining AR Balance: ${formatPeso(metrics.arBalance)} (${formatPesoMillions(metrics.arBalance)})`,
    `• Collection Efficiency: ${formatPercent(metrics.collectionEfficiency)} (${gapPhrase}; Prior Month ${formatPercent(metrics.priorMonthEfficiency)}, ${formatPercent(metrics.momDelta, true)} MoM)`,
    ``,
    `TARGET VARIANCE ANALYSIS (${metrics.targetBenchmark.toFixed(1)}% BENCHMARK)`,
    `• ${metrics.targetBenchmark.toFixed(1)}% Collection Target Amount: ${formatPeso(metrics.targetAmount)}`,
    `• Actual Collections: ${formatPeso(metrics.totalCollections)}`,
    `• ${varianceDirection}: ${formatPeso(metrics.absoluteVariance)}`,
    ``,
    `POST-SEPT RECOVERY FLOW (OCT 1 – NOV ${getLastUpdatedDay(data.lastUpdated)} CASH INFLOWS)`,
    recoveryLines,
    `• Total Early Oct – Nov Impact: ${formatPeso(metrics.totalRecoveryImpact)} (${metrics.recoveryShareOfCollectionsPct.toFixed(2)}% of active collections)`,
  ].join('\n');
}

export interface EmailDraftPayload {
  subject: string;
  body: string;
  mailtoUrl: string;
}

export function buildEmailDraft(
  data: ARReportData,
  targetBenchmark: number
): EmailDraftPayload {
  const allMetrics = computeARMetrics(data, 'all', targetBenchmark);
  const novEndDay = getLastUpdatedDay(data.lastUpdated);
  const commitmentRange = novEndDay >= 30 ? 'Nov 30' : `Nov ${novEndDay + 1}–30`;
  const targetPctLabel = `${allMetrics.targetBenchmark.toFixed(0)}%`;

  const projectionCommitment = round2(
    (data.managerSummaries ?? []).reduce(
      (sum, m) => sum + computeManagerTargetProjection(m, targetBenchmark).additionalNeededForTarget,
      0
    )
  );
  const varianceAgainstTarget = round2(Math.max(0, allMetrics.varianceAgainstTarget));
  const remainingFromTarget = round2(Math.max(0, varianceAgainstTarget - projectionCommitment));

  const subject = 'Mancom AR Performance Summary';
  const body = [
    'KEY METRICS OVERVIEW',
    `• YTD Billing: ${formatPeso(allMetrics.totalBilling)}`,
    `• YTD Collection: ${formatPeso(allMetrics.totalCollections)}`,
    `• AR Balance: ${formatPeso(allMetrics.arBalance)}`,
    `• Collection Efficiency: ${formatPercent(allMetrics.collectionEfficiency)}`,
    '',
    'POST-SEPTEMBER RECOVERY FLOW & COLLECTION COMMITMENT',
    `• ${targetPctLabel} Collection Target Amount: ${formatPeso(allMetrics.targetAmount)}`,
    `• Actual Collections (YTD September, incl. Oct 1–Nov ${novEndDay}): ${formatPeso(allMetrics.totalCollections)}`,
    `• Variance Against Target: ${formatPeso(varianceAgainstTarget)}`,
    '',
    `• Collection Commitment (${commitmentRange}): ${formatPeso(projectionCommitment)}`,
    `• Actual Collections (Oct 1–Nov ${novEndDay} Total Impact): ${formatPeso(allMetrics.totalRecoveryImpact)}`,
    `  └ October 1–31 Collection (YTD Sep AR): ${formatPeso(data.recoveryFlows.oct1To31SepAr)}`,
    `  └ November 1–${novEndDay} Collection (YTD Sep AR): ${formatPeso(data.recoveryFlows.nov1To9SepAr)}`,
    `  └ Collection (Oct AR): ${formatPeso(data.recoveryFlows.collectionOctAr)}`,
    `• Remaining Balance from Target (${targetPctLabel}): ${formatPeso(remainingFromTarget)}`,
  ].join('\n');

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    subject,
    body,
    mailtoUrl,
  };
}
