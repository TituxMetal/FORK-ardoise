-- RenameTable
-- Prisma sees model renames as drop+create; hand-written per the rename convention
-- so existing rows survive. SQLite retargets FK references to the renamed tables.

ALTER TABLE "groupe" RENAME TO "group";
ALTER TABLE "membre" RENAME TO "member";
ALTER TABLE "depense" RENAME TO "expense";
ALTER TABLE "depense_participant" RENAME TO "expense_participant";
ALTER TABLE "depense_part" RENAME TO "expense_part";
ALTER TABLE "reglement" RENAME TO "payback";

-- DropIndex
DROP INDEX "depense_groupeId_idx";

-- DropIndex
DROP INDEX "groupe_invitationSecret_key";

-- DropIndex
DROP INDEX "membre_groupeId_idx";

-- DropIndex
DROP INDEX "membre_userId_idx";

-- DropIndex
DROP INDEX "membre_userId_groupeId_key";

-- DropIndex
DROP INDEX "reglement_groupeId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "group_invitationSecret_key" ON "group"("invitationSecret");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE INDEX "member_groupeId_idx" ON "member"("groupeId");

-- CreateIndex
CREATE UNIQUE INDEX "member_userId_groupeId_key" ON "member"("userId", "groupeId");

-- CreateIndex
CREATE INDEX "expense_groupeId_idx" ON "expense"("groupeId");

-- CreateIndex
CREATE INDEX "payback_groupeId_idx" ON "payback"("groupeId");
