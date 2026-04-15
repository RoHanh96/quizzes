-- CreateTable
CREATE TABLE "CrosswordPublicKeywordSolve" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shareLink" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "solvedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrosswordPublicKeywordSolve_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CrosswordPublicKeywordSolve_shareLink_key" ON "CrosswordPublicKeywordSolve"("shareLink");

-- CreateIndex
CREATE UNIQUE INDEX "CrosswordPublicKeywordSolve_quizId_key" ON "CrosswordPublicKeywordSolve"("quizId");
