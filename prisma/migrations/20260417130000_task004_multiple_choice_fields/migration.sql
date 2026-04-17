-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN "playLength" INTEGER;

-- AlterTable
ALTER TABLE "MultipleChoiceQuestion" ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'easy';
ALTER TABLE "MultipleChoiceQuestion" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
