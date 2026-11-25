import React from 'react';
import { ARReportData } from '../../types/arReport';
import {
  formatNumber,
  formatPercent,
  formatPeso,
  formatPesoMillions,
  getLastUpdatedDay,
  round2,
} from '../../utils/arCalculations';

interface PerformanceSummaryPageProps {
  data: ARReportData;
  targetBenchmark: number;
  variant: 'ytd_sep' | 'ytd_oct';
}

export const PerformanceSummaryPage: React.FC<PerformanceSummaryPageProps> = ({
  data,
  targetBenchmark,
  variant,
}) => {
  const isSep = variant === 'ytd_sep';
  const managers = data.managerSummaries ?? [];
  const novEndDay = getLastUpdatedDay(data.lastUpdated);

  // Derive YTD Sep vs YTD Aug breakdown from manager summaries when available
  const ytdAugBilled = managers.reduce((s, m) => s + m.ytdAugBilled, 0);
  const sepBilled = managers.reduce((s, m) => s + m.sepBilled, 0);
  const preOctSepOpen = managers.reduce((s, m) => s + m.ytdSepPreOctOpen, 0);

  // Page 2 = YTD Sep (excluding Oct & Nov AR) or full YTD Sep portfolio
  // Let's keep Page 2 strictly focused on YTD Sep AR (Prior + Sep AR) and Page 7 on Total YTD October (YTD Sep + Oct AR)
  const sepOnlyBilling =
    ytdAugBilled + sepBilled > 0 ? round2(ytdAugBilled + sepBilled) : round2(data.ytdSepBilling);
  const sepOnlyCollected =
    managers.length > 0
      ? round2(managers.reduce((s, m) => s + m.ytdAugCollected + m.sepCollected, 0))
      : round2(data.ytdSepCollections);

  const billingTotal = isSep
    ? sepOnlyBilling
    : round2(data.ytdSepBilling + data.octArBilling);
  const collectionsTotal = isSep
    ? sepOnlyCollected
    : round2(data.ytdSepCollections + data.octArCollections);
  const arBalanceTotal = round2(billingTotal - collectionsTotal);
  const efficiency =
    billingTotal > 0 ? round2((collectionsTotal / billingTotal) * 100) : 0;

  const targetAmount = round2(billingTotal * (targetBenchmark / 100));
  const varianceAmount = round2(targetAmount - collectionsTotal);
  const effGap = round2(efficiency - targetBenchmark);
  const isAboveTarget = varianceAmount <= 0;

  // Spreadsheet-derived YTD Sep breakdown metrics for Page 2 lower Metric Breakdown
  const ytdSepRemainingOpenTotal = round2(
    managers.reduce((s, m) => s + m.ytdSepRemainingOpen, 0)
  );
  const sepOctNovRecovery = round2(
    data.recoveryFlows.oct1To31SepAr + data.recoveryFlows.nov1To9SepAr
  );
  const additionalNeededForTarget = round2(Math.max(0, varianceAmount));

  const recoveryRows = isSep
    ? [
        {
          label: 'October 1-31 Collection',
          amount: data.recoveryFlows.oct1To31SepAr,
          formatted: formatPeso(data.recoveryFlows.oct1To31SepAr),
        },
        {
          label: `November 1-${novEndDay} Collection`,
          amount: data.recoveryFlows.nov1To9SepAr,
          formatted: formatPeso(data.recoveryFlows.nov1To9SepAr),
        },
      ]
    : [
        {
          label: 'Oct 1–31 Collection (YTD Sep AR)',
          amount: data.recoveryFlows.oct1To31SepAr,
          formatted: formatPeso(data.recoveryFlows.oct1To31SepAr),
        },
        {
          label: `Nov 1-${novEndDay} Collection (YTD Sep AR)`,
          amount: data.recoveryFlows.nov1To9SepAr,
          formatted: formatNumber(data.recoveryFlows.nov1To9SepAr),
        },
        {
          label: 'Collection (Oct & Nov AR)',
          amount: data.recoveryFlows.collectionOctAr,
          formatted: formatNumber(data.recoveryFlows.collectionOctAr),
        },
      ];

  const totalEarlyImpact = round2(
    recoveryRows.reduce((sum, item) => sum + item.amount, 0)
  );

  return (
    <section
      aria-label={`Page ${isSep ? 2 : 7}: ${isSep ? 'YTD September' : 'YTD October'} Billing & Collection Efficiency`}
      className="looker-slide-canvas rounded-xl border border-slate-300/80 shadow-sm px-6 py-7 sm:px-10 sm:py-8"
    >
      {/* Top Title Bar & Target Benchmark Box */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.04em] text-[#C5A728]">
            MANCOM &amp; LEADERSHIP PERFORMANCE UPDATE
          </p>
          <h2 className="mt-1 font-display text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">
            YTD{' '}
            <span className="text-[#C5A728]">
              {isSep ? 'September' : 'October'}
            </span>{' '}
            Billing &amp; Collection Efficiency
          </h2>
          <p className="mt-0.5 text-xs text-slate-600 tabular-nums">
            Updated as of {data.lastUpdated}
          </p>
        </div>

        <div className="rounded-xl border border-[#8E949E] bg-[#ECECEE] px-6 py-2.5 text-center self-start shrink-0">
          <p className="text-[11px] font-medium text-slate-700">Target Efficiency</p>
          <p className="mt-0.5 font-display text-base font-bold text-slate-950 tabular-nums">
            {targetBenchmark.toFixed(1)}% Benchmark
          </p>
        </div>
      </div>

      {/* 4 KPI Scorecards matching Looker Studio PDF */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Billing */}
        <article className="flex flex-col justify-between rounded-xl border border-[#8E949E] bg-[#ECECEE] px-4 py-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.03em] text-slate-700">
              {isSep ? 'YTD SEP BILLING' : 'TOTAL BILLING YTD'}
            </p>
            <p className="mt-1.5 font-display text-[28px] font-semibold tracking-tight text-slate-950 tabular-nums">
              {formatPesoMillions(billingTotal)}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-slate-700 tabular-nums">
            {isSep ? (
              <>
                YTD Aug: {formatPesoMillions(ytdAugBilled).replace('₱', '')} | Sep AR:{' '}
                {formatPesoMillions(sepBilled).replace('₱', '')}
              </>
            ) : (
              <>
                YTD Sep:{' '}
                <span className="text-[#B6981E] font-semibold">
                  {formatPesoMillions(data.ytdSepBilling).replace('₱', '')}
                </span>{' '}
                | Oct AR:{' '}
                <span className="text-[#B6981E] font-semibold">
                  {formatPesoMillions(data.octArBilling).replace('₱', '')}
                </span>
              </>
            )}
          </p>
        </article>

        {/* Card 2: Collections */}
        <article className="flex flex-col justify-between rounded-xl border border-[#8E949E] bg-[#ECECEE] px-4 py-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.03em] text-slate-700">
              {isSep ? 'YTD COLLECTION' : 'TOTAL COLLECTIONS'}
            </p>
            <p className="mt-1.5 font-display text-[28px] font-semibold tracking-tight text-[#C5A728] tabular-nums">
              {formatPesoMillions(collectionsTotal)}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-slate-700 tabular-nums">
            {isSep ? (
              'Realized cash inflow (YTD September Billing)'
            ) : (
              <>
                YTD Sep:{' '}
                <span className="text-[#B6981E] font-semibold">
                  {formatPesoMillions(data.ytdSepCollections).replace('₱', '')}
                </span>{' '}
                | Oct AR:{' '}
                <span className="text-[#B6981E] font-semibold">
                  {formatPesoMillions(data.octArCollections).replace('₱', '')}
                </span>
              </>
            )}
          </p>
        </article>

        {/* Card 3: AR Balance (Gold-tinted Highlight Card) */}
        <article className="flex flex-col justify-between rounded-xl border border-[#C7AC2D] bg-[#FCF6D6] px-4 py-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.03em] text-[#C5A728]">
              {isSep ? 'AR BALANCE' : 'YTD AR BALANCE'}
            </p>
            <p className="mt-1.5 font-display text-[28px] font-semibold tracking-tight text-[#C5A728] tabular-nums">
              {formatPesoMillions(arBalanceTotal)}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-slate-700 tabular-nums">
            {isSep ? (
              'Remaining Balance of YTD September Billing'
            ) : (
              <>
                YTD Sep:{' '}
                <span className="text-[#B6981E] font-semibold">
                  {formatPesoMillions(
                    round2(data.ytdSepBilling - data.ytdSepCollections)
                  ).replace('₱', '')}
                </span>{' '}
                | Oct AR:{' '}
                <span className="text-[#B6981E] font-semibold">
                  {formatPesoMillions(
                    round2(data.octArBilling - data.octArCollections)
                  ).replace('₱', '')}
                </span>
              </>
            )}
          </p>
        </article>

        {/* Card 4: Collection Efficiency */}
        <article className="flex flex-col justify-between rounded-xl border border-[#8E949E] bg-[#ECECEE] px-4 py-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.03em] text-slate-700">
              COLLECTION EFFICIENCY
            </p>
            <p className="mt-1.5 font-display text-[28px] font-semibold tracking-tight text-slate-950 tabular-nums">
              {formatPercent(efficiency)}
            </p>
          </div>
          <div className="mt-1.5 text-[11px] tabular-nums">
            <p className={isAboveTarget ? 'text-emerald-700 font-semibold' : 'text-slate-700'}>
              <span className={isAboveTarget ? 'text-emerald-700 font-bold' : 'text-[#B6981E] font-bold'}>
                {formatPercent(Math.abs(effGap))}
              </span>{' '}
              {isAboveTarget ? 'above' : 'below'} {targetBenchmark.toFixed(0)}% target
            </p>
            <p className="text-slate-700 mt-0.5">
              Sep: {formatPercent(data.priorMonthEfficiency)}
            </p>
          </div>
        </article>
      </div>

      {/* Bottom 2-Column Split: Metric Breakdown & Post-Sept Recovery Flow */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left: Metric Breakdown */}
        <div className="lg:col-span-6 space-y-6 pt-1">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Metric Breakdown</h3>
            <div className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3 px-2 text-slate-800">
                <span>{targetBenchmark.toFixed(0)}% Collection Target Amount</span>
                <span className="font-semibold tabular-nums whitespace-nowrap">
                  {formatPeso(targetAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 px-2 text-slate-800">
                <span>
                  {isSep
                    ? `Actual Collections (YTD September) Incl Oct 1 - Nov ${novEndDay}`
                    : 'Actual Collections (YTD Sep + Oct–Nov)'}
                </span>
                <span className="font-semibold tabular-nums whitespace-nowrap">
                  {formatNumber(collectionsTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-full border border-[#C7AC2D] bg-[#FCF6D6] px-4 py-2 text-[#9E8418] font-semibold">
                <span>
                  {isAboveTarget ? 'Surplus Above Target' : 'Variance Against Target'}
                </span>
                <span className="tabular-nums whitespace-nowrap">
                  {isAboveTarget
                    ? `+${formatNumber(Math.abs(varianceAmount))}`
                    : formatNumber(varianceAmount)}
                </span>
              </div>
            </div>
          </div>

          {isSep && (
            <div className="space-y-2.5 pt-2 text-sm">
              <div className="flex items-center justify-between gap-3 px-2 text-slate-800">
                <span>September AR YTD Balance (Pre-Oct Baseline)</span>
                <span className="font-semibold tabular-nums whitespace-nowrap">
                  {formatPeso(preOctSepOpen)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 px-2 text-slate-800">
                <span>Actual Collections (Oct 1 - Nov {novEndDay})</span>
                <span className="font-semibold tabular-nums whitespace-nowrap">
                  {formatNumber(sepOctNovRecovery)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 px-2 text-slate-800">
                <span>Remaining Open YTD Sep Balance</span>
                <span className="font-semibold tabular-nums whitespace-nowrap">
                  {formatNumber(ytdSepRemainingOpenTotal > 0 ? ytdSepRemainingOpenTotal : arBalanceTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-full border border-[#C7AC2D] bg-[#FCF6D6] px-4 py-2 text-[#9E8418] font-semibold">
                <span>Additional Required for {targetBenchmark.toFixed(0)}% Target</span>
                <span className="tabular-nums whitespace-nowrap">
                  {formatNumber(additionalNeededForTarget)}
                </span>
              </div>
            </div>
          )}

          {!isSep && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-700">
              <div className="flex items-center justify-between font-semibold text-slate-800 mb-2">
                <span>Realization Progress vs. {targetBenchmark.toFixed(1)}% Target</span>
                <span className="tabular-nums">
                  {formatPeso(collectionsTotal)} / {formatPeso(billingTotal)}
                </span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#C7AC2D] transition-all duration-200"
                  style={{ width: `${Math.min(100, Math.max(0, efficiency))}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-900"
                  style={{ left: `${Math.min(100, Math.max(0, targetBenchmark))}%` }}
                  title={`Target: ${targetBenchmark.toFixed(1)}%`}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-slate-500 tabular-nums">
                <span>0%</span>
                <span>Current: {formatPercent(efficiency)}</span>
                <span>Target: {targetBenchmark.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Post-Sept Recovery Flow Gold-Tinted Card */}
        <div className="lg:col-span-6 rounded-xl border border-[#C7AC2D] bg-[#FCF6D6] p-5 sm:p-6">
          <p className="text-xs font-semibold text-slate-600">
            Post-Sept Recovery Flow{isSep ? ' (Included in YTD Collection)' : ''}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold text-slate-950">
            Oct 1 - Nov {novEndDay} Cash Inflows
          </h3>

          <div className="mt-4 space-y-2.5">
            {recoveryRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 rounded-full bg-white px-5 py-2.5 text-sm shadow-2xs"
              >
                <span className="text-slate-700">{row.label}</span>
                <span className="font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                  {row.formatted}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-[#141A21] px-5 py-4 text-center text-white">
            <p className="text-[11px] font-bold tracking-[0.06em] text-slate-200">
              TOTAL EARLY OCT - NOV IMPACT
            </p>
            <p className="mt-1 font-display text-2xl sm:text-[26px] font-semibold tracking-wide text-white tabular-nums">
              {formatPeso(totalEarlyImpact)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
