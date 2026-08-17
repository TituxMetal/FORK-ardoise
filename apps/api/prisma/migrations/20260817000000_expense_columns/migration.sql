-- RenameColumn
-- Prisma sees column renames as drop+create; hand-written per the rename convention
-- so existing rows survive. SQLite retargets FK references to the renamed columns.

ALTER TABLE "expense_participant" RENAME COLUMN "depenseId" TO "expenseId";
ALTER TABLE "expense_part" RENAME COLUMN "depenseId" TO "expenseId";
