-- CreateTable
CREATE TABLE "_CoOwnership" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CoOwnership_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CoOwnership_B_index" ON "_CoOwnership"("B");

-- AddForeignKey
ALTER TABLE "_CoOwnership" ADD CONSTRAINT "_CoOwnership_A_fkey" FOREIGN KEY ("A") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CoOwnership" ADD CONSTRAINT "_CoOwnership_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
