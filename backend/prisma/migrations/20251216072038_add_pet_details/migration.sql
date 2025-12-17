-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "chronicDiseases" TEXT,
ADD COLUMN     "isSterilized" BOOLEAN NOT NULL DEFAULT false;
