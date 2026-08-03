-- AlterTable
ALTER TABLE "email_verification" ADD COLUMN     "last_sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "password_reset" ADD COLUMN     "last_sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
