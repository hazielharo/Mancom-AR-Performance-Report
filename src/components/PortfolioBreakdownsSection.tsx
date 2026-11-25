import React, { useState } from 'react';
import { ComputedARMetrics, DimensionSummary } from '../types/arReport';
import { formatPercent, formatPeso, formatPesoMillions } from '../utils/arCalculations';

interface PortfolioBreakdownsSectionProps {
  metrics: ComputedARMetrics;
}

type DimensionTab = 'category' | 'aging' | 'manager';

const TABS: Array<{ id: DimensionTab; label: string; columnTitle: string }> = [
  { id: 'category', label: 'By Category', columnTitle: 'Category' },
  { id: 'aging', label: 'By Aging', columnTitle: 'Aging Bucket' },
  { id: 'manager', label: 'By Area Manager', columnTitle: 'Area Manager' },
];

export const PortfolioBreakdownsSection: React.FC<PortfolioBreakdownsSectionProps> = ({
  metrics,
}) => {
  const [activeTab, setActiveTab] = useState<DimensionTab>('category');
  const breakdown = metrics.activeBreakdown;

  if (!breakdown) return null;

  const rows: DimensionSummary[] =
    activeTab === 'category'
      ? breakdown.byCategory
      : activeTab === 'aging'
      ? breakdown.byAging
      : breakdown.byAreaManager;

  const activeTabMeta = TABS.find((t) => t.id === activeTab)!;

  return (
    <section
      id="breakdowns"
      aria-label="AppSheet Ledger Breakdowns"
      className="rounded-xl border border-slate-200 bg-white p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Ledger Breakdown ({metrics.segmentLabel})
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Aggregated directly from AppSheet AR Monitoring records across categories, aging buckets, and area managers
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Ledger breakdown dimension"
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200/80 self-start sm:self-auto"
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-semibold tracking-wide text-slate-500">
              <th scope="col" className="pb-2.5 pr-4">
                {activeTabMeta.columnTitle}
              </th>
              <th scope="col" className="pb-2.5 px-3 text-right">
                Records
              </th>
              <th scope="col" className="pb-2.5 px-3 text-right">
                Billed Amount
              </th>
              <th scope="col" className="pb-2.5 px-3 text-right">
                Collections
              </th>
              <th scope="col" className="pb-2.5 px-3 text-right">
                Open Balance
              </th>
              <th scope="col" className="pb-2.5 pl-3 text-right min-w-[150px]">
                Collection Eff.
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {rows.map((item) => {
              const meetsTarget = item.efficiency >= metrics.targetBenchmark;
              return (
                <tr key={item.name} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                    {item.name}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                    {item.count.toLocaleString('en-US')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">
                    <span title={formatPeso(item.billed)}>{formatPeso(item.billed)}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-emerald-700 tabular-nums whitespace-nowrap">
                    {formatPeso(item.collections)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-amber-700 tabular-nums whitespace-nowrap">
                    {formatPeso(item.balance)}
                  </td>
                  <td className="py-3 pl-3 text-right tabular-nums whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2.5 w-full">
                      <div className="hidden sm:block h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            meetsTarget ? 'bg-emerald-600' : 'bg-slate-700'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, item.efficiency))}%` }}
                        />
                      </div>
                      <span
                        className={`font-mono text-xs font-bold w-14 text-right ${
                          meetsTarget ? 'text-emerald-700' : 'text-slate-800'
                        }`}
                      >
                        {formatPercent(item.efficiency)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-900">
              <td className="py-3 pr-4">
                Total ({metrics.segmentLabel})
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums">
                {rows.reduce((sum, r) => sum + r.count, 0).toLocaleString('en-US')}
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                {formatPesoMillions(metrics.totalBilling)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-emerald-700 tabular-nums whitespace-nowrap">
                {formatPesoMillions(metrics.totalCollections)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-amber-700 tabular-nums whitespace-nowrap">
                {formatPesoMillions(metrics.arBalance)}
              </td>
              <td className="py-3 pl-3 text-right font-mono tabular-nums whitespace-nowrap">
                {formatPercent(metrics.collectionEfficiency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};
