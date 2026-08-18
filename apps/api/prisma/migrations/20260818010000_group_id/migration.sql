-- RenameColumn
-- Prisma sees column renames as drop+create; hand-written per the rename convention
-- so existing rows survive. SQLite keeps the column data and FK references.

-- DropIndex
DROP INDEX "member_userId_groupeId_key";

-- DropIndex
DROP INDEX "member_groupeId_idx";

-- DropIndex
DROP INDEX "expense_groupeId_idx";

-- DropIndex
DROP INDEX "service_groupeId_idx";

-- DropIndex
DROP INDEX "payback_groupeId_idx";

ALTER TABLE "member" RENAME COLUMN "groupeId" TO "groupId";
ALTER TABLE "expense" RENAME COLUMN "groupeId" TO "groupId";
ALTER TABLE "service" RENAME COLUMN "groupeId" TO "groupId";
ALTER TABLE "payback" RENAME COLUMN "groupeId" TO "groupId";

-- CreateIndex
CREATE UNIQUE INDEX "member_userId_groupId_key" ON "member"("userId", "groupId");

-- CreateIndex
CREATE INDEX "member_groupId_idx" ON "member"("groupId");

-- CreateIndex
CREATE INDEX "expense_groupId_idx" ON "expense"("groupId");

-- CreateIndex
CREATE INDEX "service_groupId_idx" ON "service"("groupId");

-- CreateIndex
CREATE INDEX "payback_groupId_idx" ON "payback"("groupId");
