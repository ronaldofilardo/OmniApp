-- AlterTable
ALTER TABLE "public"."event_files" ADD COLUMN     "file_content" TEXT,
ALTER COLUMN "file_path" DROP NOT NULL;
