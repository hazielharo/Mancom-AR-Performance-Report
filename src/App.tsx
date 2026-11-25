import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { Eye, EyeOff } from 'lucide-react';
import { BASELINE_AR_DATA } from './data/baselineData';
import { ARReportData } from './types/arReport';
import { buildEmailDraft, computeARMetrics, parseARReportCSV } from './utils/arCalculations';
import { buildAllReportSheets, buildSupplementalArSheet, downloadAllSheetsXLSX, ReportSheet } from './utils/reportSheets';
import { exportReportSlidesToPdf, formatReportPdfFilename } from './utils/pdfExport';
import { exportReportSlidesToPpt, formatReportPptFilename } from './utils/pptExport';
import {
  clearSavedPageLayout,
  DEFAULT_PAGE_LAYOUT,
  DEFAULT_PAGE_ORDER,
  deletePageFromLayout,
  isDefaultPageLayout,
  loadSavedPageLayout,
  orderReportPages,
  reorderPageIds,
  ReportPageLayout,
  savePageLayout,
  togglePageHiddenInLayout,
} from './utils/pageOrder';
import {
  canWriteLayoutToFirestore,
  fetchServerReportLayout,
  requestServerAdminToken,
  saveGlobalLayoutToFirestore,
  saveServerReportLayout,
  subscribeGlobalLayoutFromFirestore,
  testFirestoreConnection,
} from './utils/firestoreLayout';
import {
  clearCachedAccessToken,
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
} from './utils/googleAuth';
import {
  computeSheetFingerprint,
  DEFAULT_LIVE_SHEET_CONFIG,
  DEFAULT_MAIN_AR_SHEET_TITLE,
  DEFAULT_MAIN_AR_SHEET_GID,
  DEFAULT_MAIN_AR_SPREADSHEET_ID,
  fetchPublicSheetCsv,
  fetchSpreadsheetMetadata,
  fetchSheetValues,
  GoogleSheetsApiError,
  LiveSheetConfig,
  LiveSyncStatus,
  pickDefaultSheetTab,
  saveServerLiveArSnapshot,
  SheetTabInfo,
  sheetValuesToCSV,
  startSheetRefresh,
  SUPPLEMENTAL_AR_SHEET_GID,
} from './utils/googleSheets';
import { ReportShellHeader, REPORT_PAGES } from './components/ReportShellHeader';
import { ReportSidebar } from './components/ReportSidebar';
import { CoverPage } from './components/pages/CoverPage';
import { PerformanceSummaryPage } from './components/pages/PerformanceSummaryPage';
import { PortfolioManagersPage } from './components/pages/PortfolioManagersPage';
import { AgingSummaryPage } from './components/pages/AgingSummaryPage';
import { CohortEfficiencyPage } from './components/pages/CohortEfficiencyPage';
import { BalanceBreakdownPage } from './components/pages/BalanceBreakdownPage';
import { ComparativeReportPage } from './components/pages/ComparativeReportPage';
import { DataSheetsPage } from './components/pages/DataSheetsPage';
import { DrawerTab, ManageDataDrawer } from './components/ManageDataDrawer';
import { ExportSummaryModal } from './components/ExportSummaryModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import {
  clearStoredAdminSession,
  loadStoredAdminSession,
  resolveAdminSessionState,
  saveStoredAdminSession,
} from './utils/adminAuth';
import {
  CommittedPaymentsConfig,
  CommitmentSyncStatus,
  DEFAULT_COMMITTED_PAYMENTS_CONFIG,
  DEFAULT_COMMITTED_PAYMENTS_SHEET_GID,
  DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID,
  deleteCommittedPayment,
  fetchCommittedPayments,
  parseCommittedPaymentsCsv,
  PaymentCommitmentRecord,
  prunePaidCommitmentRecords,
  runCommittedPaymentsCleanup,
  saveCommittedPaymentsConfig,
  UpsertCommitmentInput,
  upsertCommittedPayment,
} from './utils/paymentCommitments';

const STORAGE_KEY = 'mancom_ar_custom_data_v4';
const RAW_CSV_STORAGE_KEY = 'mancom_ar_custom_csv_v4';
const LIVE_SHEET_CONFIG_KEY = 'mancom_ar_sheet_config_v1';

function formatSyncTimestamp(isoOrDate?: string): string {
  const dt = isoOrDate ? new Date(isoOrDate) : new Date();
  const target = Number.isNaN(dt.getTime()) ? new Date() : dt;
  return target.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function loadInitialData(): { data: ARReportData; isCustom: boolean; rawCsv: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const savedCsv = localStorage.getItem(RAW_CSV_STORAGE_KEY) ?? '';
    if (!raw) return { data: BASELINE_AR_DATA, isCustom: false, rawCsv: '' };
    const parsed = JSON.parse(raw) as ARReportData;
    if (
      typeof parsed?.ytdSepBilling === 'number' &&
      typeof parsed?.octArBilling === 'number' &&
      parsed?.recoveryFlows &&
      Array.isArray(parsed?.managerSummaries)
    ) {
      if (
        (!parsed.openInvoices ||
          (parsed.openInvoices.length > 0 && parsed.openInvoices[0].particulars === undefined)) &&
        savedCsv
      ) {
        const rehydrated = parseARReportCSV(savedCsv, BASELINE_AR_DATA, parsed.lastUpdated);
        if (rehydrated.ok && rehydrated.data) {
          return { data: rehydrated.data, isCustom: true, rawCsv: savedCsv };
        }
      }
      return { data: parsed, isCustom: true, rawCsv: savedCsv };
    }
  } catch {
    // Fall back to baseline data
  }
  return { data: BASELINE_AR_DATA, isCustom: false, rawCsv: '' };
}

function loadSavedSheetConfig(): LiveSheetConfig {
  try {
    const raw = localStorage.getItem(LIVE_SHEET_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LiveSheetConfig;
      if (parsed?.spreadsheetId && parsed?.sheetTitle) {
        return {
          ...parsed,
          sheetGid:
            typeof parsed.sheetGid === 'number'
              ? parsed.sheetGid
              : parsed.spreadsheetId === DEFAULT_MAIN_AR_SPREADSHEET_ID
                ? DEFAULT_MAIN_AR_SHEET_GID
                : undefined,
        };
      }
    }
  } catch {
    // Ignore invalid stored config
  }
  return DEFAULT_LIVE_SHEET_CONFIG;
}

export default function App() {
  const initial = useMemo(() => loadInitialData(), []);
  const savedConfig = useMemo(() => loadSavedSheetConfig(), []);

  const [reportData, setReportData] = useState<ARReportData>(initial.data);
  const [rawCsvText, setRawCsvText] = useState<string>(initial.rawCsv);
  const [isCustomData, setIsCustomData] = useState<boolean>(initial.isCustom);
  const [activePage, setActivePage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');
  const [targetBenchmark, setTargetBenchmark] = useState<number>(
    BASELINE_AR_DATA.defaultTargetBenchmark
  );
  const [isManageDrawerOpen, setIsManageDrawerOpen] = useState(false);
  const [manageDrawerTab, setManageDrawerTab] = useState<DrawerTab>('sheets');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [verifiedAdminEmail, setVerifiedAdminEmail] = useState<string | null>(() =>
    loadStoredAdminSession()
  );
  const [isPublicPreview, setIsPublicPreview] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [pageLayout, setPageLayout] = useState<ReportPageLayout>(() => loadSavedPageLayout());
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [pdfExportError, setPdfExportError] = useState<string | null>(null);
  const [emailDraftNotice, setEmailDraftNotice] = useState<string | null>(null);
  const emailNoticeTimerRef = useRef<number | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const adminTokenRef = useRef<string | null>(null);
  const pageLayoutRef = useRef<ReportPageLayout>(pageLayout);
  pageLayoutRef.current = pageLayout;

  // Firebase Auth & Live Google Sheets State (accessToken cached in memory only)
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getAccessToken());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [sheetConfig, setSheetConfig] = useState<LiveSheetConfig | null>(savedConfig);
  const [syncStatus, setSyncStatus] = useState<LiveSyncStatus>('syncing');
  const [autoSyncStatus, setAutoSyncStatus] = useState<'syncing' | 'synced' | 'paused' | 'error'>('syncing');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const isSyncingRef = useRef(false);
  const lastFingerprintRef = useRef<string | null>(null);
  const publicArRequestRef = useRef<{ controller: AbortController; signal: AbortSignal } | null>(null);
  const publicArCsvRef = useRef<string | null>(null);
  const supplementalCsvRef = useRef<string | null>(null);
  const paymentsCsvRef = useRef<string | null>(null);
  const [supplementalSheet, setSupplementalSheet] = useState<ReportSheet | null>(null);
  const [publicCommitments, setPublicCommitments] = useState<PaymentCommitmentRecord[] | null>(null);
  const reportDataRef = useRef<ARReportData>(reportData);
  reportDataRef.current = reportData;

  // Committed Payments state & Google Apps Script two-way sync
  const [commitments, setCommitments] = useState<PaymentCommitmentRecord[]>([]);
  const displayedCommitments = publicCommitments ?? commitments;
  const [committedPaymentsConfig, setCommittedPaymentsConfig] =
    useState<CommittedPaymentsConfig>(DEFAULT_COMMITTED_PAYMENTS_CONFIG);
  const [commitmentSyncStatus, setCommitmentSyncStatus] =
    useState<CommitmentSyncStatus>('local_only');
  const [commitmentSyncWarning, setCommitmentSyncWarning] = useState<string | null>(null);
  const commitmentsRef = useRef<PaymentCommitmentRecord[]>(commitments);
  commitmentsRef.current = commitments;

  const applyCommitmentStoreResponse = useCallback(
    (resp: {
      commitments: PaymentCommitmentRecord[];
      config: CommittedPaymentsConfig;
      sheetSynced: boolean;
      warning?: string;
    }) => {
      setCommitments(resp.commitments);
      setCommittedPaymentsConfig(resp.config);
      setCommitmentSyncWarning(resp.warning ?? null);
      if (!resp.config.webhookUrl) {
        setCommitmentSyncStatus('local_only');
      } else {
        setCommitmentSyncStatus(resp.sheetSynced ? 'synced' : 'error');
      }
    },
    []
  );

  // Hydrate committed payments from backend & remote Google Sheet on mount
  useEffect(() => {
    let cancelled = false;
    void fetchCommittedPayments()
      .then((resp) => {
        if (!cancelled) applyCommitmentStoreResponse(resp);
      })
      .catch(() => {
        // Keep empty fallback if offline
      });
    return () => {
      cancelled = true;
    };
  }, [applyCommitmentStoreResponse]);

  // Auto-remove any committed BI whose remaining balance is now <= 0 whenever openInvoices updates
  useEffect(() => {
    if (!adminTokenRef.current) return;
    const openInvs = reportData.openInvoices;
    if (!openInvs || openInvs.length === 0) return;
    if (commitmentsRef.current.length === 0) return;

    const { removedBiNumbers } = prunePaidCommitmentRecords(commitmentsRef.current, openInvs);
    if (removedBiNumbers.length === 0) return;

    const openBiNumbers = openInvs.filter((i) => i.remainingBalance > 0.005).map((i) => i.biNumber);
    void runCommittedPaymentsCleanup(openBiNumbers)
      .then((resp) => applyCommitmentStoreResponse(resp))
      .catch(() => {});
  }, [reportData.openInvoices, applyCommitmentStoreResponse]);

  const handleUpsertCommitment = useCallback(
    async (input: UpsertCommitmentInput) => {
      setCommitmentSyncStatus('syncing');
      const resp = await upsertCommittedPayment(input);
      applyCommitmentStoreResponse(resp);
    },
    [applyCommitmentStoreResponse]
  );

  const handleDeleteCommitment = useCallback(
    async (biNumber: string) => {
      setCommitmentSyncStatus('syncing');
      const resp = await deleteCommittedPayment(biNumber);
      applyCommitmentStoreResponse(resp);
    },
    [applyCommitmentStoreResponse]
  );

  const handleSyncCommitments = useCallback(async () => {
    setCommitmentSyncStatus('syncing');
    const openBiNumbers =
      reportDataRef.current.openInvoices
        ?.filter((i) => i.remainingBalance > 0.005)
        .map((i) => i.biNumber) ?? undefined;
    const resp = await runCommittedPaymentsCleanup(openBiNumbers);
    applyCommitmentStoreResponse(resp);
  }, [applyCommitmentStoreResponse]);

  const handleSaveCommittedPaymentsConfig = useCallback(
    async (config: CommittedPaymentsConfig) => {
      setCommitmentSyncStatus('syncing');
      const resp = await saveCommittedPaymentsConfig(config);
      applyCommitmentStoreResponse(resp);
    },
    [applyCommitmentStoreResponse]
  );

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setAuthUser(user);
        setAccessToken(token);
      },
      (user) => {
        setAuthUser(user);
        setAccessToken(null);
        setSyncStatus((prev) =>
          sheetConfig ? 'auth_required' : prev === 'disconnected' ? 'disconnected' : 'disconnected'
        );
      }
    );
    return () => unsubscribe();
  }, [sheetConfig]);

  // Global Report Layout initialization & real-time synchronization for all viewers
  useEffect(() => {
    let cancelled = false;
    void testFirestoreConnection();

    void fetchServerReportLayout().then((serverLayout) => {
      if (cancelled || !serverLayout) return;
      if (serverLayout.updatedAtMs >= pageLayoutRef.current.updatedAtMs) {
        setPageLayout(serverLayout);
        savePageLayout(serverLayout);
      }
    });

    const unsubFirestore = subscribeGlobalLayoutFromFirestore((firestoreLayout) => {
      if (cancelled) return;
      if (firestoreLayout.updatedAtMs >= pageLayoutRef.current.updatedAtMs) {
        setPageLayout(firestoreLayout);
        savePageLayout(firestoreLayout);
      }
    });

    return () => {
      cancelled = true;
      unsubFirestore();
    };
  }, []);

  const refreshPublicAr = useCallback(async (force = false, signal?: AbortSignal) => {
    if (!force && reportDataRef.current.sourceFormat === 'manual') {
      setSyncStatus('disconnected');
      setAutoSyncStatus('paused');
      return;
    }
    if (publicArRequestRef.current && !publicArRequestRef.current.signal.aborted) {
      if (!force) return;
      publicArRequestRef.current.controller.abort();
    }
    const controller = new AbortController();
    const requestSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
    publicArRequestRef.current = { controller, signal: requestSignal };
    if (force) {
      setAutoSyncStatus('syncing');
      setSyncStatus('syncing');
      setSyncError(null);
    }
    try {
      const csv = await fetchPublicSheetCsv(DEFAULT_MAIN_AR_SPREADSHEET_ID, DEFAULT_MAIN_AR_SHEET_GID, requestSignal);
      if (requestSignal.aborted) return;
      if (!force && reportDataRef.current.sourceFormat === 'manual') return;

      if (force || csv !== publicArCsvRef.current) {
        const syncedLabel = formatSyncTimestamp();
        const parsed = parseARReportCSV(csv, BASELINE_AR_DATA, syncedLabel);
        if (!parsed.ok || !parsed.data) {
          throw new Error(parsed.errors[0] ?? 'The live export is not an AR Monitoring CSV.');
        }
        publicArCsvRef.current = csv;
        setRawCsvText(csv);
        setReportData(parsed.data);
        setIsCustomData(false);
        setLastSyncedAt(syncedLabel);
        if (force) {
          try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(RAW_CSV_STORAGE_KEY);
          } catch {}
        }
      }
      setSyncStatus('live');
      setSyncError(null);
      setAutoSyncStatus('synced');
    } catch (error) {
      if (requestSignal.aborted || (!force && (publicArCsvRef.current !== null || reportDataRef.current.sourceFormat === 'manual'))) return;
      setSyncStatus('error');
      setAutoSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'Unable to read the live AR sheet.');
    } finally {
      if (publicArRequestRef.current?.controller === controller) publicArRequestRef.current = null;
    }
  }, []);

  const refreshSupplementalSheets = useCallback(async (signal?: AbortSignal) => {
    await Promise.allSettled([
      fetchPublicSheetCsv(DEFAULT_MAIN_AR_SPREADSHEET_ID, SUPPLEMENTAL_AR_SHEET_GID, signal).then((csv) => {
        if (signal?.aborted || csv === supplementalCsvRef.current) return;
        const sheet = buildSupplementalArSheet(csv);
        supplementalCsvRef.current = csv;
        setSupplementalSheet(sheet);
      }),
      fetchPublicSheetCsv(DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID, DEFAULT_COMMITTED_PAYMENTS_SHEET_GID, signal).then((csv) => {
        if (signal?.aborted || csv === paymentsCsvRef.current) return;
        const records = parseCommittedPaymentsCsv(csv);
        paymentsCsvRef.current = csv;
        setPublicCommitments(records);
      }),
    ]);
  }, []);

  const usePublicAr = !accessToken || !sheetConfig;
  useEffect(() => {
    return startSheetRefresh((signal) => Promise.all([
      usePublicAr ? refreshPublicAr(false, signal) : undefined,
      refreshSupplementalSheets(signal),
    ]));
  }, [usePublicAr, refreshPublicAr, refreshSupplementalSheets]);

  const applyDataToState = useCallback((updated: ARReportData, uploadedCsv?: string) => {
    reportDataRef.current = updated;
    publicArCsvRef.current = null;
    if (updated.sourceFormat === 'manual') {
      setSyncStatus('disconnected');
      setAutoSyncStatus('paused');
    }
    setReportData(updated);
    setIsCustomData(true);
    const nextCsv = uploadedCsv ?? '';
    setRawCsvText(nextCsv);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (nextCsv) {
        localStorage.setItem(RAW_CSV_STORAGE_KEY, nextCsv);
      } else {
        localStorage.removeItem(RAW_CSV_STORAGE_KEY);
      }
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const syncLiveSheet = useCallback(
    async (
      configToSync: LiveSheetConfig,
      tokenOverride?: string | null,
      forceApply = false,
      signal?: AbortSignal
    ) => {
      if (!forceApply && reportDataRef.current.sourceFormat === 'manual') return;
      const token = tokenOverride ?? accessToken ?? getAccessToken();
      if (!token) {
        setSyncStatus('auth_required');
        return;
      }
      if (isSyncingRef.current) return;

      isSyncingRef.current = true;
      if (forceApply) {
        setSyncStatus('syncing');
        setAutoSyncStatus('syncing');
        setSyncError(null);
      }

      try {
        const values = await fetchSheetValues(
          configToSync.spreadsheetId,
          configToSync.sheetTitle,
          token,
          signal
        );
        if (signal?.aborted || (!forceApply && reportDataRef.current.sourceFormat === 'manual')) return;
        const fingerprint = computeSheetFingerprint(values);
        const nowTs = formatSyncTimestamp();

        if (forceApply || fingerprint !== lastFingerprintRef.current) {
          const csv = sheetValuesToCSV(values);
          const parsed = parseARReportCSV(csv, reportDataRef.current, nowTs);
          if (!parsed.ok || !parsed.data) {
            throw new Error(
              parsed.errors[0] ||
                `Worksheet "${configToSync.sheetTitle}" does not match the AR Monitoring columns.`
            );
          }
          lastFingerprintRef.current = fingerprint;
          applyDataToState(parsed.data, csv);
          setLastSyncedAt(nowTs);

          if (adminTokenRef.current) {
            void saveServerLiveArSnapshot(
              {
                csv,
                syncedAt: new Date().toISOString(),
                spreadsheetId: configToSync.spreadsheetId,
                sheetGid: configToSync.sheetGid,
              },
              adminTokenRef.current
            );
          }
        }

        setSyncStatus('live');
        setSyncError(null);
        setAutoSyncStatus('synced');
      } catch (err: any) {
        if (signal?.aborted) return;
        if (err instanceof GoogleSheetsApiError && (err.status === 401 || err.status === 403)) {
          clearCachedAccessToken();
          setAccessToken(null);
          setSyncStatus('auth_required');
          setSyncError(
            err.status === 401
              ? 'Google session expired. Sign in again to resume real-time sync.'
              : err.message
          );
        } else {
          setSyncStatus('error');
          setSyncError(err?.message || 'Failed to sync rows from Google Sheets.');
        }
        setAutoSyncStatus('error');
        throw err;
      } finally {
        isSyncingRef.current = false;
      }
    },
    [accessToken, applyDataToState]
  );

  useEffect(() => {
    if (!sheetConfig || !accessToken) return;
    return startSheetRefresh(
      (signal) => syncLiveSheet(sheetConfig, accessToken, false, signal),
      sheetConfig.pollIntervalSec,
    );
  }, [sheetConfig, accessToken, syncLiveSheet]);

  const handleSyncNow = async () => {
    await Promise.all([
      accessToken && sheetConfig
        ? syncLiveSheet(sheetConfig, accessToken, true).catch(() => {})
        : refreshPublicAr(true),
      refreshSupplementalSheets(),
    ]);
  };

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setSyncError(null);
    try {
      const result = await googleSignIn();
      setAuthUser(result.user);
      setAccessToken(result.accessToken);
      const idToken = await result.user.getIdToken().catch(() => '');
      if (idToken) {
        const token = await requestServerAdminToken({ idToken });
        if (token) {
          adminTokenRef.current = token;
        }
      }
      if (sheetConfig) {
        await syncLiveSheet(sheetConfig, result.accessToken, true).catch(() => {});
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await logout();
    setAuthUser(null);
    setAccessToken(null);
    setVerifiedAdminEmail(null);
    adminTokenRef.current = null;
    clearStoredAdminSession();
    setSyncStatus(sheetConfig ? 'auth_required' : 'disconnected');
  };

  const adminSession = useMemo(
    () =>
      resolveAdminSessionState({
        googleUserEmail: authUser?.email,
        verifiedEmail: verifiedAdminEmail,
      }),
    [authUser?.email, verifiedAdminEmail]
  );

  const effectiveIsAdmin = adminSession.isAdmin && !isPublicPreview;

  useEffect(() => {
    if (!adminSession.isAdmin) {
      setIsPublicPreview(false);
    }
  }, [adminSession.isAdmin]);

  useEffect(() => {
    if (!effectiveIsAdmin && isManageDrawerOpen) {
      setIsManageDrawerOpen(false);
    }
  }, [effectiveIsAdmin, isManageDrawerOpen]);

  // Ensure in-memory Bearer token exists whenever Admin session is active (e.g. after reload)
  useEffect(() => {
    if (!adminSession.isAdmin || adminTokenRef.current) return;
    let cancelled = false;
    const hydrateToken = async () => {
      if (authUser) {
        const idToken = await authUser.getIdToken().catch(() => '');
        if (idToken) {
          const token = await requestServerAdminToken({ idToken });
          if (!cancelled && token) {
            adminTokenRef.current = token;
            return;
          }
        }
      }
      if (verifiedAdminEmail) {
        const token = await requestServerAdminToken({ email: verifiedAdminEmail });
        if (!cancelled && token) {
          adminTokenRef.current = token;
        }
      }
    };
    void hydrateToken();
    return () => {
      cancelled = true;
    };
  }, [adminSession.isAdmin, authUser, verifiedAdminEmail]);

  const handleVerifiedAdminEmail = useCallback((email: string) => {
    setVerifiedAdminEmail(email);
    setIsPublicPreview(false);
    saveStoredAdminSession(email);
    void requestServerAdminToken({ email }).then((token) => {
      if (token) {
        adminTokenRef.current = token;
      }
    });
  }, []);

  const handleAdminSignOut = useCallback(async () => {
    setVerifiedAdminEmail(null);
    setIsPublicPreview(false);
    setIsManageDrawerOpen(false);
    adminTokenRef.current = null;
    clearStoredAdminSession();
    if (authUser?.email) {
      await logout();
      setAuthUser(null);
      setAccessToken(null);
      setSyncStatus(sheetConfig ? 'auth_required' : 'disconnected');
    }
  }, [authUser?.email, sheetConfig]);

  const handleLoadSpreadsheetTabs = async (
    spreadsheetId: string
  ): Promise<{ title: string; sheets: SheetTabInfo[]; defaultTab: string }> => {
    const token = accessToken ?? getAccessToken();
    if (!token) {
      throw new Error('Sign in with Google first.');
    }
    const meta = await fetchSpreadsheetMetadata(spreadsheetId, token);
    const preferredGid =
      spreadsheetId === DEFAULT_MAIN_AR_SPREADSHEET_ID
        ? DEFAULT_MAIN_AR_SHEET_GID
        : undefined;
    return {
      title: meta.title,
      sheets: meta.sheets,
      defaultTab: pickDefaultSheetTab(meta.sheets, preferredGid),
    };
  };

  const handleConnectLiveSheet = async (nextConfig: LiveSheetConfig) => {
    lastFingerprintRef.current = null;
    setSheetConfig(nextConfig);
    try {
      localStorage.setItem(LIVE_SHEET_CONFIG_KEY, JSON.stringify(nextConfig));
    } catch {
      // Ignore storage errors
    }
    await syncLiveSheet(nextConfig, accessToken, true);
    setIsManageDrawerOpen(false);
  };

  const handleDisconnectLiveSheet = () => {
    setSheetConfig(DEFAULT_LIVE_SHEET_CONFIG);
    lastFingerprintRef.current = null;
    setSyncStatus('auth_required');
    setSyncError(null);
    try {
      localStorage.removeItem(LIVE_SHEET_CONFIG_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  const adminOrderedPages = useMemo(
    () => orderReportPages(REPORT_PAGES, pageLayout.pageOrder, pageLayout.deletedPages),
    [pageLayout.pageOrder, pageLayout.deletedPages]
  );

  const publicOrderedPages = useMemo(
    () =>
      orderReportPages(
        REPORT_PAGES,
        pageLayout.pageOrder,
        pageLayout.deletedPages,
        pageLayout.hiddenPages
      ),
    [pageLayout.pageOrder, pageLayout.deletedPages, pageLayout.hiddenPages]
  );

  const orderedPages = effectiveIsAdmin ? adminOrderedPages : publicOrderedPages;

  const hiddenPageSet = useMemo(
    () => new Set(pageLayout.hiddenPages),
    [pageLayout.hiddenPages]
  );

  const isCustomPageLayout = useMemo(
    () => !isDefaultPageLayout(pageLayout, DEFAULT_PAGE_ORDER),
    [pageLayout]
  );

  // Keep activePage valid if a page deletion or public-preview toggle removes/hides the active slide
  useEffect(() => {
    if (orderedPages.length === 0) return;
    if (!orderedPages.some((p) => p.page === activePage)) {
      setActivePage(orderedPages[0].page);
    }
  }, [orderedPages, activePage]);

  const persistGlobalLayout = useCallback(
    async (nextLayout: ReportPageLayout) => {
      setPageLayout(nextLayout);
      savePageLayout(nextLayout);

      let token = adminTokenRef.current;
      if (!token && authUser) {
        const idToken = await authUser.getIdToken().catch(() => '');
        if (idToken) {
          token = await requestServerAdminToken({ idToken });
          if (token) adminTokenRef.current = token;
        }
      } else if (!token && verifiedAdminEmail) {
        token = await requestServerAdminToken({ email: verifiedAdminEmail });
        if (token) adminTokenRef.current = token;
      }

      if (token) {
        const serverSaved = await saveServerReportLayout(nextLayout, token);
        if (serverSaved) {
          setPageLayout(serverSaved);
          savePageLayout(serverSaved);
        }
      }

      if (canWriteLayoutToFirestore()) {
        void saveGlobalLayoutToFirestore(nextLayout).catch(() => {
          // Global layout already persisted on server endpoint
        });
      }
    },
    [authUser, verifiedAdminEmail]
  );

  const handleReorderPages = useCallback(
    (fromPageId: number, toPageId: number) => {
      if (!effectiveIsAdmin) return;
      const current = pageLayoutRef.current;
      const nextOrder = reorderPageIds(
        current.pageOrder,
        fromPageId,
        toPageId,
        DEFAULT_PAGE_ORDER
      );
      const nextLayout: ReportPageLayout = {
        pageOrder: nextOrder,
        deletedPages: current.deletedPages,
        hiddenPages: current.hiddenPages,
        updatedAtMs: Date.now(),
      };
      void persistGlobalLayout(nextLayout);
    },
    [effectiveIsAdmin, persistGlobalLayout]
  );

  const handleDeletePage = useCallback(
    (pageId: number) => {
      if (!effectiveIsAdmin) return;
      const current = pageLayoutRef.current;
      const nextLayout = deletePageFromLayout(current, pageId, DEFAULT_PAGE_ORDER);
      const nextVisible = orderReportPages(
        REPORT_PAGES,
        nextLayout.pageOrder,
        nextLayout.deletedPages
      );
      if (activePage === pageId && nextVisible.length > 0) {
        setActivePage(nextVisible[0].page);
      }
      void persistGlobalLayout(nextLayout);
    },
    [effectiveIsAdmin, activePage, persistGlobalLayout]
  );

  const handleToggleHidePage = useCallback(
    (pageId: number) => {
      if (!effectiveIsAdmin) return;
      const current = pageLayoutRef.current;
      const nextLayout = togglePageHiddenInLayout(current, pageId, DEFAULT_PAGE_ORDER);
      void persistGlobalLayout(nextLayout);
    },
    [effectiveIsAdmin, persistGlobalLayout]
  );

  const handleResetPageLayout = useCallback(() => {
    if (!effectiveIsAdmin) return;
    clearSavedPageLayout();
    const resetLayout: ReportPageLayout = {
      pageOrder: [...DEFAULT_PAGE_LAYOUT.pageOrder],
      deletedPages: [],
      hiddenPages: [],
      updatedAtMs: Date.now(),
    };
    void persistGlobalLayout(resetLayout);
  }, [effectiveIsAdmin, persistGlobalLayout]);

  const handleOpenManageDrawer = useCallback(
    (tab: DrawerTab) => {
      if (!effectiveIsAdmin) return;
      setManageDrawerTab(tab);
      setIsManageDrawerOpen(true);
    },
    [effectiveIsAdmin]
  );

  const metrics = useMemo(
    () => computeARMetrics(reportData, 'all', targetBenchmark),
    [reportData, targetBenchmark]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isManageDrawerOpen || isExportModalOpen || isAdminLoginModalOpen || viewMode !== 'single') {
        return;
      }
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight') {
        setActivePage((p) => {
          const idx = orderedPages.findIndex((item) => item.page === p);
          return idx >= 0 && idx < orderedPages.length - 1 ? orderedPages[idx + 1].page : p;
        });
      } else if (e.key === 'ArrowLeft') {
        setActivePage((p) => {
          const idx = orderedPages.findIndex((item) => item.page === p);
          return idx > 0 ? orderedPages[idx - 1].page : p;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isManageDrawerOpen, isExportModalOpen, isAdminLoginModalOpen, viewMode, orderedPages]);

  const handleApplyData = (updated: ARReportData, uploadedCsv?: string) => {
    applyDataToState(updated, uploadedCsv);
  };

  const handleResetBaseline = () => {
    handleDisconnectLiveSheet();
    publicArCsvRef.current = null;
    setReportData(BASELINE_AR_DATA);
    setRawCsvText('');
    setIsCustomData(false);
    setTargetBenchmark(BASELINE_AR_DATA.defaultTargetBenchmark);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(RAW_CSV_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    void refreshPublicAr(true);
  };

  const handleDownloadAllSheets = () => {
    const sheets = buildAllReportSheets(reportData, targetBenchmark, rawCsvText, supplementalSheet);
    downloadAllSheetsXLSX(sheets);
  };

  const handleSaveAsPdf = useCallback(async () => {
    if (isExportingPdf || isExportingPpt) return;
    const container = mainRef.current;
    const slides = container
      ? Array.from(container.querySelectorAll<HTMLElement>('section.looker-slide-canvas'))
      : [];

    if (slides.length === 0) {
      setPdfExportError('No report slides were found to export.');
      return;
    }

    setPdfExportError(null);
    setIsExportingPdf(true);
    const filename = formatReportPdfFilename(new Date());
    const previousTitle = document.title;
    document.title = filename.replace(/\.pdf$/i, '');

    try {
      await exportReportSlidesToPdf({
        slideElements: slides,
        filename,
      });
    } catch (err: any) {
      setPdfExportError(
        err?.message || 'Unable to generate PDF in this browser. Try Single Slide or All Pages.'
      );
    } finally {
      document.title = previousTitle;
      setIsExportingPdf(false);
    }
  }, [isExportingPdf, isExportingPpt]);

  const handleSaveAsPpt = useCallback(async () => {
    if (isExportingPpt || isExportingPdf) return;
    const container = mainRef.current;
    const slides = container
      ? Array.from(container.querySelectorAll<HTMLElement>('section.looker-slide-canvas'))
      : [];

    if (slides.length === 0) {
      setPdfExportError('No report slides were found to export.');
      return;
    }

    setPdfExportError(null);
    setIsExportingPpt(true);
    const filename = formatReportPptFilename(new Date());

    try {
      await exportReportSlidesToPpt({
        slideElements: slides,
        filename,
      });
    } catch (err: any) {
      setPdfExportError(
        err?.message || 'Unable to generate PowerPoint (.pptx) file in this browser.'
      );
    } finally {
      setIsExportingPpt(false);
    }
  }, [isExportingPpt, isExportingPdf]);

  const handleDraftEmail = useCallback(async () => {
    const draft = buildEmailDraft(reportData, targetBenchmark);
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(draft.body);
        copied = true;
      }
    } catch {
      // Clipboard write may be restricted in some contexts
    }

    const link = document.createElement('a');
    link.href = draft.mailtoUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();

    setEmailDraftNotice(
      copied
        ? `Email draft opened ("${draft.subject}") and summary copied to clipboard.`
        : `Email draft opened ("${draft.subject}").`
    );
    if (emailNoticeTimerRef.current !== null) {
      window.clearTimeout(emailNoticeTimerRef.current);
    }
    emailNoticeTimerRef.current = window.setTimeout(() => {
      setEmailDraftNotice(null);
    }, 6000);
  }, [reportData, targetBenchmark]);

  const handleToggleSidebar = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsDesktopSidebarOpen((prev) => !prev);
    } else {
      setIsMobileNavOpen((prev) => !prev);
    }
  }, []);

  const liveSheetLabel = syncStatus !== 'live'
    ? null
    : usePublicAr
      ? DEFAULT_MAIN_AR_SHEET_TITLE
      : `${sheetConfig.spreadsheetTitle} (${sheetConfig.sheetTitle})`;

  const renderPage = (pageNum: number) => {
    switch (pageNum) {
      case 1:
        return <CoverPage key={1} data={reportData} targetBenchmark={targetBenchmark} />;
      case 2:
        return (
          <PerformanceSummaryPage
            key={2}
            data={reportData}
            targetBenchmark={targetBenchmark}
            variant="ytd_sep"
          />
        );
      case 3:
        return (
          <PortfolioManagersPage
            key={3}
            data={reportData}
            targetBenchmark={targetBenchmark}
            pageVariant="p3_portfolio"
          />
        );
      case 5:
        return (
          <PortfolioManagersPage
            key={5}
            data={reportData}
            targetBenchmark={targetBenchmark}
            pageVariant="p5_projection"
          />
        );
      case 7:
        return (
          <PerformanceSummaryPage
            key={7}
            data={reportData}
            targetBenchmark={targetBenchmark}
            variant="ytd_oct"
          />
        );
      case 8:
        return (
          <PortfolioManagersPage
            key={8}
            data={reportData}
            targetBenchmark={targetBenchmark}
            pageVariant="p8_oct_billings"
          />
        );
      case 9:
        return (
          <AgingSummaryPage
            key={9}
            data={reportData}
            targetBenchmark={targetBenchmark}
          />
        );
      case 10:
        return <CohortEfficiencyPage key={10} data={reportData} />;
      case 11:
        return (
          <BalanceBreakdownPage
            key={11}
            data={reportData}
            commitments={displayedCommitments}
            committedPaymentsConfig={committedPaymentsConfig}
            commitmentSyncStatus={publicCommitments && commitmentSyncStatus === 'local_only' ? 'synced' : commitmentSyncStatus}
            commitmentSyncWarning={commitmentSyncWarning}
            onUpsertCommitment={handleUpsertCommitment}
            onDeleteCommitment={handleDeleteCommitment}
            onSyncCommitments={handleSyncCommitments}
            onOpenCommitmentSyncSetup={() => handleOpenManageDrawer('commitments')}
            isAdminAuthorized={effectiveIsAdmin}
          />
        );
      case 12:
        return (
          <ComparativeReportPage
            key={12}
            data={reportData}
            rawCsvText={rawCsvText}
            targetBenchmark={targetBenchmark}
          />
        );
      case 13:
        return (
          <DataSheetsPage
            key={13}
            data={reportData}
            targetBenchmark={targetBenchmark}
            rawCsvText={rawCsvText}
            isCustomData={isCustomData}
            liveSheetLabel={liveSheetLabel}
            supplementalSheet={supplementalSheet}
          />
        );
      default:
        return <CoverPage key={1} data={reportData} targetBenchmark={targetBenchmark} />;
    }
  };

  const renderPageWithAdminVisibilityNotice = (pageNum: number) => {
    const content = renderPage(pageNum);
    if (!effectiveIsAdmin || !hiddenPageSet.has(pageNum)) {
      return content;
    }
    return (
      <div key={`hidden-wrap-${pageNum}`} className="space-y-2">
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-[#FEF3C7] px-4 py-2 text-xs text-slate-900 print:hidden"
        >
          <span className="inline-flex items-center gap-2 font-medium">
            <EyeOff className="h-4 w-4 text-[#8E740B] shrink-0" aria-hidden="true" />
            <span>
              <strong>Hidden from Public Viewers:</strong> This page is concealed in Public
              Preview, public sidebar, All Pages, and public PDF/PPT exports.
            </span>
          </span>
          <button
            type="button"
            onClick={() => handleToggleHidePage(pageNum)}
            className="inline-flex items-center gap-1 rounded-md bg-[#141A21] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-[#D8C136]" aria-hidden="true" />
            <span>Unhide Page</span>
          </button>
        </div>
        {content}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-900 flex flex-col">
      <ReportShellHeader
        orderedPages={orderedPages}
        activePage={activePage}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isDesktopSidebarOpen={isDesktopSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        targetBenchmark={targetBenchmark}
        defaultBenchmark={reportData.defaultTargetBenchmark}
        onTargetBenchmarkChange={setTargetBenchmark}
        isCustomData={isCustomData}
        syncStatus={syncStatus}
        autoSyncStatus={autoSyncStatus}
        lastSyncedAt={lastSyncedAt}
        sheetConfig={sheetConfig}
        onOpenLiveSheets={() => handleOpenManageDrawer('sheets')}
        onSyncNow={() => void handleSyncNow()}
        onResetToBaseline={handleResetBaseline}
        onOpenManageData={() => handleOpenManageDrawer('sheets')}
        onOpenExportSummary={() => setIsExportModalOpen(true)}
        onDownloadAllSheets={handleDownloadAllSheets}
        onSaveAsPdf={handleSaveAsPdf}
        onSaveAsPpt={handleSaveAsPpt}
        onDraftEmail={handleDraftEmail}
        isExportingPdf={isExportingPdf}
        isExportingPpt={isExportingPpt}
        isAdminAuthorized={effectiveIsAdmin}
        isRealAdmin={adminSession.isAdmin}
        isPublicPreview={isPublicPreview}
        onTogglePublicPreview={() => setIsPublicPreview((prev) => !prev)}
        adminEmailLabel={adminSession.activeAdminEmail}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
        onAdminSignOut={handleAdminSignOut}
      />

      {pdfExportError && (
        <div
          role="alert"
          className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800 flex items-center justify-between gap-2 print:hidden"
        >
          <span>{pdfExportError}</span>
          <button
            type="button"
            onClick={() => setPdfExportError(null)}
            className="font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {emailDraftNotice && (
        <div
          role="status"
          className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-900 flex items-center justify-between gap-2 print:hidden"
        >
          <span>{emailDraftNotice}</span>
          <button
            type="button"
            onClick={() => setEmailDraftNotice(null)}
            className="font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-1 min-w-0">
        <ReportSidebar
          orderedPages={orderedPages}
          activePage={activePage}
          viewMode={viewMode}
          onPageChange={setActivePage}
          onViewModeChange={setViewMode}
          isDesktopOpen={isDesktopSidebarOpen}
          onToggleDesktop={() => setIsDesktopSidebarOpen(false)}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          lastUpdated={reportData.lastUpdated}
          targetBenchmark={targetBenchmark}
          isAdminAuthorized={effectiveIsAdmin}
          isCustomLayout={isCustomPageLayout}
          hiddenPageIds={pageLayout.hiddenPages}
          onReorderPages={handleReorderPages}
          onDeletePage={handleDeletePage}
          onToggleHidePage={handleToggleHidePage}
          onResetPageLayout={handleResetPageLayout}
        />

        <div className="flex flex-1 flex-col min-w-0">
          <main
            ref={mainRef}
            className={`mx-auto w-full flex-1 px-4 py-5 sm:px-6 space-y-6 transition-all print:max-w-none print:p-0 print:space-y-0 ${
              isDesktopSidebarOpen ? 'max-w-[1400px]' : 'max-w-full'
            } ${viewMode === 'all' ? 'print-all-slides' : ''}`}
          >
            {viewMode === 'single'
              ? renderPageWithAdminVisibilityNotice(activePage)
              : orderedPages.map((p) => renderPageWithAdminVisibilityNotice(p.page))}
          </main>

          <footer
            className={`mx-auto w-full px-4 py-4 sm:px-6 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 print:hidden ${
              isDesktopSidebarOpen ? 'max-w-[1400px]' : 'max-w-full'
            }`}
          >
            <span>
              Asia Affinity® Property Management, Inc. · Linked Source:{' '}
              {liveSheetLabel
                ? `Google Sheets (${liveSheetLabel})`
                : isCustomData
                  ? 'Custom AppSheet CSV Import'
                  : 'AR_MONITORING_FOR_APPSHEET (Local Snapshot)'}
            </span>
            <span className="tabular-nums">
              Currency: Philippine Peso (₱) · Benchmark: {targetBenchmark.toFixed(1)}% · Updated:{' '}
              {reportData.lastUpdated}
            </span>
          </footer>
        </div>
      </div>

      {effectiveIsAdmin && (
        <ManageDataDrawer
          isOpen={isManageDrawerOpen}
          initialTab={manageDrawerTab}
          data={reportData}
          authUser={authUser}
          hasAccessToken={Boolean(accessToken)}
          isLoggingIn={isLoggingIn}
          sheetConfig={sheetConfig}
          syncStatus={syncStatus}
          syncError={syncError}
          lastSyncedAt={lastSyncedAt}
          commitments={displayedCommitments}
          committedPaymentsConfig={committedPaymentsConfig}
          commitmentSyncStatus={commitmentSyncStatus}
          commitmentSyncWarning={commitmentSyncWarning}
          onSaveCommittedPaymentsConfig={handleSaveCommittedPaymentsConfig}
          onSyncCommitments={handleSyncCommitments}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={handleGoogleSignOut}
          onLoadSpreadsheetTabs={handleLoadSpreadsheetTabs}
          onConnectLiveSheet={handleConnectLiveSheet}
          onSyncNow={handleSyncNow}
          onDisconnectLiveSheet={handleDisconnectLiveSheet}
          onClose={() => setIsManageDrawerOpen(false)}
          onApplyData={handleApplyData}
          onResetBaseline={handleResetBaseline}
        />
      )}

      <ExportSummaryModal
        isOpen={isExportModalOpen}
        data={reportData}
        metrics={metrics}
        onClose={() => setIsExportModalOpen(false)}
        onDownloadAllSheets={handleDownloadAllSheets}
        onSaveAsPdf={handleSaveAsPdf}
      />

      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        googleUserEmail={authUser?.email}
        isLoggingInGoogle={isLoggingIn}
        onGoogleSignIn={async () => {
          await handleGoogleSignIn();
        }}
        onVerifiedAdminEmail={handleVerifiedAdminEmail}
        onClose={() => setIsAdminLoginModalOpen(false)}
      />
    </div>
  );
}
