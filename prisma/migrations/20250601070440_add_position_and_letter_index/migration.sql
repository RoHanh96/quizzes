-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CrosswordQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "letterIndex" INTEGER NOT NULL DEFAULT 0,
    "quizId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CrosswordQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CrosswordQuestion" ("answer", "createdAt", "id", "order", "question", "quizId", "updatedAt") SELECT "answer", "createdAt", "id", "order", "question", "quizId", "updatedAt" FROM "CrosswordQuestion";
DROP TABLE "CrosswordQuestion";
ALTER TABLE "new_CrosswordQuestion" RENAME TO "CrosswordQuestion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
