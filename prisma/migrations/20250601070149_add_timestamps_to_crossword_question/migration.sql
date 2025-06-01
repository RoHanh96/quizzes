/*
  Warnings:

  - Added the required column `updatedAt` to the `CrosswordQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CrosswordQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "quizId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CrosswordQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CrosswordQuestion" ("answer", "id", "order", "question", "quizId") SELECT "answer", "id", "order", "question", "quizId" FROM "CrosswordQuestion";
DROP TABLE "CrosswordQuestion";
ALTER TABLE "new_CrosswordQuestion" RENAME TO "CrosswordQuestion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
