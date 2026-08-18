-- DropIndex
DROP INDEX "group_invitationSecret_key";

-- RenameColumn
-- Prisma sees column renames as drop+create; hand-written per the rename convention
-- so existing rows survive. SQLite keeps the column data and FK references.

ALTER TABLE "group" RENAME COLUMN "invitationSecret" TO "inviteSecret";

-- CreateIndex
CREATE UNIQUE INDEX "group_inviteSecret_key" ON "group"("inviteSecret");
