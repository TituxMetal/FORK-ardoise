-- CreateTable
CREATE TABLE "reglement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupeId" TEXT NOT NULL,
    "debtorId" TEXT NOT NULL,
    "creditorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    CONSTRAINT "reglement_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "groupe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "reglement_groupeId_idx" ON "reglement"("groupeId");
