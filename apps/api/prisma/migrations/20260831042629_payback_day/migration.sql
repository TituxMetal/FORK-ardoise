/*
  Warnings:

  - Added the required column `day` to the `payback` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_payback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "debtorId" TEXT NOT NULL,
    "creditorId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    CONSTRAINT "payback_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_payback" ("amount", "creditorId", "day", "debtorId", "groupId", "id") SELECT "amount", "creditorId", '2026-08-31', "debtorId", "groupId", "id" FROM "payback";
DROP TABLE "payback";
ALTER TABLE "new_payback" RENAME TO "payback";
CREATE INDEX "payback_groupId_idx" ON "payback"("groupId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
