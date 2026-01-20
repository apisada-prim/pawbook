-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "favoriteThings" TEXT[],
ADD COLUMN     "powerStats" JSONB,
ADD COLUMN     "secretHabits" TEXT[],
ADD COLUMN     "socialTags" TEXT[];
