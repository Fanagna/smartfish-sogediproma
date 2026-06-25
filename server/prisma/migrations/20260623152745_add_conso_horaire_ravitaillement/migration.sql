-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CAPITAINE', 'OBSERVATEUR');

-- CreateEnum
CREATE TYPE "Urgence" AS ENUM ('BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OBSERVATEUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bateau" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "immatriculation" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "longueur" DOUBLE PRECISION NOT NULL,
    "carburantCapacity" DOUBLE PRECISION NOT NULL DEFAULT 500.0,
    "carburantRestant" DOUBLE PRECISION NOT NULL DEFAULT 500.0,
    "consoHoraire" DOUBLE PRECISION,
    "capitaineId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bateau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ravitaillement" (
    "id" SERIAL NOT NULL,
    "bateauId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "litres" DOUBLE PRECISION NOT NULL,
    "prixLitre" DOUBLE PRECISION NOT NULL DEFAULT 4800,
    "coutTotal" DOUBLE PRECISION NOT NULL,
    "fournisseur" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ravitaillement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capture" (
    "id" SERIAL NOT NULL,
    "bateauId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "espece" TEXT NOT NULL,
    "poids" DOUBLE PRECISION NOT NULL,
    "quantite" INTEGER NOT NULL,
    "zonePeche" TEXT NOT NULL,
    "profondeur" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" SERIAL NOT NULL,
    "bateauId" INTEGER NOT NULL,
    "captureId" INTEGER,
    "espece" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "unite" TEXT NOT NULL,
    "seuil" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "alerte" BOOLEAN NOT NULL DEFAULT false,
    "prixVente" DOUBLE PRECISION DEFAULT 0,
    "dateEntree" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateSortie" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" SERIAL NOT NULL,
    "bateauId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "statut" TEXT NOT NULL,
    "cout" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionLog" (
    "id" SERIAL NOT NULL,
    "contenu" TEXT NOT NULL,
    "contexte" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'RECOMMENDATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anomalie" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "urgence" "Urgence" NOT NULL DEFAULT 'MOYENNE',
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anomalie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vente" (
    "id" SERIAL NOT NULL,
    "stockId" INTEGER,
    "clientId" INTEGER,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "espece" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "typeClient" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exportation" (
    "id" SERIAL NOT NULL,
    "stockId" INTEGER,
    "clientId" INTEGER,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "espece" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "paysDestination" TEXT NOT NULL,
    "prixTotal" DOUBLE PRECISION NOT NULL,
    "statut" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exportation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rapport" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rapport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fraude" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "niveauRisque" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "donneesConcernees" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fraude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achat" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "fournisseur" TEXT NOT NULL,
    "espece" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Achat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "type" TEXT NOT NULL,
    "totalAchats" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nbCommandes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdreMission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bateauNom" TEXT NOT NULL,
    "bateauType" TEXT NOT NULL,
    "objetMission" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "chefMission" TEXT NOT NULL,
    "capitaine" TEXT NOT NULL,
    "equipage" JSONB NOT NULL DEFAULT '[]',
    "dateDepart" TIMESTAMP(3) NOT NULL,
    "dateArrivee" TIMESTAMP(3) NOT NULL,
    "heureDepart" TEXT NOT NULL,
    "heureArrivee" TEXT NOT NULL,
    "vidangeDate" TIMESTAMP(3),
    "vidangeTotal" DOUBLE PRECISION,
    "vidangeProchaine" DOUBLE PRECISION,
    "carburantRestant" DOUBLE PRECISION,
    "carburantRemplissage" DOUBLE PRECISION,
    "carburantDepart" DOUBLE PRECISION,
    "carburantConsommation" DOUBLE PRECISION,
    "carburantArrivee" DOUBLE PRECISION,
    "marchandises" JSONB NOT NULL DEFAULT '[]',
    "passagers" JSONB NOT NULL DEFAULT '[]',
    "diversFrais" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdreMission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Bateau_immatriculation_key" ON "Bateau"("immatriculation");

-- CreateIndex
CREATE INDEX "Ravitaillement_bateauId_idx" ON "Ravitaillement"("bateauId");

-- CreateIndex
CREATE INDEX "Ravitaillement_date_idx" ON "Ravitaillement"("date");

-- CreateIndex
CREATE INDEX "Capture_date_idx" ON "Capture"("date");

-- CreateIndex
CREATE INDEX "Capture_espece_idx" ON "Capture"("espece");

-- CreateIndex
CREATE INDEX "Capture_bateauId_idx" ON "Capture"("bateauId");

-- CreateIndex
CREATE INDEX "Capture_zonePeche_idx" ON "Capture"("zonePeche");

-- CreateIndex
CREATE INDEX "Stock_espece_idx" ON "Stock"("espece");

-- CreateIndex
CREATE INDEX "Stock_dateSortie_idx" ON "Stock"("dateSortie");

-- CreateIndex
CREATE INDEX "Stock_bateauId_idx" ON "Stock"("bateauId");

-- CreateIndex
CREATE INDEX "Anomalie_date_idx" ON "Anomalie"("date");

-- CreateIndex
CREATE INDEX "Anomalie_statut_idx" ON "Anomalie"("statut");

-- CreateIndex
CREATE INDEX "Anomalie_urgence_idx" ON "Anomalie"("urgence");

-- CreateIndex
CREATE INDEX "Vente_date_idx" ON "Vente"("date");

-- CreateIndex
CREATE INDEX "Vente_espece_idx" ON "Vente"("espece");

-- CreateIndex
CREATE INDEX "Exportation_date_idx" ON "Exportation"("date");

-- CreateIndex
CREATE INDEX "Exportation_paysDestination_idx" ON "Exportation"("paysDestination");

-- AddForeignKey
ALTER TABLE "Bateau" ADD CONSTRAINT "Bateau_capitaineId_fkey" FOREIGN KEY ("capitaineId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ravitaillement" ADD CONSTRAINT "Ravitaillement_bateauId_fkey" FOREIGN KEY ("bateauId") REFERENCES "Bateau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capture" ADD CONSTRAINT "Capture_bateauId_fkey" FOREIGN KEY ("bateauId") REFERENCES "Bateau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capture" ADD CONSTRAINT "Capture_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_bateauId_fkey" FOREIGN KEY ("bateauId") REFERENCES "Bateau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_captureId_fkey" FOREIGN KEY ("captureId") REFERENCES "Capture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_bateauId_fkey" FOREIGN KEY ("bateauId") REFERENCES "Bateau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anomalie" ADD CONSTRAINT "Anomalie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exportation" ADD CONSTRAINT "Exportation_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exportation" ADD CONSTRAINT "Exportation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exportation" ADD CONSTRAINT "Exportation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rapport" ADD CONSTRAINT "Rapport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fraude" ADD CONSTRAINT "Fraude_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achat" ADD CONSTRAINT "Achat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achat" ADD CONSTRAINT "Achat_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdreMission" ADD CONSTRAINT "OrdreMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
