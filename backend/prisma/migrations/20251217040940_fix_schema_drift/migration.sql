/*
  Warnings:

  - You are about to drop the `_CoOwnership` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[transferCode]` on the table `Pet` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "_CoOwnership" DROP CONSTRAINT "_CoOwnership_A_fkey";

-- DropForeignKey
ALTER TABLE "_CoOwnership" DROP CONSTRAINT "_CoOwnership_B_fkey";

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "transferCode" TEXT,
ADD COLUMN     "transferExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultFamilyId" TEXT;

-- DropTable
DROP TABLE "_CoOwnership";

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Pets',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FamilyMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FamilyMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PastOwners" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PastOwners_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Family_ownerId_key" ON "Family"("ownerId");

-- CreateIndex
CREATE INDEX "_FamilyMembers_B_index" ON "_FamilyMembers"("B");

-- CreateIndex
CREATE INDEX "_PastOwners_B_index" ON "_PastOwners"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Pet_transferCode_key" ON "Pet"("transferCode");

-- AddForeignKey
ALTER TABLE "Family" ADD CONSTRAINT "Family_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FamilyMembers" ADD CONSTRAINT "_FamilyMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FamilyMembers" ADD CONSTRAINT "_FamilyMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PastOwners" ADD CONSTRAINT "_PastOwners_A_fkey" FOREIGN KEY ("A") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PastOwners" ADD CONSTRAINT "_PastOwners_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
