-- CreateTable
CREATE TABLE "depense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "payerId" TEXT NOT NULL,
    CONSTRAINT "depense_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "groupe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "depense_participant" (
    "depenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,

    PRIMARY KEY ("depenseId", "userId"),
    CONSTRAINT "depense_participant_depenseId_fkey" FOREIGN KEY ("depenseId") REFERENCES "depense" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "depense_part" (
    "depenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "ordinal" INTEGER NOT NULL,

    PRIMARY KEY ("depenseId", "userId"),
    CONSTRAINT "depense_part_depenseId_fkey" FOREIGN KEY ("depenseId") REFERENCES "depense" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "depense_groupeId_idx" ON "depense"("groupeId");
