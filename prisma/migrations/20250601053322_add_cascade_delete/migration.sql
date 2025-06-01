-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CrosswordQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "letterIndex" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CrosswordQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CrosswordQuestion" ("answer", "createdAt", "id", "letterIndex", "position", "question", "quizId", "updatedAt") SELECT "answer", "createdAt", "id", "letterIndex", "position", "question", "quizId", "updatedAt" FROM "CrosswordQuestion";
DROP TABLE "CrosswordQuestion";
ALTER TABLE "new_CrosswordQuestion" RENAME TO "CrosswordQuestion";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
