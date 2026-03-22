-- Drop any unique constraint on the keyword column.
-- Prisma's schema never declared @unique on keyword, but a stale constraint
-- may exist from an earlier db push. IF EXISTS makes this idempotent.
ALTER TABLE "rules" DROP CONSTRAINT IF EXISTS "rules_keyword_key";

-- Also drop the index form in case it was created as a plain unique index
-- rather than a named constraint.
DROP INDEX IF EXISTS "rules_keyword_key";
