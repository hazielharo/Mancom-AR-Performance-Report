import React from 'react';
import { ARReportData } from '../../types/arReport';
import { formatNumber, formatPercent, formatWholeNumber } from '../../utils/arCalculations';

interface CohortEfficiencyPageProps {
  data: ARReportData;
}

function compactMonthLabel(label: string): string {
  const parts = label.trim().split(/\s+/);
  if (parts.length === 2) {
    return `${parts[0].slice(0, 3)} ${parts[1]}`;
  }
  return label;
}

export const CohortEfficiencyPage: React.FC<CohortEfficiencyPageProps> = ({ data }) => {
  const matrix = data.cohortMatrix;
  if (!matrix) return null;

  return (
    <section
      aria-label="Page 10: Collection Efficiency Matrix"
      className="looker-slide-canvas rounded-xl border border-slate-300/80 shadow-sm px-4 py-6 sm:px-6 sm:py-7"
    >
      <div>
        <p className="text-xs font-bold tracking-[0.04em] text-[#C5A728]">
          MANCOM &amp; LEADERSHIP PERFORMANCE UPDATE
        </p>
        <h2 className="mt-1 font-display text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900">
          Collection Efficiency
        </h2>
      </div>

      <div className="mt-5 overflow-x-auto bg-white rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-[9.5px] xl:text-[10px] leading-tight tabular-nums">
          <thead>
            <tr className="bg-[#D8C136] text-slate-950 font-bold">
              <th className="py-2 px-1 text-left w-5">#</th>
              <th className="py-2 px-1 text-left">Month (AR TAG)</th>
              <th className="py-2 px-1 text-right">Target Billed</th>
              {matrix.orMonthColumns.map((col) => (
                <th key={col} className="py-2 px-1 text-right" title={col}>
                  {compactMonthLabel(col)}
                </th>
              ))}
              <th className="py-2 px-1 text-right">Total Collection</th>
              <th className="py-2 px-1 text-right">Remaining Balance</th>
              <th className="py-2 px-1 text-right">YTD Eff / Target</th>
              <th className="py-2 px-1 text-right">YTD Eff (All)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matrix.rows.map((row, idx) => (
              <tr key={row.arTag} className="hover:bg-[#FCF6D6]/50">
                <td className="py-1.5 px-1 text-slate-500">{idx + 1}.</td>
                <td className="py-1.5 px-1 font-medium text-slate-900 whitespace-nowrap">
                  {compactMonthLabel(row.arTag)}
                </td>
                <td className="py-1.5 px-1 text-right font-medium text-slate-900 whitespace-nowrap">
                  {formatWholeNumber(row.billedTarget)}
                </td>
                {matrix.orMonthColumns.map((col) => {
                  const val = row.monthlyCollections[col] ?? 0;
                  return (
                    <td
                      key={col}
                      className={`py-1.5 px-1 text-right whitespace-nowrap ${
                        val === 0 ? 'text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {formatWholeNumber(val)}
                    </td>
                  );
                })}
                <td className="py-1.5 px-1 text-right font-semibold text-slate-900 whitespace-nowrap">
                  {formatWholeNumber(row.totalCollection)}
                </td>
                <td className="py-1.5 px-1 text-right text-slate-800 whitespace-nowrap">
                  {formatWholeNumber(row.remainingBalance)}
                </td>
                <td className="py-1.5 px-1 text-right font-semibold text-slate-900 whitespace-nowrap">
                  {row.effPerTargetPct === null ? 'null' : `${Math.round(row.effPerTargetPct)}%`}
                </td>
                <td className="py-1.5 px-1 text-right font-semibold text-slate-900 whitespace-nowrap">
                  {row.ytdCumEffPct === null ? 'null' : `${Math.round(row.ytdCumEffPct)}%`}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-950">
              <td className="py-2 px-1" />
              <td className="py-2 px-1 whitespace-nowrap">Grand total</td>
              <td className="py-2 px-1 text-right whitespace-nowrap">
                {formatWholeNumber(matrix.grandTotalBilled)}
              </td>
              {matrix.orMonthColumns.map((col) => (
                <td key={col} className="py-2 px-1 text-right whitespace-nowrap">
                  {formatWholeNumber(matrix.columnTotals[col] ?? 0)}
                </td>
              ))}
              <td className="py-2 px-1 text-right whitespace-nowrap">
                {formatWholeNumber(matrix.grandTotalCollected)}
              </td>
              <td className="py-2 px-1 text-right whitespace-nowrap">
                {formatNumber(matrix.grandTotalRemaining)}
              </td>
              <td colSpan={2} className="py-2 px-1 text-right text-[#C5A728] text-xs xl:text-sm font-bold whitespace-nowrap">
                {formatPercent(matrix.grandTotalEffPct)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};
