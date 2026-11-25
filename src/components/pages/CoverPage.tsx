import React from 'react';
import { ARReportData } from '../../types/arReport';
import { formatPercent, formatPesoMillions, round2 } from '../../utils/arCalculations';
import { AsiaAffinityLogo } from '../AsiaAffinityLogo';

interface CoverPageProps {
  data: ARReportData;
  targetBenchmark: number;
}

export const CoverPage: React.FC<CoverPageProps> = ({ data, targetBenchmark }) => {
  const ytdSepEff =
    data.ytdSepBilling > 0 ? round2((data.ytdSepCollections / data.ytdSepBilling) * 100) : 0;
  const totalBilling = round2(data.ytdSepBilling + data.octArBilling);
  const totalCollections = round2(data.ytdSepCollections + data.octArCollections);
  const totalEff = totalBilling > 0 ? round2((totalCollections / totalBilling) * 100) : 0;
  const targetAmount = round2(totalBilling * (targetBenchmark / 100));
  const deficit = round2(targetAmount - totalCollections);

  return (
    <section
      aria-label="Page 1: Accounts Receivable & Collection Performance Cover"
      className="looker-slide-canvas rounded-xl border border-slate-300/80 shadow-sm px-6 py-8 sm:px-12 sm:py-10 min-h-[600px] flex flex-col justify-between"
    >
      {/* Top-Left Brand Monogram */}
      <div>
        <AsiaAffinityLogo />
      </div>

      {/* Center Hero Title */}
      <div className="mx-auto max-w-4xl text-center py-10">
        <h1 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[#C7AC2D] leading-tight">
          Accounts Receivable &amp; Collection Performance
        </h1>
        <p className="mt-5 text-base sm:text-lg text-slate-800 max-w-3xl mx-auto leading-relaxed">
          Comprehensive Analysis of YTD September Performance, Subsequent Collections, and{' '}
          {data.focusMonthLabel?.split(' ')[0] || 'October'} For-The-Month (FTM) Billings
        </p>
      </div>

      {/* Bottom 4-Column Executive Strip matching Page 1 */}
      <div className="mx-auto w-full max-w-4xl grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-6 pb-2 text-xs text-slate-800">
        <div>
          <p className="font-medium text-slate-700">Reporting Period</p>
          <p className="mt-1 font-bold text-slate-900">YTD Sept vs Oct/Nov 2026</p>
        </div>

        <div>
          <p className="font-medium text-slate-700">Total Receivables Managed</p>
          <p className="mt-1 font-bold text-slate-900 tabular-nums">
            {formatPesoMillions(totalBilling)}{' '}
            <span className="font-semibold text-slate-700">
              (YTD Sep {formatPesoMillions(data.ytdSepBilling)})
            </span>
          </p>
        </div>

        <div>
          <p className="font-medium text-slate-700">Cumulative Collections</p>
          <p className="mt-1 font-bold text-slate-900 tabular-nums">
            {formatPesoMillions(totalCollections)} Recovered
          </p>
          <p className="font-bold text-slate-900 tabular-nums">
            ({formatPercent(totalEff)} · Sep {formatPercent(ytdSepEff)})
          </p>
        </div>

        <div>
          <p className="font-medium text-slate-700 tabular-nums">
            Target Benchmark {targetBenchmark.toFixed(2)}%
          </p>
          <p className="mt-1 font-bold text-slate-900 tabular-nums">
            ({formatPesoMillions(Math.abs(deficit))}{' '}
            {deficit > 0 ? 'Deficit' : 'Surplus'})
          </p>
        </div>
      </div>
    </section>
  );
};
