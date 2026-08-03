-- AlterTable
ALTER TABLE "order" ADD COLUMN     "discount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "promo_code" TEXT;
