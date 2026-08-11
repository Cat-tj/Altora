# TASK PACKET — ALT-REC-IMP-007

TASK ID: ALT-REC-IMP-007
TITLE: Expense tracking & financial integrity

OBJECTIVE:
Verify expense recording writes correctly to DB with proper tenant isolation
and audit trail. Expenses should be immutable once recorded (no delete, only
void with reason). Verify the ledger/expense reconciliation path.

REQUIRED:
1. Audit market-expenses.ts: create expense → verify DB row, tenant isolation,
   audit trail. Void expense → status changes, no delete.
2. Integration tests: create expense → DB verification, void expense →
   voided status, list expenses → filtered by tenant.
3. Verify expense doesn't affect ProductStock (expenses ≠ stock movements).
4. Unit/lint/tsc/build clean.
