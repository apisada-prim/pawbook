-- CreateTable
CREATE TABLE "VaccineQrToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VaccineQrToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VaccineQrToken_token_key" ON "VaccineQrToken"("token");

-- AddForeignKey
ALTER TABLE "VaccineQrToken" ADD CONSTRAINT "VaccineQrToken_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
