/*
  Warnings:

  - You are about to drop the column `category_id` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `recurrence_end_date` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `recurrence_rule` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `recurrence_total_occurrences` on the `events` table. All the data in the column will be lost.
  - You are about to drop the `event_occurrences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `repetitive_event_categories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."event_occurrences" DROP CONSTRAINT "event_occurrences_event_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."events" DROP CONSTRAINT "events_category_id_fkey";

-- AlterTable
ALTER TABLE "public"."events" DROP COLUMN "category_id",
DROP COLUMN "recurrence_end_date",
DROP COLUMN "recurrence_rule",
DROP COLUMN "recurrence_total_occurrences";

-- DropTable
DROP TABLE "public"."event_occurrences";

-- DropTable
DROP TABLE "public"."repetitive_event_categories";
