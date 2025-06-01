-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quiz" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "verticalWord" TEXT,
    "imageUrl" TEXT,
    "questions" TEXT NOT NULL DEFAULT '[]',
    "shareLink" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "gameId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Quiz_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Quiz_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Quiz" ("createdAt", "creatorId", "gameId", "id", "imageUrl", "questions", "shareLink", "title", "updatedAt", "verticalWord") SELECT "createdAt", "creatorId", "gameId", "id", "imageUrl", "questions", "shareLink", "title", "updatedAt", "verticalWord" FROM "Quiz";
DROP TABLE "Quiz";
ALTER TABLE "new_Quiz" RENAME TO "Quiz";
CREATE UNIQUE INDEX "Quiz_shareLink_key" ON "Quiz"("shareLink");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
