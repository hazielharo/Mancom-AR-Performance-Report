import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  X,
  Upload,
  RotateCcw,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Download,
  RefreshCw,
  LogOut,
  Radio,
  Link2,
  CalendarCheck,
  Copy,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ARReportData } from '../types/arReport';
import {
  APPSHEET_CSV_HEADERS,
  formatPeso,
  generateCSVTemplate,
  getLastUpdatedDay,
  parseARReportCSV,
  round2,
} from '../utils/arCalculations';
import {
  DEFAULT_MAIN_AR_SHEET_GID,
  DEFAULT_MAIN_AR_SPREADSHEET_ID,
  extractSpreadsheetId,
  fetchPublicSheetCsv,
  LiveSheetConfig,
  LiveSyncStatus,
  SheetTabInfo,
  SHEET_REFRESH_INTERVAL_SEC,
} from '../utils/googleSheets';
import {
  buildAppsScriptCode,
  COMMITTED_PAYMENTS_COLUMNS,
  CommittedPaymentsConfig,
  CommitmentSyncStatus,
  DEFAULT_COMMITTED_PAYMENTS_CONFIG,
  DEFAULT_COMMITTED_PAYMENTS_SHEET_GID,
  DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID,
  DEFAULT_MAIN_AR_SOURCE_SHEET_GID,
  DEFAULT_MAIN_AR_SOURCE_SPREADSHEET_ID,
  PaymentCommitmentRecord,
  validateAppsScriptWebhookUrl,
} from '../utils/paymentCommitments';
import { GoogleSignInButton } from './GoogleSignInButton';

export type DrawerTab = 'sheets' | 'commitments' | 'csv' | 'manual';

interface ManageDataDrawerProps {
  isOpen: boolean;
  initialTab?: DrawerTab;
  data: ARReportData;
  authUser: User | null;
  hasAccessToken: boolean;
  isLoggingIn: boolean;
  sheetConfig: LiveSheetConfig | null;
  syncStatus: LiveSyncStatus;
  syncError: string | null;
  lastSyncedAt: string | null;
  commitments?: PaymentCommitmentRecord[];
  committedPaymentsConfig?: CommittedPaymentsConfig;
  commitmentSyncStatus?: CommitmentSyncStatus;
  commitmentSyncWarning?: string | null;
  onSaveCommittedPaymentsConfig?: (config: CommittedPaymentsConfig) => Promise<void>;
  onSyncCommitments?: () => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  onLoadSpreadsheetTabs: (
    spreadsheetId: string
  ) => Promise<{ title: string; sheets: SheetTabInfo[]; defaultTab: string }>;
  onConnectLiveSheet: (config: LiveSheetConfig) => Promise<void>;
  onSyncNow: () => Promise<void>;
  onDisconnectLiveSheet: () => void;
  onClose: () => void;
  onApplyData: (updated: ARReportData, rawCsv?: string) => void;
  onResetBaseline: () => void;
}

const LARGE_FILE_TEXTAREA_LIMIT = 60_000;

function formatCurrentTimestamp(): string {
  return new Date().toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export const ManageDataDrawer: React.FC<ManageDataDrawerProps> = ({
  isOpen,
  initialTab = 'sheets',
  data,
  authUser,
  hasAccessToken,
  isLoggingIn,
  sheetConfig,
  syncStatus,
  syncError,
  lastSyncedAt,
  commitments = [],
  committedPaymentsConfig = DEFAULT_COMMITTED_PAYMENTS_CONFIG,
  commitmentSyncStatus = 'local_only',
  commitmentSyncWarning = null,
  onSaveCommittedPaymentsConfig = async () => {},
  onSyncCommitments = async () => {},
  onGoogleSignIn,
  onGoogleSignOut,
  onLoadSpreadsheetTabs,
  onConnectLiveSheet,
  onSyncNow,
  onDisconnectLiveSheet,
  onClose,
  onApplyData,
  onResetBaseline,
}) => {
  const [activeTab, setActiveTab] = useState<DrawerTab>(initialTab);
  const activePollInterval = hasAccessToken ? sheetConfig?.pollIntervalSec ?? 0 : SHEET_REFRESH_INTERVAL_SEC;
  const novEndDay = getLastUpdatedDay(data.lastUpdated);

  // Live Google Sheets form state (pre-filled with hardcoded read-only Main AR Monitoring source)
  const [sheetUrlInput, setSheetUrlInput] = useState(
    sheetConfig?.spreadsheetId || DEFAULT_MAIN_AR_SPREADSHEET_ID
  );
  const [discoveredTitle, setDiscoveredTitle] = useState(sheetConfig?.spreadsheetTitle ?? '');
  const [discoveredTabs, setDiscoveredTabs] = useState<SheetTabInfo[]>(
    sheetConfig?.availableTabs ?? []
  );
  const [selectedSheetTab, setSelectedSheetTab] = useState(sheetConfig?.sheetTitle ?? '');
  const [pollIntervalSec, setPollIntervalSec] = useState<number>(
    sheetConfig?.pollIntervalSec ?? 30
  );
  const [isLoadingTabs, setIsLoadingTabs] = useState(false);

  // Committed Payments Google Apps Script Sync state (pre-filled with both hardcoded IDs)
  const [commitmentWebhookInput, setCommitmentWebhookInput] = useState(
    committedPaymentsConfig.webhookUrl
  );
  const [commitmentSourceIdInput, setCommitmentSourceIdInput] = useState(
    committedPaymentsConfig.sourceSpreadsheetId || DEFAULT_MAIN_AR_SOURCE_SPREADSHEET_ID
  );
  const [commitmentTargetIdInput, setCommitmentTargetIdInput] = useState(
    committedPaymentsConfig.targetSpreadsheetId || DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID
  );
  const [isSavingCommitConfig, setIsSavingCommitConfig] = useState(false);
  const [copiedScriptNotice, setCopiedScriptNotice] = useState(false);

  // Manual form string state so user can type cleanly without jumping cursors
  const [ytdSepBilling, setYtdSepBilling] = useState(String(data.ytdSepBilling));
  const [ytdSepCollections, setYtdSepCollections] = useState(String(data.ytdSepCollections));
  const [octArBilling, setOctArBilling] = useState(String(data.octArBilling));
  const [octArCollections, setOctArCollections] = useState(String(data.octArCollections));
  const [priorMonthEfficiency, setPriorMonthEfficiency] = useState(
    String(data.priorMonthEfficiency)
  );
  const [oct1To31SepAr, setOct1To31SepAr] = useState(String(data.recoveryFlows.oct1To31SepAr));
  const [nov1To9SepAr, setNov1To9SepAr] = useState(String(data.recoveryFlows.nov1To9SepAr));
  const [collectionOctAr, setCollectionOctAr] = useState(
    String(data.recoveryFlows.collectionOctAr)
  );

  // AppSheet CSV state (holds full uploaded or pasted CSV string)
  const [csvRawContent, setCsvRawContent] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isLoadingSourceFile, setIsLoadingSourceFile] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSheetUrlInput(sheetConfig?.spreadsheetId || DEFAULT_MAIN_AR_SPREADSHEET_ID);
      setDiscoveredTitle(sheetConfig?.spreadsheetTitle ?? '');
      setDiscoveredTabs(sheetConfig?.availableTabs ?? []);
      setSelectedSheetTab(sheetConfig?.sheetTitle ?? '');
      setPollIntervalSec(sheetConfig?.pollIntervalSec ?? 30);

      setCommitmentWebhookInput(committedPaymentsConfig.webhookUrl);
      setCommitmentSourceIdInput(
        committedPaymentsConfig.sourceSpreadsheetId || DEFAULT_MAIN_AR_SOURCE_SPREADSHEET_ID
      );
      setCommitmentTargetIdInput(
        committedPaymentsConfig.targetSpreadsheetId || DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID
      );
      setCopiedScriptNotice(false);

      setYtdSepBilling(String(data.ytdSepBilling));
      setYtdSepCollections(String(data.ytdSepCollections));
      setOctArBilling(String(data.octArBilling));
      setOctArCollections(String(data.octArCollections));
      setPriorMonthEfficiency(String(data.priorMonthEfficiency));
      setOct1To31SepAr(String(data.recoveryFlows.oct1To31SepAr));
      setNov1To9SepAr(String(data.recoveryFlows.nov1To9SepAr));
      setCollectionOctAr(String(data.recoveryFlows.collectionOctAr));
      setCsvRawContent('');
      setUploadedFileName(null);
      setFormErrors([]);
    }
  }, [isOpen, initialTab, data, sheetConfig, committedPaymentsConfig]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const livePreview = useMemo(() => {
    if (!csvRawContent.trim()) return null;
    return parseARReportCSV(csvRawContent, data, formatCurrentTimestamp());
  }, [csvRawContent, data]);

  const resolvedSourceId = useMemo(
    () =>
      extractSpreadsheetId(commitmentSourceIdInput) ||
      commitmentSourceIdInput.trim() ||
      DEFAULT_MAIN_AR_SOURCE_SPREADSHEET_ID,
    [commitmentSourceIdInput]
  );
  const resolvedTargetId = useMemo(
    () =>
      extractSpreadsheetId(commitmentTargetIdInput) ||
      commitmentTargetIdInput.trim() ||
      DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID,
    [commitmentTargetIdInput]
  );
  const sourceGid =
    committedPaymentsConfig.sourceSheetGid ?? DEFAULT_MAIN_AR_SOURCE_SHEET_GID;
  const targetGid =
    committedPaymentsConfig.targetSheetGid ?? DEFAULT_COMMITTED_PAYMENTS_SHEET_GID;
  const appsScriptCode = useMemo(
    () => buildAppsScriptCode(resolvedSourceId, resolvedTargetId, sourceGid, targetGid),
    [resolvedSourceId, resolvedTargetId, sourceGid, targetGid]
  );

  if (!isOpen) return null;

  const isLargeFileLoaded = csvRawContent.length > LARGE_FILE_TEXTAREA_LIMIT;
  const textareaDisplayValue = isLargeFileLoaded
    ? csvRawContent.split(/\r?\n/).slice(0, 12).join('\n')
    : csvRawContent;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    const parseField = (raw: string, label: string): number => {
      const cleaned = raw.replace(/[₱,\s]/g, '');
      const n = Number(cleaned);
      if (!cleaned || !Number.isFinite(n) || n < 0) {
        errors.push(`${label} must be a valid non-negative number.`);
        return 0;
      }
      return round2(n);
    };

    const sepBill = parseField(ytdSepBilling, 'YTD September Billing');
    const sepCol = parseField(ytdSepCollections, 'YTD September Collections');
    const octBill = parseField(octArBilling, 'October AR Billing');
    const octCol = parseField(octArCollections, 'October AR Collections');
    const priorEff = parseField(priorMonthEfficiency, 'Prior Month Efficiency (%)');
    const recOctSep = parseField(oct1To31SepAr, 'Oct 1–31 Collection (YTD Sep AR)');
    const recNovSep = parseField(nov1To9SepAr, `Nov 1–${novEndDay} Collection (YTD Sep AR)`);
    const recOctAr = parseField(collectionOctAr, 'Collection (Oct & Nov AR)');

    if (sepBill + octBill <= 0) {
      errors.push('Combined Total Billing must be greater than zero.');
    }
    if (priorEff > 100) {
      errors.push('Prior Month Efficiency (%) cannot exceed 100%.');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    onApplyData({
      ...data,
      lastUpdated: formatCurrentTimestamp(),
      ytdSepBilling: sepBill,
      ytdSepCollections: sepCol,
      octArBilling: octBill,
      octArCollections: octCol,
      priorMonthEfficiency: priorEff,
      baselineTargetBillingBasis: undefined,
      sourceFormat: 'manual',
      recoveryFlows: {
        oct1To31SepAr: recOctSep,
        nov1To9SepAr: recNovSep,
        collectionOctAr: recOctAr,
      },
    });
    onClose();
  };

  const handleCSVApply = () => {
    const result = parseARReportCSV(csvRawContent, data, formatCurrentTimestamp());
    if (!result.ok || !result.data) {
      setFormErrors(result.errors);
      return;
    }
    onApplyData(result.data, csvRawContent);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCsvRawContent(reader.result);
        setUploadedFileName(file.name);
        setFormErrors([]);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadCurrentSourceFile = async () => {
    setIsLoadingSourceFile(true);
    setFormErrors([]);
    try {
      const text = await fetchPublicSheetCsv(DEFAULT_MAIN_AR_SPREADSHEET_ID, DEFAULT_MAIN_AR_SHEET_GID);
      setCsvRawContent(text);
      setUploadedFileName('AR_MONITORING_FOR_APPSHEET.csv');
    } catch (error) {
      setFormErrors([error instanceof Error ? error.message : 'Unable to load the live AppSheet CSV.']);
    } finally {
      setIsLoadingSourceFile(false);
    }
  };

  const handleInsertSampleTemplate = () => {
    setCsvRawContent(generateCSVTemplate(data));
    setUploadedFileName(null);
    setFormErrors([]);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([generateCSVTemplate(data)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AR_MONITORING_FOR_APPSHEET_TEMPLATE.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadTabs = async () => {
    setFormErrors([]);
    const parsedId = extractSpreadsheetId(sheetUrlInput);
    if (!parsedId) {
      setFormErrors([
        'Enter a valid Google Sheets URL (https://docs.google.com/spreadsheets/d/...) or Spreadsheet ID.',
      ]);
      return;
    }
    if (!hasAccessToken) {
      setFormErrors(['Sign in with Google first so the app can read your spreadsheet tabs.']);
      return;
    }

    setIsLoadingTabs(true);
    try {
      const meta = await onLoadSpreadsheetTabs(parsedId);
      setDiscoveredTitle(meta.title);
      setDiscoveredTabs(meta.sheets);
      setSelectedSheetTab((prev) =>
        meta.sheets.some((s) => s.title === prev) ? prev : meta.defaultTab
      );
      if (meta.sheets.length === 0) {
        setFormErrors(['No readable worksheet tabs were found in this Google Spreadsheet.']);
      }
    } catch (err: any) {
      setFormErrors([err?.message || 'Unable to read spreadsheet metadata from Google Sheets.']);
    } finally {
      setIsLoadingTabs(false);
    }
  };

  const handleConnectLiveSheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    const parsedId = extractSpreadsheetId(sheetUrlInput);
    if (!parsedId) {
      setFormErrors([
        'Enter a valid Google Sheets URL or Spreadsheet ID before connecting live sync.',
      ]);
      return;
    }
    if (!hasAccessToken) {
      setFormErrors(['Sign in with Google to authorize live Google Sheets synchronization.']);
      return;
    }

    let finalTitle = discoveredTitle;
    let finalTabs = discoveredTabs;
    let finalTab = selectedSheetTab;

    if (finalTabs.length === 0 || !finalTab) {
      setIsLoadingTabs(true);
      try {
        const meta = await onLoadSpreadsheetTabs(parsedId);
        finalTitle = meta.title;
        finalTabs = meta.sheets;
        finalTab = meta.defaultTab;
        setDiscoveredTitle(meta.title);
        setDiscoveredTabs(meta.sheets);
        setSelectedSheetTab(meta.defaultTab);
      } catch (err: any) {
        setFormErrors([err?.message || 'Unable to load tabs for the specified Google Sheet.']);
        setIsLoadingTabs(false);
        return;
      } finally {
        setIsLoadingTabs(false);
      }
    }

    if (!finalTab) {
      setFormErrors(['Select a worksheet tab containing the AR Monitoring columns.']);
      return;
    }

    try {
      await onConnectLiveSheet({
        spreadsheetId: parsedId,
        spreadsheetTitle: finalTitle || 'Linked Google Sheet',
        sheetTitle: finalTab,
        availableTabs: finalTabs,
        pollIntervalSec,
      });
    } catch (err: any) {
      setFormErrors([err?.message || 'Failed to sync rows from Google Sheets.']);
    }
  };

  const handleSaveCommitmentsSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    const check = validateAppsScriptWebhookUrl(commitmentWebhookInput);
    if (!check.valid) {
      setFormErrors([check.error || 'Invalid Google Apps Script Web App URL.']);
      return;
    }
    if (resolvedTargetId === resolvedSourceId) {
      setFormErrors([
        'Committed Payments target spreadsheet ID must be separate from the strictly read-only Main AR Monitoring spreadsheet.',
      ]);
      return;
    }
    setIsSavingCommitConfig(true);
    try {
      await onSaveCommittedPaymentsConfig({
        webhookUrl: check.normalizedUrl,
        sourceSpreadsheetId: resolvedSourceId,
        sourceSheetGid: sourceGid,
        targetSpreadsheetId: resolvedTargetId,
        targetSheetGid: targetGid,
      });
    } catch (err: any) {
      setFormErrors([err?.message || 'Unable to save Google Apps Script webhook settings.']);
    } finally {
      setIsSavingCommitConfig(false);
    }
  };

  const handleCopyAppsScript = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(appsScriptCode);
        setCopiedScriptNotice(true);
        window.setTimeout(() => setCopiedScriptNotice(false), 3000);
      }
    } catch {
      // Clipboard write may be restricted
    }
  };

  const handleDownloadAppsScript = () => {
    const blob = new Blob([appsScriptCode], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CommittedPaymentsSync.gs';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-data-title"
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="manage-data-title" className="text-lg font-bold text-slate-900">
              Manage Report Data
            </h2>
            <p className="text-xs text-slate-500">
              Connect live Google Sheets, sync Committed Payments, upload CSV, or adjust figures
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Manage Data drawer"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="border-b border-slate-200 px-6 py-3 bg-slate-50/70">
          <div role="tablist" aria-label="Data Input Mode" className="inline-flex flex-wrap rounded-lg bg-slate-200/70 p-1 gap-0.5">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'sheets'}
              onClick={() => {
                setActiveTab('sheets');
                setFormErrors([]);
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'sheets'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span>Live AR Sheet</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'commitments'}
              onClick={() => {
                setActiveTab('commitments');
                setFormErrors([]);
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'commitments'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarCheck className="h-3.5 w-3.5 text-[#9E8418]" aria-hidden="true" />
              <span>Committed Payments</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'csv'}
              onClick={() => {
                setActiveTab('csv');
                setFormErrors([]);
              }}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'csv'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AppSheet CSV
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'manual'}
              onClick={() => {
                setActiveTab('manual');
                setFormErrors([]);
              }}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manual Figures
            </button>
          </div>
        </div>

        {/* Error Box */}
        {formErrors.length > 0 && (
          <div
            role="alert"
            className="mx-6 mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900"
          >
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
              <span>Please fix the following before applying:</span>
            </div>
            <ul className="mt-1.5 list-disc pl-6 space-y-0.5">
              {formErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'sheets' ? (
            <form id="live-sheets-form" onSubmit={handleConnectLiveSheetSubmit} className="space-y-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 leading-relaxed space-y-2">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Link2 className="h-4 w-4 text-[#9E8418]" aria-hidden="true" />
                  <span>Automatic Read-Only AppSheet → Google Sheets Sync</span>
                </p>
                <p>
                  Pre-linked to the Main AR Monitoring Spreadsheet and synced automatically on every
                  app open for both Admin and Public Viewers.
                </p>
                <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50/80 px-2.5 py-2 text-[11px] text-emerald-950">
                  <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold">Strictly Read-Only Source:</strong>{' '}
                    <code className="font-mono">{DEFAULT_MAIN_AR_SPREADSHEET_ID}</code> (GID{' '}
                    <code className="font-mono">{DEFAULT_MAIN_AR_SHEET_GID}</code>) is only ever read
                    and will never be modified, edited, or have rows deleted.
                  </span>
                </div>
              </div>

              {/* Step 1: Google Sign In */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Step 1 · Google Workspace Access
                    </span>
                    <p className="text-xs text-slate-700 mt-0.5">
                      {hasAccessToken && authUser
                        ? `Connected as ${authUser.displayName || authUser.email}`
                        : 'Optional for live OAuth polling: Sign in with read-only spreadsheets access.'}
                    </p>
                  </div>
                  {hasAccessToken && authUser && (
                    <button
                      type="button"
                      onClick={() => void onGoogleSignOut()}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Sign out</span>
                    </button>
                  )}
                </div>

                {!hasAccessToken && (
                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <GoogleSignInButton
                      onClick={() => void onGoogleSignIn()}
                      disabled={isLoggingIn}
                      label={isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
                    />
                    {sheetConfig?.spreadsheetId && (
                      <span className="text-[11px] text-slate-600">
                        Default spreadsheet pre-loaded; background auto-sync runs on every load.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Spreadsheet URL / ID & Tab Picker */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Step 2 · Linked Source Spreadsheet (Read-Only)
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-slate-600">
                    GID: {sheetConfig?.sheetGid ?? DEFAULT_MAIN_AR_SHEET_GID}
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="google-sheet-url"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Main AR Monitoring Spreadsheet URL or ID (Read-Only)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="google-sheet-url"
                      type="text"
                      value={sheetUrlInput}
                      onChange={(e) => {
                        setSheetUrlInput(e.target.value);
                        setFormErrors([]);
                      }}
                      placeholder={DEFAULT_MAIN_AR_SPREADSHEET_ID}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void handleLoadTabs()}
                      disabled={isLoadingTabs || !hasAccessToken}
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                    >
                      {isLoadingTabs ? 'Loading...' : 'Load Tabs'}
                    </button>
                  </div>
                </div>

                {discoveredTabs.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="google-sheet-tab"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Worksheet Tab {discoveredTitle ? `(${discoveredTitle})` : ''}
                      </label>
                      <select
                        id="google-sheet-tab"
                        value={selectedSheetTab}
                        onChange={(e) => setSelectedSheetTab(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none cursor-pointer"
                      >
                        {discoveredTabs.map((tab) => (
                          <option key={tab.sheetId} value={tab.title}>
                            {tab.title} (GID {tab.sheetId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="poll-interval-select"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Auto-Refresh Interval
                      </label>
                      <select
                        id="poll-interval-select"
                        value={pollIntervalSec}
                        onChange={(e) => setPollIntervalSec(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none cursor-pointer"
                      >
                        <option value={15}>Every 15 seconds (Near Real-Time)</option>
                        <option value={30}>Every 30 seconds (Recommended)</option>
                        <option value={60}>Every 60 seconds</option>
                        <option value={300}>Every 5 minutes</option>
                        <option value={0}>On page load only</option>
                      </select>
                    </div>
                  </div>
                )}

                {discoveredTabs.length === 0 && (
                  <div>
                    <label
                      htmlFor="poll-interval-select-default"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Auto-Refresh Interval
                    </label>
                    <select
                      id="poll-interval-select-default"
                      value={pollIntervalSec}
                      onChange={(e) => setPollIntervalSec(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none cursor-pointer"
                    >
                      <option value={15}>Every 15 seconds (Near Real-Time)</option>
                      <option value={30}>Every 30 seconds (Recommended)</option>
                      <option value={60}>Every 60 seconds</option>
                      <option value={300}>Every 5 minutes</option>
                      <option value={0}>On page load only</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Active Connection & Optional Manual Force Refresh Card */}
              {sheetConfig && (
                <div
                  data-testid="live-sheet-status-card"
                  className={`rounded-lg border p-3.5 text-xs ${
                    syncStatus === 'error'
                      ? 'border-red-200 bg-red-50 text-red-900'
                      : syncStatus === 'live' || syncStatus === 'syncing'
                        ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                        : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {sheetConfig.spreadsheetTitle} · {sheetConfig.sheetTitle}
                      </p>
                      <p className="text-[11px] opacity-85 mt-0.5 tabular-nums">
                        {syncStatus === 'syncing'
                          ? 'Fetching latest read-only AR rows...'
                          : syncStatus === 'live'
                            ? `Auto-sync active${
                                activePollInterval > 0
                                  ? ` · Background refresh every ${activePollInterval}s`
                                  : ''
                              }${lastSyncedAt ? ` · Last synced ${lastSyncedAt}` : ''}`
                            : `Pre-linked GID ${sheetConfig.sheetGid ?? DEFAULT_MAIN_AR_SHEET_GID}${
                                lastSyncedAt ? ` · Last checked ${lastSyncedAt}` : ''
                              }`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-testid="force-refresh-ar-btn"
                        onClick={() => void onSyncNow()}
                        disabled={syncStatus === 'syncing'}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
                          aria-hidden="true"
                        />
                        <span>Force Refresh</span>
                      </button>
                      <button
                        type="button"
                        onClick={onDisconnectLiveSheet}
                        className="rounded-md px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/70 hover:text-slate-900 cursor-pointer"
                      >
                        Reset Default
                      </button>
                    </div>
                  </div>
                  {syncError && syncStatus === 'error' && (
                    <p className="mt-2 text-[11px] font-medium text-red-800">{syncError}</p>
                  )}
                </div>
              )}
            </form>
          ) : activeTab === 'commitments' ? (
            <form
              id="commitments-sync-form"
              onSubmit={handleSaveCommitmentsSyncSubmit}
              className="space-y-4"
            >
              <div className="rounded-lg border border-slate-200 bg-[#FAF6DD]/70 p-3.5 text-xs text-slate-700 leading-relaxed space-y-2">
                <p className="font-semibold text-slate-950 flex items-center gap-1.5">
                  <CalendarCheck className="h-4 w-4 text-[#9E8418]" aria-hidden="true" />
                  <span>Committed Payments Two-Way Google Sheet Sync</span>
                </p>
                <p>
                  Payment commitments append exclusively to the dedicated{' '}
                  <code className="font-mono text-[11px] font-semibold">COMMITTED_PAYMENTS</code>{' '}
                  dump spreadsheet. Paid invoices detected in the read-only Main AR Monitoring
                  sheet are auto-deleted solely from the Committed Payments spreadsheet.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Step 1 · Dual-Spreadsheet &amp; Webhook Config
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                    {commitments.length} active {commitments.length === 1 ? 'commitment' : 'commitments'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="commitment-source-sheet-id"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Main AR Monitoring Spreadsheet ID (Strictly Read-Only)
                    </label>
                    <span className="font-mono text-[10.5px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                      Read-Only · GID {sourceGid}
                    </span>
                  </div>
                  <input
                    id="commitment-source-sheet-id"
                    type="text"
                    value={commitmentSourceIdInput}
                    onChange={(e) => setCommitmentSourceIdInput(e.target.value)}
                    placeholder={DEFAULT_MAIN_AR_SOURCE_SPREADSHEET_ID}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Never modified or deleted from. Used exclusively to check invoice payment status.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="commitment-target-sheet-id"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Committed Payments Dump Spreadsheet ID (Appends &amp; Auto-Deletes)
                    </label>
                    <span className="font-mono text-[10.5px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                      Write Target · GID {targetGid}
                    </span>
                  </div>
                  <input
                    id="commitment-target-sheet-id"
                    type="text"
                    value={commitmentTargetIdInput}
                    onChange={(e) => setCommitmentTargetIdInput(e.target.value)}
                    placeholder={DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Rows are written here and auto-deleted exclusively from this sheet when settled.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="commitment-webhook-url"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Google Apps Script Web App URL (<code className="font-mono">/exec</code>)
                  </label>
                  <input
                    id="commitment-webhook-url"
                    type="url"
                    value={commitmentWebhookInput}
                    onChange={(e) => {
                      setCommitmentWebhookInput(e.target.value);
                      setFormErrors([]);
                    }}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Deploy the pre-configured script below in spreadsheet{' '}
                    <code className="font-mono">{DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID}</code> and
                    paste its <code className="font-mono">/exec</code> URL here.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    data-testid="force-refresh-commitments-btn"
                    onClick={() => void onSyncCommitments()}
                    disabled={commitmentSyncStatus === 'syncing'}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        commitmentSyncStatus === 'syncing' ? 'animate-spin' : ''
                      }`}
                      aria-hidden="true"
                    />
                    <span>Force Cross-Sheet Cleanup &amp; Sync</span>
                  </button>

                  {committedPaymentsConfig.webhookUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCommitmentWebhookInput('');
                        void onSaveCommittedPaymentsConfig({
                          webhookUrl: '',
                          sourceSpreadsheetId: resolvedSourceId,
                          sourceSheetGid: sourceGid,
                          targetSpreadsheetId: resolvedTargetId,
                          targetSheetGid: targetGid,
                        });
                      }}
                      className="text-xs font-semibold text-rose-700 hover:text-rose-900 cursor-pointer"
                    >
                      Disconnect Webhook
                    </button>
                  )}
                </div>

                {commitmentSyncWarning && (
                  <p className="rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900">
                    {commitmentSyncWarning}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Step 2 · Standalone Google Apps Script
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Columns:{' '}
                      <span className="font-medium text-slate-800">
                        {COMMITTED_PAYMENTS_COLUMNS.join(' · ')}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopyAppsScript()}
                      className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                    >
                      <Copy className="h-3 w-3" aria-hidden="true" />
                      <span>{copiedScriptNotice ? 'Copied!' : 'Copy Script'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadAppsScript}
                      className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                    >
                      <Download className="h-3 w-3" aria-hidden="true" />
                      <span>Download .gs</span>
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  aria-label="Google Apps Script source code"
                  rows={10}
                  value={appsScriptCode}
                  spellCheck={false}
                  className="w-full rounded-lg border border-slate-300 bg-slate-950 p-3 font-mono text-[10.5px] leading-relaxed text-slate-100 focus:outline-none"
                />
              </div>
            </form>
          ) : activeTab === 'csv' ? (
            <div className="space-y-4">
              {/* Format Info Banner */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
                <div className="flex items-center justify-between gap-2 font-semibold text-slate-800">
                  <span className="inline-flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-slate-600" aria-hidden="true" />
                    <span>AppSheet AR Monitoring Format</span>
                  </span>
                  {data.sourceActiveRowCount ? (
                    <span className="font-mono text-[11px] font-medium text-slate-500 tabular-nums">
                      Active dataset: {data.sourceActiveRowCount.toLocaleString('en-US')} rows
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 leading-relaxed">
                  Expects the 30-column AppSheet export including{' '}
                  <code className="font-mono text-[11px] font-semibold text-slate-800">AR TAG</code>,{' '}
                  <code className="font-mono text-[11px] font-semibold text-slate-800">BILLED AMOUNT</code>,{' '}
                  <code className="font-mono text-[11px] font-semibold text-slate-800">COLLECTION</code>,{' '}
                  <code className="font-mono text-[11px] font-semibold text-slate-800">OR DATE</code>,{' '}
                  <code className="font-mono text-[11px] font-semibold text-slate-800">CATEGORY</code>,{' '}
                  <code className="font-mono text-[11px] font-semibold text-slate-800">AREA MANAGER</code>, and{' '}
                  <code className="font-mono text-[11px] font-semibold text-slate-800">AGING</code>.
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="csv-upload-input"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Upload .CSV File</span>
                    <input
                      id="csv-upload-input"
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleLoadCurrentSourceFile}
                    disabled={isLoadingSourceFile}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                  >
                    <span>
                      {isLoadingSourceFile ? 'Loading...' : 'Load Active AppSheet CSV'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleInsertSampleTemplate}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                  >
                    Insert Sample
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                  >
                    <Download className="h-3 w-3" aria-hidden="true" />
                    <span>Download Template</span>
                  </button>
                </div>
              </div>

              {/* Live Parse Preview Card */}
              {livePreview?.ok && livePreview.stats && (
                <div
                  data-testid="csv-parse-preview"
                  className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 font-semibold text-emerald-900">
                    <span>
                      {uploadedFileName
                        ? `Ready to import: ${uploadedFileName}`
                        : 'AppSheet CSV parsed cleanly'}
                    </span>
                    <span className="font-mono tabular-nums">
                      {livePreview.stats.activeRows.toLocaleString('en-US')} active rows
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 border-t border-emerald-200/80 pt-2 font-mono text-[11px] tabular-nums text-emerald-950">
                    <div>
                      <span className="block text-[10px] font-sans text-emerald-700">Billed</span>
                      <strong>{formatPeso(livePreview.stats.totalBilling)}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] font-sans text-emerald-700">Collected</span>
                      <strong>{formatPeso(livePreview.stats.totalCollections)}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] font-sans text-emerald-700">Open AR</span>
                      <strong>{formatPeso(livePreview.stats.arBalance)}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="csv-textarea" className="block text-xs font-medium text-slate-700">
                    {isLargeFileLoaded
                      ? `Previewing first 12 lines of ${uploadedFileName || 'uploaded CSV'} (${csvRawContent.split(/\r?\n/).length.toLocaleString('en-US')} lines total)`
                      : 'Paste AppSheet AR Monitoring CSV Content'}
                  </label>
                  {csvRawContent && (
                    <button
                      type="button"
                      onClick={() => {
                        setCsvRawContent('');
                        setUploadedFileName(null);
                        setFormErrors([]);
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  id="csv-textarea"
                  rows={11}
                  value={textareaDisplayValue}
                  readOnly={isLargeFileLoaded}
                  placeholder={APPSHEET_CSV_HEADERS.join(',')}
                  onChange={(e) => {
                    if (!isLargeFileLoaded) {
                      setCsvRawContent(e.target.value);
                      setUploadedFileName(null);
                      setFormErrors([]);
                    }
                  }}
                  spellCheck={false}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <form id="manual-data-form" onSubmit={handleManualSubmit} className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 mb-3">
                  YTD September Portfolio (PHP)
                </h3>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ytd-sep-billing" className="block text-xs font-medium text-slate-700 mb-1">
                      YTD Sep Billing
                    </label>
                    <input
                      id="ytd-sep-billing"
                      type="text"
                      inputMode="decimal"
                      value={ytdSepBilling}
                      onChange={(e) => setYtdSepBilling(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="ytd-sep-collections" className="block text-xs font-medium text-slate-700 mb-1">
                      YTD Sep Collections
                    </label>
                    <input
                      id="ytd-sep-collections"
                      type="text"
                      inputMode="decimal"
                      value={ytdSepCollections}
                      onChange={(e) => setYtdSepCollections(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 mb-3">
                  October AR Portfolio (PHP)
                </h3>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="oct-ar-billing" className="block text-xs font-medium text-slate-700 mb-1">
                      October AR Billing
                    </label>
                    <input
                      id="oct-ar-billing"
                      type="text"
                      inputMode="decimal"
                      value={octArBilling}
                      onChange={(e) => setOctArBilling(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="oct-ar-collections" className="block text-xs font-medium text-slate-700 mb-1">
                      October AR Collections
                    </label>
                    <input
                      id="oct-ar-collections"
                      type="text"
                      inputMode="decimal"
                      value={octArCollections}
                      onChange={(e) => setOctArCollections(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="prior-month-eff" className="block text-xs font-medium text-slate-700 mb-1">
                  Prior Month (Sep) Efficiency (%)
                </label>
                <input
                  id="prior-month-eff"
                  type="text"
                  inputMode="decimal"
                  value={priorMonthEfficiency}
                  onChange={(e) => setPriorMonthEfficiency(e.target.value)}
                  className="w-44 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="border-t border-slate-200 pt-5">
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 mb-3">
                  Post-Sept Recovery Flow (Oct 1 – Nov {novEndDay})
                </h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="rec-oct-sep" className="block text-xs font-medium text-slate-700 mb-1">
                      Oct 1–31 Collection (YTD Sep AR)
                    </label>
                    <input
                      id="rec-oct-sep"
                      type="text"
                      inputMode="decimal"
                      value={oct1To31SepAr}
                      onChange={(e) => setOct1To31SepAr(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="rec-nov-sep" className="block text-xs font-medium text-slate-700 mb-1">
                      Nov 1–{novEndDay} Collection (YTD Sep AR)
                    </label>
                    <input
                      id="rec-nov-sep"
                      type="text"
                      inputMode="decimal"
                      value={nov1To9SepAr}
                      onChange={(e) => setNov1To9SepAr(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="rec-oct-ar" className="block text-xs font-medium text-slate-700 mb-1">
                      Collection (Oct &amp; Nov AR)
                    </label>
                    <input
                      id="rec-oct-ar"
                      type="text"
                      inputMode="decimal"
                      value={collectionOctAr}
                      onChange={(e) => setCollectionOctAr(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              onResetBaseline();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Baseline</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 cursor-pointer"
            >
              Cancel
            </button>
            {activeTab === 'sheets' ? (
              <button
                type="submit"
                form="live-sheets-form"
                disabled={isLoadingTabs || syncStatus === 'syncing'}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Connect & Sync Now'}</span>
              </button>
            ) : activeTab === 'commitments' ? (
              <button
                type="submit"
                form="commitments-sync-form"
                disabled={isSavingCommitConfig || commitmentSyncStatus === 'syncing'}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isSavingCommitConfig ? 'Saving...' : 'Save Sync Settings'}</span>
              </button>
            ) : activeTab === 'manual' ? (
              <button
                type="submit"
                form="manual-data-form"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Apply Updates</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCSVApply}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Import CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
