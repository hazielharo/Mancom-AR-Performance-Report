import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { ARReportData } from '../types/arReport';
import {
  computeARMetrics,
  formatPeso,
  formatPesoMillions,
  getLastUpdatedDay,
  round2,
} from '../utils/arCalculations';

interface ExecutiveSheetVisualsProps {
  data: ARReportData;
  targetBenchmark: number;
}

export const ExecutiveSheetVisuals: React.FC<ExecutiveSheetVisualsProps> = ({
  data,
  targetBenchmark,
}) => {
  const clampedTarget = Math.min(100, Math.max(75, targetBenchmark));
  const novEndDay = getLastUpdatedDay(data.lastUpdated);
  const allMetrics = computeARMetrics(data, 'all', clampedTarget);
  const sepMetrics = computeARMetrics(data, 'ytd_sep', clampedTarget);
  const octMetrics = computeARMetrics(data, 'oct_ar', clampedTarget);

  const managers = data.managerSummaries ?? [];
  const ytdAugBilled = round2(managers.reduce((s, m) => s + m.ytdAugBilled, 0));
  const sepBilled = round2(managers.reduce((s, m) => s + m.sepBilled, 0));
  const sepOnlyBilling =
    ytdAugBilled + sepBilled > 0 ? round2(ytdAugBilled + sepBilled) : sepMetrics.totalBilling;
  const sepOnlyCollected =
    managers.length > 0
      ? round2(managers.reduce((s, m) => s + m.ytdAugCollected + m.sepCollected, 0))
      : sepMetrics.totalCollections;
  const sepOnlyBalance = round2(sepOnlyBilling - sepOnlyCollected);
  const sepOnlyEff =
    sepOnlyBilling > 0 ? round2((sepOnlyCollected / sepOnlyBilling) * 100) : 0;

  const billingYtdSepPct =
    allMetrics.totalBilling > 0
      ? Math.round((allMetrics.billingBreakdown.ytdSep / allMetrics.totalBilling) * 1000) / 10
      : 0;
  const billingOctPct = Number(Math.max(0, 100 - billingYtdSepPct).toFixed(1));

  const collYtdSepPct =
    allMetrics.totalCollections > 0
      ? Math.round((allMetrics.collectionsBreakdown.ytdSep / allMetrics.totalCollections) * 1000) / 10
      : 0;
  const collOctPct = Number(Math.max(0, 100 - collYtdSepPct).toFixed(1));

  const balYtdSepPct =
    allMetrics.arBalance > 0
      ? Math.round((allMetrics.arBalanceBreakdown.ytdSep / allMetrics.arBalance) * 1000) / 10
      : 0;
  const balOctPct = Number(Math.max(0, 100 - balYtdSepPct).toFixed(1));

  const portfolioStages = [
    {
      id: 'ytd_oct',
      label: 'YTD October (All Portfolios)',
      sublabel: 'Cumulative Jan–Oct Billings & Collections',
      billed: allMetrics.totalBilling,
      collected: allMetrics.totalCollections,
      balance: allMetrics.arBalance,
      efficiency: allMetrics.collectionEfficiency,
    },
    {
      id: 'ytd_sep',
      label: 'YTD September (Excl. Oct/Nov)',
      sublabel: 'Baseline Sep Open & Realized Inflows',
      billed: sepOnlyBilling,
      collected: sepOnlyCollected,
      balance: sepOnlyBalance,
      efficiency: sepOnlyEff,
    },
    {
      id: 'oct_ar',
      label: 'October AR (FTM New Billing)',
      sublabel: 'Billed & Collected on October AR Tag',
      billed: octMetrics.totalBilling,
      collected: octMetrics.totalCollections,
      balance: octMetrics.arBalance,
      efficiency: octMetrics.collectionEfficiency,
    },
  ];

  const maxStageBilled = Math.max(...portfolioStages.map((s) => s.billed), 1);

  const recoveryStreams = [
    {
      id: 'oct_sep',
      label: 'Oct 1–31 Collection (YTD Sep AR)',
      sublabel: 'AR TAG < Focus Month · OR Date in Oct',
      amount: round2(data.recoveryFlows.oct1To31SepAr),
      barColor: 'bg-[#1F6E43]',
    },
    {
      id: 'nov_sep',
      label: `Nov 1–${novEndDay} Collection (YTD Sep AR)`,
      sublabel: 'AR TAG < Focus Month · OR Date in Nov',
      amount: round2(data.recoveryFlows.nov1To9SepAr),
      barColor: 'bg-[#D8C136]',
    },
    {
      id: 'oct_nov_new',
      label: 'Collection (Oct & Nov AR)',
      sublabel: 'New Oct/Nov Billing Cash Realization',
      amount: round2(data.recoveryFlows.collectionOctAr),
      barColor: 'bg-slate-800',
    },
  ];

  const maxRecoveryAmount = Math.max(...recoveryStreams.map((r) => r.amount), 1);
  const totalRecoveryImpact = allMetrics.totalRecoveryImpact;
  const targetAttainmentPct =
    allMetrics.targetAmount > 0
      ? Math.min(100, round2((allMetrics.totalCollections / allMetrics.targetAmount) * 100))
      : 0;

  return (
    <div
      aria-label="Executive KPI and Recovery Visual Summary"
      className="space-y-4"
    >
      {/* Top 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Billing YTD */}
        <article className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-slate-500">
                Total Billing YTD
              </span>
              <BarChart3 className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950 tabular-nums">
              {formatPesoMillions(allMetrics.totalBilling)}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
              {formatPeso(allMetrics.totalBilling)}
            </p>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="bg-slate-800"
                style={{ width: `${billingYtdSepPct}%` }}
                title={`YTD Sep: ${formatPeso(allMetrics.billingBreakdown.ytdSep)}`}
              />
              <div
                className="bg-[#D8C136]"
                style={{ width: `${billingOctPct}%` }}
                title={`Oct AR: ${formatPeso(allMetrics.billingBreakdown.octAr)}`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 tabular-nums">
              <span>YTD Sep ({billingYtdSepPct.toFixed(1)}%)</span>
              <span>Oct AR ({billingOctPct.toFixed(1)}%)</span>
            </div>
          </div>
        </article>

        {/* Card 2: Total Collections */}
        <article className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-slate-500">
                Total Collections
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
              {formatPesoMillions(allMetrics.totalCollections)}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
              {formatPeso(allMetrics.totalCollections)}
            </p>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="bg-emerald-600"
                style={{ width: `${collYtdSepPct}%` }}
                title={`YTD Sep Collections: ${formatPeso(allMetrics.collectionsBreakdown.ytdSep)}`}
              />
              <div
                className="bg-emerald-300"
                style={{ width: `${collOctPct}%` }}
                title={`Oct AR Collections: ${formatPeso(allMetrics.collectionsBreakdown.octAr)}`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 tabular-nums">
              <span>YTD Sep ({collYtdSepPct.toFixed(1)}%)</span>
              <span>Oct AR ({collOctPct.toFixed(1)}%)</span>
            </div>
          </div>
        </article>

        {/* Card 3: Remaining AR Balance */}
        <article className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-slate-500">
                Remaining AR Balance
              </span>
              <Wallet className="h-4 w-4 text-[#A88611] shrink-0" aria-hidden="true" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950 tabular-nums">
              {formatPesoMillions(allMetrics.arBalance)}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
              {formatPeso(allMetrics.arBalance)}
            </p>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="bg-[#C7AC2D]"
                style={{ width: `${balYtdSepPct}%` }}
                title={`Open YTD Sep AR: ${formatPeso(allMetrics.arBalanceBreakdown.ytdSep)}`}
              />
              <div
                className="bg-amber-300"
                style={{ width: `${balOctPct}%` }}
                title={`Open Oct AR: ${formatPeso(allMetrics.arBalanceBreakdown.octAr)}`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 tabular-nums">
              <span>Open Sep ({balYtdSepPct.toFixed(1)}%)</span>
              <span>Open Oct ({balOctPct.toFixed(1)}%)</span>
            </div>
          </div>
        </article>

        {/* Card 4: Collection Efficiency vs Target */}
        <article className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-slate-500">
                Collection Efficiency
              </span>
              <Target className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="font-display text-2xl font-bold tracking-tight text-slate-950 tabular-nums">
                {allMetrics.collectionEfficiency.toFixed(2)}%
              </p>
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
                  allMetrics.momDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {allMetrics.momDelta >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {allMetrics.momDelta >= 0 ? '+' : ''}
                {allMetrics.momDelta.toFixed(2)}% MoM
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
              Prior Month (Sep): {allMetrics.priorMonthEfficiency.toFixed(2)}%
            </p>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="relative h-2.5 w-full rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  allMetrics.isAboveOrAtTarget ? 'bg-emerald-600' : 'bg-[#D8C136]'
                }`}
                style={{ width: `${Math.min(100, allMetrics.collectionEfficiency)}%` }}
              />
              <div
                className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-slate-900"
                style={{ left: `${clampedTarget}%` }}
                title={`Target Benchmark: ${clampedTarget.toFixed(1)}%`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] tabular-nums">
              <span className="font-semibold text-slate-700">
                Target: {clampedTarget.toFixed(1)}%
              </span>
              <span
                className={`font-semibold ${
                  allMetrics.isAboveOrAtTarget ? 'text-emerald-700' : 'text-amber-800'
                }`}
              >
                {allMetrics.isAboveOrAtTarget
                  ? `+${formatPesoMillions(allMetrics.absoluteVariance)} surplus`
                  : `${formatPesoMillions(allMetrics.absoluteVariance)} gap`}
              </span>
            </div>
          </div>
        </article>
      </div>

      {/* Main Analytics Grid: Portfolio Stage Bar Chart & Recovery Cash Waterfall */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left Chart: Portfolio Stage Billed vs Collected vs Remaining */}
        <section
          aria-label="Portfolio Stage Billing and Collection Chart"
          className="rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Portfolio Stage Realization (Billed vs. Collected vs. Open AR)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bar widths scaled by total billed volume · vertical marker indicates {clampedTarget.toFixed(1)}% target efficiency
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600" aria-hidden="true" />
                Collected
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#D8C136]" aria-hidden="true" />
                Open AR
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-5">
            {portfolioStages.map((stage) => {
              const billedScalePct = Math.max(8, (stage.billed / maxStageBilled) * 100);
              const collectedWithinStagePct =
                stage.billed > 0 ? Math.min(100, (stage.collected / stage.billed) * 100) : 0;
              const openWithinStagePct = Math.max(0, 100 - collectedWithinStagePct);
              const meetsTarget = stage.efficiency >= clampedTarget;

              return (
                <div key={stage.id} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{stage.label}</p>
                      <p className="text-[11px] text-slate-500">{stage.sublabel}</p>
                    </div>
                    <div className="text-right tabular-nums shrink-0">
                      <span
                        className={`text-sm font-bold ${
                          meetsTarget ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {stage.efficiency.toFixed(2)}%
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Billed {formatPesoMillions(stage.billed)}
                      </span>
                    </div>
                  </div>

                  {/* Proportional Volume Bar */}
                  <div className="relative h-6 w-full rounded-md bg-slate-100 p-0.5">
                    <div
                      className="relative flex h-full overflow-hidden rounded-sm"
                      style={{ width: `${billedScalePct}%` }}
                    >
                      <div
                        className="h-full bg-emerald-600 transition-all"
                        style={{ width: `${collectedWithinStagePct}%` }}
                        title={`Collected: ${formatPeso(stage.collected)}`}
                      />
                      <div
                        className="h-full bg-[#D8C136] transition-all"
                        style={{ width: `${openWithinStagePct}%` }}
                        title={`Remaining Balance: ${formatPeso(stage.balance)}`}
                      />
                      {/* Target marker relative to this bar's billed width */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-900/80"
                        style={{ left: `${clampedTarget}%` }}
                        title={`${clampedTarget.toFixed(1)}% Target`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 tabular-nums">
                    <span>
                      Collected:{' '}
                      <strong className="font-semibold text-emerald-700">
                        {formatPeso(stage.collected)}
                      </strong>
                    </span>
                    <span>
                      Remaining:{' '}
                      <strong className="font-semibold text-slate-800">
                        {formatPeso(stage.balance)}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Chart: Post-Sept Recovery Inflow & Target Benchmark Tracker */}
        <section
          aria-label="Post-Sept Cash Recovery and Target Attainment"
          className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-5"
        >
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Post-Sept Recovery Flow (Oct 1 – Nov {novEndDay})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Realized cash inflows driving {allMetrics.recoveryShareOfCollectionsPct.toFixed(2)}% of total YTD collections
                </p>
              </div>
              <div className="text-right tabular-nums">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  Total Impact
                </span>
                <p className="font-display text-base font-bold text-slate-950">
                  {formatPesoMillions(totalRecoveryImpact)}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {recoveryStreams.map((stream) => {
                const widthPct = Math.max(4, (stream.amount / maxRecoveryAmount) * 100);
                const sharePct =
                  totalRecoveryImpact > 0
                    ? round2((stream.amount / totalRecoveryImpact) * 100)
                    : 0;

                return (
                  <div key={stream.id} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {stream.label}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{stream.sublabel}</p>
                      </div>
                      <div className="text-right tabular-nums shrink-0">
                        <span className="text-xs font-bold text-slate-950">
                          {formatPeso(stream.amount)}
                        </span>
                        <span className="ml-1.5 text-[11px] font-medium text-slate-500">
                          ({sharePct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${stream.barColor}`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Attainment Progress Box */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-900">
                {clampedTarget.toFixed(1)}% Collection Target Attainment
              </span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {targetAttainmentPct.toFixed(1)}% of Target
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${
                  allMetrics.isAboveOrAtTarget ? 'bg-emerald-600' : 'bg-[#C7AC2D]'
                }`}
                style={{ width: `${targetAttainmentPct}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 tabular-nums">
              <span>Target Amount: {formatPeso(allMetrics.targetAmount)}</span>
              <span
                className={`font-semibold ${
                  allMetrics.isAboveOrAtTarget ? 'text-emerald-700' : 'text-amber-800'
                }`}
              >
                {allMetrics.isAboveOrAtTarget
                  ? `Surplus: +${formatPeso(allMetrics.absoluteVariance)}`
                  : `Variance Gap: ${formatPeso(allMetrics.varianceAgainstTarget)}`}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
