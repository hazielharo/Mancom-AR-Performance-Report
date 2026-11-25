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
  pickDefaultSheetTab,
  sheetValuesToCSV,
} from './googleSheets';

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
