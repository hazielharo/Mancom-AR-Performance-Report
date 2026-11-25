import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarCheck,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { BASELINE_AR_DATA } from '../../data/baselineData';
import { ARLineItem, ARReportData, ClientAgingRow } from '../../types/arReport';
import {
  formatNumber,
  formatPeso,
  formatWholeNumber,
  round2,
} from '../../utils/arCalculations';
import {
  AGING_BUCKETS,
  computeCrossFilteredView,
  CrossFilterState,
  EMPTY_CROSS_FILTERS,
  parseConsolidatedARCSV,
  toggleCrossFilterValue,
} from '../../utils/balanceCrossFilter';
import {
  CommittedPaymentsConfig,
  CommitmentSyncStatus,
  countCommitmentsByClient,
  indexCommitmentsByBi,
  PaymentCommitmentRecord,
  UpsertCommitmentInput,
} from '../../utils/paymentCommitments';
import { computeSquarifiedTreemap, TreemapInputItem } from '../../utils/treemapLayout';
import { ClientInvoicesModal } from '../ClientInvoicesModal';

interface BalanceBreakdownPageProps {
  data: ARReportData;
  commitments?: PaymentCommitmentRecord[];
  committedPaymentsConfig?: CommittedPaymentsConfig;
  commitmentSyncStatus?: CommitmentSyncStatus;
  commitmentSyncWarning?: string | null;
  onUpsertCommitment?: (input: UpsertCommitmentInput) => Promise<void>;
  onDeleteCommitment?: (biNumber: string) => Promise<void>;
  onSyncCommitments?: () => Promise<void>;
  onOpenCommitmentSyncSetup?: () => void;
  isAdminAuthorized?: boolean;
}

type SortField = 'client' | 'grandTotal';
type SortDirection = 'asc' | 'desc';

// Warm gold/ochre ramp (#EAB308 -> #CA8A04) with high dark-ink contrast (>= 6:1)
const MANAGER_GOLD_PALETTE = [
  '#F2C118',
  '#EAB308',
  '#E4AA07',
  '#DDA006',
  '#D69705',
  '#CF8F04',
  '#CA8A04',
  '#C48504',
  '#BE8004',
];

// Olive/sage green ramp (#849B4E -> #657A38)
const SERVICE_OLIVE_PALETTE = [
  '#96AD60',
  '#8CA356',
  '#849B4E',
  '#7B9247',
  '#738941',
  '#6C823C',
  '#657A38',
  '#5D7133',
  '#55682E',
];

interface InteractiveTreemapProps {
  title: string;
  headerText: string;
  headerClassName: string;
  items: TreemapInputItem[];
  palette: string[];
  darkTextFromRank?: number;
  selectedIds: string[];
  heightPx: number;
  emptyMessage: string;
  onTileClick: (id: string, multi: boolean) => void;
  multiSelectMode: boolean;
}

const InteractiveTreemap: React.FC<InteractiveTreemapProps> = ({
  title,
  headerText,
  headerClassName,
  items,
  palette,
  darkTextFromRank = Number.POSITIVE_INFINITY,
  selectedIds,
  heightPx,
  emptyMessage,
  onTileClick,
  multiSelectMode,
}) => {
  const rects = useMemo(() => computeSquarifiedTreemap(items, 100, 100), [items]);
  const hasSelection = selectedIds.length > 0;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
      <div
        className={`flex items-center justify-between px-3 py-1.5 text-xs font-bold tabular-nums border-b ${headerClassName}`}
      >
        <span className="tracking-wide uppercase">{title}</span>
        <span>{headerText}</span>
      </div>
      <div className="relative w-full bg-slate-100" style={{ height: `${heightPx}px` }}>
        {rects.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-slate-500">
            {emptyMessage}
          </div>
        ) : (
          rects.map((rect, idx) => {
            const color = palette[Math.min(idx, palette.length - 1)];
            const isSelected = selectedIds.includes(rect.id);
            const isDimmed = hasSelection && !isSelected;
            const useLightText = idx >= darkTextFromRank;
            const showLabel = rect.width >= 9 && rect.height >= 12;
            const showAmount = rect.width >= 18 && rect.height >= 18;

            return (
              <button
                key={rect.id}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${title} ${rect.label}: ${formatPeso(rect.value)}`}
                title={`${rect.label}: ${formatPeso(rect.value)} (${rect.sharePct.toFixed(1)}%) — Click to filter${
                  multiSelectMode ? ' (multi-select on)' : ' (Ctrl/Cmd+Click for multi-select)'
                }`}
                onClick={(e) => onTileClick(rect.id, multiSelectMode || e.ctrlKey || e.metaKey)}
                className={`absolute border border-white/90 flex items-center justify-center p-1.5 text-center overflow-hidden transition-opacity duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 ${
                  isSelected
                    ? 'opacity-100 ring-2 ring-inset ring-slate-900 z-10 shadow-sm'
                    : isDimmed
                      ? 'opacity-35 hover:opacity-75'
                      : 'opacity-100 hover:brightness-95'
                }`}
                style={{
                  left: `${rect.x}%`,
                  top: `${rect.y}%`,
                  width: `${rect.width}%`,
                  height: `${rect.height}%`,
                  backgroundColor: color,
                  color: useLightText ? '#FFFFFF' : '#0F172A',
                }}
              >
                {showLabel && (
                  <span className="text-[11px] font-semibold leading-tight line-clamp-2 max-w-full block break-words">
                    {rect.label}
                    {showAmount ? ` : ${formatNumber(rect.value)}` : ''}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export const BalanceBreakdownPage: React.FC<BalanceBreakdownPageProps> = ({
  data,
  commitments = [],
  committedPaymentsConfig = { webhookUrl: '', sourceSpreadsheetId: '' },
  commitmentSyncStatus = 'local_only',
  commitmentSyncWarning = null,
  onUpsertCommitment = async () => {},
  onDeleteCommitment = async () => {},
  onSyncCommitments = async () => {},
  onOpenCommitmentSyncSetup = () => {},
  isAdminAuthorized = false,
}) => {
  const [filters, setFilters] = useState<CrossFilterState>(EMPTY_CROSS_FILTERS);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('grandTotal');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [selectedClientForModal, setSelectedClientForModal] = useState<string | null>(null);

  const [customLineItems, setCustomLineItems] = useState<ARLineItem[] | null>(null);
  const [customCsvName, setCustomCsvName] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const commitmentsByBi = useMemo(() => indexCommitmentsByBi(commitments), [commitments]);
  const commitmentCountsByClient = useMemo(
    () => countCommitmentsByClient(commitments),
    [commitments]
  );

  const baseLineItems: ARLineItem[] = useMemo(() => {
    if (data.arLineItems && data.arLineItems.length > 0) {
      return data.arLineItems;
    }
    if (data.sourceFormat !== 'manual' && BASELINE_AR_DATA.arLineItems) {
      return BASELINE_AR_DATA.arLineItems;
    }
    return [];
  }, [data.arLineItems, data.sourceFormat]);

  const activeLineItems = customLineItems ?? baseLineItems;

  const view = useMemo(
    () => computeCrossFilteredView(activeLineItems, filters),
    [activeLineItems, filters]
  );

  const displayedClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const nonNoise = view.clientRows.filter((row) => Math.abs(row.grandTotal) >= 0.5);
    const filtered = q
      ? nonNoise.filter((row) => row.client.toLowerCase().includes(q))
      : nonNoise;

    const sorted = filtered.slice().sort((a, b) => {
      if (sortField === 'client') {
        const cmp = a.client.localeCompare(b.client);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const diff = a.grandTotal - b.grandTotal;
      return sortDir === 'asc' ? diff : -diff;
    });

    return sorted;
  }, [view.clientRows, searchQuery, sortField, sortDir]);

  const footerTotals = useMemo(() => {
    if (!searchQuery.trim()) {
      return view.agingTotals;
    }
    const matching =
      filters.clients.length > 0
        ? displayedClients.filter((r) => filters.clients.includes(r.client))
        : displayedClients;

    return {
      aging91Above: round2(matching.reduce((s, r) => s + r.aging91Above, 0)),
      aging1To30: round2(matching.reduce((s, r) => s + r.aging1To30, 0)),
      aging31To60: round2(matching.reduce((s, r) => s + r.aging31To60, 0)),
      aging61To90: round2(matching.reduce((s, r) => s + r.aging61To90, 0)),
      agingCurrent: round2(matching.reduce((s, r) => s + r.agingCurrent, 0)),
      grandTotal: round2(matching.reduce((s, r) => s + r.grandTotal, 0)),
    };
  }, [searchQuery, view.agingTotals, displayedClients, filters.clients]);

  const handleToggleDimension = (
    key: keyof CrossFilterState,
    value: string,
    multi: boolean
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: toggleCrossFilterValue(prev[key], value, multi),
    }));
  };

  const handleRemoveFilterPill = (key: keyof CrossFilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].filter((v) => v !== value),
    }));
  };

  const handleResetFilters = () => {
    setFilters(EMPTY_CROSS_FILTERS);
    setSearchQuery('');
  };

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'client' ? 'asc' : 'desc');
    }
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const result = parseConsolidatedARCSV(text);
      if (!result.ok || !result.items) {
        setCsvError(result.error || 'Could not parse Consolidated AR CSV.');
        return;
      }
      setCsvError(null);
      setCustomLineItems(result.items);
      setCustomCsvName(file.name);
      setFilters(EMPTY_CROSS_FILTERS);
      setSearchQuery('');
    } catch {
      setCsvError('Failed to read the selected CSV file.');
    }
  };

  const hasAgingFilter = filters.agingBuckets.length > 0;
  const hasClientFilter = filters.clients.length > 0;

  const isBucketActive = (bucket: string) => filters.agingBuckets.includes(bucket);
  const isBucketDimmed = (bucket: string) => hasAgingFilter && !isBucketActive(bucket);

  const filterPills: Array<{
    key: keyof CrossFilterState;
    label: string;
    value: string;
  }> = [
    ...filters.areaManagers.map((v) => ({
      key: 'areaManagers' as const,
      label: 'Area Manager',
      value: v,
    })),
    ...filters.serviceTypes.map((v) => ({
      key: 'serviceTypes' as const,
      label: 'Service Type',
      value: v,
    })),
    ...filters.agingBuckets.map((v) => ({
      key: 'agingBuckets' as const,
      label: 'Aging',
      value: v,
    })),
    ...filters.clients.map((v) => ({
      key: 'clients' as const,
      label: 'Client',
      value: v,
    })),
  ];

  const renderClientRowValue = (row: ClientAgingRow, bucket: (typeof AGING_BUCKETS)[number]) => {
    switch (bucket) {
      case '91 days above':
        return row.aging91Above;
      case '1-30 days':
        return row.aging1To30;
      case '31-60 days':
        return row.aging31To60;
      case '61-90 days':
        return row.aging61To90;
      case 'Current':
        return row.agingCurrent;
    }
  };

  const renderFooterValue = (bucket: (typeof AGING_BUCKETS)[number]) => {
    switch (bucket) {
      case '91 days above':
        return footerTotals.aging91Above;
      case '1-30 days':
        return footerTotals.aging1To30;
      case '31-60 days':
        return footerTotals.aging31To60;
      case '61-90 days':
        return footerTotals.aging61To90;
      case 'Current':
        return footerTotals.agingCurrent;
    }
  };

  return (
    <section
      aria-label="Page 11: AR Balance Breakdown Cross-Filtering Dashboard"
      className="looker-slide-canvas rounded-xl border border-slate-300/80 shadow-sm px-5 py-6 sm:px-7 sm:py-7"
    >
      {/* Header Row */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.04em] text-[#A88611]">
            MANCOM &amp; LEADERSHIP PERFORMANCE UPDATE
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900">
              AR Balance Breakdown
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-2.5 py-0.5 font-bold text-slate-900 tabular-nums">
                Grand Total AR: {formatPeso(view.overallGrandTotal)}
              </span>
              <span className="text-slate-500 tabular-nums">
                Last Updated: {data.lastUpdated}
              </span>
              {customCsvName && (
                <span className="inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-900">
                  <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{customCsvName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomLineItems(null);
                      setCustomCsvName(null);
                      setCsvError(null);
                      setFilters(EMPTY_CROSS_FILTERS);
                    }}
                    className="ml-0.5 rounded px-1 text-emerald-800 hover:bg-emerald-200/70 cursor-pointer"
                    aria-label="Revert Consolidated AR CSV"
                    title="Revert to AppSheet AR dataset"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <div className="relative w-full sm:w-56">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client..."
              aria-label="Search client"
              className="w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#C7AC2D] focus:outline-none"
            />
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={multiSelectMode}
            onClick={() => setMultiSelectMode((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              multiSelectMode
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle multi-select mode (or hold Ctrl/Cmd while clicking)"
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                multiSelectMode ? 'bg-amber-400' : 'bg-slate-300'
              }`}
              aria-hidden="true"
            />
            <span>Multi-select</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvFileChange}
            className="hidden"
            aria-label="Upload Consolidated AR CSV file"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            title="Import exported CONSOLIDATED AR CSV (AREA MANAGER, SERVICE TYPE, CLIENT, AGING, REMAINING BALANCE)"
          >
            <Upload className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
            <span>Import Consolidated AR CSV</span>
          </button>
        </div>
      </div>

      {/* CSV Import Error Alert */}
      {csvError && (
        <div
          role="alert"
          className="mt-3 flex items-center justify-between gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{csvError}</span>
          </div>
          <button
            type="button"
            onClick={() => setCsvError(null)}
            className="rounded p-0.5 hover:bg-rose-100 cursor-pointer"
            aria-label="Dismiss CSV error"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Active Cross-Filter Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5 min-h-[24px]">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 mr-1">
            <Filter className="h-3.5 w-3.5 text-[#A88611]" aria-hidden="true" />
            <span>Cross-Filters:</span>
          </span>

          {filterPills.length === 0 ? (
            <span className="text-[11px] text-slate-500">
              Click any Area Manager tile, Service Type tile, or Aging column header to cross-filter. Click any client row to view open invoices &amp; commit payment dates.
            </span>
          ) : (
            filterPills.map((pill) => (
              <button
                key={`${pill.key}:${pill.value}`}
                type="button"
                onClick={() => handleRemoveFilterPill(pill.key, pill.value)}
                aria-label={`Remove filter ${pill.label}: ${pill.value}`}
                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-800 hover:border-slate-900 hover:bg-amber-50 cursor-pointer"
              >
                <span className="text-slate-500">{pill.label}:</span>
                <span className="max-w-[200px] truncate">{pill.value}</span>
                <X className="h-3 w-3 text-slate-500" aria-hidden="true" />
              </button>
            ))
          )}
        </div>

        {(view.activeFilterCount > 0 || searchQuery.trim().length > 0) && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 rounded border border-slate-900 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* 2-Column Split Grid: Left 36% (Stacked Treemaps) | Right 64% (Client Aging Pivot Table) */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[36fr_64fr] items-start">
        {/* Left Column (36%): Area Manager & Service Type Interactive Treemaps */}
        <div className="space-y-3 min-w-0">
          <InteractiveTreemap
            title="Area Manager"
            headerText={`All: ${formatPeso(view.managerHeaderTotal)}`}
            headerClassName="bg-[#F3D86B] border-amber-200 text-slate-950"
            items={view.managerTiles.filter((t) => t.value >= 0.5)}
            palette={MANAGER_GOLD_PALETTE}
            selectedIds={filters.areaManagers}
            heightPx={285}
            emptyMessage="No positive Area Manager balance for the current cross-filters."
            onTileClick={(id, multi) => handleToggleDimension('areaManagers', id, multi)}
            multiSelectMode={multiSelectMode}
          />

          <InteractiveTreemap
            title="Service Type"
            headerText={`All: ${formatPeso(view.serviceHeaderTotal)}`}
            headerClassName="bg-[#DCE6C3] border-[#C5D4A3] text-slate-900"
            items={view.serviceTiles.filter((t) => t.value >= 0.5)}
            palette={SERVICE_OLIVE_PALETTE}
            darkTextFromRank={4}
            selectedIds={filters.serviceTypes}
            heightPx={255}
            emptyMessage="No positive Service Type balance for the current cross-filters."
            onTileClick={(id, multi) => handleToggleDimension('serviceTypes', id, multi)}
            multiSelectMode={multiSelectMode}
          />
        </div>

        {/* Right Column (64%): Client AR Aging Pivot Table */}
        <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between bg-[#D4A738] px-3 py-1.5 text-[11px] font-bold tracking-wide text-slate-950">
            <span>CLIENT AR BREAKDOWN ({displayedClients.length})</span>
            <span>AGING / REMAINING BALANCE</span>
          </div>

          <div className="max-h-[586px] overflow-y-auto overflow-x-auto print:max-h-none print:overflow-visible">
            <table className="w-full table-fixed border-collapse text-[10px] xl:text-[10.5px] leading-tight tabular-nums">
              <thead className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_0_0_rgba(203,213,225,1)]">
                <tr className="font-semibold text-slate-700">
                  <th className="w-[27%] py-2 px-1.5 text-left">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('client')}
                      className="inline-flex items-center gap-1 font-bold text-slate-800 hover:text-slate-950 cursor-pointer"
                      title="Sort by Client name"
                    >
                      <span>Client</span>
                      {sortField === 'client' ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-3 w-3" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400" aria-hidden="true" />
                      )}
                    </button>
                  </th>

                  {AGING_BUCKETS.map((bucket) => {
                    const active = isBucketActive(bucket);
                    const dimmed = isBucketDimmed(bucket);
                    return (
                      <th key={bucket} className="w-[11.5%] py-1.5 px-1 text-right">
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={(e) =>
                            handleToggleDimension(
                              'agingBuckets',
                              bucket,
                              multiSelectMode || e.ctrlKey || e.metaKey
                            )
                          }
                          title={`Click to cross-filter by ${bucket}`}
                          className={`inline-flex w-full items-center justify-end rounded px-1 py-0.5 text-[9.5px] xl:text-[10px] font-semibold leading-tight text-right transition-all cursor-pointer ${
                            active
                              ? 'bg-[#FEF3C7] text-slate-950 ring-2 ring-inset ring-slate-900'
                              : dimmed
                                ? 'opacity-35 hover:opacity-80 text-slate-600'
                                : 'text-slate-700 hover:bg-slate-200/70'
                          }`}
                        >
                          {bucket}
                        </button>
                      </th>
                    );
                  })}

                  <th className="w-[15.5%] py-1.5 px-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleSortToggle('grandTotal')}
                      className="inline-flex w-full items-center justify-end gap-0.5 font-bold text-slate-950 hover:text-amber-800 cursor-pointer"
                      title="Sort by Grand Total"
                    >
                      <span>Grand Total</span>
                      {sortField === 'grandTotal' ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="h-3 w-3 shrink-0" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-3 w-3 shrink-0" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                      )}
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {displayedClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-slate-500">
                      No clients match the active cross-filters and search query.
                    </td>
                  </tr>
                ) : (
                  displayedClients.map((row) => {
                    const isSelected = filters.clients.includes(row.client);
                    const isDimmed = hasClientFilter && !isSelected;
                    const clientScheduledCount =
                      commitmentCountsByClient[row.client.trim().toUpperCase()] ?? 0;

                    return (
                      <tr
                        key={row.client}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button[data-cross-filter="true"]')) {
                            return;
                          }
                          if (e.ctrlKey || e.metaKey) {
                            handleToggleDimension('clients', row.client, true);
                            return;
                          }
                          setSelectedClientForModal(row.client);
                        }}
                        className={`transition-opacity cursor-pointer ${
                          isSelected
                            ? 'bg-[#FEF9C3] ring-2 ring-inset ring-slate-900 opacity-100'
                            : isDimmed
                              ? 'opacity-35 hover:opacity-75 hover:bg-[#FCF6D6]/40'
                              : 'hover:bg-[#FCF6D6]/60'
                        }`}
                      >
                        <td className="py-1.5 px-1.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (e.ctrlKey || e.metaKey) {
                                  handleToggleDimension('clients', row.client, true);
                                  return;
                                }
                                setSelectedClientForModal(row.client);
                              }}
                              title={`${row.client} — Click to view open Billing Invoices & commit payment`}
                              className="min-w-0 flex-1 truncate text-left font-medium text-slate-900 underline decoration-[#C5A728]/60 decoration-dotted underline-offset-2 hover:text-[#8E740B] hover:decoration-solid cursor-pointer focus:outline-none focus-visible:underline"
                            >
                              {row.client}
                            </button>
                            {clientScheduledCount > 0 && (
                              <span
                                title={`${clientScheduledCount} payment commitment${clientScheduledCount === 1 ? '' : 's'} scheduled`}
                                className="inline-flex shrink-0 items-center gap-0.5 rounded bg-emerald-100 px-1 py-0.5 text-[9px] font-bold text-emerald-800"
                              >
                                <CalendarCheck className="h-2.5 w-2.5" aria-hidden="true" />
                                <span>{clientScheduledCount}</span>
                              </span>
                            )}
                            <button
                              type="button"
                              data-cross-filter="true"
                              aria-pressed={isSelected}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleDimension(
                                  'clients',
                                  row.client,
                                  multiSelectMode || e.ctrlKey || e.metaKey
                                );
                              }}
                              title={`Cross-filter charts by ${row.client}`}
                              aria-label={`Cross-filter by ${row.client}`}
                              className={`shrink-0 rounded p-0.5 transition-colors cursor-pointer print:hidden ${
                                isSelected
                                  ? 'bg-slate-900 text-amber-300'
                                  : 'text-slate-400 hover:bg-slate-200/80 hover:text-slate-800'
                              }`}
                            >
                              <Filter className="h-2.5 w-2.5" aria-hidden="true" />
                            </button>
                          </div>
                        </td>

                        {AGING_BUCKETS.map((bucket) => {
                          const val = renderClientRowValue(row, bucket);
                          const bucketDimmed = isBucketDimmed(bucket);
                          return (
                            <td
                              key={bucket}
                              className={`py-1.5 px-1 text-right truncate transition-opacity ${
                                bucketDimmed ? 'opacity-35 text-slate-400' : 'text-slate-700'
                              }`}
                            >
                              {Math.abs(val) < 0.5 ? '-' : formatWholeNumber(val)}
                            </td>
                          );
                        })}

                        <td className="py-1.5 px-1.5 text-right font-bold text-slate-950 truncate">
                          {formatWholeNumber(row.grandTotal)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              <tfoot className="sticky bottom-0 z-20 bg-slate-100 shadow-[0_-2px_0_0_rgba(203,213,225,1)]">
                <tr className="font-bold text-slate-950">
                  <td className="py-2 px-1.5 truncate">Grand Total</td>
                  {AGING_BUCKETS.map((bucket) => {
                    const totalVal = renderFooterValue(bucket);
                    const bucketDimmed = isBucketDimmed(bucket);
                    return (
                      <td
                        key={bucket}
                        className={`py-2 px-1 text-right truncate transition-opacity ${
                          bucketDimmed ? 'opacity-35 text-slate-500' : 'text-slate-950'
                        }`}
                      >
                        {formatWholeNumber(totalVal)}
                      </td>
                    );
                  })}
                  <td className="py-2 px-1.5 text-right truncate">
                    {formatWholeNumber(footerTotals.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <ClientInvoicesModal
        isOpen={Boolean(selectedClientForModal)}
        clientName={selectedClientForModal}
        openInvoices={data.openInvoices}
        fallbackLineItems={activeLineItems}
        commitmentsByBi={commitmentsByBi}
        committedPaymentsConfig={committedPaymentsConfig}
        syncStatus={commitmentSyncStatus}
        syncWarning={commitmentSyncWarning}
        onUpsertCommitment={onUpsertCommitment}
        onDeleteCommitment={onDeleteCommitment}
        onSyncCommitments={onSyncCommitments}
        onOpenSyncSetup={onOpenCommitmentSyncSetup}
        isAdminAuthorized={isAdminAuthorized}
        onClose={() => setSelectedClientForModal(null)}
      />
    </section>
  );
};
