-- DropForeignKey
ALTER TABLE "Bateau" DROP CONSTRAINT "Bateau_capitaineId_fkey";

-- AlterTable
ALTER TABLE "Bateau" ADD COLUMN     "capitaineNom" TEXT,
ALTER COLUMN "capitaineId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Bateau" ADD CONSTRAINT "Bateau_capitaineId_fkey" FOREIGN KEY ("capitaineId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
