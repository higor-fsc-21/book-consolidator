-- AlterTable
ALTER TABLE "User" ADD COLUMN     "annualBooksGoal" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "weeklyRevisionsGoal" INTEGER NOT NULL DEFAULT 3;
