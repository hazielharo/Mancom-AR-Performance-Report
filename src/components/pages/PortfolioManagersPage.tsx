import React, { useMemo, useState } from 'react';
import { ARReportData, ManagerLedgerSummary } from '../../types/arReport';
import {
  allocateTargetInvoices,
  computeManagerTargetProjection,
  formatNumber,
  formatPercent,
  formatPeso,
  formatPesoMillions,
  formatWholeNumber,
  getLastUpdatedDay,
  round2,
} from '../../utils/arCalculations';
import { TargetInvoiceModal } from '../TargetInvoiceModal';

interface PortfolioManagersPageProps {
  data: ARReportData;
  targetBenchmark: number;
  pageVariant: 'p3_portfolio' | 'p5_projection' | 'p8_oct_billings';
}

const MANCOM_GROUP_ORDER = [
  { mancom: 'LTM', managers: ['LYKA', 'JANINE', 'CEZAR'] },
  { mancom: 'JOVEN', managers: ['ROWENA', 'NORIEL'] },
  { mancom: 'ACC', managers: ['HARVEY'] },
  { mancom: 'AMB/RBD', managers: ['RALPH'] },
  { mancom: 'GHIE', managers: ['ANGIE'] },
  { mancom: 'RBD', managers: ['KING', 'SANDHER'] },
];

export const PortfolioManagersPage: React.FC<PortfolioManagersPageProps> = ({
  data,
  targetBenchmark,
  pageVariant,
}) => {
  const [selectedManagerModal, setSelectedManagerModal] = useState<{
    manager: string;
    mancom: string;
    requiredAmount: number;
  } | null>(null);

  const managers = data.managerSummaries ?? [];
  const novEndDay = getLastUpdatedDay(data.lastUpdated);

  const modalAllocation = useMemo(() => {
    if (!selectedManagerModal) return null;
    return allocateTargetInvoices(
      data.openInvoices,
      selectedManagerModal.manager,
      selectedManagerModal.requiredAmount,
      data.arLineItems
    );
  }, [selectedManagerModal, data.openInvoices, data.arLineItems]);

  const mgrByName = new Map<string, ManagerLedgerSummary>();
  managers.forEach((m) => mgrByName.set(m.manager.toUpperCase(), m));

  const remainingYtdSepTotal = round2(
    managers.reduce((s, m) => s + m.ytdSepRemainingOpen, 0)
  );
  const totalRemainingAll = round2(managers.reduce((s, m) => s + m.totalRemaining, 0));

  const badgeAmount =
    pageVariant === 'p8_oct_billings' ? totalRemainingAll : remainingYtdSepTotal;

  // Build ordered MANCOM rows including any unexpected manager in custom CSVs
  const orderedMancomGroups = (() => {
    const seen = new Set<string>();
    const groups = MANCOM_GROUP_ORDER.map((g) => {
      const rows = g.managers
        .map((name) => {
          seen.add(name);
          return mgrByName.get(name);
        })
        .filter((x): x is ManagerLedgerSummary => Boolean(x));
      return { mancom: g.mancom, rows };
    }).filter((g) => g.rows.length > 0);

    const extras = managers.filter((m) => !seen.has(m.manager.toUpperCase()));
    if (extras.length > 0) {
      groups.push({ mancom: 'OTHER', rows: extras });
    }
    return groups;
  })();

  const headerMeta = {
    p3_portfolio: {
      eyebrow: 'A/R PORTFOLIO BREAKDOWN',
      title: `Outstanding Balance & ${targetBenchmark.toFixed(0)}% Target Gap by Account Manager`,
      highlight: '',
    },
    p5_projection: {
      eyebrow: 'A/R PORTFOLIO BREAKDOWN',
      title: `Target Collection & ${targetBenchmark.toFixed(0)}% Projection`,
      highlight: '',
    },
    p8_oct_billings: {
      eyebrow: 'A/R PORTFOLIO BREAKDOWN',
      title: 'Outstanding Balance with ',
      highlight: 'Oct Billings',
      suffix: ' by Account Manager',
    },
  }[pageVariant];

  // Shared totals strictly derived from the linked spreadsheet
  const totYtdAugOpen = round2(managers.reduce((s, m) => s + m.ytdAugOpen, 0));
  const totSepOpen = round2(managers.reduce((s, m) => s + m.sepOpen, 0));
  const totYtdSepPreOctOpen = round2(managers.reduce((s, m) => s + m.ytdSepPreOctOpen, 0));
  const totOct1To31 = round2(managers.reduce((s, m) => s + m.oct1To31SepColl, 0));
  const totNov1To9 = round2(managers.reduce((s, m) => s + m.nov1To9SepColl, 0));
  const totSepRecovery = round2(managers.reduce((s, m) => s + m.totalSepRecoveryColl, 0));
  const totYtdSepRemaining = round2(managers.reduce((s, m) => s + m.ytdSepRemainingOpen, 0));
  const totOctBilled = round2(managers.reduce((s, m) => s + m.octBilled, 0));
  const totOctCollected = round2(managers.reduce((s, m) => s + m.octCollected, 0));
  const totNovCollected = round2(managers.reduce((s, m) => s + m.novCollected, 0));
  const totNovBilled = round2(managers.reduce((s, m) => s + m.novBilled, 0));

  const managerTargetProjections = new Map(
    managers.map((m) => [m.manager.toUpperCase(), computeManagerTargetProjection(m, targetBenchmark)])
  );
  const totAdditionalTargetNeeded = round2(
    managers.reduce(
      (s, m) => s + (managerTargetProjections.get(m.manager.toUpperCase())?.additionalNeededForTarget ?? 0),
      0
    )
  );
  const totYtdSepOnlyBilled = round2(
    managers.reduce(
      (s, m) => s + (managerTargetProjections.get(m.manager.toUpperCase())?.ytdSepOnlyBilled ?? 0),
      0
    )
  );
  const totYtdSepOnlyCollected = round2(
    managers.reduce(
      (s, m) => s + (managerTargetProjections.get(m.manager.toUpperCase())?.ytdSepOnlyCollected ?? 0),
      0
    )
  );
  const totTargetCollectionRequired = round2(
    totYtdSepOnlyBilled * (Math.min(100, Math.max(75, targetBenchmark)) / 100)
  );

  return (
    <section
      aria-label={headerMeta.eyebrow}
      className="looker-slide-canvas rounded-xl border border-slate-300/80 shadow-sm px-6 py-7 sm:px-9 sm:py-8"
    >
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.04em] text-[#C5A728]">
            {headerMeta.eyebrow}
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
            {headerMeta.title}
            {'highlight' in headerMeta && headerMeta.highlight && (
              <span className="text-[#C5A728]">{headerMeta.highlight}</span>
            )}
            {'suffix' in headerMeta && headerMeta.suffix}
          </h2>
        </div>

        <div className="rounded-xl border border-[#8E949E] bg-[#ECECEE] px-5 py-2 text-center self-start shrink-0">
          <p className="text-[11px] font-medium text-slate-700">Remaining Outstanding A/R</p>
          <p className="mt-0.5 font-display text-xl font-bold text-slate-950 tabular-nums">
            {formatPeso(badgeAmount)}
          </p>
        </div>
      </div>

      {/* PAGE 3: Portfolio & Target Gap by MANCOM / Account Manager */}
      {pageVariant === 'p3_portfolio' && (
        <>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-[10.5px] xl:text-[11px] leading-tight tabular-nums">
              <thead>
                <tr className="bg-[#F6F1CE] border-y border-slate-700 text-[10px] xl:text-[10.5px] font-semibold text-slate-800">
                  <th className="py-2 px-1.5 text-left">MANCOM</th>
                  <th className="py-2 px-1.5 text-left">Account Manager</th>
                  <th className="py-2 px-1.5 text-right">YTD Aug A/R</th>
                  <th className="py-2 px-1.5 text-right">Sept A/R</th>
                  <th className="py-2 px-1.5 text-right">YTD Sept Balance</th>
                  <th className="py-2 px-1.5 text-right">Oct 1-31</th>
                  <th className="py-2 px-1.5 text-right">Nov 1-{novEndDay}</th>
                  <th className="py-2 px-1.5 text-right">Oct–Nov Colln</th>
                  <th className="py-2 px-1.5 text-right">AR YTD Sept Bal</th>
                  <th className="py-2 px-1.5 text-right">{targetBenchmark.toFixed(0)}% Target Coll</th>
                  <th className="py-2 px-1.5 text-right">Target Gap</th>
                  <th className="py-2 px-1.5 text-right">YTD Sep Eff %</th>
                </tr>
              </thead>
              <tbody>
                {orderedMancomGroups.map((group) =>
                  group.rows.map((m, idx) => {
                    const proj = managerTargetProjections.get(m.manager.toUpperCase())!;
                    return (
                      <tr
                        key={m.manager}
                        className="border-b border-slate-200/90 bg-[#FCF9E8]/70 hover:bg-[#FAF4D3]"
                      >
                        {idx === 0 && (
                          <td
                            rowSpan={group.rows.length}
                            className="py-1.5 px-1.5 align-top font-semibold text-slate-900 border-r border-slate-200/70 bg-[#FAF6DD]"
                          >
                            {group.mancom}
                          </td>
                        )}
                        <td className="py-1.5 px-1.5 font-medium text-slate-900 whitespace-nowrap">{m.manager}</td>
                        <td className="py-1.5 px-1.5 text-right text-slate-800 whitespace-nowrap">{formatWholeNumber(m.ytdAugOpen)}</td>
                        <td className="py-1.5 px-1.5 text-right text-slate-800 whitespace-nowrap">{formatWholeNumber(m.sepOpen)}</td>
                        <td className="py-1.5 px-1.5 text-right font-semibold text-slate-900 whitespace-nowrap">{formatWholeNumber(m.ytdSepPreOctOpen)}</td>
                        <td className="py-1.5 px-1.5 text-right text-slate-800 whitespace-nowrap">{formatWholeNumber(m.oct1To31SepColl)}</td>
                        <td className="py-1.5 px-1.5 text-right text-slate-800 whitespace-nowrap">{formatWholeNumber(m.nov1To9SepColl)}</td>
                        <td className="py-1.5 px-1.5 text-right font-semibold text-slate-900 whitespace-nowrap">{formatWholeNumber(m.totalSepRecoveryColl)}</td>
                        <td className="py-1.5 px-1.5 text-right font-semibold text-slate-900 whitespace-nowrap">{formatWholeNumber(m.ytdSepRemainingOpen)}</td>
                        <td className="py-1.5 px-1.5 text-right text-slate-800 whitespace-nowrap">{formatWholeNumber(proj.targetCollectionRequired)}</td>
                        <td className="py-1.5 px-1.5 text-right text-slate-800 whitespace-nowrap">{formatWholeNumber(proj.additionalNeededForTarget)}</td>
                        <td className="py-1.5 px-1.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                          {proj.ytdSepEfficiencyPct === null ? '-' : `${proj.ytdSepEfficiencyPct.toFixed(2)}%`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-b border-slate-800 bg-[#F6F1CE] font-bold text-slate-950">
                  <td colSpan={2} className="py-2 px-1.5">Grand total</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatWholeNumber(totYtdAugOpen)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatWholeNumber(totSepOpen)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatWholeNumber(totYtdSepPreOctOpen)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatWholeNumber(totOct1To31)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatWholeNumber(totNov1To9)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatWholeNumber(totSepRecovery)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatWholeNumber(totYtdSepRemaining)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatWholeNumber(totTargetCollectionRequired)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">{formatWholeNumber(totAdditionalTargetNeeded)}</td>
                  <td className="py-2 px-1.5 text-right whitespace-nowrap">
                    {totYtdSepOnlyBilled > 0
                      ? `${round2((totYtdSepOnlyCollected / totYtdSepOnlyBilled) * 100).toFixed(2)}%`
                      : '-'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Centered Aging Distribution Box */}
          <div className="mt-6 flex justify-center">
            <div className="w-full max-w-lg rounded-xl border border-[#8E949E] bg-[#ECECEE] px-6 py-4 text-xs tabular-nums">
              <p className="font-bold tracking-wide text-slate-900">AGING DISTRIBUTION</p>
              <div className="mt-2.5 grid grid-cols-5 gap-2 text-right font-semibold text-slate-600">
                <div className="text-left" />
                <div className="col-span-2 text-center">YTD September</div>
                <div className="col-span-2 text-center">as of reporting date</div>
              </div>
              <div className="mt-2 grid grid-cols-5 gap-2 items-center text-slate-900">
                <div className="font-medium text-slate-700">YTD Aug A/R</div>
                <div className="text-right font-bold">{formatPesoMillions(totYtdAugOpen)}</div>
                <div className="text-right">
                  {totYtdSepPreOctOpen > 0
                    ? formatPercent((totYtdAugOpen / totYtdSepPreOctOpen) * 100)
                    : '0.00%'}
                </div>
                <div className="text-right font-bold">
                  {formatPesoMillions(
                    managers.reduce((s, m) => s + Math.max(0, m.ytdAugBilled - m.ytdAugCollected), 0)
                  )}
                </div>
                <div className="text-right">
                  {totYtdSepRemaining > 0
                    ? formatPercent(
                        (managers.reduce((s, m) => s + (m.ytdAugBilled - m.ytdAugCollected), 0) /
                          totYtdSepRemaining) *
                          100
                      )
                    : '0.00%'}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-5 gap-2 items-center text-slate-900">
                <div className="font-medium text-slate-700">Sept New A/R</div>
                <div className="text-right font-bold">{formatPesoMillions(totSepOpen)}</div>
                <div className="text-right">
                  {totYtdSepPreOctOpen > 0
                    ? formatPercent((totSepOpen / totYtdSepPreOctOpen) * 100)
                    : '0.00%'}
                </div>
                <div className="text-right font-bold">
                  {formatPesoMillions(
                    managers.reduce((s, m) => s + Math.max(0, m.sepBilled - m.sepCollected), 0)
                  )}
                </div>
                <div className="text-right">
                  {totYtdSepRemaining > 0
                    ? formatPercent(
                        (managers.reduce((s, m) => s + (m.sepBilled - m.sepCollected), 0) /
                          totYtdSepRemaining) *
                          100
                      )
                    : '0.00%'}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PAGE 5: Target Collection Gap + Recomputed Collection Efficiency Box */}
      {pageVariant === 'p5_projection' && (() => {
        const ytdSepPreOctColl = round2(totYtdSepOnlyCollected - totSepRecovery);
        const ytdSepBalAfterTarget = round2(totYtdSepRemaining - totAdditionalTargetNeeded);
        const projectedEff =
          totYtdSepOnlyBilled > 0
            ? round2(((totYtdSepOnlyCollected + totAdditionalTargetNeeded) / totYtdSepOnlyBilled) * 100)
            : 0;

        return (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            <div className="lg:col-span-7 overflow-x-auto">
              <table className="w-full border-collapse text-[11px] leading-tight tabular-nums">
                <thead>
                  <tr className="bg-[#F6F1CE] border-y border-slate-700 text-[10.5px] font-semibold text-slate-800">
                    <th className="py-2.5 px-2 text-left">MANCOM</th>
                    <th className="py-2.5 px-2 text-left">Account Manager</th>
                    <th className="py-2.5 px-2 text-right">AR YTD Sept Bal</th>
                    <th className="py-2.5 px-2 text-right">Required ({targetBenchmark.toFixed(0)}%)</th>
                    <th className="py-2.5 px-2 text-right">Proj. Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedMancomGroups.map((group) =>
                    group.rows.map((m, idx) => {
                      const proj = managerTargetProjections.get(m.manager.toUpperCase())!;
                      return (
                        <tr
                          key={m.manager}
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
                                  manager: m.manager,
                                  mancom: group.mancom,
                                  requiredAmount: proj.additionalNeededForTarget,
                                })
                              }
                              title={`View recommended invoices to collect for ${m.manager}`}
                              className="text-left font-semibold text-slate-900 underline decoration-[#C5A728]/70 decoration-dotted underline-offset-4 hover:text-[#8E740B] hover:decoration-solid cursor-pointer"
                            >
                              {m.manager}
                            </button>
                          </td>
                          <td className="py-2 px-2 text-right text-slate-800 whitespace-nowrap">
                            {formatNumber(m.ytdSepRemainingOpen)}
                          </td>
                          <td className="py-2 px-2 text-right text-slate-800 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedManagerModal({
                                  manager: m.manager,
                                  mancom: group.mancom,
                                  requiredAmount: proj.additionalNeededForTarget,
                                })
                              }
                              aria-label={`View required invoices for ${m.manager}: ${formatNumber(proj.additionalNeededForTarget)}`}
                              title={`Click to view target invoices for ${m.manager}`}
                              className="font-semibold text-slate-900 underline decoration-[#C5A728]/70 decoration-dotted underline-offset-4 hover:text-[#8E740B] hover:decoration-solid tabular-nums cursor-pointer"
                            >
                              {formatNumber(proj.additionalNeededForTarget)}
                            </button>
                          </td>
                          <td className="py-2 px-2 text-right font-semibold text-slate-900 whitespace-nowrap">
                            {formatNumber(proj.projectedRemainingAtTarget)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-b border-slate-800 bg-[#F6F1CE] font-bold text-slate-950">
                    <td colSpan={2} className="py-2.5 px-2">Grand total</td>
                    <td className="py-2.5 px-2 text-right whitespace-nowrap">{formatNumber(totYtdSepRemaining)}</td>
                    <td className="py-2.5 px-2 text-right whitespace-nowrap">{formatNumber(totAdditionalTargetNeeded)}</td>
                    <td className="py-2.5 px-2 text-right whitespace-nowrap">{formatNumber(ytdSepBalAfterTarget)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-slate-600 bg-[#DFDFE1] p-5">
              <p className="text-xs font-semibold text-slate-700">Collection Efficiency</p>
              <h3 className="mt-1 font-display text-xl font-bold text-slate-950">
                Target Collection Projection
              </h3>

              <div className="mt-4 space-y-2.5 text-xs">
                {[
                  { label: 'YTD September Billings', val: formatPeso(totYtdSepOnlyBilled) },
                  { label: 'YTD September Collection (Pre-Oct)', val: formatNumber(ytdSepPreOctColl) },
                  { label: `Oct 1 - Nov ${novEndDay} Collection`, val: formatNumber(totSepRecovery) },
                  { label: 'Total YTD Sep Collections', val: formatNumber(totYtdSepOnlyCollected) },
                  {
                    label: `Required to Reach ${targetBenchmark.toFixed(0)}% Target`,
                    val: formatNumber(totAdditionalTargetNeeded),
                  },
                  {
                    label: 'YTD September Balance (after target)',
                    val: formatPeso(ytdSepBalAfterTarget),
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
                  {formatPercent(projectedEff)}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PAGE 8: Outstanding Balance with Oct Billings by Account Manager */}
      {pageVariant === 'p8_oct_billings' && (
        <>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-[11px] leading-tight tabular-nums">
              <thead>
                <tr className="bg-[#F6F1CE] border-y border-slate-700 text-[10.5px] font-semibold text-slate-800">
                  <th className="py-2 px-2 text-left">MANCOM</th>
                  <th className="py-2 px-2 text-left">Account Manager</th>
                  <th className="py-2 px-2 text-right">YTD Sep AR</th>
                  <th className="py-2 px-2 text-right">Oct Billing (New AR)</th>
                  <th className="py-2 px-2 text-right">YTD AR</th>
                  <th className="py-2 px-2 text-right">YTD Sep AR Coll</th>
                  <th className="py-2 px-2 text-right">Oct AR Coll</th>
                  <th className="py-2 px-2 text-right">Remaining Balance</th>
                </tr>
              </thead>
              <tbody>
                {orderedMancomGroups.map((group) =>
                  group.rows.map((m, idx) => {
                    const ytdAr = round2(m.ytdSepPreOctOpen + m.octBilled + m.novBilled);
                    const octAndNovColl = round2(m.octCollected + m.novCollected);
                    return (
                      <tr
                        key={m.manager}
                        className="border-b border-slate-200 bg-[#FCF9E8]/70 hover:bg-[#FAF4D3]"
                      >
                        {idx === 0 && (
                          <td
                            rowSpan={group.rows.length}
                            className="py-1.5 px-2 align-top font-semibold text-slate-900 border-r border-slate-200/70 bg-[#FAF6DD]"
                          >
                            {group.mancom}
                          </td>
                        )}
                        <td className="py-1.5 px-2 font-medium text-slate-900 whitespace-nowrap">{m.manager}</td>
                        <td className="py-1.5 px-2 text-right text-slate-800 whitespace-nowrap">{formatNumber(m.ytdSepPreOctOpen)}</td>
                        <td className="py-1.5 px-2 text-right text-slate-800 whitespace-nowrap">{formatNumber(round2(m.octBilled + m.novBilled))}</td>
                        <td className="py-1.5 px-2 text-right font-semibold text-slate-900 whitespace-nowrap">{formatNumber(ytdAr)}</td>
                        <td className="py-1.5 px-2 text-right text-slate-800 whitespace-nowrap">{formatNumber(m.totalSepRecoveryColl)}</td>
                        <td className="py-1.5 px-2 text-right text-slate-800 whitespace-nowrap">{formatNumber(octAndNovColl)}</td>
                        <td className="py-1.5 px-2 text-right font-semibold text-slate-950 whitespace-nowrap">{formatNumber(m.totalRemaining)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-b border-slate-800 bg-[#F6F1CE] font-bold text-slate-950">
                  <td colSpan={2} className="py-2 px-2">Grand total</td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">{formatNumber(totYtdSepPreOctOpen)}</td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">{formatNumber(round2(totOctBilled + totNovBilled))}</td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">
                    {formatNumber(round2(totYtdSepPreOctOpen + totOctBilled + totNovBilled))}
                  </td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">{formatNumber(totSepRecovery)}</td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">{formatNumber(round2(totOctCollected + totNovCollected))}</td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">{formatNumber(totalRemainingAll)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="w-full max-w-lg rounded-xl border border-[#8E949E] bg-[#ECECEE] px-6 py-4 text-xs tabular-nums">
              <p className="font-bold tracking-wide text-slate-900">AGING DISTRIBUTION</p>
              <div className="mt-2.5 grid grid-cols-5 gap-2 text-right font-semibold text-slate-600">
                <div className="text-left" />
                <div className="col-span-2 text-center">YTD October</div>
                <div className="col-span-2 text-center">as of reporting date</div>
              </div>
              <div className="mt-2 grid grid-cols-5 gap-2 items-center text-slate-900">
                <div className="font-medium text-slate-700">YTD Sep A/R</div>
                <div className="text-right font-bold">{formatPesoMillions(totYtdSepPreOctOpen)}</div>
                <div className="text-right">
                  {formatPercent(
                    (totYtdSepPreOctOpen / Math.max(1, totYtdSepPreOctOpen + totOctBilled + totNovBilled)) * 100
                  )}
                </div>
                <div className="text-right font-bold">{formatPesoMillions(totYtdSepRemaining)}</div>
                <div className="text-right">
                  {formatPercent((totYtdSepRemaining / Math.max(1, totalRemainingAll)) * 100)}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-5 gap-2 items-center text-slate-900">
                <div className="font-medium text-slate-700">Oct &amp; Nov New A/R</div>
                <div className="text-right font-bold">
                  {formatPesoMillions(round2(totOctBilled + totNovBilled))}
                </div>
                <div className="text-right">
                  {formatPercent(
                    ((totOctBilled + totNovBilled) /
                      Math.max(1, totYtdSepPreOctOpen + totOctBilled + totNovBilled)) *
                      100
                  )}
                </div>
                <div className="text-right font-bold">
                  {formatPesoMillions(round2(totalRemainingAll - totYtdSepRemaining))}
                </div>
                <div className="text-right">
                  {formatPercent(
                    ((totalRemainingAll - totYtdSepRemaining) / Math.max(1, totalRemainingAll)) * 100
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <TargetInvoiceModal
        isOpen={Boolean(selectedManagerModal)}
        mancom={selectedManagerModal?.mancom ?? ''}
        targetBenchmark={targetBenchmark}
        allocation={modalAllocation}
        onClose={() => setSelectedManagerModal(null)}
      />
    </section>
  );
};
