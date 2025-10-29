/*
  Warnings:

  - You are about to drop the column `numberOfRaters` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `Comment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "numberOfRaters",
DROP COLUMN "rating";

-- AlterTable
ALTER TABLE "Rating" ADD COLUMN     "numberOfRaters" INTEGER NOT NULL DEFAULT 0;
