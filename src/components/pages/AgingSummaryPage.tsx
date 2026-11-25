import React from 'react';
import { ARReportData } from '../../types/arReport';
import {
  computePage9Summary,
  formatNumber,
  formatPercent,
  formatPeso,
  round2,
} from '../../utils/arCalculations';

interface AgingSummaryPageProps {
  data: ARReportData;
  targetBenchmark: number;
}

export const AgingSummaryPage: React.FC<AgingSummaryPageProps> = ({
  data,
  targetBenchmark,
}) => {
  const managers = [...(data.managerSummaries ?? [])].sort(
    (a, b) => b.totalRemaining - a.totalRemaining
  );

  const totCurrent = round2(managers.reduce((s, m) => s + m.agingCurrent, 0));
  const tot1To30 = round2(managers.reduce((s, m) => s + m.aging1To30, 0));
  const tot31To60 = round2(managers.reduce((s, m) => s + m.aging31To60, 0));
  const tot61To90 = round2(managers.reduce((s, m) => s + m.aging61To90, 0));
  const tot91Above = round2(managers.reduce((s, m) => s + m.aging91Above, 0));
  const grandTotal = round2(managers.reduce((s, m) => s + m.totalRemaining, 0));

  const pct = (part: number, whole: number) =>
    whole > 0 ? `${Math.round((part / whole) * 100)}%` : '0%';

  const summary = computePage9Summary(data, targetBenchmark);

  return (
    <section
      aria-label="Page 9: AR Aging Summary"
      className="looker-slide-canvas rounded-xl border border-slate-300/80 shadow-sm px-6 py-7 sm:px-10 sm:py-8"
    >
      <div>
        <p className="text-xs font-bold tracking-[0.04em] text-[#C5A728]">
          MANCOM &amp; LEADERSHIP PERFORMANCE UPDATE
        </p>
        <h2 className="mt-1 font-display text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900">
          AR Aging Summary
        </h2>
      </div>

      <div className="mt-6 overflow-x-auto bg-white rounded-lg border border-slate-200/80">
        <table className="w-full border-collapse text-[11px] leading-tight tabular-nums">
          <thead>
            <tr className="bg-[#D8C136] text-slate-950 font-bold">
              <th className="py-2 px-2 text-left w-8">#</th>
              <th className="py-2 px-2 text-left">ACCOUNT MANAGER</th>
              <th className="py-2 px-2 text-right">Current</th>
              <th className="py-2 px-2 text-right">1-30 days</th>
              <th className="py-2 px-2 text-right">31-60 days</th>
              <th className="py-2 px-2 text-right">61-90 days</th>
              <th className="py-2 px-2 text-right">91 days above</th>
              <th className="py-2 px-2 text-right">Grand Total</th>
              <th className="py-2 px-2 text-right">% per AM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {managers.map((m, idx) => (
              <tr key={m.manager} className="hover:bg-[#FCF6D6]/50">
                <td className="py-2 px-2 text-slate-600">{idx + 1}.</td>
                <td className="py-2 px-2 font-medium text-slate-900 whitespace-nowrap">{m.manager}</td>
                <td className="py-2 px-2 text-right text-slate-800 whitespace-nowrap">{formatNumber(m.agingCurrent)}</td>
                <td className="py-2 px-2 text-right text-slate-800 whitespace-nowrap">{formatNumber(m.aging1To30)}</td>
                <td className="py-2 px-2 text-right text-slate-800 whitespace-nowrap">{formatNumber(m.aging31To60)}</td>
                <td className="py-2 px-2 text-right text-slate-800 whitespace-nowrap">{formatNumber(m.aging61To90)}</td>
                <td className="py-2 px-2 text-right text-slate-800 whitespace-nowrap">{formatNumber(m.aging91Above)}</td>
                <td className="py-2 px-2 text-right font-semibold text-slate-950 whitespace-nowrap">
                  {formatNumber(m.totalRemaining)}
                </td>
                <td className="py-2 px-2 text-right font-medium text-slate-800 whitespace-nowrap">
                  {pct(m.totalRemaining, grandTotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 bg-white font-bold text-slate-950">
              <td className="py-2 px-2" />
              <td className="py-2 px-2">Grand total</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{formatNumber(totCurrent)}</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{formatNumber(tot1To30)}</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{formatNumber(tot31To60)}</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{formatNumber(tot61To90)}</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{formatNumber(tot91Above)}</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{formatNumber(grandTotal)}</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">100%</td>
            </tr>
            <tr className="bg-[#D8C136] font-bold text-slate-950">
              <td className="py-2 px-2" />
              <td className="py-2 px-2">% of Aging</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{pct(totCurrent, grandTotal)}</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{pct(tot1To30, grandTotal)}</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{pct(tot31To60, grandTotal)}</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{pct(tot61To90, grandTotal)}</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">{pct(tot91Above, grandTotal)}</td>
              <td className="py-2 px-2 text-right whitespace-nowrap">100%</td>
              <td className="py-2 px-2" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Centered Collection & Projection Summary Block */}
      <div className="mt-6 flex justify-center">
        <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xs">
          <div className="border-b border-slate-200 bg-[#FAF6DD] px-5 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-800">
              Projected Collection Efficiency ({targetBenchmark.toFixed(0)}% Benchmark)
            </p>
          </div>
          <table className="w-full border-collapse text-xs tabular-nums">
            <tbody className="divide-y divide-slate-200/80">
              <tr>
                <td className="py-2.5 px-5 font-medium text-slate-700">Total Billing</td>
                <td className="py-2.5 px-5 text-right font-semibold text-slate-900">
                  {formatPeso(summary.totalBilling)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-5 font-medium text-slate-700">Less: Collection</td>
                <td className="py-2.5 px-5 text-right font-semibold text-slate-900">
                  {formatPeso(summary.lessCollection)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-5 font-medium text-slate-700">Projection</td>
                <td className="py-2.5 px-5 text-right font-semibold text-[#8E740B]">
                  {formatPeso(summary.projection)}
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="py-2.5 px-5 font-bold text-slate-950">Total Collection</td>
                <td className="py-2.5 px-5 text-right font-bold text-slate-950">
                  {formatPeso(summary.totalCollection)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-[#141A21] text-white">
                <td className="py-3 px-5 font-bold tracking-wide">
                  Projected Collection Efficiency
                </td>
                <td className="py-3 px-5 text-right font-display text-base font-bold text-[#F3DA64]">
                  {formatPercent(summary.projectedCollectionEfficiency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
};

