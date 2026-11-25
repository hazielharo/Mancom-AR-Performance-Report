import { ARLineItem, OpenInvoiceItem } from '../types/arReport';
import { COLLECTION_PRIORITY_ORDER, round2 } from './arCalculations';

export const DEFAULT_MAIN_AR_SOURCE_SPREADSHEET_ID =
  '1exqZWTrc736kC5IB7PUYtDiJdk3SqnFEnQ7-NaTCUzg';
export const DEFAULT_MAIN_AR_SOURCE_SHEET_GID = 975333387;
export const DEFAULT_MAIN_AR_SOURCE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_MAIN_AR_SOURCE_SPREADSHEET_ID}/edit?gid=${DEFAULT_MAIN_AR_SOURCE_SHEET_GID}#gid=${DEFAULT_MAIN_AR_SOURCE_SHEET_GID}`;

export const DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID =
  '1SlTtGtx7S37veqqYOjutO3JnXV8iDMDHlN2VVVR_V0k';
export const DEFAULT_COMMITTED_PAYMENTS_SHEET_GID = 2010918633;
export const DEFAULT_COMMITTED_PAYMENTS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID}/edit?gid=${DEFAULT_COMMITTED_PAYMENTS_SHEET_GID}#gid=${DEFAULT_COMMITTED_PAYMENTS_SHEET_GID}`;

export const COMMITTED_PAYMENTS_COLUMNS = [
  'Timestamp',
  'Account Manager',
  'Client Name',
  'BI/SOA',
  'Service Type',
  'Particulars',
  'Aging',
  'Remaining Balance',
  'Committed Payment Date',
] as const;

export interface PaymentCommitmentRecord {
  timestamp: string;
  accountManager: string;
  clientName: string;
  biNumber: string;
  serviceType: string;
  particulars: string;
  aging: string;
  remainingBalance: number;
  committedPaymentDate: string;
}

export interface CommittedPaymentsConfig {
  webhookUrl: string;
  sourceSpreadsheetId?: string;
  sourceSheetGid?: number;
  targetSpreadsheetId?: string;
  targetSheetGid?: number;
}

export const DEFAULT_COMMITTED_PAYMENTS_CONFIG: CommittedPaymentsConfig = {
  webhookUrl: '',
  sourceSpreadsheetId: DEFAULT_MAIN_AR_SOURCE_SPREADSHEET_ID,
  sourceSheetGid: DEFAULT_MAIN_AR_SOURCE_SHEET_GID,
  targetSpreadsheetId: DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID,
  targetSheetGid: DEFAULT_COMMITTED_PAYMENTS_SHEET_GID,
};

export type CommitmentSyncStatus = 'local_only' | 'syncing' | 'synced' | 'error';

export interface CommittedPaymentsStoreResponse {
  ok: boolean;
  commitments: PaymentCommitmentRecord[];
  config: CommittedPaymentsConfig;
  sheetSynced: boolean;
  deletedCount?: number;
  syncedAt?: string;
  warning?: string;
  error?: string;
}

export interface UpsertCommitmentInput {
  accountManager: string;
  clientName: string;
  biNumber: string;
  serviceType: string;
  particulars: string;
  aging: string;
  remainingBalance: number;
  committedPaymentDate: string;
}

export function normalizeBiKey(biNumber: string | undefined | null): string {
  return (biNumber ?? '').trim().toUpperCase();
}

export function validateAppsScriptWebhookUrl(rawUrl: string): {
  valid: boolean;
  normalizedUrl: string;
  error?: string;
} {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: true, normalizedUrl: '' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      normalizedUrl: trimmed,
      error: 'Enter a valid HTTPS Google Apps Script Web App URL (https://script.google.com/macros/s/.../exec).',
    };
  }

  if (parsed.protocol !== 'https:') {
    return {
      valid: false,
      normalizedUrl: trimmed,
      error: 'Only HTTPS Google Apps Script Web App URLs are permitted.',
    };
  }

  if (parsed.username || parsed.password || (parsed.port && parsed.port !== '443')) {
    return {
      valid: false,
      normalizedUrl: trimmed,
      error: 'URL must not contain embedded credentials or non-standard ports.',
    };
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== 'script.google.com' && host !== 'script.googleusercontent.com') {
    return {
      valid: false,
      normalizedUrl: trimmed,
      error: 'Host must be script.google.com or script.googleusercontent.com.',
    };
  }

  const macroPathPattern = /^\/macros\/(?:u\/\d+\/)?s\/[a-zA-Z0-9_-]+\/exec$/;
  if (!macroPathPattern.test(parsed.pathname)) {
    return {
      valid: false,
      normalizedUrl: trimmed,
      error: 'Use the deployed Web App "/exec" URL (ending in /exec, not /dev).',
    };
  }

  return { valid: true, normalizedUrl: parsed.toString() };
}

export function isValidIsoDate(dateStr: string): boolean {
  const trimmed = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  const [y, m, d] = trimmed.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function formatCommittedDateLabel(isoDate: string): string {
  const trimmed = isoDate.trim();
  if (!isValidIsoDate(trimmed)) return trimmed;
  const [y, m, d] = trimmed.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function buildClientOpenInvoices(
  openInvoices: OpenInvoiceItem[] | undefined,
  clientName: string,
  fallbackLineItems?: ARLineItem[]
): OpenInvoiceItem[] {
  const targetKey = clientName.trim().toUpperCase();
  if (!targetKey) return [];

  const matched = (openInvoices ?? []).filter(
    (inv) =>
      inv.client.trim().toUpperCase() === targetKey &&
      inv.remainingBalance > 0.005
  );

  if (matched.length > 0) {
    return matched.slice().sort((a, b) => {
      const pA = COLLECTION_PRIORITY_ORDER[a.aging] ?? 50;
      const pB = COLLECTION_PRIORITY_ORDER[b.aging] ?? 50;
      if (pA !== pB) return pA - pB;
      if (Math.abs(b.remainingBalance - a.remainingBalance) > 0.005) {
        return b.remainingBalance - a.remainingBalance;
      }
      return a.biNumber.localeCompare(b.biNumber);
    });
  }

  // Fallback if itemized invoices haven't finished loading yet
  return (fallbackLineItems ?? [])
    .filter(
      (line) =>
        line.client.trim().toUpperCase() === targetKey &&
        line.remainingBalance > 0.005
    )
    .sort((a, b) => {
      const pA = COLLECTION_PRIORITY_ORDER[a.agingBucket] ?? 50;
      const pB = COLLECTION_PRIORITY_ORDER[b.agingBucket] ?? 50;
      if (pA !== pB) return pA - pB;
      return b.remainingBalance - a.remainingBalance;
    })
    .map((line, idx) => ({
      biNumber: `SUMMARY-${idx + 1}`,
      serviceType: line.serviceType || 'Unspecified',
      client: line.client,
      areaManager: line.areaManager,
      aging: line.agingBucket,
      particulars: 'Consolidated AR balance',
      arTag: '',
      isPriorAr: true,
      billed: round2(line.remainingBalance),
      collected: 0,
      remainingBalance: round2(line.remainingBalance),
    }));
}

export function upsertCommitmentRecord(
  existing: PaymentCommitmentRecord[],
  input: UpsertCommitmentInput,
  timestampIso = new Date().toISOString()
): PaymentCommitmentRecord[] {
  const biKey = normalizeBiKey(input.biNumber);
  if (!biKey) return existing;

  const nextRecord: PaymentCommitmentRecord = {
    timestamp: timestampIso,
    accountManager: (input.accountManager || 'Unspecified').trim(),
    clientName: (input.clientName || 'Unspecified').trim(),
    biNumber: input.biNumber.trim(),
    serviceType: (input.serviceType || 'Unspecified').trim(),
    particulars: (input.particulars || '—').trim(),
    aging: (input.aging || 'Unspecified').trim(),
    remainingBalance: round2(Number(input.remainingBalance) || 0),
    committedPaymentDate: input.committedPaymentDate.trim(),
  };

  let replaced = false;
  const nextList = existing.map((item) => {
    if (normalizeBiKey(item.biNumber) === biKey) {
      replaced = true;
      return nextRecord;
    }
    return item;
  });

  if (!replaced) {
    nextList.push(nextRecord);
  }
  return nextList;
}

export function removeCommitmentRecord(
  existing: PaymentCommitmentRecord[],
  biNumber: string
): PaymentCommitmentRecord[] {
  const biKey = normalizeBiKey(biNumber);
  if (!biKey) return existing;
  return existing.filter((item) => normalizeBiKey(item.biNumber) !== biKey);
}

/**
 * Automatically prunes any committed BI/SOA that no longer appears with a
 * positive remaining balance (> 0.005) in the authoritative openInvoices list.
 */
export function prunePaidCommitmentRecords(
  existing: PaymentCommitmentRecord[],
  openInvoices: OpenInvoiceItem[] | undefined
): { remaining: PaymentCommitmentRecord[]; removedBiNumbers: string[] } {
  if (!openInvoices || openInvoices.length === 0 || existing.length === 0) {
    return { remaining: existing, removedBiNumbers: [] };
  }

  const openBiKeys = new Set<string>();
  for (const inv of openInvoices) {
    if (inv.remainingBalance > 0.005) {
      const key = normalizeBiKey(inv.biNumber);
      if (key) openBiKeys.add(key);
    }
  }

  const remaining: PaymentCommitmentRecord[] = [];
  const removedBiNumbers: string[] = [];

  for (const rec of existing) {
    const key = normalizeBiKey(rec.biNumber);
    if (key && !openBiKeys.has(key)) {
      removedBiNumbers.push(rec.biNumber);
    } else {
      remaining.push(rec);
    }
  }

  return { remaining, removedBiNumbers };
}

export function indexCommitmentsByBi(
  records: PaymentCommitmentRecord[]
): Record<string, PaymentCommitmentRecord> {
  const map: Record<string, PaymentCommitmentRecord> = {};
  for (const rec of records) {
    const key = normalizeBiKey(rec.biNumber);
    if (key) map[key] = rec;
  }
  return map;
}

export function countCommitmentsByClient(
  records: PaymentCommitmentRecord[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const rec of records) {
    const key = rec.clientName.trim().toUpperCase();
    if (key) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}

export function buildAppsScriptCode(
  sourceSpreadsheetId?: string,
  targetSpreadsheetId?: string,
  sourceSheetGid = DEFAULT_MAIN_AR_SOURCE_SHEET_GID,
  targetSheetGid = DEFAULT_COMMITTED_PAYMENTS_SHEET_GID
): string {
  const cleanSourceId =
    sourceSpreadsheetId && /^[a-zA-Z0-9_-]{15,120}$/.test(sourceSpreadsheetId.trim())
      ? sourceSpreadsheetId.trim()
      : DEFAULT_MAIN_AR_SOURCE_SPREADSHEET_ID;

  const cleanTargetId =
    targetSpreadsheetId && /^[a-zA-Z0-9_-]{15,120}$/.test(targetSpreadsheetId.trim())
      ? targetSpreadsheetId.trim()
      : DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID;

  const cleanSourceGid = Number.isFinite(sourceSheetGid)
    ? Math.trunc(sourceSheetGid)
    : DEFAULT_MAIN_AR_SOURCE_SHEET_GID;
  const cleanTargetGid = Number.isFinite(targetSheetGid)
    ? Math.trunc(targetSheetGid)
    : DEFAULT_COMMITTED_PAYMENTS_SHEET_GID;

  return `/**
 * Asia Affinity® AR Report — Committed Payments Two-Way Google Sheets Sync
 *
 * STRICT READ-ONLY SOURCE PROTECTION:
 * - Main AR Monitoring Spreadsheet (${cleanSourceId}, GID: ${cleanSourceGid})
 *   is STRICTLY READ-ONLY. Never modified, edited, or deleted from by this script.
 * - Committed Payments Dump Spreadsheet (${cleanTargetId}, GID: ${cleanTargetGid})
 *   is the EXCLUSIVE target for commitment appends/updates and paid-invoice row deletions.
 *
 * Deployment Steps:
 * 1. Open Committed Payments Spreadsheet (${cleanTargetId}) -> Extensions -> Apps Script.
 * 2. Paste this code and run setupCommittedPaymentsSheet() once.
 * 3. Run installAutoCleanupTriggers() to enable automatic hourly + source onChange cleanup.
 * 4. Deploy -> New deployment -> Web app (Execute as: Me | Who has access: Anyone).
 * 5. Paste the /exec Web App URL into Manage Report Data -> Committed Payments.
 */

var SOURCE_AR_SPREADSHEET_ID = '${cleanSourceId}'; // STRICTLY READ-ONLY SOURCE
var SOURCE_AR_SHEET_GID = ${cleanSourceGid};
var SOURCE_AR_TAB_NAME = 'AR_MONITORING_FOR_APPSHEET';

var COMMITTED_PAYMENTS_SPREADSHEET_ID = '${cleanTargetId}'; // EXCLUSIVE WRITE/DELETE TARGET
var COMMITTED_PAYMENTS_SHEET_GID = ${cleanTargetGid};
var COMMITTED_TAB_NAME = 'COMMITTED_PAYMENTS';

var COMMITTED_HEADERS = [
  'Timestamp',
  'Account Manager',
  'Client Name',
  'BI/SOA',
  'Service Type',
  'Particulars',
  'Aging',
  'Remaining Balance',
  'Committed Payment Date',
];

function setupCommittedPaymentsSheet() {
  var sheet = getOrCreateCommittedSheet_();
  assertCommittedTargetOnly_(sheet);
  ensureHeaders_(sheet);
  return { ok: true, sheetName: sheet.getName(), sheetId: sheet.getSheetId() };
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Committed Payments Sync')
    .addItem('Initialize COMMITTED_PAYMENTS Tab', 'setupCommittedPaymentsSheet')
    .addItem('Clean Paid BIs Now', 'cleanupPaidCommitments')
    .addItem('Enable Auto-Cleanup Triggers', 'installAutoCleanupTriggers')
    .addToUi();
}

function installAutoCleanupTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'cleanupPaidCommitments') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('cleanupPaidCommitments').timeBased().everyHours(1).create();

  if (isConfiguredId_(SOURCE_AR_SPREADSHEET_ID)) {
    try {
      var sourceSs = SpreadsheetApp.openById(SOURCE_AR_SPREADSHEET_ID);
      ScriptApp.newTrigger('cleanupPaidCommitments').forSpreadsheet(sourceSs).onChange().create();
    } catch (err) {
      Logger.log('Could not attach read-only onChange listener to source AR spreadsheet: ' + err);
    }
  }
}

function doGet(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var action = (e && e.parameter && e.parameter.action) || 'list';
    if (action === 'ar_rows') {
      return jsonResponse_({
        ok: true,
        arValues: readSourceArDisplayValues_(),
        syncedAt: new Date().toISOString(),
      });
    }

    var deletedCount = 0;
    if (action === 'cleanup' || isConfiguredId_(SOURCE_AR_SPREADSHEET_ID)) {
      deletedCount = cleanupPaidCommitmentsInternal_();
    }
    return jsonResponse_({
      ok: true,
      commitments: readCommittedRecords_(),
      deletedCount: deletedCount,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err && err.message ? err.message : String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var rawBody = (e && e.postData && e.postData.contents) || '{}';
    var payload = JSON.parse(rawBody);
    var action = String(payload.action || 'upsert').toLowerCase();
    var sheet = getOrCreateCommittedSheet_();
    assertCommittedTargetOnly_(sheet);
    ensureHeaders_(sheet);

    var deletedCount = 0;
    if (action === 'upsert') {
      upsertCommitmentRow_(sheet, payload.commitment || payload);
      if (isConfiguredId_(SOURCE_AR_SPREADSHEET_ID)) deletedCount = cleanupPaidCommitmentsInternal_();
    } else if (action === 'delete') {
      deleteCommitmentByBi_(sheet, payload.biNumber || (payload.commitment && payload.commitment.biNumber));
    } else if (action === 'cleanup') {
      deletedCount = cleanupPaidCommitmentsInternal_();
    } else if (action !== 'list') {
      return jsonResponse_({ ok: false, error: 'Unsupported action: ' + action });
    }

    return jsonResponse_({
      ok: true,
      commitments: readCommittedRecords_(),
      deletedCount: deletedCount,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err && err.message ? err.message : String(err) });
  } finally {
    lock.releaseLock();
  }
}

function cleanupPaidCommitments() {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return cleanupPaidCommitmentsInternal_();
  } finally {
    lock.releaseLock();
  }
}

function readSourceArSheet_() {
  if (!isConfiguredId_(SOURCE_AR_SPREADSHEET_ID)) return null;
  var sourceSs = SpreadsheetApp.openById(SOURCE_AR_SPREADSHEET_ID);
  return getSheetByGidOrName_(sourceSs, SOURCE_AR_SHEET_GID, SOURCE_AR_TAB_NAME) || sourceSs.getSheets()[0];
}

function readSourceArDisplayValues_() {
  var sourceSheet = readSourceArSheet_();
  if (!sourceSheet || sourceSheet.getLastRow() < 1) return [];
  return sourceSheet.getDataRange().getDisplayValues();
}

function cleanupPaidCommitmentsInternal_() {
  if (!isConfiguredId_(SOURCE_AR_SPREADSHEET_ID)) return 0;

  var committedSheet = getOrCreateCommittedSheet_();
  assertCommittedTargetOnly_(committedSheet);
  ensureHeaders_(committedSheet);
  var lastRow = committedSheet.getLastRow();
  if (lastRow < 2) return 0;

  var sourceSheet = readSourceArSheet_();
  if (!sourceSheet || sourceSheet.getLastRow() < 2) return 0;

  var sourceValues = sourceSheet.getDataRange().getValues();
  var sourceHeaders = sourceValues[0].map(function (h) { return String(h || '').trim().toUpperCase(); });

  var biIdx = sourceHeaders.indexOf('BI/SOA');
  var invIdx = sourceHeaders.indexOf('INVOICE #');
  var tempIdx = sourceHeaders.indexOf('TEMP INV #');
  var remIdx = sourceHeaders.indexOf('REMAINING BALANCE');
  var billedIdx = sourceHeaders.indexOf('BILLED AMOUNT');
  var collIdx = sourceHeaders.indexOf('COLLECTION');
  var statusIdx = sourceHeaders.indexOf('STATUS');

  var biLedgerMap = {};
  for (var r = 1; r < sourceValues.length; r++) {
    var row = sourceValues[r];
    var biRaw = (biIdx >= 0 ? row[biIdx] : '') || (invIdx >= 0 ? row[invIdx] : '') || (tempIdx >= 0 ? row[tempIdx] : '') || '';
    var biKey = normalizeBiKey_(biRaw);
    if (!biKey) continue;

    var billed = billedIdx >= 0 ? parseAccountingNumber_(row[billedIdx]) : 0;
    var coll = collIdx >= 0 ? parseAccountingNumber_(row[collIdx]) : 0;
    var rem = remIdx >= 0 ? parseAccountingNumber_(row[remIdx]) : billed - coll;
    var statusText = statusIdx >= 0 ? String(row[statusIdx] || '').trim().toUpperCase() : '';

    if (!biLedgerMap[biKey]) biLedgerMap[biKey] = { totalRemaining: 0, rowCount: 0, paidRowCount: 0 };
    biLedgerMap[biKey].totalRemaining += rem;
    biLedgerMap[biKey].rowCount += 1;
    if (statusText === 'PAID' || statusText === 'SETTLED') biLedgerMap[biKey].paidRowCount += 1;
  }

  var committedValues = committedSheet.getRange(2, 1, lastRow - 1, COMMITTED_HEADERS.length).getValues();
  var rowsToDelete = [];
  for (var i = 0; i < committedValues.length; i++) {
    var committedBiKey = normalizeBiKey_(committedValues[i][3]);
    if (!committedBiKey) continue;
    var stats = biLedgerMap[committedBiKey];
    if (!stats) continue;
    if (stats.totalRemaining <= 0.005 || (stats.rowCount > 0 && stats.paidRowCount === stats.rowCount)) {
      rowsToDelete.push(i + 2);
    }
  }

  // Delete exclusively from Committed Payments target spreadsheet (bottom-to-top)
  assertCommittedTargetOnly_(committedSheet);
  for (var d = rowsToDelete.length - 1; d >= 0; d--) {
    committedSheet.deleteRow(rowsToDelete[d]);
  }
  return rowsToDelete.length;
}

function upsertCommitmentRow_(sheet, item) {
  assertCommittedTargetOnly_(sheet);
  if (!item) throw new Error('Missing commitment payload.');
  var biNumber = String(item.biNumber || '').trim();
  if (!biNumber) throw new Error('BI/SOA is required.');

  var rowValues = [
    String(item.timestamp || new Date().toISOString()),
    String(item.accountManager || 'Unspecified').trim(),
    String(item.clientName || 'Unspecified').trim(),
    biNumber,
    String(item.serviceType || 'Unspecified').trim(),
    String(item.particulars || '—').trim(),
    String(item.aging || 'Unspecified').trim(),
    Number(item.remainingBalance || 0),
    String(item.committedPaymentDate || '').trim(),
  ];

  var biKey = normalizeBiKey_(biNumber);
  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    var biColumn = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
    for (var i = 0; i < biColumn.length; i++) {
      if (normalizeBiKey_(biColumn[i][0]) === biKey) {
        sheet.getRange(i + 2, 1, 1, COMMITTED_HEADERS.length).setValues([rowValues]);
        sheet.getRange(i + 2, 8).setNumberFormat('#,##0.00');
        sheet.getRange(i + 2, 9).setNumberFormat('@');
        return;
      }
    }
  }

  sheet.appendRow(rowValues);
  var appendedRow = sheet.getLastRow();
  sheet.getRange(appendedRow, 8).setNumberFormat('#,##0.00');
  sheet.getRange(appendedRow, 9).setNumberFormat('@');
}

function deleteCommitmentByBi_(sheet, biNumberRaw) {
  assertCommittedTargetOnly_(sheet);
  var biKey = normalizeBiKey_(biNumberRaw);
  if (!biKey) return 0;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  var biColumn = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
  var deleted = 0;
  for (var i = biColumn.length - 1; i >= 0; i--) {
    if (normalizeBiKey_(biColumn[i][0]) === biKey) {
      sheet.deleteRow(i + 2);
      deleted += 1;
    }
  }
  return deleted;
}

function readCommittedRecords_() {
  var sheet = getOrCreateCommittedSheet_();
  assertCommittedTargetOnly_(sheet);
  ensureHeaders_(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, COMMITTED_HEADERS.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var bi = String(row[3] || '').trim();
    if (!bi) continue;
    var committedDate = row[8];
    if (committedDate instanceof Date) {
      committedDate = Utilities.formatDate(committedDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }
    out.push({
      timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ''),
      accountManager: String(row[1] || 'Unspecified').trim(),
      clientName: String(row[2] || 'Unspecified').trim(),
      biNumber: bi,
      serviceType: String(row[4] || 'Unspecified').trim(),
      particulars: String(row[5] || '—').trim(),
      aging: String(row[6] || 'Unspecified').trim(),
      remainingBalance: Number(row[7] || 0),
      committedPaymentDate: String(committedDate || '').trim(),
    });
  }
  return out;
}

function getOrCreateCommittedSheet_() {
  var ss = isConfiguredId_(COMMITTED_PAYMENTS_SPREADSHEET_ID)
    ? SpreadsheetApp.openById(COMMITTED_PAYMENTS_SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getId() === SOURCE_AR_SPREADSHEET_ID) {
    throw new Error('SAFETY STOP: Main AR Monitoring spreadsheet cannot be used as Committed Payments target.');
  }
  return (
    getSheetByGidOrName_(ss, COMMITTED_PAYMENTS_SHEET_GID, COMMITTED_TAB_NAME) ||
    ss.insertSheet(COMMITTED_TAB_NAME)
  );
}

function getSheetByGidOrName_(ss, gid, tabName) {
  var sheets = ss.getSheets();
  if (typeof gid === 'number' && gid >= 0) {
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getSheetId() === gid) return sheets[i];
    }
  }
  return tabName ? ss.getSheetByName(tabName) : null;
}

function assertCommittedTargetOnly_(sheet) {
  if (!sheet) throw new Error('Missing Committed Payments sheet.');
  var parentId = sheet.getParent().getId();
  if (parentId === SOURCE_AR_SPREADSHEET_ID) {
    throw new Error('SAFETY STOP: Main AR Monitoring spreadsheet is strictly read-only and cannot be modified.');
  }
  if (isConfiguredId_(COMMITTED_PAYMENTS_SPREADSHEET_ID) && parentId !== COMMITTED_PAYMENTS_SPREADSHEET_ID) {
    throw new Error('SAFETY STOP: Writes and deletions are restricted exclusively to Committed Payments spreadsheet ' + COMMITTED_PAYMENTS_SPREADSHEET_ID);
  }
}

function ensureHeaders_(sheet) {
  assertCommittedTargetOnly_(sheet);
  var firstRow = sheet.getRange(1, 1, 1, COMMITTED_HEADERS.length).getValues()[0];
  var needsHeaders = false;
  for (var i = 0; i < COMMITTED_HEADERS.length; i++) {
    if (String(firstRow[i] || '').trim() !== COMMITTED_HEADERS[i]) {
      needsHeaders = true;
      break;
    }
  }
  if (needsHeaders) {
    var headerRange = sheet.getRange(1, 1, 1, COMMITTED_HEADERS.length);
    headerRange.setValues([COMMITTED_HEADERS]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#D8C136');
    sheet.setFrozenRows(1);
  }
}

function isConfiguredId_(value) {
  return (
    typeof value === 'string' &&
    value.trim().length > 10 &&
    value.indexOf('PASTE_') !== 0
  );
}

function normalizeBiKey_(value) {
  return String(value || '').trim().toUpperCase();
}

function parseAccountingNumber_(raw) {
  if (typeof raw === 'number') return isFinite(raw) ? raw : 0;
  var text = String(raw || '').trim();
  if (!text || text === '-') return 0;
  var negative = /^\\(.*\\)$/.test(text);
  var cleaned = text.replace(/[₱,\\s()]/g, '');
  var num = Number(cleaned);
  if (!isFinite(num)) return 0;
  return negative ? -Math.abs(num) : num;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}`;
}

export async function fetchCommittedPayments(): Promise<CommittedPaymentsStoreResponse> {
  const res = await fetch('/api/committed-payments', { cache: 'no-store' });
  const data = (await res.json()) as CommittedPaymentsStoreResponse;
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load committed payments.');
  }
  return data;
}

export async function saveCommittedPaymentsConfig(
  config: CommittedPaymentsConfig
): Promise<CommittedPaymentsStoreResponse> {
  const res = await fetch('/api/committed-payments/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  const data = (await res.json()) as CommittedPaymentsStoreResponse;
  if (!res.ok) {
    throw new Error(data.error || 'Failed to save Apps Script sync configuration.');
  }
  return data;
}

export async function upsertCommittedPayment(
  input: UpsertCommitmentInput
): Promise<CommittedPaymentsStoreResponse> {
  const res = await fetch('/api/committed-payments/upsert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as CommittedPaymentsStoreResponse;
  if (!res.ok) {
    throw new Error(data.error || 'Failed to save payment commitment.');
  }
  return data;
}

export async function deleteCommittedPayment(
  biNumber: string
): Promise<CommittedPaymentsStoreResponse> {
  const res = await fetch(`/api/committed-payments/${encodeURIComponent(biNumber)}`, {
    method: 'DELETE',
  });
  const data = (await res.json()) as CommittedPaymentsStoreResponse;
  if (!res.ok) {
    throw new Error(data.error || 'Failed to remove payment commitment.');
  }
  return data;
}

export async function runCommittedPaymentsCleanup(
  openBiNumbers?: string[]
): Promise<CommittedPaymentsStoreResponse> {
  const res = await fetch('/api/committed-payments/cleanup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ openBiNumbers }),
  });
  const data = (await res.json()) as CommittedPaymentsStoreResponse;
  if (!res.ok) {
    throw new Error(data.error || 'Failed to synchronize committed payments.');
  }
  return data;
}
