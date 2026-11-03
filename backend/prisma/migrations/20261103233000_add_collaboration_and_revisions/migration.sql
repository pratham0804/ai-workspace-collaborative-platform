-- AlterTable
ALTER TABLE "Task" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Document" ADD COLUMN "collaborationGeneration" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "DocumentCollaborationState" (
    "documentId" INTEGER NOT NULL,
    "yjsState" BYTEA NOT NULL,
    "generation" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentCollaborationState_pkey" PRIMARY KEY ("documentId")
);

-- AddForeignKey
ALTER TABLE "DocumentCollaborationState" ADD CONSTRAINT "DocumentCollaborationState_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
