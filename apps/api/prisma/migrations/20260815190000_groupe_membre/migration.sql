-- CreateTable
CREATE TABLE "groupe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "membre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "groupeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "membre_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "membre_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "groupe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "membre_userId_groupeId_key" ON "membre"("userId", "groupeId");

-- CreateIndex
CREATE INDEX "membre_userId_idx" ON "membre"("userId");

-- CreateIndex
CREATE INDEX "membre_groupeId_idx" ON "membre"("groupeId");
