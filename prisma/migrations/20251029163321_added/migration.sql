/*
  Warnings:

  - You are about to drop the column `numberOfRaters` on the `Rating` table. All the data in the column will be lost.
  - You are about to drop the column `totalRating` on the `Rating` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,productId]` on the table `Rating` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Rating_productId_key";

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "numberOfRaters" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Rating" DROP COLUMN "numberOfRaters",
DROP COLUMN "totalRating",
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "productId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_productId_key" ON "Rating"("userId", "productId");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
