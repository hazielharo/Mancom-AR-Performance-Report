import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };
import { ADMIN_EMAIL, isAuthorizedAdminEmail, normalizeEmail } from './src/utils/adminAuth';
import {
  DEFAULT_PAGE_LAYOUT,
  DEFAULT_PAGE_ORDER,
  normalizePageLayout,
  ReportPageLayout,
} from './src/utils/pageOrder';
import {
  buildPublicSheetCsvUrl,
  DEFAULT_MAIN_AR_SHEET_GID,
  DEFAULT_MAIN_AR_SPREADSHEET_ID,
  sheetValuesToCSV,
} from './src/utils/googleSheets';
import {
  CommittedPaymentsConfig,
  DEFAULT_COMMITTED_PAYMENTS_SHEET_GID,
  DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID,
  DEFAULT_MAIN_AR_SOURCE_SHEET_GID,
  DEFAULT_MAIN_AR_SOURCE_SPREADSHEET_ID,
  isValidIsoDate,
  normalizeBiKey,
  PaymentCommitmentRecord,
  removeCommitmentRecord,
  upsertCommitmentRecord,
  validateAppsScriptWebhookUrl,
} from './src/utils/paymentCommitments';

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Ephemeral in-memory fallback guarantees secret is never hardcoded in source
const SESSION_SECRET =
  process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

const DATA_DIR = path.resolve(process.cwd(), '.data');
const LAYOUT_FILE_PATH = path.resolve(DATA_DIR, 'report-layout.json');
const COMMITMENTS_FILE_PATH = path.resolve(DATA_DIR, 'committed-payments.json');
const COMMITMENTS_CONFIG_FILE_PATH = path.resolve(DATA_DIR, 'committed-payments-config.json');
const LIVE_AR_CACHE_FILE_PATH = path.resolve(DATA_DIR, 'live-ar-cache.json');
const BUNDLED_SNAPSHOT_CSV_PATH = path.resolve(
  process.cwd(),
  'fixtures/AR_MONITORING_FOR_APPSHEET.csv'
);

interface AdminTokenPayload {
  email: string;
  role: 'admin';
  exp: number;
}

function signAdminToken(email: string): string {
  const payload: AdminTokenPayload = {
    email: normalizeEmail(email),
    role: 'admin',
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function verifyAdminToken(token: string): AdminTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, receivedSig] = parts;
  if (!encodedPayload || !receivedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  const a = Buffer.from(receivedSig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as AdminTokenPayload;
    if (
      parsed.role !== 'admin' ||
      typeof parsed.exp !== 'number' ||
      parsed.exp < Date.now() ||
      !isAuthorizedAdminEmail(parsed.email, ADMIN_EMAIL)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function verifyFirebaseAdminIdToken(idToken: string): Promise<string | null> {
  const apiKey = firebaseConfig.apiKey;
  if (!apiKey || !idToken) return null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      users?: Array<{ email?: string; emailVerified?: boolean }>;
    };
    const user = data.users?.[0];
    if (
      user?.emailVerified &&
      isAuthorizedAdminEmail(user.email, ADMIN_EMAIL)
    ) {
      return normalizeEmail(user.email);
    }
    return null;
  } catch {
    return null;
  }
}

function safeConstantTimeEqual(aRaw: string, bRaw: string): boolean {
  const a = Buffer.from(aRaw, 'utf8');
  const b = Buffer.from(bRaw, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function ensureStorePath(filePath: string): string {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(DATA_DIR + path.sep)) {
    throw new Error('Invalid store path.');
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  return resolved;
}

function writeAtomicJson(filePath: string, payload: unknown): void {
  const targetPath = ensureStorePath(filePath);
  const tmpPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf8');
  fs.renameSync(tmpPath, targetPath);
}

function readPersistedLayout(): ReportPageLayout {
  try {
    const filePath = ensureStorePath(LAYOUT_FILE_PATH);
    if (!fs.existsSync(filePath)) {
      return {
        pageOrder: [...DEFAULT_PAGE_ORDER],
        deletedPages: [],
        hiddenPages: [],
        updatedAtMs: 0,
      };
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return normalizePageLayout(JSON.parse(raw), DEFAULT_PAGE_ORDER);
  } catch {
    return {
      pageOrder: [...DEFAULT_PAGE_LAYOUT.pageOrder],
      deletedPages: [],
      hiddenPages: [],
      updatedAtMs: 0,
    };
  }
}

function writePersistedLayout(layout: ReportPageLayout): ReportPageLayout {
  const normalized = normalizePageLayout(
    {
      ...layout,
      updatedAtMs: Date.now(),
    },
    DEFAULT_PAGE_ORDER
  );
  writeAtomicJson(LAYOUT_FILE_PATH, normalized);
  return normalized;
}

function normalizeCommitmentList(raw: unknown): PaymentCommitmentRecord[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: PaymentCommitmentRecord[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Partial<PaymentCommitmentRecord>;
    const biNumber = String(rec.biNumber ?? '').trim();
    const biKey = normalizeBiKey(biNumber);
    const committedPaymentDate = String(rec.committedPaymentDate ?? '').trim();
    if (!biKey || seen.has(biKey) || !isValidIsoDate(committedPaymentDate)) continue;
    seen.add(biKey);
    out.push({
      timestamp: String(rec.timestamp ?? new Date().toISOString()),
      accountManager: String(rec.accountManager ?? 'Unspecified').trim() || 'Unspecified',
      clientName: String(rec.clientName ?? 'Unspecified').trim() || 'Unspecified',
      biNumber,
      serviceType: String(rec.serviceType ?? 'Unspecified').trim() || 'Unspecified',
      particulars: String(rec.particulars ?? '—').trim() || '—',
      aging: String(rec.aging ?? 'Unspecified').trim() || 'Unspecified',
      remainingBalance: Math.round((Number(rec.remainingBalance) || 0) * 100) / 100,
      committedPaymentDate,
    });
  }
  return out;
}

function readPersistedCommitments(): PaymentCommitmentRecord[] {
  try {
    const filePath = ensureStorePath(COMMITMENTS_FILE_PATH);
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8');
    return normalizeCommitmentList(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writePersistedCommitments(records: PaymentCommitmentRecord[]): PaymentCommitmentRecord[] {
  const normalized = normalizeCommitmentList(records);
  writeAtomicJson(COMMITMENTS_FILE_PATH, normalized);
  return normalized;
}

const SPREADSHEET_ID_PATTERN = /^[a-zA-Z0-9_-]{15,120}$/;

function sanitizeSpreadsheetId(raw: unknown, fallback: string): string {
  const clean = typeof raw === 'string' ? raw.trim() : '';
  return SPREADSHEET_ID_PATTERN.test(clean) ? clean : fallback;
}

function sanitizeSheetGid(raw: unknown, fallback: number): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

function readCommittedPaymentsConfig(): CommittedPaymentsConfig {
  const envUrl = process.env.COMMITTED_PAYMENTS_WEBHOOK_URL?.trim() ?? '';
  let stored: CommittedPaymentsConfig = {
    webhookUrl: '',
    sourceSpreadsheetId: DEFAULT_MAIN_AR_SOURCE_SPREADSHEET_ID,
    sourceSheetGid: DEFAULT_MAIN_AR_SOURCE_SHEET_GID,
    targetSpreadsheetId: DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID,
    targetSheetGid: DEFAULT_COMMITTED_PAYMENTS_SHEET_GID,
  };
  try {
    const filePath = ensureStorePath(COMMITMENTS_CONFIG_FILE_PATH);
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<CommittedPaymentsConfig>;
      const checked = validateAppsScriptWebhookUrl(String(parsed.webhookUrl ?? ''));
      const sourceId = sanitizeSpreadsheetId(
        parsed.sourceSpreadsheetId,
        DEFAULT_MAIN_AR_SOURCE_SPREADSHEET_ID
      );
      const candidateTargetId = sanitizeSpreadsheetId(
        parsed.targetSpreadsheetId,
        DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID
      );
      stored = {
        webhookUrl: checked.valid ? checked.normalizedUrl : '',
        sourceSpreadsheetId: sourceId,
        sourceSheetGid: sanitizeSheetGid(parsed.sourceSheetGid, DEFAULT_MAIN_AR_SOURCE_SHEET_GID),
        targetSpreadsheetId:
          candidateTargetId === sourceId
            ? DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID
            : candidateTargetId,
        targetSheetGid: sanitizeSheetGid(
          parsed.targetSheetGid,
          DEFAULT_COMMITTED_PAYMENTS_SHEET_GID
        ),
      };
    }
  } catch {
    // Fallback to hardcoded defaults
  }
  if (!stored.webhookUrl && envUrl) {
    const checkedEnv = validateAppsScriptWebhookUrl(envUrl);
    if (checkedEnv.valid) {
      stored.webhookUrl = checkedEnv.normalizedUrl;
    }
  }
  return stored;
}

function writeCommittedPaymentsConfig(config: CommittedPaymentsConfig): CommittedPaymentsConfig {
  const checked = validateAppsScriptWebhookUrl(config.webhookUrl ?? '');
  if (!checked.valid) {
    throw new Error(checked.error || 'Invalid Google Apps Script Web App URL.');
  }
  const cleanSourceId = sanitizeSpreadsheetId(
    config.sourceSpreadsheetId,
    DEFAULT_MAIN_AR_SOURCE_SPREADSHEET_ID
  );
  const cleanTargetId = sanitizeSpreadsheetId(
    config.targetSpreadsheetId,
    DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID
  );
  if (cleanTargetId === cleanSourceId) {
    throw new Error(
      'Committed Payments target spreadsheet ID must be separate from the strictly read-only Main AR Monitoring spreadsheet.'
    );
  }
  const next: CommittedPaymentsConfig = {
    webhookUrl: checked.normalizedUrl,
    sourceSpreadsheetId: cleanSourceId,
    sourceSheetGid: sanitizeSheetGid(config.sourceSheetGid, DEFAULT_MAIN_AR_SOURCE_SHEET_GID),
    targetSpreadsheetId: cleanTargetId,
    targetSheetGid: sanitizeSheetGid(config.targetSheetGid, DEFAULT_COMMITTED_PAYMENTS_SHEET_GID),
  };
  writeAtomicJson(COMMITMENTS_CONFIG_FILE_PATH, next);
  return next;
}

interface LiveArCacheRecord {
  csv: string;
  syncedAt: string;
  source: 'google_sheets_csv' | 'apps_script' | 'admin_live_sync';
  spreadsheetId: string;
  sheetGid: number;
}

function isValidArCsvText(raw: string): boolean {
  const firstLine = (raw.split(/\r?\n/, 1)[0] ?? '').toUpperCase();
  return (
    raw.trim().length > 20 &&
    !firstLine.startsWith('<!DOCTYPE') &&
    !firstLine.startsWith('<HTML') &&
    (firstLine.includes('BILLED AMOUNT') || firstLine.includes('AR TAG'))
  );
}

function readLiveArCache(): LiveArCacheRecord | null {
  try {
    const filePath = ensureStorePath(LIVE_AR_CACHE_FILE_PATH);
    if (!fs.existsSync(filePath)) return null;
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<LiveArCacheRecord>;
    if (typeof parsed.csv === 'string' && isValidArCsvText(parsed.csv)) {
      return {
        csv: parsed.csv,
        syncedAt:
          typeof parsed.syncedAt === 'string' && parsed.syncedAt.trim()
            ? parsed.syncedAt
            : new Date().toISOString(),
        source:
          parsed.source === 'google_sheets_csv' ||
          parsed.source === 'apps_script' ||
          parsed.source === 'admin_live_sync'
            ? parsed.source
            : 'admin_live_sync',
        spreadsheetId: sanitizeSpreadsheetId(
          parsed.spreadsheetId,
          DEFAULT_MAIN_AR_SPREADSHEET_ID
        ),
        sheetGid: sanitizeSheetGid(parsed.sheetGid, DEFAULT_MAIN_AR_SHEET_GID),
      };
    }
  } catch {
    // Ignore unreadable cache
  }
  return null;
}

function writeLiveArCache(record: LiveArCacheRecord): void {
  writeAtomicJson(LIVE_AR_CACHE_FILE_PATH, record);
}

async function fetchReadOnlyPublicArCsv(
  spreadsheetId: string,
  sheetGid: number
): Promise<string | null> {
  if (!SPREADSHEET_ID_PATTERN.test(spreadsheetId)) return null;
  const exportUrl = buildPublicSheetCsvUrl(spreadsheetId, sheetGid);
  try {
    const response = await fetch(exportUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    });
    const finalHost = response.url ? new URL(response.url).hostname.toLowerCase() : '';
    const isGoogleHost =
      finalHost === 'docs.google.com' || finalHost.endsWith('.googleusercontent.com');
    if (!response.ok || !isGoogleHost) {
      return null;
    }
    const text = await response.text();
    return isValidArCsvText(text) ? text : null;
  } catch {
    return null;
  }
}

function isPrivateOrLoopbackIp(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return true;
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (v === 6) {
    const lower = ip.toLowerCase();
    return (
      lower === '::1' ||
      lower === '::' ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('fe80') ||
      lower.startsWith('::ffff:127.') ||
      lower.startsWith('::ffff:10.') ||
      lower.startsWith('::ffff:192.168.') ||
      lower.startsWith('::ffff:169.254.')
    );
  }
  return true;
}

async function assertSafeAppsScriptUrl(rawUrl: string): Promise<string> {
  const checked = validateAppsScriptWebhookUrl(rawUrl);
  if (!checked.valid || !checked.normalizedUrl) {
    throw new Error(checked.error || 'Apps Script Web App URL is not valid.');
  }
  const parsed = new URL(checked.normalizedUrl);
  if (net.isIP(parsed.hostname) !== 0) {
    throw new Error('IP addresses are not allowed for webhook destinations.');
  }
  const records = await dns.lookup(parsed.hostname, { all: true });
  if (records.length === 0 || records.some((r) => isPrivateOrLoopbackIp(r.address))) {
    throw new Error('Destination resolved to a restricted network address.');
  }
  return checked.normalizedUrl;
}

interface AppsScriptWebhookResult {
  sheetSynced: boolean;
  commitments?: PaymentCommitmentRecord[];
  arValues?: unknown[][];
  deletedCount?: number;
  syncedAt?: string;
  warning?: string;
}

async function forwardToAppsScriptWebhook(
  webhookUrl: string,
  method: 'GET' | 'POST',
  payload?: unknown,
  queryParams?: Record<string, string>
): Promise<AppsScriptWebhookResult> {
  if (!webhookUrl) {
    return { sheetSynced: false };
  }

  let safeUrl: string;
  try {
    safeUrl = await assertSafeAppsScriptUrl(webhookUrl);
  } catch (err: any) {
    return {
      sheetSynced: false,
      warning: err?.message || 'Apps Script Web App URL failed safety checks.',
    };
  }

  try {
    const requestUrlObj = new URL(safeUrl);
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        requestUrlObj.searchParams.set(key, value);
      }
    }
    const response = await fetch(requestUrlObj.toString(), {
      method,
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
      body: method === 'POST' ? JSON.stringify(payload ?? {}) : undefined,
      redirect: 'follow',
      signal: AbortSignal.timeout(12_000),
    });

    const finalUrl = response.url ? new URL(response.url) : null;
    if (
      finalUrl &&
      finalUrl.hostname !== 'script.google.com' &&
      finalUrl.hostname !== 'script.googleusercontent.com'
    ) {
      return {
        sheetSynced: false,
        warning: 'Apps Script Web App redirected to an untrusted host.',
      };
    }

    if (!response.ok) {
      return {
        sheetSynced: false,
        warning: `Google Apps Script returned HTTP ${response.status}. Saved locally.`,
      };
    }

    const text = await response.text();
    let parsed: {
      ok?: boolean;
      commitments?: unknown;
      arValues?: unknown;
      deletedCount?: number;
      syncedAt?: string;
      error?: string;
    };
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        sheetSynced: false,
        warning:
          'Google Apps Script did not return JSON. Verify Web App deployment access is set to "Anyone".',
      };
    }

    if (parsed.ok === false) {
      return {
        sheetSynced: false,
        warning: parsed.error || 'Google Apps Script reported an error.',
      };
    }

    return {
      sheetSynced: true,
      commitments: Array.isArray(parsed.commitments)
        ? normalizeCommitmentList(parsed.commitments)
        : undefined,
      arValues: Array.isArray(parsed.arValues) ? (parsed.arValues as unknown[][]) : undefined,
      deletedCount: typeof parsed.deletedCount === 'number' ? parsed.deletedCount : 0,
      syncedAt: parsed.syncedAt ?? new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      sheetSynced: false,
      warning:
        err?.name === 'TimeoutError'
          ? 'Google Apps Script request timed out. Changes are saved locally.'
          : err?.message || 'Unable to reach Google Apps Script Web App. Saved locally.',
    };
  }
}

async function startServer() {
  const app = express();

  // Larger JSON allowance strictly scoped to Admin live Google Sheets snapshot caching
  app.post('/api/live-ar-snapshot', express.json({ limit: '8mb' }), (req, res) => {
    const authHeader = req.headers.authorization ?? '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      res.status(401).json({ ok: false, error: 'Administrator authorization required.' });
      return;
    }
    const verified = verifyAdminToken(match[1].trim());
    if (!verified) {
      res.status(403).json({ ok: false, error: 'Invalid or expired administrator session.' });
      return;
    }

    const body = (req.body ?? {}) as {
      csv?: unknown;
      syncedAt?: unknown;
      spreadsheetId?: unknown;
      sheetGid?: unknown;
    };
    const csv = typeof body.csv === 'string' ? body.csv : '';
    if (!isValidArCsvText(csv)) {
      res.status(400).json({ ok: false, error: 'Valid AR Monitoring CSV payload is required.' });
      return;
    }

    const record: LiveArCacheRecord = {
      csv,
      syncedAt:
        typeof body.syncedAt === 'string' && body.syncedAt.trim()
          ? body.syncedAt.trim()
          : new Date().toISOString(),
      source: 'admin_live_sync',
      spreadsheetId: sanitizeSpreadsheetId(
        body.spreadsheetId,
        DEFAULT_MAIN_AR_SPREADSHEET_ID
      ),
      sheetGid: sanitizeSheetGid(body.sheetGid, DEFAULT_MAIN_AR_SHEET_GID),
    };
    writeLiveArCache(record);
    res.json({ ok: true, syncedAt: record.syncedAt });
  });

  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Read-only automatic AR data sync endpoint used on initial load for both Admin & Public Viewers
  app.get('/api/live-ar-sync', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const config = readCommittedPaymentsConfig();
    const spreadsheetId = sanitizeSpreadsheetId(
      config.sourceSpreadsheetId,
      DEFAULT_MAIN_AR_SPREADSHEET_ID
    );
    const sheetGid = sanitizeSheetGid(
      config.sourceSheetGid,
      DEFAULT_MAIN_AR_SHEET_GID
    );

    const publicCsv = await fetchReadOnlyPublicArCsv(spreadsheetId, sheetGid);
    if (publicCsv) {
      const syncedAt = new Date().toISOString();
      writeLiveArCache({
        csv: publicCsv,
        syncedAt,
        source: 'google_sheets_csv',
        spreadsheetId,
        sheetGid,
      });
      res.json({
        ok: true,
        csv: publicCsv,
        syncedAt,
        source: 'google_sheets_csv',
        liveSheetAccessible: true,
        spreadsheetId,
        sheetGid,
      });
      return;
    }

    if (config.webhookUrl) {
      const remoteAr = await forwardToAppsScriptWebhook(
        config.webhookUrl,
        'GET',
        undefined,
        { action: 'ar_rows' }
      );
      if (remoteAr.sheetSynced && remoteAr.arValues && remoteAr.arValues.length >= 2) {
        const scriptCsv = sheetValuesToCSV(remoteAr.arValues);
        if (isValidArCsvText(scriptCsv)) {
          const syncedAt = remoteAr.syncedAt ?? new Date().toISOString();
          writeLiveArCache({
            csv: scriptCsv,
            syncedAt,
            source: 'apps_script',
            spreadsheetId,
            sheetGid,
          });
          res.json({
            ok: true,
            csv: scriptCsv,
            syncedAt,
            source: 'apps_script',
            liveSheetAccessible: true,
            spreadsheetId,
            sheetGid,
          });
          return;
        }
      }
    }

    const cached = readLiveArCache();
    if (cached) {
      res.json({
        ok: true,
        csv: cached.csv,
        syncedAt: cached.syncedAt,
        source: cached.source,
        liveSheetAccessible: true,
        spreadsheetId: cached.spreadsheetId,
        sheetGid: cached.sheetGid,
      });
      return;
    }

    try {
      const snapshotCsv = fs.readFileSync(BUNDLED_SNAPSHOT_CSV_PATH, 'utf8');
      res.json({
        ok: true,
        csv: snapshotCsv,
        syncedAt: new Date().toISOString(),
        source: 'linked_snapshot',
        liveSheetAccessible: false,
        spreadsheetId,
        sheetGid,
      });
    } catch {
      res.status(503).json({
        ok: false,
        error: 'Unable to load AR Monitoring snapshot or live Google Sheet.',
      });
    }
  });

  app.get('/api/report-layout', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(readPersistedLayout());
  });

  app.post('/api/admin/session', async (req, res) => {
    const body = (req.body ?? {}) as {
      email?: unknown;
      idToken?: unknown;
      passcode?: unknown;
    };

    if (typeof body.idToken === 'string' && body.idToken.trim()) {
      const verifiedEmail = await verifyFirebaseAdminIdToken(body.idToken.trim());
      if (!verifiedEmail) {
        res.status(403).json({ error: 'Unauthorized Google account.' });
        return;
      }
      res.json({ token: signAdminToken(verifiedEmail), email: verifiedEmail });
      return;
    }

    if (typeof body.email === 'string') {
      const configuredPasscode = process.env.ADMIN_PASSCODE?.trim() ?? '';
      if (configuredPasscode) {
        const receivedPasscode = typeof body.passcode === 'string' ? body.passcode : '';
        if (!safeConstantTimeEqual(receivedPasscode, configuredPasscode)) {
          res.status(403).json({ error: 'Invalid administrator credentials.' });
          return;
        }
      }
      if (!isAuthorizedAdminEmail(body.email, ADMIN_EMAIL)) {
        res.status(403).json({ error: 'Access denied for non-administrator email.' });
        return;
      }
      const normalized = normalizeEmail(body.email);
      res.json({ token: signAdminToken(normalized), email: normalized });
      return;
    }

    res.status(400).json({ error: 'Administrator credentials required.' });
  });

  app.put('/api/report-layout', (req, res) => {
    const authHeader = req.headers.authorization ?? '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      res.status(401).json({ error: 'Administrator authorization required.' });
      return;
    }
    const verified = verifyAdminToken(match[1].trim());
    if (!verified) {
      res.status(403).json({ error: 'Invalid or expired administrator session.' });
      return;
    }

    const body = (req.body ?? {}) as {
      pageOrder?: unknown;
      deletedPages?: unknown;
      hiddenPages?: unknown;
    };
    if (!Array.isArray(body.pageOrder) || body.pageOrder.length === 0) {
      res.status(400).json({ error: 'pageOrder must be a non-empty array of valid page IDs.' });
      return;
    }

    const saved = writePersistedLayout({
      pageOrder: body.pageOrder.map((n) => Number(n)),
      deletedPages: Array.isArray(body.deletedPages)
        ? body.deletedPages.map((n) => Number(n))
        : [],
      hiddenPages: Array.isArray(body.hiddenPages)
        ? body.hiddenPages.map((n) => Number(n))
        : [],
      updatedAtMs: Date.now(),
    });
    res.json(saved);
  });

  // Committed Payments & Two-Way Google Apps Script Sync Endpoints
  app.get('/api/committed-payments', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const config = readCommittedPaymentsConfig();
    let commitments = readPersistedCommitments();

    if (config.webhookUrl) {
      const remote = await forwardToAppsScriptWebhook(config.webhookUrl, 'GET');
      if (remote.sheetSynced && remote.commitments) {
        commitments = writePersistedCommitments(remote.commitments);
      }
      res.json({
        ok: true,
        commitments,
        config,
        sheetSynced: remote.sheetSynced,
        deletedCount: remote.deletedCount ?? 0,
        syncedAt: remote.syncedAt,
        warning: remote.warning,
      });
      return;
    }

    res.json({
      ok: true,
      commitments,
      config,
      sheetSynced: false,
      deletedCount: 0,
    });
  });

  app.put('/api/committed-payments/config', async (req, res) => {
    const body = (req.body ?? {}) as {
      webhookUrl?: unknown;
      sourceSpreadsheetId?: unknown;
      sourceSheetGid?: unknown;
      targetSpreadsheetId?: unknown;
      targetSheetGid?: unknown;
    };
    const rawUrl = typeof body.webhookUrl === 'string' ? body.webhookUrl : '';
    const check = validateAppsScriptWebhookUrl(rawUrl);
    if (!check.valid) {
      res.status(400).json({ ok: false, error: check.error });
      return;
    }

    let savedConfig: CommittedPaymentsConfig;
    try {
      savedConfig = writeCommittedPaymentsConfig({
        webhookUrl: check.normalizedUrl,
        sourceSpreadsheetId:
          typeof body.sourceSpreadsheetId === 'string'
            ? body.sourceSpreadsheetId
            : DEFAULT_MAIN_AR_SOURCE_SPREADSHEET_ID,
        sourceSheetGid: sanitizeSheetGid(
          body.sourceSheetGid,
          DEFAULT_MAIN_AR_SOURCE_SHEET_GID
        ),
        targetSpreadsheetId:
          typeof body.targetSpreadsheetId === 'string'
            ? body.targetSpreadsheetId
            : DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID,
        targetSheetGid: sanitizeSheetGid(
          body.targetSheetGid,
          DEFAULT_COMMITTED_PAYMENTS_SHEET_GID
        ),
      });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err?.message || 'Invalid sync configuration.' });
      return;
    }

    let commitments = readPersistedCommitments();
    if (!savedConfig.webhookUrl) {
      res.json({
        ok: true,
        commitments,
        config: savedConfig,
        sheetSynced: false,
      });
      return;
    }

    // Pull & merge remote state, pushing any locally staged commitments first
    const remote = await forwardToAppsScriptWebhook(savedConfig.webhookUrl, 'POST', {
      action: 'cleanup',
    });
    if (remote.sheetSynced && remote.commitments) {
      const remoteByBi = new Set(remote.commitments.map((c) => normalizeBiKey(c.biNumber)));
      for (const localItem of commitments) {
        if (!remoteByBi.has(normalizeBiKey(localItem.biNumber))) {
          await forwardToAppsScriptWebhook(savedConfig.webhookUrl, 'POST', {
            action: 'upsert',
            commitment: localItem,
          });
        }
      }
      const refreshed = await forwardToAppsScriptWebhook(savedConfig.webhookUrl, 'GET');
      if (refreshed.sheetSynced && refreshed.commitments) {
        commitments = writePersistedCommitments(refreshed.commitments);
      } else {
        commitments = writePersistedCommitments(remote.commitments);
      }
    }

    res.json({
      ok: true,
      commitments,
      config: savedConfig,
      sheetSynced: remote.sheetSynced,
      deletedCount: remote.deletedCount ?? 0,
      syncedAt: remote.syncedAt,
      warning: remote.warning,
    });
  });

  app.post('/api/committed-payments/upsert', async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const biNumber = String(body.biNumber ?? '').trim();
    const committedPaymentDate = String(body.committedPaymentDate ?? '').trim();
    if (!biNumber) {
      res.status(400).json({ ok: false, error: 'BI/SOA is required.' });
      return;
    }
    if (!isValidIsoDate(committedPaymentDate)) {
      res.status(400).json({
        ok: false,
        error: 'Committed Payment Date must be a valid YYYY-MM-DD date.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const current = readPersistedCommitments();
    const updatedList = upsertCommitmentRecord(
      current,
      {
        accountManager: String(body.accountManager ?? 'Unspecified'),
        clientName: String(body.clientName ?? 'Unspecified'),
        biNumber,
        serviceType: String(body.serviceType ?? 'Unspecified'),
        particulars: String(body.particulars ?? '—'),
        aging: String(body.aging ?? 'Unspecified'),
        remainingBalance: Number(body.remainingBalance ?? 0),
        committedPaymentDate,
      },
      nowIso
    );
    let commitments = writePersistedCommitments(updatedList);
    const savedRecord = commitments.find(
      (r) => normalizeBiKey(r.biNumber) === normalizeBiKey(biNumber)
    );

    const config = readCommittedPaymentsConfig();
    if (config.webhookUrl && savedRecord) {
      const remote = await forwardToAppsScriptWebhook(config.webhookUrl, 'POST', {
        action: 'upsert',
        commitment: savedRecord,
      });
      if (remote.sheetSynced && remote.commitments) {
        commitments = writePersistedCommitments(remote.commitments);
      }
      res.json({
        ok: true,
        commitments,
        config,
        sheetSynced: remote.sheetSynced,
        deletedCount: remote.deletedCount ?? 0,
        syncedAt: remote.syncedAt,
        warning: remote.warning,
      });
      return;
    }

    res.json({
      ok: true,
      commitments,
      config,
      sheetSynced: false,
    });
  });

  app.post('/api/committed-payments/cleanup', async (req, res) => {
    const body = (req.body ?? {}) as { openBiNumbers?: unknown };
    let commitments = readPersistedCommitments();
    const removedBis: string[] = [];

    if (Array.isArray(body.openBiNumbers) && body.openBiNumbers.length > 0) {
      const openKeys = new Set(
        body.openBiNumbers.map((b) => normalizeBiKey(String(b))).filter(Boolean)
      );
      const filtered: PaymentCommitmentRecord[] = [];
      for (const item of commitments) {
        if (openKeys.has(normalizeBiKey(item.biNumber))) {
          filtered.push(item);
        } else {
          removedBis.push(item.biNumber);
        }
      }
      if (removedBis.length > 0) {
        commitments = writePersistedCommitments(filtered);
      }
    }

    const config = readCommittedPaymentsConfig();
    if (config.webhookUrl) {
      for (const biNumber of removedBis) {
        await forwardToAppsScriptWebhook(config.webhookUrl, 'POST', {
          action: 'delete',
          biNumber,
        });
      }
      const remote = await forwardToAppsScriptWebhook(config.webhookUrl, 'POST', {
        action: 'cleanup',
      });
      if (remote.sheetSynced && remote.commitments) {
        commitments = writePersistedCommitments(remote.commitments);
      }
      res.json({
        ok: true,
        commitments,
        config,
        sheetSynced: remote.sheetSynced,
        deletedCount: Math.max(removedBis.length, remote.deletedCount ?? 0),
        syncedAt: remote.syncedAt,
        warning: remote.warning,
      });
      return;
    }

    res.json({
      ok: true,
      commitments,
      config,
      sheetSynced: false,
      deletedCount: removedBis.length,
    });
  });

  app.delete('/api/committed-payments/:biNumber', async (req, res) => {
    const biNumber = String(req.params.biNumber ?? '').trim();
    if (!biNumber) {
      res.status(400).json({ ok: false, error: 'BI/SOA parameter is required.' });
      return;
    }

    let commitments = writePersistedCommitments(
      removeCommitmentRecord(readPersistedCommitments(), biNumber)
    );
    const config = readCommittedPaymentsConfig();

    if (config.webhookUrl) {
      const remote = await forwardToAppsScriptWebhook(config.webhookUrl, 'POST', {
        action: 'delete',
        biNumber,
      });
      if (remote.sheetSynced && remote.commitments) {
        commitments = writePersistedCommitments(remote.commitments);
      }
      res.json({
        ok: true,
        commitments,
        config,
        sheetSynced: remote.sheetSynced,
        deletedCount: remote.deletedCount ?? 0,
        syncedAt: remote.syncedAt,
        warning: remote.warning,
      });
      return;
    }

    res.json({
      ok: true,
      commitments,
      config,
      sheetSynced: false,
    });
  });

  if (!IS_PRODUCTION) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
