import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BASELINE_AR_DATA } from '../data/baselineData';
import { parseARReportCSV } from './arCalculations';
import {
  buildAppsScriptCode,
  buildClientOpenInvoices,
  COMMITTED_PAYMENTS_COLUMNS,
  formatCommittedDateLabel,
  isValidIsoDate,
  prunePaidCommitmentRecords,
  removeCommitmentRecord,
  upsertCommitmentRecord,
  validateAppsScriptWebhookUrl,
} from './paymentCommitments';

test('validateAppsScriptWebhookUrl enforces strict HTTPS Google Apps Script /exec allowlist', () => {
  assert.equal(validateAppsScriptWebhookUrl('').valid, true);
  assert.equal(
    validateAppsScriptWebhookUrl('https://script.google.com/macros/s/AKfycbxTest123_abc/exec').valid,
    true
  );
  assert.equal(
    validateAppsScriptWebhookUrl('https://script.google.com/macros/u/0/s/AKfycbxTest123/exec').valid,
    true
  );
  assert.equal(
    validateAppsScriptWebhookUrl('https://script.googleusercontent.com/macros/s/AKfycbx123/exec').valid,
    true
  );

  // Reject unsafe protocols, local/private hosts, credentials, or /dev endpoints
  assert.equal(
    validateAppsScriptWebhookUrl('http://script.google.com/macros/s/AKfycbx123/exec').valid,
    false
  );
  assert.equal(
    validateAppsScriptWebhookUrl('https://127.0.0.1/macros/s/AKfycbx123/exec').valid,
    false
  );
  assert.equal(
    validateAppsScriptWebhookUrl('https://169.254.169.254/latest/meta-data').valid,
    false
  );
  assert.equal(
    validateAppsScriptWebhookUrl('https://evil.example.com/macros/s/AKfycbx123/exec').valid,
    false
  );
  assert.equal(
    validateAppsScriptWebhookUrl('https://script.google.com/macros/s/AKfycbx123/dev').valid,
    false
  );
  assert.equal(
    validateAppsScriptWebhookUrl('https://user:pass@script.google.com/macros/s/AKfycbx123/exec').valid,
    false
  );
});

test('buildClientOpenInvoices returns prioritized open BIs with positive remaining balance for any client', () => {
  const csvPath = path.resolve(
    process.cwd(),
    'public/assets/aistudio/AR_MONITORING_FOR_APPSHEET_c88dcd7c'
  );
  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const parsed = parseARReportCSV(rawCsv, BASELINE_AR_DATA, BASELINE_AR_DATA.lastUpdated);
  assert.ok(parsed.data?.openInvoices);

  const clientName = 'ONE UPTOWN RESIDENCE CONDOMINIUM ASSOC. INC.';
  const clientBIs = buildClientOpenInvoices(parsed.data!.openInvoices, clientName);
  assert.ok(clientBIs.length >= 2);
  assert.ok(
    clientBIs.every(
      (inv) =>
        inv.client.toUpperCase() === clientName &&
        inv.remainingBalance > 0.005 &&
        inv.biNumber.trim().length > 0
    )
  );
});

test('upsertCommitmentRecord updates existing BI/SOA in place and prunePaidCommitmentRecords removes paid BIs', () => {
  const first = upsertCommitmentRecord(
    [],
    {
      accountManager: 'RALPH',
      clientName: 'ACME CORP',
      biNumber: 'BI-1001',
      serviceType: 'PMA - STAFF COST',
      particulars: 'Oct Billing',
      aging: '31-60 days',
      remainingBalance: 50000,
      committedPaymentDate: '2026-11-28',
    },
    '2026-11-24T01:00:00.000Z'
  );
  assert.equal(first.length, 1);

  const second = upsertCommitmentRecord(
    first,
    {
      accountManager: 'RALPH',
      clientName: 'ACME CORP',
      biNumber: 'bi-1001',
      serviceType: 'PMA - STAFF COST',
      particulars: 'Oct Billing',
      aging: '31-60 days',
      remainingBalance: 50000,
      committedPaymentDate: '2026-12-05',
    },
    '2026-11-24T02:00:00.000Z'
  );
  assert.equal(second.length, 1);
  assert.equal(second[0].committedPaymentDate, '2026-12-05');

  const withAnother = upsertCommitmentRecord(
    second,
    {
      accountManager: 'GILLIAN',
      clientName: 'BETA INC',
      biNumber: 'BI-2002',
      serviceType: 'ADMIN FEE',
      particulars: 'Nov Billing',
      aging: '1-30 days',
      remainingBalance: 25000,
      committedPaymentDate: '2026-11-30',
    },
    '2026-11-24T02:05:00.000Z'
  );
  assert.equal(withAnother.length, 2);

  // Simulate BI-1001 paid off in AR_MONITORING_FOR_APPSHEET (no longer in openInvoices > 0)
  const pruned = prunePaidCommitmentRecords(withAnother, [
    {
      biNumber: 'BI-2002',
      serviceType: 'ADMIN FEE',
      client: 'BETA INC',
      areaManager: 'GILLIAN',
      aging: '1-30 days',
      particulars: 'Nov Billing',
      arTag: 'November 2026',
      isPriorAr: false,
      billed: 25000,
      collected: 0,
      remainingBalance: 25000,
    },
  ]);
  assert.deepEqual(pruned.removedBiNumbers, ['bi-1001']);
  assert.equal(pruned.remaining.length, 1);
  assert.equal(pruned.remaining[0].biNumber, 'BI-2002');

  const removed = removeCommitmentRecord(pruned.remaining, 'BI-2002');
  assert.equal(removed.length, 0);
});

test('ISO date validation and Google Apps Script template contain exact 9 COMMITTED_PAYMENTS columns', () => {
  assert.equal(isValidIsoDate('2026-11-28'), true);
  assert.equal(isValidIsoDate('2026-02-30'), false);
  assert.equal(formatCommittedDateLabel('2026-11-28'), 'Nov 28, 2026');

  assert.deepEqual([...COMMITTED_PAYMENTS_COLUMNS], [
    'Timestamp',
    'Account Manager',
    'Client Name',
    'BI/SOA',
    'Service Type',
    'Particulars',
    'Aging',
    'Remaining Balance',
    'Committed Payment Date',
  ]);

  const code = buildAppsScriptCode();
  assert.ok(code.includes("var COMMITTED_TAB_NAME = 'COMMITTED_PAYMENTS';"));
  assert.ok(
    code.includes(
      "var SOURCE_AR_SPREADSHEET_ID = '1exqZWTrc736kC5IB7PUYtDiJdk3SqnFEnQ7-NaTCUzg';"
    )
  );
  assert.ok(code.includes('var SOURCE_AR_SHEET_GID = 975333387;'));
  assert.ok(
    code.includes(
      "var COMMITTED_PAYMENTS_SPREADSHEET_ID = '1SlTtGtx7S37veqqYOjutO3JnXV8iDMDHlN2VVVR_V0k';"
    )
  );
  assert.ok(code.includes('var COMMITTED_PAYMENTS_SHEET_GID = 2010918633;'));
  assert.ok(code.includes("var SOURCE_AR_TAB_NAME = 'AR_MONITORING_FOR_APPSHEET';"));
  assert.ok(code.includes('assertCommittedTargetOnly_'));
  assert.ok(code.includes('cleanupPaidCommitments'));

  const gsPath = path.resolve(
    process.cwd(),
    'google-apps-script/CommittedPaymentsSync.gs'
  );
  const gsContent = fs.readFileSync(gsPath, 'utf8');
  assert.ok(
    gsContent.includes('1exqZWTrc736kC5IB7PUYtDiJdk3SqnFEnQ7-NaTCUzg')
  );
  assert.ok(gsContent.includes('975333387'));
  assert.ok(
    gsContent.includes('1SlTtGtx7S37veqqYOjutO3JnXV8iDMDHlN2VVVR_V0k')
  );
  assert.ok(gsContent.includes('2010918633'));
  assert.ok(gsContent.includes('assertCommittedTargetOnly_'));
});
