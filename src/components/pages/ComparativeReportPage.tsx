import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange, Users } from 'lucide-react';
import { ARReportData } from '../../types/arReport';
import {
  formatNumber,
  formatPercent,
  formatPeso,
  formatPesoMillions,
  formatWholeNumber,
  round2,
} from '../../utils/arCalculations';
import {
  ComparativePeriodRange,
  computeComparativeSummary,
  extractComparativePeriods,
  getComparativeManagerTargetInvoices,
  parseComparativeLedgerEntries,
} from '../../utils/comparativeReport';
import { TargetInvoiceModal } from '../TargetInvoiceModal';

interface ComparativeReportPageProps {
  data: ARReportData;
  rawCsvText?: string;
  targetBenchmark: number;
}

function formatComparativeTimestamp(raw: string): string {
  const trimmed = (raw || '').trim();
  const match = trimmed.match(/^(\d{1,2}\/\d{1,2}\/\d{4}),?\s+(.+)$/);
  if (match) {
    return `${match[1]}, ${match[2]}`;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }
  return trimmed || '11/24/2026, 3:11:45 PM';
}

export const ComparativeReportPage: React.FC<ComparativeReportPageProps> = ({
  data,
  rawCsvText,
  targetBenchmark,
}) => {
  const ledgerEntries = useMemo(
    () => parseComparativeLedgerEntries(rawCsvText),
    [rawCsvText]
  );

  const { billingMonths, collectionMonths, defaultRange } = useMemo(
    () => extractComparativePeriods(data, ledgerEntries),
    [data, ledgerEntries]
  );

  const [range, setRange] = useState<ComparativePeriodRange>(defaultRange);
  const [breakdownView, setBreakdownView] = useState<'monthly' | 'manager'>('monthly');
  const [selectedManagerModal, setSelectedManagerModal] = useState<{
    manager: string;
    mancom: string;
    requiredAmount: number;
  } | null>(null);

  // Keep selections valid whenever underlying sheet periods change
  useEffect(() => {
    setRange((prev) => {
      const validBilling = new Set(billingMonths.map((m) => m.key));
      const validColl = new Set(collectionMonths.map((m) => m.key));
      if (
        !validBilling.has(prev.billingFromKey) ||
        !validBilling.has(prev.billingToKey) ||
        !validColl.has(prev.collectionFromKey) ||
        !validColl.has(prev.collectionToKey)
      ) {
        return defaultRange;
      }
      return prev;
    });
  }, [billingMonths, collectionMonths, defaultRange]);

  const summary = useMemo(
    () => computeComparativeSummary(data, range, ledgerEntries, targetBenchmark),
    [data, range, ledgerEntries, targetBenchmark]
  );

  const modalAllocation = useMemo(() => {
    if (!selectedManagerModal) return null;
    return getComparativeManagerTargetInvoices(
      selectedManagerModal.manager,
      selectedManagerModal.requiredAmount,
      range,
      ledgerEntries,
      data.openInvoices,
      data.arLineItems
    );
  }, [selectedManagerModal, range, ledgerEntries, data.openInvoices, data.arLineItems]);

  const billingFromLabel =
    billingMonths.find((m) => m.key === range.billingFromKey)?.shortLabel ?? '';
  const billingToLabel =
    billingMonths.find((m) => m.key === range.billingToKey)?.shortLabel ?? '';
  const collFromLabel =
    collectionMonths.find((m) => m.key === range.collectionFromKey)?.shortLabel ?? '';
  const collToLabel =
    collectionMonths.find((m) => m.key === range.collectionToKey)?.shortLabel ?? '';

  const isAllYtdActive =
    billingMonths.length > 0 &&
    collectionMonths.length > 0 &&
    range.billingFromKey === billingMonths[0].key &&
    range.billingToKey === billingMonths[billingMonths.length - 1].key &&
    range.collectionFromKey === collectionMonths[0].key &&
    range.collectionToKey === collectionMonths[collectionMonths.length - 1].key;

  const updateBillingFrom = (nextFrom: number) => {
    setRange((prev) => ({
      ...prev,
      billingFromKey: nextFrom,
      billingToKey: Math.max(nextFrom, prev.billingToKey),
    }));
  };

  const updateBillingTo = (nextTo: number) => {
    setRange((prev) => ({
      ...prev,
      billingFromKey: Math.min(prev.billingFromKey, nextTo),
      billingToKey: nextTo,
    }));
  };

  const updateCollectionFrom = (nextFrom: number) => {
    setRange((prev) => ({
      ...prev,
      collectionFromKey: nextFrom,
      collectionToKey: Math.max(nextFrom, prev.collectionToKey),
    }));
  };

  const updateCollectionTo = (nextTo: number) => {
    setRange((prev) => ({
      ...prev,
      collectionFromKey: Math.min(prev.collectionFromKey, nextTo),
      collectionToKey: nextTo,
    }));
  };

  const applyAllYtdPreset = () => {
    if (billingMonths.length === 0 || collectionMonths.length === 0) return;
    setRange({
      billingFromKey: billingMonths[0].key,
      billingToKey: billingMonths[billingMonths.length - 1].key,
      collectionFromKey: collectionMonths[0].key,
      collectionToKey: collectionMonths[collectionMonths.length - 1].key,
    });
  };

  const effGap = round2(summary.kpis.cohortEfficiencyPct - targetBenchmark);
  const isAboveOrAtTarget = effGap >= 0;

  const chartItems =
    breakdownView === 'manager' && summary.hasManagerBreakdown
      ? summary.managerRows.map((m) => ({
          id: m.manager,
          label: m.manager,
          billed: m.billedAmount,
          collected: m.collectionsWithinWindow,
          remaining: m.remainingBalance,
          efficiency: m.efficiencyPct,
        }))
      : summary.monthlyRows.map((r) => ({
          id: r.arTag,
          label: r.shortLabel,
          billed: r.billedAmount,
          collected: r.collectionsWithinWindow,
          remaining: r.remainingBalance,
          efficiency: r.efficiencyPct,
        }));

  const maxChartBilled = Math.max(...chartItems.map((i) => i.billed), 1);

  return (
    <section
      aria-label="Page 12: Accounts Receivable & Collection Performance Comparative Report"
      className="looker-slide-canvas rounded-xl border border-slate-300/80 shadow-sm px-5 py-7 sm:px-8 sm:py-8 space-y-5"
    >
      {/* Header matching Page 2/3 Mancom styling */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.04em] text-[#C5A728]">
            MANCOM &amp; LEADERSHIP PERFORMANCE UPDATE
          </p>
          <h2 className="mt-1 font-display text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900">
            Accounts Receivable &amp; Collection Performance Comparative Report
          </h2>
          <p className="mt-0.5 text-xs text-slate-600 tabular-nums">
            Updated as of {formatComparativeTimestamp(data.lastUpdated)}
          </p>
          <p className="mt-1 text-xs text-slate-600 tabular-nums">
            AR Billing Period: <strong className="text-slate-900">{billingFromLabel} – {billingToLabel}</strong>
            {' · '}
            Collection Window: <strong className="text-slate-900">{collFromLabel} – {collToLabel}</strong>
          </p>
        </div>

        {/* Single Quick Preset: ALL YTD */}
        <div className="flex flex-wrap items-center gap-2 self-start shrink-0">
          <div className="rounded-xl border border-[#8E949E] bg-[#ECECEE] px-4 py-2 text-center">
            <p className="text-[11px] font-medium text-slate-700">Target Efficiency</p>
            <p className="mt-0.5 font-display text-sm font-bold text-slate-950 tabular-nums">
              {targetBenchmark.toFixed(1)}% Benchmark
            </p>
          </div>
          <button
            type="button"
            onClick={applyAllYtdPreset}
            aria-pressed={isAllYtdActive}
            className={`rounded-lg border px-3 py-2 text-xs font-bold tracking-wide transition-colors cursor-pointer print:hidden ${
              isAllYtdActive
                ? 'border-[#C7AC2D] bg-[#FCF6D6] text-[#8E740B]'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-[#FCF6D6]'
            }`}
          >
            ALL YTD
          </button>
        </div>
      </div>

      {/* Two Independent Period Covered Selectors */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {/* Selector 1: AR Billing Period */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-[#FCF6D6] p-1.5 text-[#8E740B]">
                <CalendarRange className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.04em] text-slate-900">
                  AR Billing Period
                </h3>
                <p className="text-[11px] text-slate-500">
                  Filters invoices by AR TAG billing month ({summary.kpis.billingMonthCount}{' '}
                  {summary.kpis.billingMonthCount === 1 ? 'month' : 'months'} selected)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="comp-billing-from"
                className="block text-[11px] font-semibold text-slate-600 mb-1"
              >
                AR Billing From
              </label>
              <select
                id="comp-billing-from"
                value={range.billingFromKey}
                onChange={(e) => updateBillingFrom(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#C7AC2D] focus:bg-white focus:outline-none cursor-pointer"
              >
                {billingMonths.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="comp-billing-to"
                className="block text-[11px] font-semibold text-slate-600 mb-1"
              >
                AR Billing To
              </label>
              <select
                id="comp-billing-to"
                value={range.billingToKey}
                onChange={(e) => updateBillingTo(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#C7AC2D] focus:bg-white focus:outline-none cursor-pointer"
              >
                {billingMonths.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selector 2: Collection Period */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-[#FCF6D6] p-1.5 text-[#8E740B]">
                <CalendarRange className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.04em] text-slate-900">
                  Collection Period (OR Date Window)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Captures OR collections received within this window against the selected AR billing period
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="comp-collection-from"
                className="block text-[11px] font-semibold text-slate-600 mb-1"
              >
                Collection From
              </label>
              <select
                id="comp-collection-from"
                value={range.collectionFromKey}
                onChange={(e) => updateCollectionFrom(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#C7AC2D] focus:bg-white focus:outline-none cursor-pointer"
              >
                {collectionMonths.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="comp-collection-to"
                className="block text-[11px] font-semibold text-slate-600 mb-1"
              >
                Collection To
              </label>
              <select
                id="comp-collection-to"
                value={range.collectionToKey}
                onChange={(e) => updateCollectionTo(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#C7AC2D] focus:bg-white focus:outline-none cursor-pointer"
              >
                {collectionMonths.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Comparative KPI Cards matching Page 2/3 (YTD Sep) color palette, borders, and accents */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Billing */}
        <article className="flex flex-col justify-between rounded-xl border border-[#8E949E] bg-[#ECECEE] px-4 py-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.03em] text-slate-700 uppercase">
              SELECTED AR BILLED
            </p>
            <p className="mt-1.5 font-display text-[28px] font-semibold tracking-tight text-slate-950 tabular-nums">
              {formatPesoMillions(summary.kpis.selectedArBilled)}
            </p>
          </div>
          <p className="mt-2 font-mono text-[11px] text-slate-700 tabular-nums">
            {formatPeso(summary.kpis.selectedArBilled)}
          </p>
        </article>

        {/* Card 2: Collection */}
        <article className="flex flex-col justify-between rounded-xl border border-[#8E949E] bg-[#ECECEE] px-4 py-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.03em] text-slate-700 uppercase">
              COLLECTIONS WITHIN WINDOW
            </p>
            <p className="mt-1.5 font-display text-[28px] font-semibold tracking-tight text-[#C5A728] tabular-nums">
              {formatPesoMillions(summary.kpis.collectionsWithinWindow)}
            </p>
          </div>
          <p className="mt-2 font-mono text-[11px] text-slate-700 tabular-nums">
            {formatPeso(summary.kpis.collectionsWithinWindow)}
          </p>
        </article>

        {/* Card 3: AR Balance (Gold-tinted Highlight Card) */}
        <article className="flex flex-col justify-between rounded-xl border border-[#C7AC2D] bg-[#FCF6D6] px-4 py-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.03em] text-[#C5A728] uppercase">
              AR BALANCE
            </p>
            <p className="mt-1.5 font-display text-[28px] font-semibold tracking-tight text-[#C5A728] tabular-nums">
              {formatPesoMillions(summary.kpis.remainingBalance)}
            </p>
          </div>
          <p className="mt-2 font-mono text-[11px] text-slate-700 tabular-nums">
            {formatPeso(summary.kpis.remainingBalance)}
          </p>
        </article>

        {/* Card 4: Collection Efficiency % */}
        <article className="flex flex-col justify-between rounded-xl border border-[#8E949E] bg-[#ECECEE] px-4 py-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.03em] text-slate-700 uppercase">
              COLLECTION EFFICIENCY %
            </p>
            <p className="mt-1.5 font-display text-[28px] font-semibold tracking-tight text-slate-950 tabular-nums">
              {formatPercent(summary.kpis.cohortEfficiencyPct)}
            </p>
          </div>
          <div className="mt-1.5 text-[11px] tabular-nums">
            <p className={isAboveOrAtTarget ? 'text-emerald-700 font-semibold' : 'text-slate-700'}>
              <span className={isAboveOrAtTarget ? 'text-emerald-700 font-bold' : 'text-[#B6981E] font-bold'}>
                {formatPercent(Math.abs(effGap))}
              </span>{' '}
              {isAboveOrAtTarget ? 'above' : 'below'} {targetBenchmark.toFixed(0)}% target
            </p>
            <p className="text-slate-700 mt-0.5">
              Target: {targetBenchmark.toFixed(1)}% Benchmark
            </p>
          </div>
        </article>
      </div>

      {/* Synchronized Metric Breakdown Card */}
      <div
        aria-label="Comparative Metric Breakdown"
        className="rounded-xl border border-[#C7AC2D]/80 bg-white p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Metric Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              Target reconciliation for {billingFromLabel} – {billingToLabel} AR against{' '}
              {collFromLabel} – {collToLabel} collections
            </p>
          </div>
          <span className="inline-flex items-center self-start rounded-md border border-[#8E949E] bg-[#ECECEE] px-2.5 py-1 text-[11px] font-semibold text-slate-800 tabular-nums">
            Target Benchmark: {targetBenchmark.toFixed(1)}%
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-[#8E949E] bg-[#ECECEE]/75 px-4 py-3">
            <p className="text-[11px] font-semibold text-slate-700">
              {targetBenchmark % 1 === 0 ? targetBenchmark.toFixed(0) : targetBenchmark.toFixed(1)}% Collection Target Amount
            </p>
            <p className="mt-1 font-display text-lg font-bold text-slate-950 tabular-nums">
              {formatPeso(summary.metricBreakdown.targetAmount)}
            </p>
          </div>

          <div className="rounded-lg border border-[#8E949E] bg-[#ECECEE]/75 px-4 py-3">
            <p className="text-[11px] font-semibold text-slate-700">Actual Collections</p>
            <p className="mt-1 font-display text-lg font-bold text-[#B6981E] tabular-nums">
              {formatPeso(summary.metricBreakdown.actualCollections)}
            </p>
          </div>

          <div
            className={`rounded-lg border px-4 py-3 ${
              summary.metricBreakdown.isAboveOrAtTarget
                ? 'border-emerald-300 bg-emerald-50/80'
                : 'border-[#C7AC2D] bg-[#FCF6D6]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p
                className={`text-[11px] font-bold ${
                  summary.metricBreakdown.isAboveOrAtTarget ? 'text-emerald-800' : 'text-[#9E8418]'
                }`}
              >
                Variance Against Target
              </p>
              <span
                className={`text-[10px] font-bold uppercase tracking-wide ${
                  summary.metricBreakdown.isAboveOrAtTarget ? 'text-emerald-700' : 'text-[#9E8418]'
                }`}
              >
                {summary.metricBreakdown.isAboveOrAtTarget ? 'Surplus' : 'Gap'}
              </span>
            </div>
            <p
              className={`mt-1 font-display text-lg font-bold tabular-nums ${
                summary.metricBreakdown.isAboveOrAtTarget ? 'text-emerald-900' : 'text-[#8E740B]'
              }`}
            >
              {summary.metricBreakdown.isAboveOrAtTarget
                ? `+${formatPeso(summary.metricBreakdown.absoluteVariance)}`
                : formatPeso(summary.metricBreakdown.varianceAgainstTarget)}
            </p>
          </div>
        </div>
      </div>

      {/* Comparative Chart + View Mode Toggle */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Billing vs. Collections
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Stacked comparison of realized cash collections vs. uncollected balance inside selected periods
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#1F6E43]" aria-hidden="true" />
                Collected in Window
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#D8C136]" aria-hidden="true" />
                Remaining Balance
              </span>
            </div>

            {summary.hasManagerBreakdown && (
              <div
                role="group"
                aria-label="Comparative breakdown dimension"
                className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 print:hidden"
              >
                <button
                  type="button"
                  aria-pressed={breakdownView === 'monthly'}
                  onClick={() => setBreakdownView('monthly')}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                    breakdownView === 'monthly'
                      ? 'bg-white text-slate-950 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  By AR Month
                </button>
                <button
                  type="button"
                  aria-pressed={breakdownView === 'manager'}
                  onClick={() => setBreakdownView('manager')}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                    breakdownView === 'manager'
                      ? 'bg-white text-slate-950 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="h-3 w-3" aria-hidden="true" />
                  <span>By Manager</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stacked Proportional Bar Chart */}
        {chartItems.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">
            No AR billing rows match the selected period range.
          </p>
        ) : (
          <div className="space-y-2.5">
            {chartItems.map((item) => {
              const barTotalWidthPct = Math.max(6, (item.billed / maxChartBilled) * 100);
              const collectedPctOfBar =
                item.billed > 0
                  ? Math.min(100, Math.max(0, (item.collected / item.billed) * 100))
                  : 0;
              const remainingPctOfBar = Math.max(0, 100 - collectedPctOfBar);

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-1 gap-1.5 sm:grid-cols-[110px_1fr_175px] sm:items-center sm:gap-3"
                >
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {item.label}
                  </span>

                  <div className="relative h-5 w-full rounded bg-slate-100 p-0.5">
                    <div
                      className="flex h-full overflow-hidden rounded-xs transition-all"
                      style={{ width: `${barTotalWidthPct}%` }}
                    >
                      <div
                        className="h-full bg-[#1F6E43]"
                        style={{ width: `${collectedPctOfBar}%` }}
                        title={`Collected: ${formatPeso(item.collected)}`}
                      />
                      <div
                        className="h-full bg-[#D8C136]"
                        style={{ width: `${remainingPctOfBar}%` }}
                        title={`Remaining: ${formatPeso(item.remaining)}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] tabular-nums">
                    <span className="text-slate-600">{formatPesoMillions(item.billed)}</span>
                    <span
                      className={`font-bold w-14 text-right ${
                        item.efficiency >= targetBenchmark ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {item.efficiency.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Breakdown Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/70 px-4 py-2.5">
          <h3 className="text-xs font-bold uppercase tracking-[0.04em] text-slate-900">
            {breakdownView === 'manager' && summary.hasManagerBreakdown
              ? 'Billing vs. Collections per Account Manager'
              : 'AR Efficiency Matrix'}
          </h3>
          <span className="text-[11px] text-slate-500 tabular-nums">
            {billingFromLabel} – {billingToLabel} AR · {collFromLabel} – {collToLabel} Collections
          </span>
        </div>

        <div className="overflow-x-auto">
          {breakdownView === 'manager' && summary.hasManagerBreakdown ? (
            <table className="w-full border-collapse text-[10px] xl:text-[11px] leading-tight tabular-nums">
              <thead>
                <tr className="bg-[#D8C136] text-slate-950 font-bold">
                  <th
                    rowSpan={2}
                    className="py-2 px-1.5 text-left align-bottom border-b border-[#B9A324] whitespace-nowrap"
                  >
                    Account Manager
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2 px-1.5 text-right align-bottom border-b border-[#B9A324] whitespace-nowrap"
                  >
                    Total Billings
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2 px-1.5 text-right align-bottom border-b border-[#B9A324] whitespace-nowrap"
                  >
                    Total Collections
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2 px-1.5 text-right align-bottom border-b border-[#B9A324] whitespace-nowrap"
                  >
                    Collection Efficiency %
                  </th>
                  <th
                    colSpan={6}
                    className="py-1.5 px-2 text-center border-l border-b border-[#B9A324] bg-[#CEB62E] text-[10px] uppercase tracking-[0.04em]"
                  >
                    Remaining Balance Aging
                  </th>
                </tr>
                <tr className="bg-[#D8C136] text-slate-950 font-bold">
                  <th className="py-1.5 px-1.5 text-right border-l border-b border-[#B9A324] whitespace-nowrap">
                    Current
                  </th>
                  <th className="py-1.5 px-1.5 text-right border-b border-[#B9A324] whitespace-nowrap">
                    1-30 days
                  </th>
                  <th className="py-1.5 px-1.5 text-right border-b border-[#B9A324] whitespace-nowrap">
                    31-60 days
                  </th>
                  <th className="py-1.5 px-1.5 text-right border-b border-[#B9A324] whitespace-nowrap">
                    61-90 days
                  </th>
                  <th className="py-1.5 px-1.5 text-right border-b border-[#B9A324] whitespace-nowrap">
                    91 days above
                  </th>
                  <th className="py-1.5 px-1.5 text-right border-b border-[#B9A324] bg-[#CEB62E]/70 whitespace-nowrap">
                    Grand Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.managerRows.map((row) => (
                  <tr key={row.manager} className="hover:bg-[#FCF6D6]/50">
                    <td className="py-2 px-1.5 font-semibold text-slate-900 whitespace-nowrap">
                      {row.manager}
                    </td>
                    <td className="py-2 px-1.5 text-right text-slate-900 whitespace-nowrap">
                      {formatNumber(row.billedAmount)}
                    </td>
                    <td className="py-2 px-1.5 text-right font-semibold text-emerald-700 whitespace-nowrap">
                      {formatNumber(row.collectionsWithinWindow)}
                    </td>
                    <td className="py-2 px-1.5 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatPercent(row.efficiencyPct)}
                    </td>
                    <td className="py-2 px-1.5 text-right border-l border-slate-100 text-slate-800 whitespace-nowrap">
                      {formatNumber(row.agingCurrent)}
                    </td>
                    <td className="py-2 px-1.5 text-right text-slate-800 whitespace-nowrap">
                      {formatNumber(row.aging1To30)}
                    </td>
                    <td className="py-2 px-1.5 text-right text-slate-800 whitespace-nowrap">
                      {formatNumber(row.aging31To60)}
                    </td>
                    <td className="py-2 px-1.5 text-right text-slate-800 whitespace-nowrap">
                      {formatNumber(row.aging61To90)}
                    </td>
                    <td className="py-2 px-1.5 text-right text-slate-800 whitespace-nowrap">
                      {formatNumber(row.aging91Above)}
                    </td>
                    <td className="py-2 px-1.5 text-right font-bold text-slate-950 bg-slate-50/70 whitespace-nowrap">
                      {formatNumber(row.remainingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-950">
                  <td className="py-2.5 px-1.5 whitespace-nowrap">Grand Total</td>
                  <td className="py-2.5 px-1.5 text-right whitespace-nowrap">
                    {formatNumber(summary.totals.billedAmount)}
                  </td>
                  <td className="py-2.5 px-1.5 text-right text-emerald-800 whitespace-nowrap">
                    {formatNumber(summary.totals.collectionsWithinWindow)}
                  </td>
                  <td className="py-2.5 px-1.5 text-right text-[#9E8418] whitespace-nowrap">
                    {formatPercent(summary.totals.efficiencyPct)}
                  </td>
                  <td className="py-2.5 px-1.5 text-right border-l border-slate-200 whitespace-nowrap">
                    {formatNumber(summary.totals.agingCurrent)}
                  </td>
                  <td className="py-2.5 px-1.5 text-right whitespace-nowrap">
                    {formatNumber(summary.totals.aging1To30)}
                  </td>
                  <td className="py-2.5 px-1.5 text-right whitespace-nowrap">
                    {formatNumber(summary.totals.aging31To60)}
                  </td>
                  <td className="py-2.5 px-1.5 text-right whitespace-nowrap">
                    {formatNumber(summary.totals.aging61To90)}
                  </td>
                  <td className="py-2.5 px-1.5 text-right whitespace-nowrap">
                    {formatNumber(summary.totals.aging91Above)}
                  </td>
                  <td className="py-2.5 px-1.5 text-right text-slate-950 bg-slate-100/90 whitespace-nowrap">
                    {formatNumber(summary.totals.remainingBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="w-full border-collapse text-[9.5px] xl:text-[10px] leading-tight tabular-nums">
              <thead>
                <tr className="bg-[#D8C136] text-slate-950 font-bold">
                  <th className="py-2 px-1 text-left w-5">#</th>
                  <th className="py-2 px-1 text-left">AR Billing Month</th>
                  <th className="py-2 px-1 text-right">Selected AR Billed</th>
                  {summary.activeOrColumns.map((col) => (
                    <th key={col.key} className="py-2 px-1 text-right" title={col.label}>
                      {col.shortLabel}
                    </th>
                  ))}
                  <th className="py-2 px-1 text-right">Total Collections</th>
                  <th className="py-2 px-1 text-right">Remaining Balance</th>
                  <th className="py-2 px-1 text-right">Collection Eff. (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.monthlyRows.map((row, idx) => (
                  <tr key={row.key} className="hover:bg-[#FCF6D6]/50">
                    <td className="py-1.5 px-1 text-slate-500">{idx + 1}.</td>
                    <td className="py-1.5 px-1 font-semibold text-slate-900 whitespace-nowrap">
                      {row.shortLabel}
                    </td>
                    <td className="py-1.5 px-1 text-right font-medium text-slate-900 whitespace-nowrap">
                      {formatWholeNumber(row.billedAmount)}
                    </td>
                    {summary.activeOrColumns.map((col) => {
                      const val = row.monthlyCollections[col.label] ?? 0;
                      return (
                        <td
                          key={col.key}
                          className={`py-1.5 px-1 text-right whitespace-nowrap ${
                            val === 0 ? 'text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {formatWholeNumber(val)}
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-1 text-right font-semibold text-emerald-700 whitespace-nowrap">
                      {formatWholeNumber(row.collectionsWithinWindow)}
                    </td>
                    <td className="py-1.5 px-1 text-right text-slate-800 whitespace-nowrap">
                      {formatWholeNumber(row.remainingBalance)}
                    </td>
                    <td className="py-1.5 px-1 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatPercent(row.efficiencyPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-950">
                  <td className="py-2 px-1" />
                  <td className="py-2 px-1 whitespace-nowrap">Grand Total</td>
                  <td className="py-2 px-1 text-right whitespace-nowrap">
                    {formatWholeNumber(summary.totals.billedAmount)}
                  </td>
                  {summary.activeOrColumns.map((col) => (
                    <td key={col.key} className="py-2 px-1 text-right whitespace-nowrap">
                      {formatWholeNumber(summary.totals.columnTotals[col.label] ?? 0)}
                    </td>
                  ))}
                  <td className="py-2 px-1 text-right text-emerald-800 whitespace-nowrap">
                    {formatWholeNumber(summary.totals.collectionsWithinWindow)}
                  </td>
                  <td className="py-2 px-1 text-right whitespace-nowrap">
                    {formatNumber(summary.totals.remainingBalance)}
                  </td>
                  <td className="py-2 px-1 text-right text-[#9E8418] text-[10px] xl:text-xs font-bold whitespace-nowrap">
                    {formatPercent(summary.totals.efficiencyPct)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Target Collection Projection per AM + Interactive Invoice Drill-Down */}
      {summary.managerTargetGroups.length > 0 && (
        <div
          aria-label="Target Collection Projection per AM"
          className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Target Collection Projection per AM ({targetBenchmark.toFixed(0)}% Benchmark)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                Click any Account Manager or Required amount to inspect prioritized open invoices for{' '}
                {billingFromLabel} – {billingToLabel} AR
              </p>
            </div>
            <span className="inline-flex items-center rounded-md border border-[#C7AC2D] bg-[#FCF6D6] px-2.5 py-1 text-[11px] font-bold text-[#8E740B] tabular-nums">
              Total Required: {formatPeso(summary.managerTargetTotals.additionalNeededForTarget)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            <div className="lg:col-span-7 overflow-x-auto">
              <table className="w-full border-collapse text-[11px] leading-tight tabular-nums">
                <thead>
                  <tr className="bg-[#F6F1CE] border-y border-slate-700 text-[10.5px] font-semibold text-slate-800">
                    <th className="py-2.5 px-2 text-left">MANCOM</th>
                    <th className="py-2.5 px-2 text-left">Account Manager</th>
                    <th className="py-2.5 px-2 text-right">Remaining AR Balance</th>
                    <th className="py-2.5 px-2 text-right">
                      Required ({targetBenchmark.toFixed(0)}%)
                    </th>
                    <th className="py-2.5 px-2 text-right">Proj. Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.managerTargetGroups.map((group) =>
                    group.rows.map((row, idx) => (
                      <tr
                        key={row.manager}
                        className="border-b border-slate-200 bg-[#FCF9E8]/70 hover:bg-[#FAF4D3]"
                      >
                        {idx === 0 && (
                          <td
                            rowSpan={group.rows.length}
                            className="py-2 px-2 align-top font-semibold text-slate-900 border-r border-slate-200/70 bg-[#FAF6DD]"
                          >
                            {group.mancom}
                          </td>
                        )}
                        <td className="py-2 px-2 font-medium text-slate-900">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedManagerModal({
                                manager: row.manager,
                                mancom: group.mancom,
                                requiredAmount: row.additionalNeededForTarget,
                              })
                            }
                            title={`View recommended invoices to collect for ${row.manager}`}
                            className="text-left font-semibold text-slate-900 underline decoration-[#C5A728]/70 decoration-dotted underline-offset-4 hover:text-[#8E740B] hover:decoration-solid cursor-pointer"
                          >
                            {row.manager}
                          </button>
                        </td>
                        <td className="py-2 px-2 text-right text-slate-800 whitespace-nowrap">
                          {formatNumber(row.remainingBalance)}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-800 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedManagerModal({
                                manager: row.manager,
                                mancom: group.mancom,
                                requiredAmount: row.additionalNeededForTarget,
                              })
                            }
                            aria-label={`View required invoices for ${row.manager}: ${formatNumber(row.additionalNeededForTarget)}`}
                            title={
                              row.additionalNeededForTarget <= 0.005
                                ? `${row.manager} has already exceeded the ${targetBenchmark.toFixed(0)}% benchmark`
                                : `Click to view target invoices for ${row.manager}`
                            }
                            className="font-semibold text-slate-900 underline decoration-[#C5A728]/70 decoration-dotted underline-offset-4 hover:text-[#8E740B] hover:decoration-solid tabular-nums cursor-pointer"
                          >
                            {formatNumber(row.additionalNeededForTarget)}
                          </button>
                        </td>
                        <td className="py-2 px-2 text-right font-semibold text-slate-900 whitespace-nowrap">
                          {formatNumber(row.projectedRemainingAtTarget)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-b border-slate-800 bg-[#F6F1CE] font-bold text-slate-950">
                    <td colSpan={2} className="py-2.5 px-2">
                      Grand total
                    </td>
                    <td className="py-2.5 px-2 text-right whitespace-nowrap">
                      {formatNumber(summary.managerTargetTotals.remainingBalance)}
                    </td>
                    <td className="py-2.5 px-2 text-right whitespace-nowrap">
                      {formatNumber(summary.managerTargetTotals.additionalNeededForTarget)}
                    </td>
                    <td className="py-2.5 px-2 text-right whitespace-nowrap">
                      {formatNumber(summary.managerTargetTotals.projectedRemainingAtTarget)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-slate-600 bg-[#DFDFE1] p-5">
              <p className="text-xs font-semibold text-slate-700">Collection Efficiency</p>
              <h4 className="mt-1 font-display text-xl font-bold text-slate-950">
                Target Collection Projection
              </h4>

              <div className="mt-4 space-y-2.5 text-xs">
                {[
                  {
                    label: `Selected AR Billing (${billingFromLabel}–${billingToLabel})`,
                    val: formatPeso(summary.kpis.selectedArBilled),
                  },
                  {
                    label: `Collections in Window (${collFromLabel}–${collToLabel})`,
                    val: formatNumber(summary.kpis.collectionsWithinWindow),
                  },
                  {
                    label: 'Remaining AR Balance',
                    val: formatNumber(summary.managerTargetTotals.remainingBalance),
                  },
                  {
                    label: `Required to Reach ${targetBenchmark.toFixed(0)}% Target`,
                    val: formatNumber(summary.managerTargetTotals.additionalNeededForTarget),
                  },
                  {
                    label: 'Projected Balance (after target)',
                    val: formatPeso(summary.managerTargetTotals.projectedRemainingAtTarget),
                    muted: true,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-2 rounded-full bg-white px-4 py-2"
                  >
                    <span className={item.muted ? 'text-slate-500' : 'text-slate-700'}>
                      {item.label}
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg bg-[#141A21] px-5 py-4 text-center text-white">
                <p className="text-[11px] font-bold tracking-[0.06em] text-slate-200">
                  PROJECTED COLLECTION EFFICIENCY
                </p>
                <p className="mt-1 font-display text-3xl font-semibold text-white tabular-nums">
                  {formatPercent(summary.managerTargetTotals.projectedEfficiencyPct)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <TargetInvoiceModal
        isOpen={Boolean(selectedManagerModal)}
        mancom={selectedManagerModal?.mancom ?? ''}
        targetBenchmark={targetBenchmark}
        allocation={modalAllocation}
        periodLabel={`${billingFromLabel} – ${billingToLabel}`}
        onClose={() => setSelectedManagerModal(null)}
      />
    </section>
  );
};

