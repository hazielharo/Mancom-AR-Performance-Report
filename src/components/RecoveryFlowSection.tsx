import React from 'react';
import { ComputedARMetrics } from '../types/arReport';
import { formatPeso, formatPesoMillions } from '../utils/arCalculations';

interface RecoveryFlowSectionProps {
  metrics: ComputedARMetrics;
}

export const RecoveryFlowSection: React.FC<RecoveryFlowSectionProps> = ({ metrics }) => {
  const barColors: Record<string, string> = {
    oct_1_31_sep: 'bg-slate-800',
    nov_1_9_sep: 'bg-slate-500',
    oct_ar_collection: 'bg-emerald-600',
  };

  return (
    <section
      id="recovery-flow"
      aria-label="Post-September Recovery Flow"
      className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch"
    >
      {/* Left: Post-Sept Recovery Flow Breakdown & Distribution Chart */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Post-Sept Recovery Flow (Oct 1 – Nov {metrics.novEndDay} Cash Inflows)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Cash collections captured across October and early November for{' '}
                {metrics.segmentLabel}
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
              {metrics.recoveryItems.length} inflow{' '}
              {metrics.recoveryItems.length === 1 ? 'stream' : 'streams'}
            </span>
          </div>

          <div className="mt-6 space-y-5">
            {metrics.recoveryItems.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-semibold text-slate-800">{item.label}</span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">· {item.period}</span>
                  </div>
                  <div className="flex items-baseline gap-2.5 tabular-nums">
                    <span className="text-xs font-medium text-slate-500">
                      {item.sharePct.toFixed(1)}%
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatPeso(item.amount)}
                    </span>
                  </div>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      barColors[item.id] || 'bg-slate-700'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, item.sharePct))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 tabular-nums">
          <span>
            YTD Sep AR Recovery Subtotal:{' '}
            <strong className="font-mono font-semibold text-slate-800">
              {formatPeso(metrics.recoveryYtdSepSubtotal)}
            </strong>
          </span>
          <span>
            Oct &amp; Nov AR Inflows Subtotal:{' '}
            <strong className="font-mono font-semibold text-slate-800">
              {formatPeso(metrics.recoveryOctArSubtotal)}
            </strong>
          </span>
        </div>
      </div>

      {/* Right: Dark Navy High-Impact Total Hero Card */}
      <div
        data-testid="recovery-hero-card"
        className="flex flex-col justify-between rounded-xl bg-[#0F172A] p-6 text-white lg:col-span-5"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold tracking-[0.04em] text-slate-300">
              Total Early Oct – Nov Impact
            </h2>
            <span className="text-xs font-medium text-emerald-400 tabular-nums">
              Oct 1 – Nov {metrics.novEndDay}
            </span>
          </div>

          <p className="mt-3 font-display text-3xl font-bold tracking-[0.01em] text-white sm:text-4xl tabular-nums">
            {formatPeso(metrics.totalRecoveryImpact)}
          </p>
          <p className="mt-1.5 text-sm font-medium text-slate-300 tabular-nums tracking-[0.01em]">
            {formatPesoMillions(metrics.totalRecoveryImpact)} ·{' '}
            <span className="text-emerald-400 font-semibold">
              {metrics.recoveryShareOfCollectionsPct.toFixed(2)}%
            </span>{' '}
            of {metrics.segmentLabel} collections
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 tabular-nums">
          <div>
            <p className="text-[11px] font-medium text-slate-400">
              YTD Sep AR Recovery
            </p>
            <p className="mt-1 font-mono text-base font-semibold text-white">
              {formatPesoMillions(metrics.recoveryYtdSepSubtotal)}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-slate-400">
              {formatPeso(metrics.recoveryYtdSepSubtotal)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">
              Oct &amp; Nov AR Inflows
            </p>
            <p className="mt-1 font-mono text-base font-semibold text-emerald-400">
              {formatPesoMillions(metrics.recoveryOctArSubtotal)}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-slate-400">
              {formatPeso(metrics.recoveryOctArSubtotal)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
