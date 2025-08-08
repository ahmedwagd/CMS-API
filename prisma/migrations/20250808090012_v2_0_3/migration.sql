-- DropIndex
DROP INDEX "public"."doctors_phone_key";

-- AlterTable
ALTER TABLE "public"."doctors" ALTER COLUMN "phone" DROP NOT NULL;
