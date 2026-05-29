-- AlterTable: Rename 'token' to 'tokenHash' in refresh_tokens
ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "tokenHash";

-- Recreate unique constraint with new name
DROP INDEX IF EXISTS "refresh_tokens_token_key";
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");
