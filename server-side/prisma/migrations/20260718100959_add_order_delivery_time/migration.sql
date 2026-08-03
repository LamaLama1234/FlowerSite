-- AlterTable
ALTER TABLE "order" ADD COLUMN     "delivery_time_slot" TEXT,
ADD COLUMN     "is_asap" BOOLEAN NOT NULL DEFAULT false;
