export const DEFAULT_MAIN_AR_SPREADSHEET_ID =
  '1exqZWTrc736kC5IB7PUYtDiJdk3SqnFEnQ7-NaTCUzg';
export const DEFAULT_MAIN_AR_SHEET_GID = 975333387;
export const DEFAULT_MAIN_AR_SHEET_TITLE = 'AR_MONITORING_FOR_APPSHEET';
export const DEFAULT_MAIN_AR_SPREADSHEET_TITLE =
  'Main AR Monitoring (Read-Only Source)';
export const DEFAULT_MAIN_AR_SHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_MAIN_AR_SPREADSHEET_ID}/edit?gid=${DEFAULT_MAIN_AR_SHEET_GID}#gid=${DEFAULT_MAIN_AR_SHEET_GID}`;

export interface SheetTabInfo {
  sheetId: number;
  title: string;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: SheetTabInfo[];
}

export interface LiveSheetConfig {
  spreadsheetId: string;
  spreadsheetTitle: string;
  sheetTitle: string;
  sheetGid?: number;
  availableTabs: SheetTabInfo[];
  pollIntervalSec: number; // 0 = manual only, else seconds (15, 30, 60, 300)
}

export const DEFAULT_LIVE_SHEET_CONFIG: LiveSheetConfig = {
  spreadsheetId: DEFAULT_MAIN_AR_SPREADSHEET_ID,
  spreadsheetTitle: DEFAULT_MAIN_AR_SPREADSHEET_TITLE,
  sheetTitle: DEFAULT_MAIN_AR_SHEET_TITLE,
  sheetGid: DEFAULT_MAIN_AR_SHEET_GID,
  availableTabs: [
    {
      sheetId: DEFAULT_MAIN_AR_SHEET_GID,
      title: DEFAULT_MAIN_AR_SHEET_TITLE,
    },
  ],
  pollIntervalSec: 30,
};

export type LiveSyncStatus =
  | 'disconnected'
  | 'auth_required'
  | 'syncing'
  | 'live'
  | 'error';

export interface LiveArSyncResponse {
  ok: boolean;
  csv: string;
  syncedAt: string;
  source: 'google_sheets_csv' | 'apps_script' | 'admin_live_sync' | 'linked_snapshot';
  liveSheetAccessible: boolean;
  spreadsheetId: string;
  sheetGid: number;
  warning?: string;
}

export class GoogleSheetsApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GoogleSheetsApiError';
    this.status = status;
  }
}

export function buildPublicSheetCsvUrl(
  spreadsheetId: string,
  gid?: number
): string {
  const cleanId = encodeURIComponent(spreadsheetId.trim());
  const gidParam =
    typeof gid === 'number' && Number.isFinite(gid) && gid >= 0
      ? `&gid=${Math.trunc(gid)}`
      : '';
  return `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv${gidParam}`;
}

/**
 * Extracts a Google Spreadsheet ID from either a full Google Sheets URL
 * (e.g. https://docs.google.com/spreadsheets/d/1abc.../edit#gid=0)
 * or a raw spreadsheet ID string.
 */
export function extractSpreadsheetId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]{10,})/);
  if (urlMatch?.[1]) {
    return urlMatch[1];
  }

  const rawIdMatch = trimmed.match(/^[a-zA-Z0-9-_]{15,120}$/);
  if (rawIdMatch) {
    return trimmed;
  }

  return null;
}

/**
 * Picks the most relevant tab name without hardcoding "Sheet1".
 * Matches preferred GID when provided, else prefers tabs mentioning
 * "AR MONITORING" or "APPSHEET", otherwise falls back to the first tab.
 */
export function pickDefaultSheetTab(
  sheets: SheetTabInfo[],
  preferredGid?: number
): string {
  if (!sheets || sheets.length === 0) return '';
  if (typeof preferredGid === 'number' && Number.isFinite(preferredGid)) {
    const byGid = sheets.find((s) => s.sheetId === preferredGid);
    if (byGid) return byGid.title;
  }
  const preferred = sheets.find((s) => {
    const upper = s.title.toUpperCase();
    return upper.includes('AR MONITORING') || upper.includes('APPSHEET');
  });
  return (preferred ?? sheets[0]).title;
}

function escapeCsvCell(raw: unknown): string {
  const str = raw === null || raw === undefined ? '' : String(raw);
  if (
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts a 2D Google Sheets `values` response matrix into RFC-4180 CSV text
 * suitable for `parseAppSheetARCSV`, normalizing ragged row widths cleanly.
 */
export function sheetValuesToCSV(values: unknown[][]): string {
  if (!values || values.length === 0) return '';

  const headerRaw = values[0] ?? [];
  let headerWidth = headerRaw.length;
  while (
    headerWidth > 0 &&
    String(headerRaw[headerWidth - 1] ?? '').trim() === ''
  ) {
    headerWidth -= 1;
  }
  if (headerWidth === 0) return '';

  const lines: string[] = [];
  for (let r = 0; r < values.length; r += 1) {
    const row = values[r] ?? [];
    // Keep header row; skip completely blank rows
    if (r > 0 && row.every((cell) => String(cell ?? '').trim() === '')) {
      continue;
    }
    const cells: string[] = [];
    for (let c = 0; c < headerWidth; c += 1) {
      cells.push(escapeCsvCell(row[c] ?? ''));
    }
    lines.push(cells.join(','));
  }

  return lines.join('\n');
}

/**
 * Computes a fast deterministic fingerprint over cell contents so periodic
 * background polling only triggers dashboard recalculation when values change.
 */
export function computeSheetFingerprint(values: unknown[][]): string {
  let hash = 2166136261;
  let cellCount = 0;
  for (let r = 0; r < values.length; r += 1) {
    const row = values[r] ?? [];
    for (let c = 0; c < row.length; c += 1) {
      const s = String(row[c] ?? '');
      cellCount += 1;
      for (let i = 0; i < s.length; i += 1) {
        hash ^= s.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      hash ^= 0x1f;
      hash = Math.imul(hash, 16777619);
    }
    hash ^= 0x0a;
    hash = Math.imul(hash, 16777619);
  }
  return `${values.length}:${cellCount}:${(hash >>> 0).toString(16)}`;
}

export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
): Promise<SpreadsheetMetadata> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}?fields=properties.title,sheets.properties(sheetId,title)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg =
      body?.error?.message ||
      `Unable to read spreadsheet metadata (HTTP ${res.status}).`;
    throw new GoogleSheetsApiError(msg, res.status);
  }

  const data = await res.json();
  const sheets: SheetTabInfo[] = Array.isArray(data?.sheets)
    ? data.sheets
        .map((s: any) => ({
          sheetId: Number(s?.properties?.sheetId ?? 0),
          title: String(s?.properties?.title ?? ''),
        }))
        .filter((s: SheetTabInfo) => s.title.length > 0)
    : [];

  return {
    spreadsheetId,
    title: String(data?.properties?.title ?? 'Untitled Spreadsheet'),
    sheets,
  };
}

export async function fetchSheetValues(
  spreadsheetId: string,
  sheetTitle: string,
  accessToken: string
): Promise<unknown[][]> {
  const escapedTab = `'${sheetTitle.replace(/'/g, "''")}'`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(escapedTab)}?valueRenderOption=FORMATTED_VALUE`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg =
      body?.error?.message ||
      `Unable to fetch rows from tab "${sheetTitle}" (HTTP ${res.status}).`;
    throw new GoogleSheetsApiError(msg, res.status);
  }

  const data = await res.json();
  return Array.isArray(data?.values) ? data.values : [];
}

export async function fetchLiveArSyncSnapshot(
  force = false
): Promise<LiveArSyncResponse> {
  const res = await fetch(
    `/api/live-ar-sync${force ? '?force=1' : ''}`,
    { cache: 'no-store' }
  );
  const data = (await res.json()) as LiveArSyncResponse & { error?: string };
  if (!res.ok || !data.ok) {
    throw new Error(data?.error || `Live AR sync failed (HTTP ${res.status}).`);
  }
  return data;
}

export async function saveServerLiveArSnapshot(
  payload: {
    csv: string;
    syncedAt?: string;
    spreadsheetId?: string;
    sheetGid?: number;
  },
  adminToken: string
): Promise<boolean> {
  if (!adminToken || !payload.csv.trim()) return false;
  try {
    const res = await fetch('/api/live-ar-snapshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

