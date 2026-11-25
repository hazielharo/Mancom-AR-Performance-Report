import React from 'react';
import { SlidersHorizontal, Download, RotateCcw } from 'lucide-react';
import { PortfolioSegment } from '../types/arReport';

interface TopHeaderProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  segment: PortfolioSegment;
  onSegmentChange: (segment: PortfolioSegment) => void;
  targetBenchmark: number;
  defaultBenchmark: number;
  onTargetBenchmarkChange: (value: number) => void;
  isCustomData: boolean;
  onResetToBaseline: () => void;
  onOpenManageData: () => void;
  onOpenExportSummary: () => void;
}

const SEGMENTS: Array<{ id: PortfolioSegment; label: string }> = [
  { id: 'all', label: 'All Portfolios' },
  { id: 'ytd_sep', label: 'YTD September AR' },
  { id: 'oct_ar', label: 'October AR' },
];

export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  subtitle,
  lastUpdated,
  segment,
  onSegmentChange,
  targetBenchmark,
  defaultBenchmark,
  onTargetBenchmarkChange,
  isCustomData,
  onResetToBaseline,
  onOpenManageData,
  onOpenExportSummary,
}) => {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-3 md:gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          <a
            href="#overview"
            className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Mancom AR
          </a>

          <nav
            aria-label="Report sections"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#overview"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Overview
            </a>
            <a
              href="#composition"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Composition
            </a>
            <a
              href="#target-breakdown"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Target Variance
            </a>
            <a
              href="#recovery-flow"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Recovery Flow
            </a>
            <a
              href="#breakdowns"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Breakdowns
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenManageData}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-300 bg-white px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span>Manage Data</span>
            </button>
            <button
              type="button"
              onClick={onOpenExportSummary}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-slate-900 px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export Summary</span>
            </button>
          </div>
        </div>
      </header>

      <section
        aria-label="Report header and simulation controls"
        className="mx-auto max-w-[1360px] px-4 pt-6 pb-2 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px] [text-wrap:balance]">
              {title}
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {subtitle}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
              <span className="tabular-nums">
                Target Benchmark:{' '}
                <strong className="font-semibold text-slate-900">
                  {targetBenchmark.toFixed(1)}%
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="tabular-nums">
                Last Updated: {lastUpdated}
              </span>
              {isCustomData && (
                <>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={onResetToBaseline}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 underline underline-offset-2 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    <span>Reset to Baseline</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Workspace Control Bar: Portfolio Segment Filter & Target Benchmark Simulator */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
            <div
              role="tablist"
              aria-label="Portfolio Segment Filter"
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200/80"
            >
              {SEGMENTS.map((item) => {
                const active = segment === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onSegmentChange(item.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2">
              <div className="flex flex-col">
                <label
                  htmlFor="benchmark-slider"
                  className="text-[11px] font-semibold tracking-wide text-slate-500 whitespace-nowrap"
                >
                  Target Simulator
                </label>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <input
                    id="benchmark-slider"
                    type="range"
                    min={75}
                    max={100}
                    step={0.5}
                    value={targetBenchmark}
                    onChange={(e) => onTargetBenchmarkChange(Number(e.target.value))}
                    aria-label="Target efficiency benchmark percentage"
                    className="benchmark-slider w-24 sm:w-28"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      id="benchmark-number"
                      type="number"
                      min={75}
                      max={100}
                      step={0.5}
                      value={targetBenchmark}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isNaN(val)) {
                          onTargetBenchmarkChange(Math.min(100, Math.max(75, val)));
                        }
                      }}
                      aria-label="Target benchmark numeric input"
                      className="w-14 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                    />
                    <span className="font-mono text-xs font-medium text-slate-500">%</span>
                  </div>
                  {Math.abs(targetBenchmark - defaultBenchmark) > 0.01 && (
                    <button
                      type="button"
                      onClick={() => onTargetBenchmarkChange(defaultBenchmark)}
                      title={`Reset target to ${defaultBenchmark.toFixed(1)}%`}
                      aria-label={`Reset target benchmark to ${defaultBenchmark.toFixed(1)}%`}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline underline-offset-2 whitespace-nowrap cursor-pointer"
                    >
                      90%
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
