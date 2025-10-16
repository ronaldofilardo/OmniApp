-- CreateTable
CREATE TABLE "public"."upload_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_upload_codes_code_hash" ON "public"."upload_codes"("code_hash");

-- CreateIndex
CREATE UNIQUE INDEX "unique_event_file_type_code" ON "public"."upload_codes"("event_id", "file_type");

-- AddForeignKey
ALTER TABLE "public"."upload_codes" ADD CONSTRAINT "upload_codes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."upload_codes" ADD CONSTRAINT "upload_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
