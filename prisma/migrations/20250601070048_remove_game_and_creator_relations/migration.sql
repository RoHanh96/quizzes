/*
  Warnings:

  - You are about to drop the `Game` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdAt` on the `CrosswordQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `letterIndex` on the `CrosswordQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `CrosswordQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `CrosswordQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `creatorId` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `gameId` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `questions` on the `Quiz` table. All the data in the column will be lost.
  - Added the required column `order` to the `CrosswordQuestion` table without a default value. This is not possible if the table is not empty.
  - Made the column `verticalWord` on table `Quiz` required. This step will fail if there are existing NULL values in that column.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Game";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CrosswordQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "quizId" TEXT NOT NULL,
    CONSTRAINT "CrosswordQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CrosswordQuestion" ("answer", "id", "question", "quizId") SELECT "answer", "id", "question", "quizId" FROM "CrosswordQuestion";
DROP TABLE "CrosswordQuestion";
ALTER TABLE "new_CrosswordQuestion" RENAME TO "CrosswordQuestion";
CREATE TABLE "new_Quiz" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "verticalWord" TEXT NOT NULL,
    "shareLink" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Quiz" ("createdAt", "id", "shareLink", "title", "updatedAt", "verticalWord") SELECT "createdAt", "id", "shareLink", "title", "updatedAt", "verticalWord" FROM "Quiz";
DROP TABLE "Quiz";
ALTER TABLE "new_Quiz" RENAME TO "Quiz";
CREATE UNIQUE INDEX "Quiz_shareLink_key" ON "Quiz"("shareLink");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
