/*
  Warnings:

  - Added the required column `invitationSecret` to the `groupe` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_groupe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "invitationSecret" TEXT NOT NULL
);
INSERT INTO "new_groupe" ("id", "name", "invitationSecret") SELECT "id", "name", lower(hex(randomblob(16))) FROM "groupe";
DROP TABLE "groupe";
ALTER TABLE "new_groupe" RENAME TO "groupe";
CREATE UNIQUE INDEX "groupe_invitationSecret_key" ON "groupe"("invitationSecret");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
