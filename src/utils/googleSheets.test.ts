import test from 'node:test';
import assert from 'node:assert/strict';
import { BASELINE_AR_DATA } from '../data/baselineData';
import { parseARReportCSV } from './arCalculations';
import {
  buildPublicSheetCsvUrl,
  computeSheetFingerprint,
  DEFAULT_LIVE_SHEET_CONFIG,
  DEFAULT_MAIN_AR_SHEET_GID,
  DEFAULT_MAIN_AR_SPREADSHEET_ID,
  extractSpreadsheetId,
  fetchPublicSheetCsv,
  GoogleSheetsApiError,
  pickDefaultSheetTab,
  sheetValuesToCSV,
  startSheetRefresh,
  SUPPLEMENTAL_AR_SHEET_GID,
} from './googleSheets';
import { DEFAULT_COMMITTED_PAYMENTS_SHEET_GID, DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID } from './paymentCommitments';
import { buildAllReportSheets, buildSupplementalArSheet } from './reportSheets';

test('default Main AR Monitoring spreadsheet config is pre-populated as read-only source', () => {
  assert.equal(DEFAULT_MAIN_AR_SPREADSHEET_ID, '1exqZWTrc736kC5IB7PUYtDiJdk3SqnFEnQ7-NaTCUzg');
  assert.equal(DEFAULT_MAIN_AR_SHEET_GID, 975333387);
  assert.equal(DEFAULT_LIVE_SHEET_CONFIG.spreadsheetId, '1exqZWTrc736kC5IB7PUYtDiJdk3SqnFEnQ7-NaTCUzg');
  assert.equal(DEFAULT_LIVE_SHEET_CONFIG.sheetGid, 975333387);
  assert.equal(
    buildPublicSheetCsvUrl(DEFAULT_MAIN_AR_SPREADSHEET_ID, DEFAULT_MAIN_AR_SHEET_GID),
    'https://docs.google.com/spreadsheets/d/1exqZWTrc736kC5IB7PUYtDiJdk3SqnFEnQ7-NaTCUzg/export?format=csv&gid=975333387'
  );
});

test('reads all configured exports anonymously with a fresh cache-buster', async (context) => {
  const csv = 'Column\nvalue';
  const fetchMock = context.mock.method(globalThis, 'fetch', async (_url: string, _init: RequestInit) =>
    new Response(csv, { headers: { 'Content-Type': 'text/csv' } })
  );
  const clock = context.mock.method(Date, 'now', () => 1000);
  const tabs = [
    [DEFAULT_MAIN_AR_SPREADSHEET_ID, DEFAULT_MAIN_AR_SHEET_GID],
    [DEFAULT_MAIN_AR_SPREADSHEET_ID, SUPPLEMENTAL_AR_SHEET_GID],
    [DEFAULT_COMMITTED_PAYMENTS_SPREADSHEET_ID, DEFAULT_COMMITTED_PAYMENTS_SHEET_GID],
  ] as const;

  for (const [spreadsheetId, gid] of tabs) {
    assert.equal(await fetchPublicSheetCsv(spreadsheetId, gid), csv);
  }
  clock.mock.mockImplementation(() => 2000);
  assert.equal(await fetchPublicSheetCsv(...tabs[0]), csv);
  assert.equal(fetchMock.mock.callCount(), 4);

  for (const [index, call] of fetchMock.mock.calls.entries()) {
    const [spreadsheetId, gid] = tabs[index % tabs.length];
    const [request, options] = call.arguments;
    const url = new URL(String(request));
    assert.equal(url.pathname, `/spreadsheets/d/${spreadsheetId}/export`);
    assert.equal(url.searchParams.get('gid'), String(gid));
    assert.equal(url.searchParams.get('cb'), index < tabs.length ? '1000' : '2000');
    assert.equal(options?.cache, 'no-store');
    assert.equal(options?.credentials, 'omit');
  }
});

test('uses an uncached GViz CSV when the browser blocks the CSV export redirect', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => new Response('Column\nvalue'));
  fetchMock.mock.mockImplementationOnce(async () => { throw new TypeError('Failed to fetch'); });
  assert.equal(await fetchPublicSheetCsv(DEFAULT_MAIN_AR_SPREADSHEET_ID, SUPPLEMENTAL_AR_SHEET_GID), 'Column\nvalue');
  const [request, options] = fetchMock.mock.calls[1].arguments;
  const url = new URL(String(request));
  assert.match(url.pathname, /\/gviz\/tq$/);
  assert.equal(url.searchParams.get('tqx'), 'out:csv');
  assert.equal(url.searchParams.get('gid'), String(SUPPLEMENTAL_AR_SHEET_GID));
  assert.match(url.searchParams.get('cb') ?? '', /^\d+$/);
  assert.equal(options?.cache, 'no-store');
});

test('reports private exports instead of using a login page as data', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => new Response('Sign in', { status: 401 }));
  await assert.rejects(
    fetchPublicSheetCsv(DEFAULT_MAIN_AR_SPREADSHEET_ID, DEFAULT_MAIN_AR_SHEET_GID),
    (error: unknown) => error instanceof GoogleSheetsApiError && error.status === 401
  );
});

test('refreshes on mount, every 30 seconds, on focus, and when visible again', async (context) => {
  const browserWindow = new EventTarget();
  const browserDocument = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  let intervalCallback = () => {};
  let intervalMs = 0;
  const clearInterval = context.mock.fn();
  const preexistingWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const preexistingDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: Object.assign(browserWindow, {
    setInterval: (callback: () => void, ms: number) => {
      intervalCallback = callback;
      intervalMs = ms;
      return 42;
    },
    clearInterval,
  }) });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: browserDocument });
  context.after(() => {
    if (preexistingWindow) Object.defineProperty(globalThis, 'window', preexistingWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (preexistingDocument) Object.defineProperty(globalThis, 'document', preexistingDocument);
    else Reflect.deleteProperty(globalThis, 'document');
  });

  const refresh = context.mock.fn(async (_signal: AbortSignal) => {});
  const stop = startSheetRefresh(refresh);
  assert.equal(intervalMs, 30_000);
  intervalCallback();
  assert.equal(refresh.mock.callCount(), 1, 'Does not stack requests already in flight');
  await Promise.resolve();
  intervalCallback();
  await Promise.resolve();
  browserWindow.dispatchEvent(new Event('focus'));
  await Promise.resolve();
  browserDocument.visibilityState = 'hidden';
  browserDocument.dispatchEvent(new Event('visibilitychange'));
  assert.equal(refresh.mock.callCount(), 3);
  browserDocument.visibilityState = 'visible';
  browserDocument.dispatchEvent(new Event('visibilitychange'));
  assert.equal(refresh.mock.callCount(), 4);

  stop();
  assert.deepEqual(clearInterval.mock.calls[0].arguments, [42]);
  assert.equal(refresh.mock.calls[0].arguments[0].aborted, true);
  await Promise.resolve();
  browserWindow.dispatchEvent(new Event('focus'));
  browserDocument.dispatchEvent(new Event('visibilitychange'));
  assert.equal(refresh.mock.callCount(), 4);
});

test('shows the supplemental export separately without affecting any report totals', () => {
  const sheet = buildSupplementalArSheet('Account,Account,\n"Client, Inc.",Second,notes\n,,');
  assert.deepEqual(sheet.columns, ['Account', 'Account (2)', 'Column 3']);
  assert.deepEqual(sheet.rows, [{ Account: 'Client, Inc.', 'Account (2)': 'Second', 'Column 3': 'notes' }]);
  assert.deepEqual(
    buildAllReportSheets(BASELINE_AR_DATA, 90, undefined, sheet),
    [...buildAllReportSheets(BASELINE_AR_DATA, 90), sheet],
  );
});

test('extractSpreadsheetId parses full Google Sheets URLs and raw IDs cleanly', () => {
  assert.equal(
    extractSpreadsheetId(
      'https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-/edit?gid=0#gid=0'
    ),
    '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-'
  );
  assert.equal(
    extractSpreadsheetId('1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-'),
    '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-'
  );
  assert.equal(extractSpreadsheetId('https://example.com/not-a-sheet'), null);
  assert.equal(extractSpreadsheetId('   '), null);
});

test('pickDefaultSheetTab selects preferred GID or AppSheet / AR Monitoring tab cleanly', () => {
  assert.equal(
    pickDefaultSheetTab(
      [
        { sheetId: 1, title: 'Summary' },
        { sheetId: 975333387, title: 'Custom AR Ledger Tab' },
        { sheetId: 3, title: 'AR MONITORING FOR APPSHEET' },
      ],
      975333387
    ),
    'Custom AR Ledger Tab'
  );
  assert.equal(
    pickDefaultSheetTab([
      { sheetId: 1, title: 'Summary' },
      { sheetId: 2, title: 'AR MONITORING FOR APPSHEET' },
      { sheetId: 3, title: 'Notes' },
    ]),
    'AR MONITORING FOR APPSHEET'
  );
  assert.equal(
    pickDefaultSheetTab([
      { sheetId: 10, title: 'Ledger_2026' },
      { sheetId: 11, title: 'Pivot' },
    ]),
    'Ledger_2026'
  );
  assert.equal(pickDefaultSheetTab([]), '');
});

test('sheetValuesToCSV converts ragged Google Sheets values into parseAppSheetARCSV-ready CSV', () => {
  const values: unknown[][] = [
    ['BI/SOA', 'CATEGORY', 'SERVICE TYPE', 'AREA MANAGER', 'AR TAG', 'OR DATE', 'CLIENT', 'AGING', 'BILLED AMOUNT', 'COLLECTION', 'REMAINING BALANCE'],
    ['BI-01', 'AAPMI', 'PMA - MNGMT FEE', 'CEZAR', 'September 2026', 'September 2026', 'CLIENT A, INC.', '91 days above', '100,000.00', '90,000.00', '10,000.00'],
    ['', '', ''],
    ['BI-02', 'MREIT', 'PMA - STAFF COST', 'ROWENA', 'October 2026', 'October 2026', 'CLIENT "B"', '1-30 days', '50,000.00', '25,000.00'], // ragged row missing final cell
  ];

  const csv = sheetValuesToCSV(values);
  const parsed = parseARReportCSV(csv, BASELINE_AR_DATA, '11/19/2026 10:55:00 PM');
  assert.equal(parsed.ok, true);
  assert.equal(parsed.stats?.activeRows, 2);
  assert.equal(parsed.stats?.totalBilling, 150_000);
  assert.equal(parsed.stats?.totalCollections, 115_000);
  assert.equal(parsed.stats?.arBalance, 35_000);
});

test('computeSheetFingerprint detects live cell updates deterministically', () => {
  const base = [
    ['AR TAG', 'BILLED AMOUNT', 'COLLECTION'],
    ['October 2026', '100,000.00', '50,000.00'],
  ];
  const updated = [
    ['AR TAG', 'BILLED AMOUNT', 'COLLECTION'],
    ['October 2026', '100,000.00', '75,000.00'],
  ];

  assert.equal(computeSheetFingerprint(base), computeSheetFingerprint(base));
  assert.notEqual(computeSheetFingerprint(base), computeSheetFingerprint(updated));
});
