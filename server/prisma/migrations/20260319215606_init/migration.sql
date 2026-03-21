-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('contains', 'startsWith', 'exact');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('highlight', 'tooltip');

-- CreateTable
CREATE TABLE "rules" (
    "id" SERIAL NOT NULL,
    "keyword" TEXT NOT NULL,
    "matchType" "MatchType" NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "color" TEXT,
    "label" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);
