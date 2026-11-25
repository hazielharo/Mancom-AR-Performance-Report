import React from 'react';
import { ComputedARMetrics } from '../types/arReport';
import { formatPercent, formatPeso, formatPesoMillions } from '../utils/arCalculations';

interface VisualAnalyticsRowProps {
  metrics: ComputedARMetrics;
}

export const VisualAnalyticsRow: React.FC<VisualAnalyticsRowProps> = ({ metrics }) => {
  const collectedPct =
    metrics.totalBilling > 0
      ? (metrics.totalCollections / metrics.totalBilling) * 100
      : 0;
  const arPct = Math.max(0, 100 - collectedPct);

  const ytdSepBilling = metrics.billingBreakdown.ytdSep;
  const ytdSepCollectedPct =
    ytdSepBilling > 0 ? (metrics.collectionsBreakdown.ytdSep / ytdSepBilling) * 100 : 0;

  const octArBilling = metrics.billingBreakdown.octAr;
  const octArCollectedPct =
    octArBilling > 0 ? (metrics.collectionsBreakdown.octAr / octArBilling) * 100 : 0;

  return (
    <section
      aria-label="Billing composition and target variance analysis"
      className="grid grid-cols-1 gap-6 lg:grid-cols-12"
    >
      {/* Left: Billing Split & Segment Comparison */}
      <div
        id="composition"
        className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7"
      >
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Billing-to-Collection Composition
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Allocation of {metrics.segmentLabel} total billing into realized cash collections and remaining open AR
              </p>
            </div>
            <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
              {formatPesoMillions(metrics.totalBilling)} Total
            </span>
          </div>

          {/* Primary Horizontal Stacked Waterfall Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2 tabular-nums">
              <span className="text-emerald-700 font-semibold">
                Realized Collections · {formatPercent(collectedPct)}
              </span>
              <span className="text-amber-700 font-semibold">
                Open AR Balance · {formatPercent(arPct)}
              </span>
            </div>

            {/* Clean Benchmark Ruler Indicator above bar so it never collides with inner currency labels */}
            <div className="relative h-4 w-full mb-1" aria-hidden="true">
              <div
                className="absolute bottom-0 flex flex-col items-center -translate-x-1/2"
                style={{ left: `${Math.min(96, Math.max(4, metrics.targetBenchmark))}%` }}
              >
                <span className="font-mono text-[10px] font-bold text-slate-800 whitespace-nowrap leading-none mb-0.5">
                  {metrics.targetBenchmark.toFixed(1)}% Target
                </span>
                <span className="h-1.5 w-0.5 bg-slate-900" />
              </div>
            </div>

            <div
              className="relative flex h-10 w-full overflow-hidden rounded-lg bg-slate-100"
              role="img"
              aria-label={`Collections ${formatPercent(collectedPct)} (${formatPesoMillions(metrics.totalCollections)}) versus Remaining AR Balance ${formatPercent(arPct)} (${formatPesoMillions(metrics.arBalance)})`}
            >
              <div
                className="flex items-center justify-start bg-emerald-600 px-3 text-xs font-semibold text-white transition-all duration-200 tabular-nums overflow-hidden whitespace-nowrap"
                style={{ width: `${Math.min(100, Math.max(0, collectedPct))}%` }}
              >
                {collectedPct >= 20 && formatPesoMillions(metrics.totalCollections)}
              </div>
              <div
                className="flex items-center justify-end bg-amber-400 px-3 text-xs font-semibold text-slate-950 transition-all duration-200 tabular-nums overflow-hidden whitespace-nowrap"
                style={{ width: `${Math.min(100, Math.max(0, arPct))}%` }}
              >
                {arPct >= 18 && formatPesoMillions(metrics.arBalance)}
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 tabular-nums">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600 shrink-0" aria-hidden="true" />
                  <span>Collections ({formatPeso(metrics.totalCollections)})</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-amber-400 shrink-0" aria-hidden="true" />
                  <span>Open AR ({formatPeso(metrics.arBalance)})</span>
                </span>
              </div>
              <span className="font-medium text-slate-700">
                {metrics.isAboveOrAtTarget ? 'Target Met' : `Shortfall: ${formatPesoMillions(metrics.absoluteVariance)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Segment-by-Segment Efficiency Breakdown */}
        <div className="mt-7 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-xs font-semibold tracking-wide text-slate-500">
              Segment Realization Comparison
            </h3>
            <span className="text-[11px] text-slate-400">
              Collected vs. Open Balance
            </span>
          </div>

          <div className="space-y-3.5">
            {/* YTD Sep AR Row */}
            <div
              className={`transition-opacity ${
                metrics.segment === 'oct_ar' ? 'opacity-45' : 'opacity-100'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5 tabular-nums">
                <span className="font-semibold text-slate-800">
                  YTD September AR{' '}
                  <span className="font-normal text-slate-500">
                    ({formatPesoMillions(ytdSepBilling)} billed)
                  </span>
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatPercent(ytdSepCollectedPct)} collected ·{' '}
                  <span className="text-amber-700">
                    {formatPesoMillions(metrics.arBalanceBreakdown.ytdSep)} open
                  </span>
                </span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded bg-slate-100">
                <div
                  className="bg-emerald-600 transition-all duration-200"
                  style={{ width: `${Math.min(100, ytdSepCollectedPct)}%` }}
                />
                <div
                  className="bg-amber-400 transition-all duration-200"
                  style={{ width: `${Math.max(0, 100 - ytdSepCollectedPct)}%` }}
                />
              </div>
            </div>

            {/* Oct AR Row */}
            <div
              className={`transition-opacity ${
                metrics.segment === 'ytd_sep' ? 'opacity-45' : 'opacity-100'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5 tabular-nums">
                <span className="font-semibold text-slate-800">
                  October AR{' '}
                  <span className="font-normal text-slate-500">
                    ({formatPesoMillions(octArBilling)} billed)
                  </span>
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatPercent(octArCollectedPct)} collected ·{' '}
                  <span className="text-amber-700">
                    {formatPesoMillions(metrics.arBalanceBreakdown.octAr)} open
                  </span>
                </span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded bg-slate-100">
                <div
                  className="bg-emerald-600 transition-all duration-200"
                  style={{ width: `${Math.min(100, octArCollectedPct)}%` }}
                />
                <div
                  className="bg-amber-400 transition-all duration-200"
                  style={{ width: `${Math.max(0, 100 - octArCollectedPct)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Metric Breakdown Table */}
      <div
        id="target-breakdown"
        className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5"
      >
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Target Variance Breakdown
            </h2>
            <span className="text-xs font-medium text-slate-500">
              {metrics.segmentLabel}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Reconciliation against {metrics.targetBenchmark.toFixed(1)}% collection benchmark
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold tracking-wide text-slate-500">
                  <th scope="col" className="pb-2.5 pr-3">
                    Metric
                  </th>
                  <th scope="col" className="pb-2.5 text-right">
                    Amount (PHP)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <tr>
                  <td className="py-3.5 pr-3 font-medium text-slate-700">
                    {metrics.targetBenchmark.toFixed(1)}% Collection Target Amount
                  </td>
                  <td
                    data-testid="table-target-amount"
                    className="py-3.5 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap"
                  >
                    {formatPeso(metrics.targetAmount)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-3 font-medium text-slate-700">
                    {metrics.segment === 'all'
                      ? 'Actual Collections (YTD Sep + Oct–Nov)'
                      : `Actual Collections (${metrics.segmentLabel})`}
                  </td>
                  <td
                    data-testid="table-actual-collections"
                    className="py-3.5 text-right font-mono font-semibold text-emerald-700 tabular-nums whitespace-nowrap"
                  >
                    {formatPeso(metrics.totalCollections)}
                  </td>
                </tr>
                <tr
                  className={
                    metrics.isAboveOrAtTarget
                      ? 'bg-emerald-50/70'
                      : 'bg-amber-50/70'
                  }
                >
                  <td className="py-3.5 pl-2.5 pr-3 font-bold text-slate-900">
                    <div>Variance Against Target</div>
                    <div
                      className={`text-[11px] font-semibold ${
                        metrics.isAboveOrAtTarget
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {metrics.isAboveOrAtTarget
                        ? 'Target exceeded (collection surplus)'
                        : 'Collection gap to close'}
                    </div>
                  </td>
                  <td
                    data-testid="table-variance-amount"
                    className={`py-3.5 pr-2.5 text-right font-mono text-base font-bold tabular-nums whitespace-nowrap ${
                      metrics.isAboveOrAtTarget
                        ? 'text-emerald-800'
                        : 'text-amber-800'
                    }`}
                  >
                    {metrics.isAboveOrAtTarget
                      ? `+${formatPeso(metrics.absoluteVariance)}`
                      : formatPeso(metrics.absoluteVariance)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 text-xs text-slate-500">
                    Total Billing Basis
                  </td>
                  <td className="py-3 text-right font-mono text-xs font-medium text-slate-600 tabular-nums whitespace-nowrap">
                    {formatPeso(metrics.totalBilling)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 text-xs text-slate-500">
                    Remaining Uncollected AR
                  </td>
                  <td className="py-3 text-right font-mono text-xs font-medium text-slate-600 tabular-nums whitespace-nowrap">
                    {formatPeso(metrics.arBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
