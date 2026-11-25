import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search, X } from 'lucide-react';
import {
  AllocatedTargetInvoiceResult,
  filterAllocatedInvoices,
  formatNumber,
  formatPeso,
} from '../utils/arCalculations';

interface TargetInvoiceModalProps {
  isOpen: boolean;
  mancom: string;
  targetBenchmark: number;
  allocation: AllocatedTargetInvoiceResult | null;
  periodLabel?: string;
  onClose: () => void;
}

export const TargetInvoiceModal: React.FC<TargetInvoiceModalProps> = ({
  isOpen,
  mancom,
  targetBenchmark,
  allocation,
  periodLabel = 'YTD September',
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('ALL');
  const [selectedAging, setSelectedAging] = useState('ALL');

  // Reset search & dropdown filters when opening or switching Account Manager
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedServiceType('ALL');
      setSelectedAging('ALL');
    }
  }, [isOpen, allocation?.manager]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const filterResult = useMemo(() => {
    return filterAllocatedInvoices(allocation?.rows ?? [], {
      searchQuery,
      serviceType: selectedServiceType,
      aging: selectedAging,
    });
  }, [allocation?.rows, searchQuery, selectedServiceType, selectedAging]);

  if (!isOpen || !allocation) return null;

  const hasActiveFilter =
    searchQuery.trim().length > 0 ||
    selectedServiceType !== 'ALL' ||
    selectedAging !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedServiceType('ALL');
    setSelectedAging('ALL');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 sm:p-6 backdrop-blur-[1px] print:hidden"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="target-invoice-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#FAF6DD] px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9E8418]">
              {mancom} · {targetBenchmark.toFixed(0)}% Target Collection Breakdown
            </p>
            <h3
              id="target-invoice-modal-title"
              className="mt-0.5 font-display text-lg sm:text-xl font-bold text-slate-950"
            >
              {allocation.manager} — Recommended Target Invoices
            </h3>
            <p className="mt-1 text-xs text-slate-600 tabular-nums">
              Prioritized oldest aging first to cover{' '}
              <span className="font-semibold text-slate-950">
                {formatPeso(allocation.requiredAmount)}
              </span>
              {allocation.rows.length > 0 && (
                <span>
                  {' '}
                  ({filterResult.filteredRows.length} of {allocation.rows.length} invoices)
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close invoice breakdown modal"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Real-time Search & Dropdown Filter Bar */}
        {allocation.rows.length > 0 && (
          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1 min-w-0">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Client, Service Type, or Particulars..."
                  aria-label="Search target invoices"
                  className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#9E8418] focus:outline-none focus:ring-1 focus:ring-[#9E8418]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search query"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  value={selectedServiceType}
                  onChange={(e) => setSelectedServiceType(e.target.value)}
                  aria-label="Filter by Service Type"
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-[#9E8418] focus:outline-none focus:ring-1 focus:ring-[#9E8418] cursor-pointer"
                >
                  <option value="ALL">All Service Types</option>
                  {filterResult.serviceTypeOptions.map((svc) => (
                    <option key={svc} value={svc}>
                      {svc}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedAging}
                  onChange={(e) => setSelectedAging(e.target.value)}
                  aria-label="Filter by Aging"
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-[#9E8418] focus:outline-none focus:ring-1 focus:ring-[#9E8418] cursor-pointer"
                >
                  <option value="ALL">All Aging</option>
                  {filterResult.agingOptions.map((ag) => (
                    <option key={ag} value={ag}>
                      {ag}
                    </option>
                  ))}
                </select>

                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Invoice Table */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {allocation.requiredAmount <= 0.005 ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
              <p className="text-sm font-semibold text-emerald-950">
                {targetBenchmark.toFixed(0)}% Collection Target Already Achieved
              </p>
              <p className="mt-1 text-xs text-emerald-800">
                {allocation.manager} has no remaining {periodLabel} collection shortfall at the{' '}
                {targetBenchmark.toFixed(0)}% benchmark.
              </p>
            </div>
          ) : allocation.rows.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-600">
              No itemized open invoices found for {allocation.manager} in the current dataset.
            </div>
          ) : filterResult.filteredRows.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-xs font-semibold text-slate-800">
                No target invoices match your search or filter criteria.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2.5 inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Reset Filters</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-xs tabular-nums">
                <thead className="sticky top-0 z-10 bg-[#F6F1CE] text-[11px] font-bold text-slate-900 border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 text-left whitespace-nowrap">Service Type</th>
                    <th className="py-2.5 px-3 text-left">Client</th>
                    <th className="py-2.5 px-3 text-left whitespace-nowrap">Aging</th>
                    <th className="py-2.5 px-3 text-left">Particulars</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 bg-white">
                  {filterResult.filteredRows.map((row, idx) => (
                    <tr
                      key={`${row.biNumber}-${idx}`}
                      className="hover:bg-[#FCF9E8]/70 align-top"
                    >
                      <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">
                        {row.serviceType}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {row.clientName}
                      </td>
                      <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                        {row.aging}
                      </td>
                      <td className="py-2 px-3 text-slate-600 min-w-[200px] leading-snug">
                        {row.particulars}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-950 whitespace-nowrap">
                        {formatNumber(row.amountForCollection)}
                        {row.isPartial && (
                          <span className="ml-1 text-[10px] font-medium text-amber-700">
                            (Partial)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom Total & Dynamic Filtered Subtotal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 bg-[#141A21] px-5 py-3 text-white tabular-nums">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-100">
              {hasActiveFilter
                ? `Filtered Subtotal (${filterResult.filteredRows.length} of ${allocation.rows.length} invoices)`
                : `Total Recommended Collection (${allocation.manager})`}
            </span>
            <span className="text-[11px] text-slate-300">
              Overall Target Total: {formatPeso(allocation.totalAmount)} · Target Required:{' '}
              {formatPeso(allocation.requiredAmount)}
            </span>
          </div>
          <div className="font-display text-lg font-bold text-[#F3DA64]">
            {formatPeso(filterResult.filteredSubtotal)}
          </div>
        </div>
      </div>
    </div>
  );
};
