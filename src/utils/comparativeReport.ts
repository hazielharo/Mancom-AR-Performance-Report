import { ARLineItem, ARReportData, OpenInvoiceItem } from '../types/arReport';
import {
  AllocatedTargetInvoiceResult,
  allocateTargetInvoices,
  DEFAULT_MANCOM_BY_MANAGER,
  parseAccountingNumber,
  parseCSVRows,
  round2,
} from './arCalculations';

const MONTH_NAMES: Record<string, { index: number; canonical: string; short: string }> = {
  january: { index: 0, canonical: 'January', short: 'Jan' },
  february: { index: 1, canonical: 'February', short: 'Feb' },
  march: { index: 2, canonical: 'March', short: 'Mar' },
  april: { index: 3, canonical: 'April', short: 'Apr' },
  may: { index: 4, canonical: 'May', short: 'May' },
  june: { index: 5, canonical: 'June', short: 'Jun' },
  july: { index: 6, canonical: 'July', short: 'Jul' },
  august: { index: 7, canonical: 'August', short: 'Aug' },
  september: { index: 8, canonical: 'September', short: 'Sep' },
  october: { index: 9, canonical: 'October', short: 'Oct' },
  november: { index: 10, canonical: 'November', short: 'Nov' },
  december: { index: 11, canonical: 'December', short: 'Dec' },
};

export const COMPARATIVE_MANCOM_ORDER: Array<{ mancom: string; managers: string[] }> = [
  { mancom: 'LTM', managers: ['LYKA', 'JANINE', 'CEZAR'] },
  { mancom: 'JOVEN', managers: ['ROWENA', 'NORIEL'] },
  { mancom: 'ACC', managers: ['HARVEY'] },
  { mancom: 'AMB/RBD', managers: ['RALPH'] },
  { mancom: 'GHIE', managers: ['ANGIE'] },
  { mancom: 'RBD', managers: ['KING', 'SANDHER'] },
];

export interface ComparativePeriodOption {
  key: number;
  label: string;
  shortLabel: string;
}

export interface ComparativePeriodRange {
  billingFromKey: number;
  billingToKey: number;
  collectionFromKey: number;
  collectionToKey: number;
}

export interface ComparativeLedgerEntry {
  biNumber: string;
  arTag: string;
  arTagKey: number;
  orDate: string;
  orDateKey: number | null;
  areaManager: string;
  serviceType: string;
  client: string;
  particulars: string;
  aging: string;
  billed: number;
  collections: number;
  remaining: number;
}

export interface ComparativeMonthRow {
  key: number;
  arTag: string;
  shortLabel: string;
  billedAmount: number;
  monthlyCollections: Record<string, number>;
  collectionsWithinWindow: number;
  collectionsOutsideWindow: number;
  remainingBalance: number;
  efficiencyPct: number;
}

export interface ComparativeManagerRow {
  manager: string;
  billedAmount: number;
  collectionsWithinWindow: number;
  collectionsOutsideWindow: number;
  remainingBalance: number;
  efficiencyPct: number;
  agingCurrent: number;
  aging1To30: number;
  aging31To60: number;
  aging61To90: number;
  aging91Above: number;
}

export interface ComparativeManagerTargetRow {
  mancom: string;
  manager: string;
  billedAmount: number;
  collectionsWithinWindow: number;
  remainingBalance: number;
  targetCollectionRequired: number;
  additionalNeededForTarget: number;
  projectedRemainingAtTarget: number;
  efficiencyPct: number;
}

export interface ComparativeManagerTargetGroup {
  mancom: string;
  rows: ComparativeManagerTargetRow[];
}

export interface ComparativeReportKPIs {
  selectedArBilled: number;
  collectionsWithinWindow: number;
  collectionsOutsideWindow: number;
  remainingBalance: number;
  cohortEfficiencyPct: number;
  billingMonthCount: number;
  collectionMonthCount: number;
}

export interface ComparativeMetricBreakdown {
  targetBenchmarkPct: number;
  targetAmount: number;
  actualCollections: number;
  varianceAgainstTarget: number;
  absoluteVariance: number;
  isAboveOrAtTarget: boolean;
}

export interface ComparativeReportSummary {
  kpis: ComparativeReportKPIs;
  metricBreakdown: ComparativeMetricBreakdown;
  activeOrColumns: ComparativePeriodOption[];
  monthlyRows: ComparativeMonthRow[];
  managerRows: ComparativeManagerRow[];
  managerTargetGroups: ComparativeManagerTargetGroup[];
  managerTargetTotals: {
    remainingBalance: number;
    additionalNeededForTarget: number;
    projectedRemainingAtTarget: number;
    projectedEfficiencyPct: number;
  };
  hasManagerBreakdown: boolean;
  totals: {
    billedAmount: number;
    columnTotals: Record<string, number>;
    collectionsWithinWindow: number;
    collectionsOutsideWindow: number;
    remainingBalance: number;
    efficiencyPct: number;
    agingCurrent: number;
    aging1To30: number;
    aging31To60: number;
    aging61To90: number;
    aging91Above: number;
  };
}

export function parseComparativeMonthKey(raw: string): ComparativePeriodOption | null {
  const cleaned = (raw || '').trim();
  if (!cleaned) return null;
  const parts = cleaned.split(/\s+/);
  if (parts.length !== 2) return null;
  const info = MONTH_NAMES[parts[0].toLowerCase()];
  const year = Number(parts[1]);
  if (!info || !Number.isInteger(year) || year < 2000 || year > 2100) {
    return null;
  }
  return {
    key: year * 12 + info.index,
    label: `${info.canonical} ${year}`,
    shortLabel: `${info.short} ${year}`,
  };
}

export function parseComparativeLedgerEntries(rawCsvText?: string): ComparativeLedgerEntry[] {
  if (!rawCsvText || !rawCsvText.trim()) return [];
  const rows = parseCSVRows(rawCsvText);
  if (rows.length < 2) return [];

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
  const managerIdx = colIdx('AREA MANAGER');
  const serviceIdx = colIdx('SERVICE TYPE');
  const clientIdx = colIdx('CLIENT');
  const particularsIdx = colIdx('PARTICULARS');
  const agingIdx = colIdx('AGING');

  if (billedIdx === -1 || collIdx === -1 || (arTagIdx === -1 && biDateIdx === -1)) {
    return [];
  }

  const entries: ComparativeLedgerEntry[] = [];

  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r];
    if (row.every((c) => !c.trim())) continue;

    const billed = parseAccountingNumber(row[billedIdx]);
    const collections = parseAccountingNumber(row[collIdx]);
    const rawRem = remIdx >= 0 ? parseAccountingNumber(row[remIdx]) : round2(billed - collections);
    if (Number.isNaN(billed) || Number.isNaN(collections)) continue;
    const remaining = Number.isNaN(rawRem) ? round2(billed - collections) : rawRem;

    const arTagRaw = ((arTagIdx >= 0 ? row[arTagIdx] : '') || (biDateIdx >= 0 ? row[biDateIdx] : '') || '').trim();
    if (billed === 0 && collections === 0 && remaining === 0 && !arTagRaw) continue;

    const arParsed = parseComparativeMonthKey(arTagRaw);
    if (!arParsed) continue;

    const orDateRaw = (orDateIdx >= 0 ? row[orDateIdx] : '')?.trim() || '';
    const orParsed = parseComparativeMonthKey(orDateRaw);

    const biNumber =
      (biSoaIdx >= 0 ? row[biSoaIdx] : '')?.trim() ||
      (invoiceIdx >= 0 ? row[invoiceIdx] : '')?.trim() ||
      (tempInvIdx >= 0 ? row[tempInvIdx] : '')?.trim() ||
      'UNASSIGNED';

    entries.push({
      biNumber,
      arTag: arParsed.label,
      arTagKey: arParsed.key,
      orDate: orParsed ? orParsed.label : orDateRaw,
      orDateKey: orParsed ? orParsed.key : null,
      areaManager: (managerIdx >= 0 ? row[managerIdx] : '')?.trim() || 'Unspecified',
      serviceType: (serviceIdx >= 0 ? row[serviceIdx] : '')?.trim() || 'Unspecified',
      client: (clientIdx >= 0 ? row[clientIdx] : '')?.trim() || 'Unspecified',
      particulars: (particularsIdx >= 0 ? row[particularsIdx] : '')?.trim() || '—',
      aging: (agingIdx >= 0 ? row[agingIdx] : '')?.trim() || 'Unspecified',
      billed,
      collections,
      remaining,
    });
  }

  return entries;
}

export function extractComparativePeriods(
  data: ARReportData,
  entries?: ComparativeLedgerEntry[]
): {
  billingMonths: ComparativePeriodOption[];
  collectionMonths: ComparativePeriodOption[];
  defaultRange: ComparativePeriodRange;
} {
  const billingMap = new Map<number, ComparativePeriodOption>();
  const collectionMap = new Map<number, ComparativePeriodOption>();

  if (entries && entries.length > 0) {
    for (const entry of entries) {
      if (!billingMap.has(entry.arTagKey)) {
        const parsed = parseComparativeMonthKey(entry.arTag);
        if (parsed) billingMap.set(parsed.key, parsed);
      }
      if (entry.orDateKey !== null && entry.orDate) {
        if (!collectionMap.has(entry.orDateKey)) {
          const parsed = parseComparativeMonthKey(entry.orDate);
          if (parsed) collectionMap.set(parsed.key, parsed);
        }
      }
    }
  }

  // Always ensure matrix periods are also included / used as fallback
  if (billingMap.size === 0 && data.cohortMatrix) {
    for (const row of data.cohortMatrix.rows) {
      const parsed = parseComparativeMonthKey(row.arTag);
      if (parsed) billingMap.set(parsed.key, parsed);
    }
  }
  if (collectionMap.size === 0 && data.cohortMatrix) {
    for (const col of data.cohortMatrix.orMonthColumns) {
      const parsed = parseComparativeMonthKey(col);
      if (parsed) collectionMap.set(parsed.key, parsed);
    }
  }

  const billingMonths = Array.from(billingMap.values()).sort((a, b) => a.key - b.key);
  const collectionMonths = Array.from(collectionMap.values()).sort((a, b) => a.key - b.key);

  const jan2026Billing = billingMonths.find((m) => m.label === 'January 2026');
  const oct2026Billing = billingMonths.find((m) => m.label === 'October 2026');
  const jan2026Collection = collectionMonths.find((m) => m.label === 'January 2026');
  const nov2026Collection = collectionMonths.find((m) => m.label === 'November 2026');

  const firstBillingKey = billingMonths[0]?.key ?? 2026 * 12;
  const lastBillingKey = billingMonths[billingMonths.length - 1]?.key ?? firstBillingKey;
  const firstCollKey = collectionMonths[0]?.key ?? 2026 * 12;
  const lastCollKey = collectionMonths[collectionMonths.length - 1]?.key ?? firstCollKey;

  const billingFromKey = jan2026Billing?.key ?? firstBillingKey;
  const billingToKey = oct2026Billing?.key ?? lastBillingKey;
  const collectionFromKey = jan2026Collection?.key ?? firstCollKey;
  const collectionToKey = nov2026Collection?.key ?? lastCollKey;

  return {
    billingMonths,
    collectionMonths,
    defaultRange: {
      billingFromKey: Math.min(billingFromKey, billingToKey),
      billingToKey: Math.max(billingFromKey, billingToKey),
      collectionFromKey: Math.min(collectionFromKey, collectionToKey),
      collectionToKey: Math.max(collectionFromKey, collectionToKey),
    },
  };
}

export function computeComparativeSummary(
  data: ARReportData,
  range: ComparativePeriodRange,
  entries?: ComparativeLedgerEntry[],
  targetBenchmark = 90
): ComparativeReportSummary {
  const billFrom = Math.min(range.billingFromKey, range.billingToKey);
  const billTo = Math.max(range.billingFromKey, range.billingToKey);
  const collFrom = Math.min(range.collectionFromKey, range.collectionToKey);
  const collTo = Math.max(range.collectionFromKey, range.collectionToKey);

  const activeOrColumnsMap = new Map<number, ComparativePeriodOption>();
  const monthlyAccMap = new Map<
    number,
    {
      opt: ComparativePeriodOption;
      billed: number;
      monthlyCollections: Record<string, number>;
      collectionsWithinWindow: number;
      collectionsOutsideWindow: number;
    }
  >();
  const mgrAccMap = new Map<
    string,
    {
      billed: number;
      collectionsWithinWindow: number;
      collectionsOutsideWindow: number;
      agingCurrent: number;
      aging1To30: number;
      aging31To60: number;
      aging61To90: number;
      aging91Above: number;
    }
  >();

  const usingEntries = Boolean(entries && entries.length > 0);

  if (usingEntries) {
    Object.keys(DEFAULT_MANCOM_BY_MANAGER).forEach((name) => {
      mgrAccMap.set(name, {
        billed: 0,
        collectionsWithinWindow: 0,
        collectionsOutsideWindow: 0,
        agingCurrent: 0,
        aging1To30: 0,
        aging31To60: 0,
        aging61To90: 0,
        aging91Above: 0,
      });
    });

    for (const entry of entries!) {
      if (entry.orDateKey !== null && entry.orDateKey >= collFrom && entry.orDateKey <= collTo) {
        if (!activeOrColumnsMap.has(entry.orDateKey)) {
          const parsedOr = parseComparativeMonthKey(entry.orDate);
          if (parsedOr) activeOrColumnsMap.set(parsedOr.key, parsedOr);
        }
      }

      if (entry.arTagKey < billFrom || entry.arTagKey > billTo) {
        continue;
      }

      let monthBucket = monthlyAccMap.get(entry.arTagKey);
      if (!monthBucket) {
        const parsedAr = parseComparativeMonthKey(entry.arTag) ?? {
          key: entry.arTagKey,
          label: entry.arTag,
          shortLabel: entry.arTag,
        };
        monthBucket = {
          opt: parsedAr,
          billed: 0,
          monthlyCollections: {},
          collectionsWithinWindow: 0,
          collectionsOutsideWindow: 0,
        };
        monthlyAccMap.set(entry.arTagKey, monthBucket);
      }

      monthBucket.billed += entry.billed;

      const inCollWindow =
        entry.orDateKey !== null && entry.orDateKey >= collFrom && entry.orDateKey <= collTo;
      if (inCollWindow) {
        monthBucket.collectionsWithinWindow += entry.collections;
        monthBucket.monthlyCollections[entry.orDate] =
          (monthBucket.monthlyCollections[entry.orDate] ?? 0) + entry.collections;
      } else {
        monthBucket.collectionsOutsideWindow += entry.collections;
      }

      if (entry.areaManager !== 'Unspecified') {
        const mgrKey = entry.areaManager.trim().toUpperCase();
        const mgrEntry = mgrAccMap.get(mgrKey) ?? {
          billed: 0,
          collectionsWithinWindow: 0,
          collectionsOutsideWindow: 0,
          agingCurrent: 0,
          aging1To30: 0,
          aging31To60: 0,
          aging61To90: 0,
          aging91Above: 0,
        };
        mgrEntry.billed += entry.billed;
        if (inCollWindow) {
          mgrEntry.collectionsWithinWindow += entry.collections;
        } else {
          mgrEntry.collectionsOutsideWindow += entry.collections;
        }

        const openInWindow = entry.billed - (inCollWindow ? entry.collections : 0);
        if (entry.aging === 'Current') mgrEntry.agingCurrent += openInWindow;
        else if (entry.aging === '1-30 days') mgrEntry.aging1To30 += openInWindow;
        else if (entry.aging === '31-60 days') mgrEntry.aging31To60 += openInWindow;
        else if (entry.aging === '61-90 days') mgrEntry.aging61To90 += openInWindow;
        else if (entry.aging === '91 days above') mgrEntry.aging91Above += openInWindow;
        else if (Math.abs(openInWindow) > 0.0001) mgrEntry.agingCurrent += openInWindow;

        mgrAccMap.set(mgrKey, mgrEntry);
      }
    }
  } else if (data.cohortMatrix) {
    for (const col of data.cohortMatrix.orMonthColumns) {
      const parsed = parseComparativeMonthKey(col);
      if (parsed && parsed.key >= collFrom && parsed.key <= collTo) {
        activeOrColumnsMap.set(parsed.key, parsed);
      }
    }

    for (const row of data.cohortMatrix.rows) {
      const parsedAr = parseComparativeMonthKey(row.arTag);
      if (!parsedAr || parsedAr.key < billFrom || parsedAr.key > billTo) continue;

      const monthlyCollections: Record<string, number> = {};
      let inWindow = 0;
      for (const col of data.cohortMatrix.orMonthColumns) {
        const parsedOr = parseComparativeMonthKey(col);
        if (parsedOr && parsedOr.key >= collFrom && parsedOr.key <= collTo) {
          const val = row.monthlyCollections[col] ?? 0;
          monthlyCollections[col] = round2(val);
          inWindow += val;
        }
      }
      const collectionsWithinWindow = round2(inWindow);
      const collectionsOutsideWindow = round2(row.totalCollection - collectionsWithinWindow);

      monthlyAccMap.set(parsedAr.key, {
        opt: parsedAr,
        billed: row.billedTarget,
        monthlyCollections,
        collectionsWithinWindow,
        collectionsOutsideWindow,
      });
    }
  }

  const activeOrColumns = Array.from(activeOrColumnsMap.values()).sort((a, b) => a.key - b.key);
  const columnTotals: Record<string, number> = {};
  activeOrColumns.forEach((c) => {
    columnTotals[c.label] = 0;
  });

  const monthlyRows: ComparativeMonthRow[] = Array.from(monthlyAccMap.values())
    .sort((a, b) => a.opt.key - b.opt.key)
    .map((bucket) => {
      const billedAmount = round2(bucket.billed);
      const collectionsWithinWindow = round2(bucket.collectionsWithinWindow);
      const collectionsOutsideWindow = round2(bucket.collectionsOutsideWindow);
      const remainingBalance = round2(billedAmount - collectionsWithinWindow);
      const efficiencyPct =
        billedAmount > 0 ? round2((collectionsWithinWindow / billedAmount) * 100) : 0;

      const normalizedCols: Record<string, number> = {};
      activeOrColumns.forEach((col) => {
        const val = round2(bucket.monthlyCollections[col.label] ?? 0);
        normalizedCols[col.label] = val;
        columnTotals[col.label] = round2((columnTotals[col.label] ?? 0) + val);
      });

      return {
        key: bucket.opt.key,
        arTag: bucket.opt.label,
        shortLabel: bucket.opt.shortLabel,
        billedAmount,
        monthlyCollections: normalizedCols,
        collectionsWithinWindow,
        collectionsOutsideWindow,
        remainingBalance,
        efficiencyPct,
      };
    });

  const safeBenchmarkPct = Math.min(100, Math.max(0, round2(targetBenchmark)));

  const buildManagerTargetRow = (
    manager: string,
    mancom: string,
    bucket: { billed: number; collectionsWithinWindow: number }
  ): ComparativeManagerTargetRow => {
    const billedAmount = round2(bucket.billed);
    const collectionsWithinWindow = round2(bucket.collectionsWithinWindow);
    const remainingBalance = round2(billedAmount - collectionsWithinWindow);
    const targetCollectionRequired = round2(billedAmount * (safeBenchmarkPct / 100));
    const rawShortfall = round2(targetCollectionRequired - collectionsWithinWindow);
    const additionalNeededForTarget = round2(
      Math.min(Math.max(0, remainingBalance), Math.max(0, rawShortfall))
    );
    const projectedRemainingAtTarget = round2(
      Math.max(0, remainingBalance - additionalNeededForTarget)
    );
    const efficiencyPct =
      billedAmount > 0 ? round2((collectionsWithinWindow / billedAmount) * 100) : 0;
    return {
      mancom,
      manager,
      billedAmount,
      collectionsWithinWindow,
      remainingBalance,
      targetCollectionRequired,
      additionalNeededForTarget,
      projectedRemainingAtTarget,
      efficiencyPct,
    };
  };

  const managerRows: ComparativeManagerRow[] = Array.from(mgrAccMap.entries())
    .map(([manager, bucket]) => {
      const billedAmount = round2(bucket.billed);
      const collectionsWithinWindow = round2(bucket.collectionsWithinWindow);
      const collectionsOutsideWindow = round2(bucket.collectionsOutsideWindow);
      const remainingBalance = round2(billedAmount - collectionsWithinWindow);
      const efficiencyPct =
        billedAmount > 0 ? round2((collectionsWithinWindow / billedAmount) * 100) : 0;
      return {
        manager,
        billedAmount,
        collectionsWithinWindow,
        collectionsOutsideWindow,
        remainingBalance,
        efficiencyPct,
        agingCurrent: round2(bucket.agingCurrent),
        aging1To30: round2(bucket.aging1To30),
        aging31To60: round2(bucket.aging31To60),
        aging61To90: round2(bucket.aging61To90),
        aging91Above: round2(bucket.aging91Above),
      };
    })
    .filter((r) => r.billedAmount > 0 || r.collectionsWithinWindow > 0)
    .sort((a, b) => b.billedAmount - a.billedAmount);

  const selectedArBilled = round2(monthlyRows.reduce((s, r) => s + r.billedAmount, 0));
  const collectionsWithinWindow = round2(
    monthlyRows.reduce((s, r) => s + r.collectionsWithinWindow, 0)
  );
  const collectionsOutsideWindow = round2(
    monthlyRows.reduce((s, r) => s + r.collectionsOutsideWindow, 0)
  );
  const remainingBalance = round2(selectedArBilled - collectionsWithinWindow);
  const cohortEfficiencyPct =
    selectedArBilled > 0 ? round2((collectionsWithinWindow / selectedArBilled) * 100) : 0;

  const targetAmount = round2(selectedArBilled * (safeBenchmarkPct / 100));
  const varianceAgainstTarget = round2(targetAmount - collectionsWithinWindow);
  const isAboveOrAtTarget = varianceAgainstTarget <= 0;

  const managerTargetGroups: ComparativeManagerTargetGroup[] = [];

  if (usingEntries) {
    const seenManagers = new Set<string>();
    for (const grp of COMPARATIVE_MANCOM_ORDER) {
      const rows = grp.managers
        .map((mgr) => {
          seenManagers.add(mgr);
          const bucket = mgrAccMap.get(mgr);
          if (!bucket) return null;
          return buildManagerTargetRow(mgr, grp.mancom, bucket);
        })
        .filter((x): x is ComparativeManagerTargetRow => Boolean(x));
      if (rows.length > 0) {
        managerTargetGroups.push({ mancom: grp.mancom, rows });
      }
    }

    const extraRows: ComparativeManagerTargetRow[] = [];
    for (const [mgr, bucket] of mgrAccMap.entries()) {
      if (!seenManagers.has(mgr) && (bucket.billed > 0 || bucket.collectionsWithinWindow > 0)) {
        extraRows.push(
          buildManagerTargetRow(mgr, DEFAULT_MANCOM_BY_MANAGER[mgr] ?? 'OTHER', bucket)
        );
      }
    }
    if (extraRows.length > 0) {
      managerTargetGroups.push({ mancom: 'OTHER', rows: extraRows });
    }
  }

  const allTargetRows = managerTargetGroups.flatMap((g) => g.rows);
  const targetRemainingTotal = round2(allTargetRows.reduce((s, r) => s + r.remainingBalance, 0));
  const targetAdditionalTotal = round2(
    allTargetRows.reduce((s, r) => s + r.additionalNeededForTarget, 0)
  );
  const targetProjectedRemainingTotal = round2(
    allTargetRows.reduce((s, r) => s + r.projectedRemainingAtTarget, 0)
  );

  const projectedEffPct =
    selectedArBilled > 0
      ? round2(((collectionsWithinWindow + targetAdditionalTotal) / selectedArBilled) * 100)
      : 0;

  return {
    kpis: {
      selectedArBilled,
      collectionsWithinWindow,
      collectionsOutsideWindow,
      remainingBalance,
      cohortEfficiencyPct,
      billingMonthCount: monthlyRows.length,
      collectionMonthCount: activeOrColumns.length,
    },
    metricBreakdown: {
      targetBenchmarkPct: safeBenchmarkPct,
      targetAmount,
      actualCollections: collectionsWithinWindow,
      varianceAgainstTarget,
      absoluteVariance: round2(Math.abs(varianceAgainstTarget)),
      isAboveOrAtTarget,
    },
    activeOrColumns,
    monthlyRows,
    managerRows,
    managerTargetGroups,
    managerTargetTotals: {
      remainingBalance: targetRemainingTotal,
      additionalNeededForTarget: targetAdditionalTotal,
      projectedRemainingAtTarget: targetProjectedRemainingTotal,
      projectedEfficiencyPct: projectedEffPct,
    },
    hasManagerBreakdown: usingEntries && managerRows.length > 0,
    totals: {
      billedAmount: selectedArBilled,
      columnTotals,
      collectionsWithinWindow,
      collectionsOutsideWindow,
      remainingBalance,
      efficiencyPct: cohortEfficiencyPct,
      agingCurrent: round2(managerRows.reduce((s, r) => s + r.agingCurrent, 0)),
      aging1To30: round2(managerRows.reduce((s, r) => s + r.aging1To30, 0)),
      aging31To60: round2(managerRows.reduce((s, r) => s + r.aging31To60, 0)),
      aging61To90: round2(managerRows.reduce((s, r) => s + r.aging61To90, 0)),
      aging91Above: round2(managerRows.reduce((s, r) => s + r.aging91Above, 0)),
    },
  };
}

export function getComparativeManagerTargetInvoices(
  managerName: string,
  requiredAmount: number,
  range: ComparativePeriodRange,
  entries: ComparativeLedgerEntry[],
  fallbackOpenInvoices?: OpenInvoiceItem[],
  fallbackLineItems?: ARLineItem[]
): AllocatedTargetInvoiceResult {
  const billFrom = Math.min(range.billingFromKey, range.billingToKey);
  const billTo = Math.max(range.billingFromKey, range.billingToKey);
  const collFrom = Math.min(range.collectionFromKey, range.collectionToKey);
  const collTo = Math.max(range.collectionFromKey, range.collectionToKey);
  const normalizedMgr = managerName.trim().toUpperCase();

  if (entries.length > 0) {
    const periodInvoices: OpenInvoiceItem[] = [];
    for (const entry of entries) {
      if (entry.arTagKey < billFrom || entry.arTagKey > billTo) continue;
      if (entry.areaManager.trim().toUpperCase() !== normalizedMgr) continue;

      const inCollWindow =
        entry.orDateKey !== null && entry.orDateKey >= collFrom && entry.orDateKey <= collTo;
      const openInWindow = round2(entry.billed - (inCollWindow ? entry.collections : 0));
      if (openInWindow <= 0.005) continue;

      periodInvoices.push({
        biNumber: entry.biNumber,
        serviceType: entry.serviceType,
        client: entry.client,
        areaManager: entry.areaManager,
        aging: entry.aging,
        particulars: entry.particulars,
        arTag: entry.arTag,
        isPriorAr: entry.arTagKey < billTo,
        billed: round2(entry.billed),
        collected: round2(inCollWindow ? entry.collections : 0),
        remainingBalance: openInWindow,
      });
    }

    return allocateTargetInvoices(periodInvoices, managerName, requiredAmount);
  }

  return allocateTargetInvoices(
    fallbackOpenInvoices,
    managerName,
    requiredAmount,
    fallbackLineItems
  );
}

