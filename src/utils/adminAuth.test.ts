import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_EMAIL,
  isAuthorizedAdminEmail,
  resolveAdminSessionState,
  validateAdminLoginEmail,
} from './adminAuth';

test('isAuthorizedAdminEmail matches ADMIN_EMAIL case-insensitively and rejects others', () => {
  assert.equal(isAuthorizedAdminEmail(ADMIN_EMAIL), true);
  assert.equal(isAuthorizedAdminEmail(`  ${ADMIN_EMAIL.toUpperCase()}  `), true);
  assert.equal(isAuthorizedAdminEmail('viewer@asia-affinity.com'), false);
  assert.equal(isAuthorizedAdminEmail(''), false);
  assert.equal(isAuthorizedAdminEmail(null), false);
});

test('validateAdminLoginEmail validates format and enforces ADMIN_EMAIL authorization', () => {
  const empty = validateAdminLoginEmail('   ');
  assert.equal(empty.ok, false);

  const malformed = validateAdminLoginEmail('not-an-email');
  assert.equal(malformed.ok, false);

  const unauthorized = validateAdminLoginEmail('someone@asia-affinity.com');
  assert.equal(unauthorized.ok, false);

  const valid = validateAdminLoginEmail(` ${ADMIN_EMAIL.toUpperCase()} `);
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.email, ADMIN_EMAIL.toLowerCase());
  }
});

test('resolveAdminSessionState restricts Draft to Email exclusively to ADMIN_EMAIL', () => {
  const loggedOut = resolveAdminSessionState({});
  assert.equal(loggedOut.isAdmin, false);
  assert.equal(loggedOut.activeAdminEmail, null);

  const nonAdminGoogle = resolveAdminSessionState({
    googleUserEmail: 'staff@asia-affinity.com',
    verifiedEmail: null,
  });
  assert.equal(nonAdminGoogle.isAdmin, false);

  const adminGoogle = resolveAdminSessionState({
    googleUserEmail: ADMIN_EMAIL,
    verifiedEmail: null,
  });
  assert.equal(adminGoogle.isAdmin, true);
  assert.equal(adminGoogle.source, 'google');

  const verifiedDirect = resolveAdminSessionState({
    googleUserEmail: null,
    verifiedEmail: ADMIN_EMAIL,
  });
  assert.equal(verifiedDirect.isAdmin, true);
  assert.equal(verifiedDirect.source, 'verified_email');
});
