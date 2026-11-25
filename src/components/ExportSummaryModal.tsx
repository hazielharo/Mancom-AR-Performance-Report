import React, { useEffect, useState } from 'react';
import { X, Copy, Check, FileDown, FileSpreadsheet } from 'lucide-react';
import { ARReportData, ComputedARMetrics } from '../types/arReport';
import { generateExecutiveSummaryText } from '../utils/arCalculations';

interface ExportSummaryModalProps {
  isOpen: boolean;
  data: ARReportData;
  metrics: ComputedARMetrics;
  onClose: () => void;
  onDownloadAllSheets: () => void;
  onSaveAsPdf: () => void;
}

export const ExportSummaryModal: React.FC<ExportSummaryModalProps> = ({
  isOpen,
  data,
  metrics,
  onClose,
  onDownloadAllSheets,
  onSaveAsPdf,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCopied(false);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const summaryText = generateExecutiveSummaryText(data, metrics);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback selection copy
      const el = document.getElementById('export-summary-textarea') as HTMLTextAreaElement | null;
      if (el) {
        el.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mancom-ar-summary-${metrics.segment}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    onClose();
    window.setTimeout(() => {
      onSaveAsPdf();
    }, 60);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px] print:hidden"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-summary-title"
        className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="export-summary-title" className="text-lg font-bold text-slate-900">
              Executive Summary Export
            </h2>
            <p className="text-xs text-slate-500">
              Ready for Slack, Teams, or Leadership Email ({metrics.segmentLabel} ·{' '}
              {metrics.targetBenchmark.toFixed(1)}% Benchmark)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Export Summary modal"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6">
          <label htmlFor="export-summary-textarea" className="sr-only">
            Formatted executive summary text
          </label>
          <textarea
            id="export-summary-textarea"
            readOnly
            rows={16}
            value={summaryText}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800 focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-xl">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Download .TXT</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <FileDown className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
              <span>Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onDownloadAllSheets}
              className="inline-flex items-center gap-2 rounded-lg border border-[#C7AC2D] bg-[#FCF6D6] px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-[#F5ECC0] cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#9E8418]" aria-hidden="true" />
              <span>All Sheets (.xlsx)</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
