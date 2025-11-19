-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "keyLid" VARCHAR(100),
ADD COLUMN     "keyParticipantLid" VARCHAR(100),
ALTER COLUMN "keyRemoteJid" DROP NOT NULL;
