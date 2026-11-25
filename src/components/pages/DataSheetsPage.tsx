import React, { useMemo, useState } from 'react';
import {
  BarChart2,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Database,
  Download,
  FileSpreadsheet,
  FilterX,
  Search,
  Table2,
} from 'lucide-react';
import { ARReportData } from '../../types/arReport';
import {
  buildAllReportSheets,
  buildSheetColumnFilters,
  downloadAllSheetsXLSX,
  downloadSheetCSV,
  filterSheetRows,
  formatSheetCellValue,
  isGrandTotalSheetRow,
  ReportSheet,
  sheetToTSV,
} from '../../utils/reportSheets';
import { ExecutiveSheetVisuals } from '../ExecutiveSheetVisuals';

interface DataSheetsPageProps {
  data: ARReportData;
  targetBenchmark: number;
  rawCsvText: string;
  isCustomData: boolean;
  liveSheetLabel?: string | null;
}

const PAGE_SIZE = 50;

export const DataSheetsPage: React.FC<DataSheetsPageProps> = ({
  data,
  targetBenchmark,
  rawCsvText,
  isCustomData,
  liveSheetLabel,
}) => {
  const sheets: ReportSheet[] = useMemo(
    () => buildAllReportSheets(data, targetBenchmark, rawCsvText),
    [data, targetBenchmark, rawCsvText]
  );

  const [selectedSheetId, setSelectedSheetId] = useState<string>(sheets[0]?.id ?? 'exec_summary');
  const [execViewMode, setExecViewMode] = useState<'visual' | 'table'>('visual');
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [copiedSheetId, setCopiedSheetId] = useState<string | null>(null);

  const activeSheet =
    sheets.find((s) => s.id === selectedSheetId) ?? sheets[0];
  const isExecVisualMode = activeSheet?.id === 'exec_summary' && execViewMode === 'visual';
  const isRawLedger = activeSheet?.id === 'raw_ledger';

  const rawColumnFilterConfigs = useMemo(() => {
    if (!activeSheet || activeSheet.id !== 'raw_ledger') return undefined;
    return buildSheetColumnFilters(activeSheet);
  }, [activeSheet]);

  const { bodyRows, grandTotalRow } = useMemo(() => {
    if (!activeSheet) return { bodyRows: [], grandTotalRow: null };
    const foundTotal = activeSheet.rows.find(isGrandTotalSheetRow) ?? null;
    const regularRows = foundTotal
      ? activeSheet.rows.filter((r) => !isGrandTotalSheetRow(r))
      : activeSheet.rows;
    return { bodyRows: regularRows, grandTotalRow: foundTotal };
  }, [activeSheet]);

  const filteredRows = useMemo(() => {
    if (!activeSheet) return [];
    return filterSheetRows(
      bodyRows,
      activeSheet.columns,
      searchQuery,
      isRawLedger ? columnFilters : {},
      rawColumnFilterConfigs
    );
  }, [activeSheet, bodyRows, searchQuery, isRawLedger, columnFilters, rawColumnFilterConfigs]);

  const activeColumnFilterCount = isRawLedger
    ? Object.values(columnFilters).filter((v) => v.trim() !== '' && v !== 'ALL').length
    : 0;

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const visibleRows = filteredRows.slice(startIdx, startIdx + PAGE_SIZE);

  const handleCopyTSV = async () => {
    if (!activeSheet) return;
    const tsv = sheetToTSV(activeSheet);
    try {
      await navigator.clipboard.writeText(tsv);
      setCopiedSheetId(activeSheet.id);
      setTimeout(() => setCopiedSheetId(null), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = tsv;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedSheetId(activeSheet.id);
      setTimeout(() => setCopiedSheetId(null), 2500);
    }
  };

  return (
    <section
      aria-label="Page 13: Linked Spreadsheet & All Report Data Sheets"
      className="looker-slide-canvas rounded-xl border border-slate-300/80 shadow-sm px-5 py-7 sm:px-8 sm:py-8"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.04em] text-[#C5A728]">
            LINKED SPREADSHEET WORKBOOK · ALL {sheets.length} REPORT SHEETS
          </p>
          <h2 className="mt-1 font-display text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900">
            Report Data Sheets
          </h2>
          <p className="mt-1 text-xs text-slate-600 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
              <Database className="h-3.5 w-3.5 text-[#9E8418]" aria-hidden="true" />
              <span>
                Linked Source:{' '}
                {liveSheetLabel
                  ? `Google Sheets · ${liveSheetLabel}`
                  : isCustomData
                    ? 'Custom AppSheet CSV Import'
                    : 'AR_MONITORING_FOR_APPSHEET (Local Snapshot)'}
              </span>
            </span>
            {data.sourceActiveRowCount ? (
              <span className="text-slate-500 tabular-nums">
                · {data.sourceActiveRowCount.toLocaleString('en-US')} active ledger rows
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden">
          <button
            type="button"
            onClick={() => downloadAllSheetsXLSX(sheets)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#141A21] px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#D8C136]" aria-hidden="true" />
            <span>Download All {sheets.length} Sheets (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Sheet Selector Tabs */}
      <div
        role="tablist"
        aria-label="Report data sheets"
        className="mt-5 flex flex-wrap gap-1.5 border-b border-slate-200 pb-3 print:hidden"
      >
        {sheets.map((sheet, idx) => {
          const isActive = sheet.id === activeSheet?.id;
          const displayCount = sheet.rows.filter((r) => !isGrandTotalSheetRow(r)).length;
          return (
            <button
              key={sheet.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setSelectedSheetId(sheet.id);
                setSearchQuery('');
                setColumnFilters({});
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold cursor-pointer ${
                isActive
                  ? 'bg-[#D8C136] text-slate-950 shadow-2xs'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>
                {idx + 1}. {sheet.sheetName}
              </span>
              <span
                className={`font-mono text-[10px] tabular-nums ${
                  isActive ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                ({displayCount.toLocaleString('en-US')})
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Sheet Toolbar & Content */}
      {activeSheet && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{activeSheet.title}</h3>
              <p className="text-xs text-slate-600">{activeSheet.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden">
              {activeSheet.id === 'exec_summary' && (
                <div
                  role="group"
                  aria-label="Executive KPI presentation mode"
                  className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 p-0.5"
                >
                  <button
                    type="button"
                    aria-pressed={execViewMode === 'visual'}
                    onClick={() => setExecViewMode('visual')}
                    className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                      execViewMode === 'visual'
                        ? 'bg-white text-slate-950 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BarChart2 className="h-3.5 w-3.5 text-[#9E8418]" aria-hidden="true" />
                    <span>Visual Summary</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={execViewMode === 'table'}
                    onClick={() => setExecViewMode('table')}
                    className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                      execViewMode === 'table'
                        ? 'bg-white text-slate-950 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Table2 className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                    <span>Table ({activeSheet.rows.length})</span>
                  </button>
                </div>
              )}

              {!isExecVisualMode && (
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search sheet..."
                    aria-label={`Search ${activeSheet.sheetName}`}
                    className="w-44 rounded-md border border-slate-300 bg-white pl-8 pr-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#C7AC2D] focus:outline-none"
                  />
                </div>
              )}

              {activeColumnFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setColumnFilters({});
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
                >
                  <FilterX className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Clear Filters ({activeColumnFilterCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyTSV}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
              >
                {copiedSheetId === activeSheet.id ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Copied TSV</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                    <span>Copy for Sheets</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => downloadSheetCSV(activeSheet)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                <span>Download .CSV</span>
              </button>
            </div>
          </div>

          {/* Executive KPI Visual Dashboard OR Spreadsheet Table */}
          {isExecVisualMode ? (
            <ExecutiveSheetVisuals data={data} targetBenchmark={targetBenchmark} />
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="overflow-x-auto max-h-[540px] print:max-h-none print:overflow-visible">
                <table className="w-full border-collapse text-[11px] tabular-nums">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#D8C136] text-slate-950 font-bold">
                      {activeSheet.columns.map((col) => {
                        const isSampleNum = typeof bodyRows[0]?.[col] === 'number';
                        return (
                          <th
                            key={col}
                            className={`py-2 px-2.5 whitespace-nowrap border-b border-amber-500/30 ${
                              isSampleNum ? 'text-right' : 'text-left'
                            }`}
                          >
                            {col}
                          </th>
                        );
                      })}
                    </tr>

                    {/* Interactive Column Header Filters on Linked AppSheet Source Ledger */}
                    {isRawLedger && rawColumnFilterConfigs && (
                      <tr className="bg-[#FAF4CC] border-b border-amber-400/40 print:hidden">
                        {activeSheet.columns.map((col) => {
                          const cfg = rawColumnFilterConfigs[col];
                          const currentVal = columnFilters[col] ?? '';
                          if (!cfg) return <th key={col} className="p-1.5" />;

                          return (
                            <th key={col} className="p-1.5 text-left font-normal min-w-[110px]">
                              {cfg.type === 'dropdown' ? (
                                <select
                                  value={currentVal || 'ALL'}
                                  onChange={(e) => {
                                    const next = e.target.value;
                                    setColumnFilters((prev) => ({
                                      ...prev,
                                      [col]: next === 'ALL' ? '' : next,
                                    }));
                                    setPage(1);
                                  }}
                                  aria-label={`Filter ${col}`}
                                  className="w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-[10px] font-medium text-slate-800 focus:border-[#9E8418] focus:outline-none cursor-pointer"
                                >
                                  <option value="ALL">All</option>
                                  {(cfg.options ?? []).map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="search"
                                  value={currentVal}
                                  onChange={(e) => {
                                    const next = e.target.value;
                                    setColumnFilters((prev) => ({
                                      ...prev,
                                      [col]: next,
                                    }));
                                    setPage(1);
                                  }}
                                  placeholder="Filter..."
                                  aria-label={`Filter ${col}`}
                                  className="w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-800 placeholder:text-slate-400 focus:border-[#9E8418] focus:outline-none"
                                />
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    )}
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {visibleRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={activeSheet.columns.length}
                          className="py-8 text-center text-slate-500"
                        >
                          No matching rows found in {activeSheet.sheetName}.
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((row, rIdx) => (
                        <tr key={startIdx + rIdx} className="hover:bg-[#FCF6D6]/50">
                          {activeSheet.columns.map((col) => {
                            const rawVal = row[col] ?? '';
                            const isNum = typeof rawVal === 'number';
                            return (
                              <td
                                key={col}
                                title={String(rawVal)}
                                className={`py-1.5 px-2.5 whitespace-nowrap max-w-[260px] truncate ${
                                  isNum
                                    ? 'text-right font-medium text-slate-900'
                                    : 'text-left text-slate-800'
                                }`}
                              >
                                {formatSheetCellValue(col, rawVal)}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>

                  {grandTotalRow && (
                    <tfoot className="sticky bottom-0 z-10">
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-950">
                        {activeSheet.columns.map((col) => {
                          const rawVal = grandTotalRow[col] ?? '';
                          const isNum = typeof rawVal === 'number';
                          return (
                            <td
                              key={col}
                              className={`py-2 px-2.5 whitespace-nowrap ${
                                isNum ? 'text-right' : 'text-left'
                              }`}
                            >
                              {rawVal === '' ? '' : formatSheetCellValue(col, rawVal)}
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-3 py-2 text-[11px] text-slate-600 tabular-nums print:hidden">
                <span>
                  {filteredRows.length === 0
                    ? '0 rows'
                    : `Showing ${startIdx + 1} – ${Math.min(
                        startIdx + PAGE_SIZE,
                        filteredRows.length
                      )} of ${filteredRows.length.toLocaleString('en-US')} rows · ${activeSheet.columns.length} columns`}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous sheet page"
                    className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <span className="px-1 font-medium text-slate-700">
                    Page {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Next sheet page"
                    className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
