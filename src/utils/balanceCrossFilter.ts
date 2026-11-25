import { ARLineItem, ClientAgingRow } from '../types/arReport';
import { parseAccountingNumber, parseCSVRows, round2 } from './arCalculations';
import { TreemapInputItem } from './treemapLayout';

export const AGING_BUCKETS = [
  'Current',
  '1-30 days',
  '31-60 days',
  '61-90 days',
  '91 days above',
] as const;

export interface CrossFilterState {
  areaManagers: string[];
  serviceTypes: string[];
  clients: string[];
  agingBuckets: string[];
}

export const EMPTY_CROSS_FILTERS: CrossFilterState = {
  areaManagers: [],
  serviceTypes: [],
  clients: [],
  agingBuckets: [],
};

export interface CrossFilteredDashboardView {
  managerTiles: TreemapInputItem[];
  managerHeaderTotal: number;
  serviceTiles: TreemapInputItem[];
  serviceHeaderTotal: number;
  clientRows: ClientAgingRow[];
  agingTotals: {
    aging91Above: number;
    aging1To30: number;
    aging31To60: number;
    aging61To90: number;
    agingCurrent: number;
    grandTotal: number;
  };
  overallGrandTotal: number;
  activeFilterCount: number;
}

export function toggleCrossFilterValue(
  current: string[],
  value: string,
  multiSelect: boolean
): string[] {
  if (multiSelect) {
    return current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
  }
  if (current.length === 1 && current[0] === value) {
    return [];
  }
  return [value];
}

function matchesSelection(selected: string[], value: string): boolean {
  return selected.length === 0 || selected.includes(value);
}

/**
 * Computes Looker Studio-style bidirectional cross-filtered aggregations:
 * - Manager treemap applies Service Type + Client + Aging filters (leaving Area Manager open so all tiles remain interactive/dimmable)
 * - Service Type treemap applies Area Manager + Client + Aging filters
 * - Client × Aging table applies Area Manager + Service Type filters, restricts aging columns when Aging filter is active,
 *   and sums selected Clients (or all visible clients when no Client filter is active) in the Grand Total footer.
 */
export function computeCrossFilteredView(
  items: ARLineItem[],
  filters: CrossFilterState
): CrossFilteredDashboardView {
  const managerMap = new Map<string, number>();
  const serviceMap = new Map<string, number>();
  const clientMap = new Map<string, ClientAgingRow>();

  let overallGrandTotal = 0;
  let managerHeaderTotal = 0;
  let serviceHeaderTotal = 0;

  for (const item of items) {
    const bal = item.remainingBalance;
    if (Math.abs(bal) < 0.0001) continue;

    const matchMgr = matchesSelection(filters.areaManagers, item.areaManager);
    const matchSvc = matchesSelection(filters.serviceTypes, item.serviceType);
    const matchCli = matchesSelection(filters.clients, item.client);
    const matchAge = matchesSelection(filters.agingBuckets, item.agingBucket);

    if (matchMgr && matchSvc && matchCli && matchAge) {
      overallGrandTotal += bal;
    }

    // Top Treemap: Area Managers (filtered by Service, Client, Aging)
    if (matchSvc && matchCli && matchAge) {
      managerMap.set(item.areaManager, (managerMap.get(item.areaManager) ?? 0) + bal);
      if (matchMgr) {
        managerHeaderTotal += bal;
      }
    }

    // Bottom Treemap: Service Types (filtered by Manager, Client, Aging)
    if (matchMgr && matchCli && matchAge) {
      serviceMap.set(item.serviceType, (serviceMap.get(item.serviceType) ?? 0) + bal);
      if (matchSvc) {
        serviceHeaderTotal += bal;
      }
    }

    // Right Table: Client × Aging Pivot (filtered by Manager & Service; Aging filter zeros non-selected buckets)
    if (matchMgr && matchSvc) {
      let row = clientMap.get(item.client);
      if (!row) {
        row = {
          client: item.client,
          aging91Above: 0,
          agingCurrent: 0,
          aging1To30: 0,
          aging31To60: 0,
          aging61To90: 0,
          grandTotal: 0,
        };
        clientMap.set(item.client, row);
      }
      if (matchAge) {
        if (item.agingBucket === '91 days above') row.aging91Above += bal;
        else if (item.agingBucket === '1-30 days') row.aging1To30 += bal;
        else if (item.agingBucket === '31-60 days') row.aging31To60 += bal;
        else if (item.agingBucket === '61-90 days') row.aging61To90 += bal;
        else if (item.agingBucket === 'Current') row.agingCurrent += bal;
        row.grandTotal += bal;
      }
    }
  }

  const managerTiles: TreemapInputItem[] = Array.from(managerMap.entries())
    .map(([name, val]) => ({ id: name, label: name, value: round2(val) }))
    .filter((t) => t.value > 0.005)
    .sort((a, b) => b.value - a.value);

  const serviceTiles: TreemapInputItem[] = Array.from(serviceMap.entries())
    .map(([name, val]) => ({ id: name, label: name, value: round2(val) }))
    .filter((t) => t.value > 0.005)
    .sort((a, b) => b.value - a.value);

  const clientRows: ClientAgingRow[] = Array.from(clientMap.values())
    .map((r) => ({
      ...r,
      aging91Above: round2(r.aging91Above),
      aging1To30: round2(r.aging1To30),
      aging31To60: round2(r.aging31To60),
      aging61To90: round2(r.aging61To90),
      agingCurrent: round2(r.agingCurrent),
      grandTotal: round2(r.grandTotal),
    }))
    .filter((r) => Math.abs(r.grandTotal) >= 0.01)
    .sort((a, b) => b.grandTotal - a.grandTotal);

  const agingTotals = {
    aging91Above: 0,
    aging1To30: 0,
    aging31To60: 0,
    aging61To90: 0,
    agingCurrent: 0,
    grandTotal: 0,
  };

  for (const r of clientRows) {
    if (matchesSelection(filters.clients, r.client)) {
      agingTotals.aging91Above += r.aging91Above;
      agingTotals.aging1To30 += r.aging1To30;
      agingTotals.aging31To60 += r.aging31To60;
      agingTotals.aging61To90 += r.aging61To90;
      agingTotals.agingCurrent += r.agingCurrent;
      agingTotals.grandTotal += r.grandTotal;
    }
  }

  agingTotals.aging91Above = round2(agingTotals.aging91Above);
  agingTotals.aging1To30 = round2(agingTotals.aging1To30);
  agingTotals.aging31To60 = round2(agingTotals.aging31To60);
  agingTotals.aging61To90 = round2(agingTotals.aging61To90);
  agingTotals.agingCurrent = round2(agingTotals.agingCurrent);
  agingTotals.grandTotal = round2(agingTotals.grandTotal);

  const activeFilterCount =
    filters.areaManagers.length +
    filters.serviceTypes.length +
    filters.clients.length +
    filters.agingBuckets.length;

  return {
    managerTiles,
    managerHeaderTotal: round2(managerHeaderTotal),
    serviceTiles,
    serviceHeaderTotal: round2(serviceHeaderTotal),
    clientRows,
    agingTotals,
    overallGrandTotal: round2(overallGrandTotal),
    activeFilterCount,
  };
}

export interface ConsolidatedCSVResult {
  ok: boolean;
  items?: ARLineItem[];
  error?: string;
}

/**
 * Parses an exported CONSOLIDATED AR CSV containing:
 * AREA MANAGER, SERVICE TYPE, CLIENT, AGING, REMAINING BALANCE
 */
export function parseConsolidatedARCSV(csvText: string): ConsolidatedCSVResult {
  const rows = parseCSVRows(csvText).filter((r) => r.some((c) => c.trim().length > 0));
  if (rows.length < 2) {
    return {
      ok: false,
      error: 'CSV must include a header row and at least one data row.',
    };
  }

  const headerMap = new Map<string, number>();
  rows[0].forEach((h, idx) => {
    const norm = h.trim().toUpperCase();
    if (norm && !headerMap.has(norm)) headerMap.set(norm, idx);
  });

  const col = (aliases: string[]) => {
    for (const a of aliases) {
      const idx = headerMap.get(a);
      if (idx !== undefined) return idx;
    }
    return -1;
  };

  const mgrIdx = col(['AREA MANAGER', 'MANAGER']);
  const svcIdx = col(['SERVICE TYPE', 'SERVICE']);
  const clientIdx = col(['CLIENT']);
  const agingIdx = col(['AGING', 'AGING BUCKET']);
  const remIdx = col(['REMAINING BALANCE', 'BALANCE', 'OPEN AR']);

  const missing: string[] = [];
  if (mgrIdx === -1) missing.push('AREA MANAGER');
  if (svcIdx === -1) missing.push('SERVICE TYPE');
  if (clientIdx === -1) missing.push('CLIENT');
  if (agingIdx === -1) missing.push('AGING');
  if (remIdx === -1) missing.push('REMAINING BALANCE');

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Missing required Consolidated AR column(s): ${missing.join(', ')}.`,
    };
  }

  const grouped = new Map<string, ARLineItem>();
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const rem = parseAccountingNumber(row[remIdx]);
    if (Number.isNaN(rem)) {
      return {
        ok: false,
        error: `Row ${i + 1} has an invalid REMAINING BALANCE value.`,
      };
    }
    if (Math.abs(rem) < 0.005) continue;

    const areaManager = row[mgrIdx]?.trim() || 'Unspecified';
    const serviceType = row[svcIdx]?.trim() || 'Unspecified';
    const client = row[clientIdx]?.trim() || 'Unspecified';
    const agingBucket = row[agingIdx]?.trim() || 'Unspecified';

    const key = `${client}\u0000${areaManager}\u0000${serviceType}\u0000${agingBucket}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.remainingBalance = round2(existing.remainingBalance + rem);
    } else {
      grouped.set(key, {
        client,
        areaManager,
        serviceType,
        agingBucket,
        remainingBalance: round2(rem),
      });
    }
  }

  const items = Array.from(grouped.values()).filter((x) => Math.abs(x.remainingBalance) >= 0.01);
  if (items.length === 0) {
    return {
      ok: false,
      error: 'No non-zero REMAINING BALANCE rows were found in the uploaded CSV.',
    };
  }

  return { ok: true, items };
}
