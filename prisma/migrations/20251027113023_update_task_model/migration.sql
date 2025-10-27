-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "allowedExtensions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "expectedCount" INTEGER;
