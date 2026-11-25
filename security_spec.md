# Firestore Security Specification (`report_config`)

## Data Invariants
1. **Single Authoritative Layout Document**: Only `/report_config/layout` may exist or be read (`configId == 'layout'`), with `allow list: if false;` blocking collection enumeration.
2. **Zero PII Exposure**: `/report_config/layout` stores only numeric page IDs (`pageOrder`, `deletedPages`, `hiddenPages`) and server `updatedAt` timestamp—no user emails, names, or financial data.
3. **Verified Admin Writes Only**: Creates and updates require `request.auth != null`, `request.auth.token.email_verified == true`, and `request.auth.token.email == 'hharo@asia-affinity.com'`.
4. **Strict Shape & Size Bounds**: `pageOrder` is a non-empty bounded list (`1..15` ints), `deletedPages` and `hiddenPages` are bounded lists (`0..14` ints), extra fields are rejected via `hasOnly`, and `updatedAt` must equal `request.time`.
5. **No Client Deletes**: Deleting the layout document (`allow delete: if false;`) is blocked; restoring defaults updates the fields cleanly.

## Dirty Dozen Adversarial Payloads (Must Return `PERMISSION_DENIED`)
1. **Unauthenticated Write**: `{ pageOrder: [1, 2], deletedPages: [] }` with `auth = null`.
2. **Non-Admin Verified User**: `{ pageOrder: [1, 2], deletedPages: [] }` with `email = "viewer@asia-affinity.com", email_verified = true`.
3. **Admin Email Spoof (Unverified)**: `{ pageOrder: [1, 2], deletedPages: [] }` with `email = "hharo@asia-affinity.com", email_verified = false`.
4. **Shadow / Ghost Field Injection**: `{ pageOrder: [1, 2], deletedPages: [], isAdmin: true }`.
5. **Wrong Document Path / ID Poisoning**: Write to `/report_config/malicious_id`.
6. **Oversized Array Exhaustion**: `{ pageOrder: [1..50], deletedPages: [] }`.
7. **Empty `pageOrder` Wipe**: `{ pageOrder: [], deletedPages: [1, 2] }`.
8. **Type Poisoning in `pageOrder`**: `{ pageOrder: ["1"], deletedPages: [] }`.
9. **Type Poisoning in `deletedPages`**: `{ pageOrder: [1, 2], deletedPages: ["bad"] }`.
10. **Forged Client Timestamp**: `{ pageOrder: [1, 2], deletedPages: [], updatedAt: "2020-01-01T00:00:00Z" }`.
11. **Missing Required Field**: `{ pageOrder: [1, 2] }` (missing `deletedPages` / `updatedAt`).
12. **Collection Delete / List Enumeration**: `list` on `/report_config` or `delete` on `/report_config/layout`.
