-- Task 003: remove legacy crossword_advanced (no production); add layout seed.
DELETE FROM CrosswordQuestion WHERE quizId IN (SELECT id FROM Quiz WHERE type = 'crossword_advanced');
DELETE FROM CrosswordPublicKeywordSolve WHERE quizId IN (SELECT id FROM Quiz WHERE type = 'crossword_advanced');
DELETE FROM Quiz WHERE type = 'crossword_advanced';

-- SQLite: new nullable column
ALTER TABLE "Quiz" ADD COLUMN "advancedLayoutSeed" INTEGER;
