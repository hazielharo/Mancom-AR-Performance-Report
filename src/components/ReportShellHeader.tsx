import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  FileDown,
  FileSpreadsheet,
  FileText,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Presentation,
  Radio,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { AsiaAffinityLogo } from './AsiaAffinityLogo';
import { LiveSheetConfig, LiveSyncStatus } from '../utils/googleSheets';

export interface ReportPageMeta {
  page: number;
  shortTitle: string;
  fullTitle: string;
}

export const REPORT_PAGES: ReportPageMeta[] = [
  { page: 1, shortTitle: '1. Cover', fullTitle: 'Accounts Receivable & Collection Performance' },
  { page: 2, shortTitle: '2. YTD Sep', fullTitle: 'YTD September Billing & Collection Efficiency' },
  { page: 3, shortTitle: '3. Portfolio & Target', fullTitle: 'Outstanding Balance & Target Gap by Account Manager' },
  { page: 5, shortTitle: '4. Target Projection', fullTitle: 'Target Collection & Recomputed Efficiency' },
  { page: 7, shortTitle: '5. YTD Oct', fullTitle: 'YTD October Billing & Collection Efficiency' },
  { page: 8, shortTitle: '6. Oct Billings', fullTitle: 'Outstanding Balance with Oct Billings' },
  { page: 9, shortTitle: '7. Aging Summary', fullTitle: 'AR Aging Summary' },
  { page: 10, shortTitle: '8. Efficiency Matrix', fullTitle: 'Collection Efficiency Matrix' },
  { page: 11, shortTitle: '9. Balance Breakdown', fullTitle: 'AR Balance Breakdown (Treemaps & Clients)' },
  { page: 12, shortTitle: '10. Comparative Report', fullTitle: 'Accounts Receivable & Collection Performance Comparative Report' },
  { page: 13, shortTitle: '11. Data Sheets', fullTitle: 'All Report Data Sheets & Linked Ledger' },
];

interface ReportShellHeaderProps {
  orderedPages: ReportPageMeta[];
  activePage: number;
  viewMode: 'single' | 'all';
  onViewModeChange: (mode: 'single' | 'all') => void;
  isDesktopSidebarOpen: boolean;
  onToggleSidebar: () => void;
  targetBenchmark: number;
  defaultBenchmark: number;
  onTargetBenchmarkChange: (value: number) => void;
  isCustomData: boolean;
  syncStatus: LiveSyncStatus;
  autoSyncStatus?: 'syncing' | 'synced' | 'error';
  lastSyncedAt?: string | null;
  sheetConfig: LiveSheetConfig | null;
  onOpenLiveSheets: () => void;
  onSyncNow: () => void;
  onResetToBaseline: () => void;
  onOpenManageData: () => void;
  onOpenExportSummary: () => void;
  onDownloadAllSheets: () => void;
  onSaveAsPdf: () => void;
  onSaveAsPpt: () => void;
  onDraftEmail: () => void;
  isExportingPdf: boolean;
  isExportingPpt: boolean;
  isAdminAuthorized: boolean;
  isRealAdmin: boolean;
  isPublicPreview: boolean;
  onTogglePublicPreview: () => void;
  adminEmailLabel: string | null;
  onOpenAdminLogin: () => void;
  onAdminSignOut: () => void;
}

export const ReportShellHeader: React.FC<ReportShellHeaderProps> = ({
  orderedPages,
  activePage,
  viewMode,
  onViewModeChange,
  isDesktopSidebarOpen,
  onToggleSidebar,
  targetBenchmark,
  defaultBenchmark,
  onTargetBenchmarkChange,
  isCustomData,
  syncStatus,
  autoSyncStatus = 'synced',
  lastSyncedAt = null,
  sheetConfig,
  onOpenLiveSheets,
  onSyncNow,
  onResetToBaseline,
  onOpenManageData,
  onOpenExportSummary,
  onDownloadAllSheets,
  onSaveAsPdf,
  onSaveAsPpt,
  onDraftEmail,
  isExportingPdf,
  isExportingPpt,
  isAdminAuthorized,
  isRealAdmin,
  isPublicPreview,
  onTogglePublicPreview,
  adminEmailLabel,
  onOpenAdminLogin,
  onAdminSignOut,
}) => {
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const saveMenuRef = useRef<HTMLDivElement | null>(null);
  const [benchmarkDraft, setBenchmarkDraft] = useState<string>(targetBenchmark.toFixed(1));
  const [isEditingBenchmark, setIsEditingBenchmark] = useState(false);

  useEffect(() => {
    if (!isEditingBenchmark) {
      setBenchmarkDraft(
        Number.isInteger(targetBenchmark) ? String(targetBenchmark) : targetBenchmark.toFixed(1)
      );
    }
  }, [targetBenchmark, isEditingBenchmark]);

  useEffect(() => {
    if (!isSaveMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target as Node)) {
        setIsSaveMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSaveMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isSaveMenuOpen]);

  const commitBenchmarkDraft = (raw: string) => {
    const parsed = Number.parseFloat(raw);
    if (Number.isNaN(parsed)) {
      setBenchmarkDraft(
        Number.isInteger(targetBenchmark) ? String(targetBenchmark) : targetBenchmark.toFixed(1)
      );
      return;
    }
    const clamped = Math.min(100, Math.max(75, Math.round(parsed * 10) / 10));
    onTargetBenchmarkChange(clamped);
    setBenchmarkDraft(Number.isInteger(clamped) ? String(clamped) : clamped.toFixed(1));
  };

  const isLiveConnected = syncStatus === 'live' || syncStatus === 'syncing';
  const activeIdx = Math.max(
    0,
    orderedPages.findIndex((p) => p.page === activePage)
  );
  const currentMeta = orderedPages[activeIdx] ?? REPORT_PAGES[0];
  const isBusyExport = isExportingPdf || isExportingPpt;
  const compactSyncTime = (() => {
    if (!lastSyncedAt) return '';
    const parsed = new Date(lastSyncedAt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    const parts = lastSyncedAt.split(',');
    return (parts[parts.length - 1] ?? lastSyncedAt).trim();
  })();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm print:hidden">
      <div className="mx-auto flex max-w-[1640px] flex-wrap lg:flex-nowrap items-center justify-between gap-2 px-3 py-2 sm:px-6">
        {/* Left: Sidebar Toggle, Brand, & Single Slide / All Pages Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isDesktopSidebarOpen ? 'Toggle report navigation sidebar' : 'Show report navigation sidebar'}
            title={isDesktopSidebarOpen ? 'Toggle sidebar' : 'Show sidebar'}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-50 hover:text-slate-950 cursor-pointer shrink-0"
          >
            <Menu className="h-4 w-4 lg:hidden" aria-hidden="true" />
            {isDesktopSidebarOpen ? (
              <PanelLeftClose className="hidden lg:block h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelLeftOpen className="hidden lg:block h-4 w-4 text-[#9E8418]" aria-hidden="true" />
            )}
          </button>

          <AsiaAffinityLogo compact />

          <div className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />

          {/* Single Slide vs All Pages Segmented Toggle */}
          <div
            role="group"
            aria-label="Slide display mode"
            className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 shrink-0"
          >
            <button
              type="button"
              aria-pressed={viewMode === 'single'}
              onClick={() => onViewModeChange('single')}
              className={`rounded-md px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Slide
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'all'}
              onClick={() => onViewModeChange('all')}
              className={`inline-flex items-center gap-1 rounded-md px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-[#D8C136] text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              <span>All Pages</span>
            </button>
          </div>

          {/* Subtle Synced Status Badge (visible to both Admin & Public Viewers) */}
          <span
            data-testid="header-sync-badge"
            role="status"
            title={
              autoSyncStatus === 'syncing'
                ? 'Automatically syncing read-only AR Monitoring data...'
                : lastSyncedAt
                  ? `Auto-synced from Main AR Monitoring sheet · ${lastSyncedAt}`
                  : 'Auto-synced with linked AR Monitoring source'
            }
            className={`hidden sm:inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium whitespace-nowrap tabular-nums shrink-0 ${
              autoSyncStatus === 'syncing' || syncStatus === 'syncing'
                ? 'border-amber-200 bg-amber-50/90 text-amber-800'
                : autoSyncStatus === 'error'
                  ? 'border-slate-200 bg-slate-50 text-slate-600'
                  : 'border-emerald-200 bg-emerald-50/85 text-emerald-800'
            }`}
          >
            {autoSyncStatus === 'syncing' || syncStatus === 'syncing' ? (
              <RefreshCw className="h-3 w-3 animate-spin text-amber-700" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" />
            )}
            <span>
              {autoSyncStatus === 'syncing' || syncStatus === 'syncing'
                ? 'Syncing...'
                : compactSyncTime
                  ? `Synced · ${compactSyncTime}`
                  : 'Synced'}
            </span>
          </span>

          <span
            className="hidden 2xl:inline-block truncate max-w-[200px] text-xs font-medium text-slate-500"
            title={currentMeta.fullTitle}
          >
            {viewMode === 'all'
              ? `All ${orderedPages.length} Slides`
              : `Slide ${activeIdx + 1}: ${currentMeta.fullTitle}`}
          </span>
        </div>

        {/* Right: Benchmark Simulator, Sync, Manage Data, Consolidated Save As & Admin Login */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 w-full lg:w-auto lg:justify-end">
          <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
            <label
              htmlFor="benchmark-slider"
              className="text-[11px] font-semibold text-slate-500 whitespace-nowrap"
            >
              Target
            </label>
            <input
              id="benchmark-slider"
              type="range"
              min={75}
              max={100}
              step={0.5}
              value={targetBenchmark}
              onChange={(e) => onTargetBenchmarkChange(Number(e.target.value))}
              aria-label="Target efficiency benchmark percentage slider"
              className="benchmark-slider w-16 xl:w-20"
            />
            <div className="inline-flex items-center gap-0.5 rounded border border-slate-300 bg-white px-1.5 py-0.5 focus-within:border-[#C7AC2D]">
              <input
                id="benchmark-numeric-input"
                type="number"
                min={75}
                max={100}
                step={0.1}
                value={benchmarkDraft}
                onFocus={() => setIsEditingBenchmark(true)}
                onChange={(e) => {
                  const nextVal = e.target.value;
                  setBenchmarkDraft(nextVal);
                  const parsed = Number.parseFloat(nextVal);
                  if (!Number.isNaN(parsed) && parsed >= 75 && parsed <= 100) {
                    onTargetBenchmarkChange(Math.round(parsed * 10) / 10);
                  }
                }}
                onBlur={() => {
                  setIsEditingBenchmark(false);
                  commitBenchmarkDraft(benchmarkDraft);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingBenchmark(false);
                    commitBenchmarkDraft(benchmarkDraft);
                    (e.currentTarget as HTMLInputElement).blur();
                  }
                }}
                aria-label="Target efficiency benchmark exact percentage"
                className="w-11 bg-transparent font-mono text-xs font-bold text-slate-900 tabular-nums text-right focus:outline-none"
              />
              <span className="font-mono text-[11px] font-bold text-slate-500 select-none">%</span>
            </div>
            {Math.abs(targetBenchmark - defaultBenchmark) > 0.01 && (
              <button
                type="button"
                onClick={() => onTargetBenchmarkChange(defaultBenchmark)}
                className="text-[11px] font-semibold text-[#9E8418] hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {isAdminAuthorized && (
            <>
              {isLiveConnected ? (
                <button
                  type="button"
                  onClick={onSyncNow}
                  disabled={syncStatus === 'syncing'}
                  title={`Synced with ${sheetConfig?.spreadsheetTitle ?? 'Google Sheets'} (${sheetConfig?.sheetTitle ?? ''}). Click to sync now.`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 text-emerald-700 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>
                    {syncStatus === 'syncing'
                      ? 'Syncing...'
                      : sheetConfig && sheetConfig.pollIntervalSec > 0
                        ? `Live · ${sheetConfig.pollIntervalSec}s`
                        : 'Sync Sheet'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLiveSheets}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2 sm:px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    syncStatus === 'auth_required'
                      ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Radio
                    className={`h-3.5 w-3.5 ${
                      syncStatus === 'auth_required' ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">
                    {syncStatus === 'auth_required' ? 'Reconnect Sheet' : 'Live Sync'}
                  </span>
                  <span className="sm:hidden">
                    {syncStatus === 'auth_required' ? 'Reconnect' : 'Sync'}
                  </span>
                </button>
              )}

              {isCustomData && !isLiveConnected && (
                <button
                  type="button"
                  onClick={onResetToBaseline}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Reset to Linked Sheet</span>
                  <span className="sm:hidden">Reset</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenManageData}
                aria-label="Manage Data"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                <span className="hidden sm:inline">Manage Data</span>
              </button>
            </>
          )}

          {/* Consolidated "Save As" Dropdown */}
          <div className="relative" ref={saveMenuRef}>
            <button
              type="button"
              onClick={() => setIsSaveMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isSaveMenuOpen}
              aria-controls="save-as-dropdown-menu"
              disabled={isBusyExport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#141A21] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              {isBusyExport ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#D8C136]" aria-hidden="true" />
              ) : (
                <Download className="h-3.5 w-3.5 text-[#D8C136]" aria-hidden="true" />
              )}
              <span>
                {isExportingPdf
                  ? 'Exporting PDF...'
                  : isExportingPpt
                    ? 'Exporting PPT...'
                    : 'Save As'}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-300 transition-transform ${
                  isSaveMenuOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {isSaveMenuOpen && (
              <div
                id="save-as-dropdown-menu"
                role="menu"
                aria-label="Export and Save As options"
                className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-50"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsSaveMenuOpen(false);
                    onSaveAsPdf();
                  }}
                  className="flex w-full items-start gap-2.5 px-3.5 py-2 text-left text-xs hover:bg-[#FCF6D6]/70 cursor-pointer"
                >
                  <FileDown className="mt-0.5 h-4 w-4 text-slate-700 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-slate-900">Save as PDF</span>
                    <span className="block text-[11px] text-slate-500">
                      Exports {viewMode === 'all' ? `all ${orderedPages.length} slides (1 page each)` : 'current slide'} cleanly
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsSaveMenuOpen(false);
                    onSaveAsPpt();
                  }}
                  className="flex w-full items-start gap-2.5 px-3.5 py-2 text-left text-xs hover:bg-[#FCF6D6]/70 cursor-pointer"
                >
                  <Presentation
                    className="mt-0.5 h-4 w-4 text-[#8E740B] shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block font-semibold text-slate-900">Save as PPT</span>
                    <span className="block text-[11px] text-slate-500">
                      Exports {viewMode === 'all' ? `all ${orderedPages.length} slides` : 'current slide'} (.pptx)
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsSaveMenuOpen(false);
                    onDownloadAllSheets();
                  }}
                  className="flex w-full items-start gap-2.5 px-3.5 py-2 text-left text-xs hover:bg-[#FCF6D6]/70 cursor-pointer"
                >
                  <FileSpreadsheet
                    className="mt-0.5 h-4 w-4 text-[#9E8418] shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block font-semibold text-slate-900">Save as Excel (.xlsx)</span>
                    <span className="block text-[11px] text-slate-500">
                      Downloads all workbook data sheets
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsSaveMenuOpen(false);
                    onOpenExportSummary();
                  }}
                  className="flex w-full items-start gap-2.5 px-3.5 py-2 text-left text-xs hover:bg-[#FCF6D6]/70 cursor-pointer"
                >
                  <FileText className="mt-0.5 h-4 w-4 text-slate-600 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-slate-900">
                      Executive Summary (.txt)
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Copy or download summary report
                    </span>
                  </span>
                </button>

                {isAdminAuthorized && (
                  <>
                    <div className="my-1 border-t border-slate-200" role="separator" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsSaveMenuOpen(false);
                        onDraftEmail();
                      }}
                      className="flex w-full items-start gap-2.5 px-3.5 py-2 text-left text-xs hover:bg-emerald-50 cursor-pointer"
                    >
                      <Mail
                        className="mt-0.5 h-4 w-4 text-emerald-700 shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        <span className="block font-semibold text-slate-900">Draft to Email</span>
                        <span className="block text-[11px] text-emerald-700">
                          Admin authorized · Pre-filled summary
                        </span>
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Admin Preview as Public Toggle (only visible when authenticated as Admin) */}
          {isRealAdmin && (
            <button
              type="button"
              role="switch"
              aria-checked={isPublicPreview}
              onClick={onTogglePublicPreview}
              title={
                isPublicPreview
                  ? 'Exit Public Preview and restore full Admin controls'
                  : 'Preview report exactly as public viewers see it without signing out'
              }
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 sm:px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                isPublicPreview
                  ? 'border-amber-400 bg-[#FEF3C7] text-slate-950 hover:bg-amber-200'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-[#FCF6D6] hover:text-slate-950'
              }`}
            >
              {isPublicPreview ? (
                <EyeOff className="h-3.5 w-3.5 text-[#8E740B]" aria-hidden="true" />
              ) : (
                <Eye className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {isPublicPreview ? 'Exit Public Preview' : 'Preview as Public'}
              </span>
              <span className="sm:hidden">{isPublicPreview ? 'Exit Preview' : 'Preview'}</span>
            </button>
          )}

          {/* Admin RBAC Button / Active Admin Badge */}
          {isAdminAuthorized ? (
            <button
              type="button"
              onClick={onAdminSignOut}
              title={`Admin authorized (${adminEmailLabel ?? 'admin'}). Click to sign out of Admin mode.`}
              aria-label="Sign out of Admin mode"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
              <span className="hidden sm:inline">Admin</span>
              <LogOut className="h-3 w-3 text-emerald-700" aria-hidden="true" />
            </button>
          ) : !isRealAdmin ? (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              aria-label="Admin Login"
              title="Sign in with authorized admin email to unlock Manage Data, Draft to Email, and Page Controls"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950 whitespace-nowrap cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span className="hidden sm:inline">Admin Login</span>
              <span className="sm:hidden">Admin</span>
            </button>
          ) : null}
        </div>
      </div>

      {isRealAdmin && isPublicPreview && (
        <div
          role="status"
          aria-live="polite"
          className="border-t border-amber-300 bg-[#FEF3C7] px-3 py-1.5 sm:px-6"
        >
          <div className="mx-auto flex max-w-[1640px] flex-wrap items-center justify-between gap-2 text-xs text-slate-900">
            <div className="flex items-center gap-2 font-medium">
              <Eye className="h-3.5 w-3.5 text-[#8E740B] shrink-0" aria-hidden="true" />
              <span>
                <strong className="font-bold">Public Preview Mode Active:</strong> Viewing as a
                non-admin public viewer. Manage Data, Draft to Email, sidebar editing controls, and
                hidden pages are concealed.
              </span>
            </div>
            <button
              type="button"
              onClick={onTogglePublicPreview}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#141A21] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 cursor-pointer shrink-0"
            >
              <EyeOff className="h-3.5 w-3.5 text-[#D8C136]" aria-hidden="true" />
              <span>Exit Public Preview</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
