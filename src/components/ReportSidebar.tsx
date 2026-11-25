import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  PanelLeftClose,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { ReportPageMeta } from './ReportShellHeader';

interface ReportSidebarProps {
  orderedPages: ReportPageMeta[];
  activePage: number;
  viewMode: 'single' | 'all';
  onPageChange: (page: number) => void;
  onViewModeChange: (mode: 'single' | 'all') => void;
  isDesktopOpen: boolean;
  onToggleDesktop: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  lastUpdated: string;
  targetBenchmark: number;
  isAdminAuthorized: boolean;
  isCustomLayout: boolean;
  hiddenPageIds?: number[];
  onReorderPages: (fromPageId: number, toPageId: number) => void;
  onDeletePage: (pageId: number) => void;
  onToggleHidePage?: (pageId: number) => void;
  onResetPageLayout: () => void;
}

export const ReportSidebar: React.FC<ReportSidebarProps> = ({
  orderedPages,
  activePage,
  viewMode,
  onPageChange,
  onViewModeChange,
  isDesktopOpen,
  onToggleDesktop,
  isMobileOpen,
  onCloseMobile,
  lastUpdated,
  targetBenchmark,
  isAdminAuthorized,
  isCustomLayout,
  hiddenPageIds = [],
  onReorderPages,
  onDeletePage,
  onToggleHidePage,
  onResetPageLayout,
}) => {
  const [draggedPageId, setDraggedPageId] = useState<number | null>(null);
  const [dragOverPageId, setDragOverPageId] = useState<number | null>(null);
  const [pendingDeletePage, setPendingDeletePage] = useState<ReportPageMeta | null>(null);

  useEffect(() => {
    if (!isAdminAuthorized && pendingDeletePage) {
      setPendingDeletePage(null);
    }
  }, [isAdminAuthorized, pendingDeletePage]);

  useEffect(() => {
    if (!pendingDeletePage) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPendingDeletePage(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pendingDeletePage]);

  const handleSelectPage = (pageNum: number) => {
    onViewModeChange('single');
    onPageChange(pageNum);
    onCloseMobile();
  };

  const activeIdx = Math.max(
    0,
    orderedPages.findIndex((p) => p.page === activePage)
  );
  const prevPageId = activeIdx > 0 ? orderedPages[activeIdx - 1].page : null;
  const nextPageId = activeIdx < orderedPages.length - 1 ? orderedPages[activeIdx + 1].page : null;

  const hiddenSet = new Set(isAdminAuthorized ? hiddenPageIds : []);
  const hiddenCount = orderedPages.filter((p) => hiddenSet.has(p.page)).length;
  const publicVisibleCount = orderedPages.length - hiddenCount;

  const navContent = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
            Report Navigation
          </p>
          <p className="text-xs font-semibold text-slate-800 mt-0.5 tabular-nums">
            {viewMode === 'all'
              ? `All ${orderedPages.length} Slides Active`
              : `Slide ${activeIdx + 1} of ${orderedPages.length}`}
            {isAdminAuthorized && hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ''}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isAdminAuthorized && isCustomLayout && (
            <button
              type="button"
              onClick={onResetPageLayout}
              aria-label="Reset page order, hidden, and deleted pages"
              title="Restore default slide order, unhide all, and restore removed pages for all viewers"
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleDesktop}
            aria-label="Collapse report navigation sidebar"
            title="Hide sidebar"
            className="hidden lg:inline-flex rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close report navigation"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {isAdminAuthorized && (
        <div className="border-b border-amber-200/80 bg-[#FCF6D6]/60 px-3 py-1.5 text-[10px] font-medium text-[#8E740B]">
          Admin mode: Drag to reorder, hide, or delete pages globally
        </div>
      )}

      <nav
        aria-label="Report pages"
        className="flex-1 overflow-y-auto px-2.5 py-2 space-y-0.5"
      >
        {orderedPages.map((p, idx) => {
          const isActive = viewMode === 'single' && activePage === p.page;
          const cleanLabel = p.shortTitle.replace(/^\d+\.\s*/, '');
          const isBeingDragged = draggedPageId === p.page;
          const isDropTarget = dragOverPageId === p.page && draggedPageId !== p.page;
          const isLastRemaining = orderedPages.length <= 1;
          const isHidden = hiddenSet.has(p.page);
          const isLastPublicVisible = !isHidden && publicVisibleCount <= 1;

          return (
            <div
              key={p.page}
              data-page-id={p.page}
              data-page-hidden={isHidden ? 'true' : 'false'}
              draggable={isAdminAuthorized}
              onDragStart={(e) => {
                if (!isAdminAuthorized) return;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(p.page));
                setDraggedPageId(p.page);
              }}
              onDragOver={(e) => {
                if (!isAdminAuthorized) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverPageId !== p.page) {
                  setDragOverPageId(p.page);
                }
              }}
              onDragLeave={() => {
                if (dragOverPageId === p.page) {
                  setDragOverPageId(null);
                }
              }}
              onDrop={(e) => {
                if (!isAdminAuthorized) return;
                e.preventDefault();
                const transferVal = Number(e.dataTransfer.getData('text/plain'));
                const sourcePageId = draggedPageId ?? (Number.isInteger(transferVal) ? transferVal : null);
                if (sourcePageId !== null && sourcePageId !== p.page) {
                  onReorderPages(sourcePageId, p.page);
                }
                setDraggedPageId(null);
                setDragOverPageId(null);
              }}
              onDragEnd={() => {
                setDraggedPageId(null);
                setDragOverPageId(null);
              }}
              className={`group flex items-center gap-0.5 rounded-lg transition-all ${
                isBeingDragged ? 'opacity-45 scale-[0.98]' : ''
              } ${
                isDropTarget ? 'ring-2 ring-slate-900 bg-amber-50' : ''
              } ${
                isActive
                  ? isHidden
                    ? 'bg-slate-100 text-slate-700 ring-1 ring-slate-300'
                    : 'bg-[#FCF6D6] text-slate-950 ring-1 ring-[#D8C136]'
                  : isHidden
                    ? 'bg-slate-50/80 text-slate-500 hover:bg-slate-100/90'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950'
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelectPage(p.page)}
                aria-current={isActive ? 'page' : undefined}
                title={
                  isAdminAuthorized
                    ? isHidden
                      ? `${p.fullTitle} (Hidden from public viewers)`
                      : `${p.fullTitle} (Drag to reorder)`
                    : p.fullTitle
                }
                className={`flex min-w-0 flex-1 items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-opacity cursor-pointer ${
                  isHidden ? 'opacity-55 group-hover:opacity-80' : ''
                }`}
              >
                {isAdminAuthorized && (
                  <span
                    data-testid="page-drag-handle"
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-slate-400 group-hover:text-slate-700 cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </span>
                )}

                <span
                  className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-mono font-bold tabular-nums ${
                    isHidden
                      ? 'bg-slate-200 text-slate-600'
                      : isActive
                        ? 'bg-[#D8C136] text-slate-950'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/80 group-hover:text-slate-900'
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 min-w-0">
                    <span className="text-xs font-semibold leading-snug truncate">
                      {cleanLabel}
                    </span>
                    {isHidden && (
                      <span className="shrink-0 rounded bg-slate-200 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-700">
                        Hidden
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] leading-tight text-slate-500 truncate mt-0.5">
                    {p.fullTitle}
                  </span>
                </span>
              </button>

              {isAdminAuthorized && (
                <div className="mr-1 flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={isLastPublicVisible}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleHidePage?.(p.page);
                    }}
                    aria-label={isHidden ? `Unhide page ${cleanLabel}` : `Hide page ${cleanLabel}`}
                    aria-pressed={isHidden}
                    data-testid={`toggle-hide-page-${p.page}`}
                    title={
                      isLastPublicVisible
                        ? 'At least one page must remain visible to public viewers'
                        : isHidden
                          ? `Unhide "${cleanLabel}" for all viewers`
                          : `Hide "${cleanLabel}" from public viewers`
                    }
                    className={`shrink-0 rounded-md p-1.5 transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed ${
                      isHidden
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 opacity-100'
                        : 'text-slate-400 opacity-75 group-hover:opacity-100 hover:bg-slate-200/80 hover:text-slate-800 focus-visible:opacity-100'
                    }`}
                  >
                    {isHidden ? (
                      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isLastRemaining}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDeletePage(p);
                    }}
                    aria-label={`Delete page ${cleanLabel}`}
                    data-testid={`delete-page-${p.page}`}
                    title={
                      isLastRemaining
                        ? 'At least one report page must remain'
                        : `Delete "${cleanLabel}" for all viewers`
                    }
                    className="shrink-0 rounded-md p-1.5 text-slate-400 opacity-75 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Slide Prev/Next & Snapshot Metadata */}
      <div className="border-t border-slate-200 px-3 py-3 space-y-2.5 bg-slate-50/70">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={viewMode === 'all' || prevPageId === null}
            onClick={() => {
              if (prevPageId !== null) onPageChange(prevPageId);
            }}
            aria-label="Previous report page"
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950 disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Prev</span>
          </button>
          <button
            type="button"
            disabled={viewMode === 'all' || nextPageId === null}
            onClick={() => {
              if (nextPageId !== null) onPageChange(nextPageId);
            }}
            aria-label="Next report page"
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950 disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="text-[11px] text-slate-500 space-y-0.5 tabular-nums">
          <p className="flex items-center justify-between">
            <span>Benchmark</span>
            <span className="font-semibold text-slate-700">{targetBenchmark.toFixed(1)}%</span>
          </p>
          <p className="flex items-center justify-between">
            <span>Updated</span>
            <span className="font-medium text-slate-700 truncate max-w-[140px]" title={lastUpdated}>
              {lastUpdated}
            </span>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Left Sidebar */}
      {isDesktopOpen && (
        <aside
          aria-label="Report sidebar navigation"
          className="hidden lg:block w-60 xl:w-64 shrink-0 border-r border-slate-200 bg-white print:hidden"
        >
          <div className="sticky top-[53px] h-[calc(100vh-53px)]">
            {navContent}
          </div>
        </aside>
      )}

      {/* Mobile / Tablet Slide-Over Drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden print:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Report pages navigation drawer"
        >
          <div
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full border-r border-slate-200 bg-white shadow-2xl">
            {navContent}
          </aside>
        </div>
      )}

      {/* Admin Delete Page Confirmation Modal */}
      {pendingDeletePage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px] print:hidden"
          onClick={() => setPendingDeletePage(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-page-confirm-title"
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 border-b border-slate-200 bg-rose-50/80 px-5 py-4">
              <div className="mt-0.5 rounded-lg bg-rose-100 p-1.5 text-rose-700 shrink-0">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  id="delete-page-confirm-title"
                  className="text-sm font-bold text-slate-950"
                >
                  Delete Report Page?
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Remove <strong className="text-slate-900">{pendingDeletePage.fullTitle}</strong>{' '}
                  from the report? All viewers will immediately see the updated navigation, All Pages
                  view, and exports.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setPendingDeletePage(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = pendingDeletePage.page;
                  setPendingDeletePage(null);
                  onDeletePage(targetId);
                }}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer"
              >
                Delete Page
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
