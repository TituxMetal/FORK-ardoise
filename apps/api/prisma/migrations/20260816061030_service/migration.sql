-- CreateTable
CREATE TABLE "service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "providerId" TEXT NOT NULL,
    CONSTRAINT "service_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "groupe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_participant" (
    "serviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,

    PRIMARY KEY ("serviceId", "userId"),
    CONSTRAINT "service_participant_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_part" (
    "serviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "ordinal" INTEGER NOT NULL,

    PRIMARY KEY ("serviceId", "userId"),
    CONSTRAINT "service_part_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "service_groupeId_idx" ON "service"("groupeId");
