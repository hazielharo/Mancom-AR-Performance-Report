import React from 'react';
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { ComputedARMetrics } from '../types/arReport';
import { formatPercent, formatPeso, formatPesoMillions } from '../utils/arCalculations';

interface KpiGridProps {
  metrics: ComputedARMetrics;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ metrics }) => {
  const arSharePct =
    metrics.totalBilling > 0
      ? ((metrics.arBalance / metrics.totalBilling) * 100).toFixed(2)
      : '0.00';

  const efficiencyBarWidth = Math.min(100, Math.max(0, metrics.collectionEfficiency));
  const targetMarkerPos = Math.min(100, Math.max(0, metrics.targetBenchmark));
  const priorMonthPos = Math.min(100, Math.max(0, metrics.priorMonthEfficiency));

  const isPositiveMom = metrics.momDelta >= 0;

  return (
    <section
      id="overview"
      aria-label="Key Performance Indicators"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {/* 1. Total Billing YTD */}
      <article
        data-testid="kpi-billing"
        className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold tracking-wide text-slate-500">
              Total Billing YTD
            </h2>
            <span className="text-xs font-medium text-slate-400">
              {metrics.segment === 'all' ? 'Combined' : metrics.segmentLabel}
            </span>
          </div>
          <p className="mt-2.5 font-display text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
            {formatPesoMillions(metrics.totalBilling)}
          </p>
          <p className="mt-1 font-mono text-xs font-medium text-slate-500 tabular-nums">
            {formatPeso(metrics.totalBilling)}
          </p>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600 tabular-nums">
          <div className="flex items-center justify-between gap-2">
            <span className={metrics.segment === 'oct_ar' ? 'text-slate-400' : 'text-slate-600'}>
              YTD Sep:{' '}
              <strong className="font-semibold text-slate-900">
                {formatPesoMillions(metrics.billingBreakdown.ytdSep)}
              </strong>
            </span>
            <span aria-hidden="true" className="text-slate-300">
              |
            </span>
            <span className={metrics.segment === 'ytd_sep' ? 'text-slate-400' : 'text-slate-600'}>
              Oct AR:{' '}
              <strong className="font-semibold text-slate-900">
                {formatPesoMillions(metrics.billingBreakdown.octAr)}
              </strong>
            </span>
          </div>
        </div>
      </article>

      {/* 2. Total Collections */}
      <article
        data-testid="kpi-collections"
        className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold tracking-wide text-slate-500">
              Total Collections
            </h2>
            <span className="text-xs font-semibold text-emerald-700 tabular-nums">
              {formatPercent(metrics.collectionEfficiency)} realized
            </span>
          </div>
          <p className="mt-2.5 font-display text-3xl font-bold tracking-tight text-emerald-700 tabular-nums">
            {formatPesoMillions(metrics.totalCollections)}
          </p>
          <p className="mt-1 font-mono text-xs font-medium text-slate-500 tabular-nums">
            {formatPeso(metrics.totalCollections)}
          </p>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600 tabular-nums">
          <div className="flex items-center justify-between gap-2">
            <span className={metrics.segment === 'oct_ar' ? 'text-slate-400' : 'text-slate-600'}>
              YTD Sep:{' '}
              <strong className="font-semibold text-slate-900">
                {formatPesoMillions(metrics.collectionsBreakdown.ytdSep)}
              </strong>
            </span>
            <span aria-hidden="true" className="text-slate-300">
              |
            </span>
            <span className={metrics.segment === 'ytd_sep' ? 'text-slate-400' : 'text-slate-600'}>
              Oct AR:{' '}
              <strong className="font-semibold text-slate-900">
                {formatPesoMillions(metrics.collectionsBreakdown.octAr)}
              </strong>
            </span>
          </div>
        </div>
      </article>

      {/* 3. YTD AR Balance */}
      <article
        data-testid="kpi-ar-balance"
        className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold tracking-wide text-slate-500">
              {metrics.segment === 'oct_ar' ? 'Oct AR Balance' : 'YTD AR Balance'}
            </h2>
            <span className="text-xs font-semibold text-amber-700 tabular-nums">
              {arSharePct}% open
            </span>
          </div>
          <p className="mt-2.5 font-display text-3xl font-bold tracking-tight text-amber-700 tabular-nums">
            {formatPesoMillions(metrics.arBalance)}
          </p>
          <p className="mt-1 font-mono text-xs font-medium text-slate-500 tabular-nums">
            {formatPeso(metrics.arBalance)}
          </p>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600 tabular-nums">
          <div className="flex items-center justify-between gap-2">
            <span className={metrics.segment === 'oct_ar' ? 'text-slate-400' : 'text-slate-600'}>
              YTD Sep:{' '}
              <strong className="font-semibold text-slate-900">
                {formatPesoMillions(metrics.arBalanceBreakdown.ytdSep)}
              </strong>
            </span>
            <span aria-hidden="true" className="text-slate-300">
              |
            </span>
            <span className={metrics.segment === 'ytd_sep' ? 'text-slate-400' : 'text-slate-600'}>
              Oct AR:{' '}
              <strong className="font-semibold text-slate-900">
                {formatPesoMillions(metrics.arBalanceBreakdown.octAr)}
              </strong>
            </span>
          </div>
        </div>
      </article>

      {/* 4. Collection Efficiency with Target Marker & Prior Month Indicator */}
      <article
        data-testid="kpi-efficiency"
        className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold tracking-wide text-slate-500 whitespace-nowrap">
              Collection Efficiency
            </h2>
            <span className="text-xs font-medium text-slate-400 whitespace-nowrap tabular-nums">
              Target {metrics.targetBenchmark.toFixed(1)}%
            </span>
          </div>

          <p className="mt-2.5 font-display text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
            {formatPercent(metrics.collectionEfficiency)}
          </p>

          <p
            className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${
              metrics.isAboveOrAtTarget ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {metrics.isAboveOrAtTarget ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>
              {formatPercent(Math.abs(metrics.efficiencyGapToTarget))}{' '}
              {metrics.isAboveOrAtTarget ? 'above' : 'below'}{' '}
              {metrics.targetBenchmark.toFixed(1)}% target
            </span>
          </p>

          {/* Visual Progress Bar with Target Marker Line and Prior Month Indicator */}
          <div className="mt-3">
            <div
              role="progressbar"
              aria-label="Collection efficiency against target benchmark"
              aria-valuenow={metrics.collectionEfficiency}
              aria-valuemin={0}
              aria-valuemax={100}
              className="relative h-2.5 w-full rounded-full bg-slate-100"
            >
              {/* Filled efficiency bar */}
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  metrics.isAboveOrAtTarget ? 'bg-emerald-600' : 'bg-emerald-500'
                }`}
                style={{ width: `${efficiencyBarWidth}%` }}
              />

              {/* Prior Month (Sep) Marker */}
              <div
                title={`Prior Month (Sep): ${formatPercent(metrics.priorMonthEfficiency)}`}
                className="absolute top-0 bottom-0 w-0.5 bg-slate-500/80"
                style={{ left: `${priorMonthPos}%` }}
              />

              {/* Target Benchmark Vertical Marker Line */}
              <div
                title={`Target Benchmark: ${metrics.targetBenchmark.toFixed(1)}%`}
                className="absolute -top-1 -bottom-1 w-0.5 bg-slate-900"
                style={{ left: `${targetMarkerPos}%` }}
              />
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-slate-500 tabular-nums">
              <span>Sep: {formatPercent(metrics.priorMonthEfficiency)}</span>
              <span className="font-semibold text-slate-800">
                Target: {metrics.targetBenchmark.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3 flex items-center justify-between text-xs tabular-nums">
          <span className="text-slate-500">
            Prior (Sep): <strong className="font-semibold text-slate-700">{formatPercent(metrics.priorMonthEfficiency)}</strong>
          </span>
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              isPositiveMom ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {isPositiveMom ? (
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{formatPercent(metrics.momDelta, true)} MoM</span>
          </span>
        </div>
      </article>
    </section>
  );
};
