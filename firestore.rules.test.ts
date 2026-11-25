import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const rulesText = fs.readFileSync(rulesPath, 'utf8');

test('firestore.rules enforces Eight Pillars constraints for report_config/layout', () => {
  assert.match(rulesText, /rules_version\s*=\s*'2'/);
  assert.match(rulesText, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);
  assert.match(rulesText, /request\.auth\.token\.email_verified\s*==\s*true/);
  assert.match(rulesText, /request\.auth\.token\.email\s*==\s*'hharo@asia-affinity\.com'/);
  assert.match(rulesText, /isValidReportLayout\(incoming\(\)\)/);
  assert.match(
    rulesText,
    /data\.keys\(\)\.hasOnly\(\['pageOrder', 'deletedPages', 'hiddenPages', 'updatedAt'\]\)/
  );
  assert.match(rulesText, /data\.hiddenPages is list/);
  assert.match(rulesText, /data\.hiddenPages\.size\(\) <= 14/);
  assert.match(rulesText, /data\.updatedAt == request\.time/);
  assert.match(rulesText, /allow list: if false;/);
  assert.match(rulesText, /allow delete: if false;/);
});
