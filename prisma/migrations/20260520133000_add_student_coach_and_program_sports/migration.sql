CREATE TYPE "ProgramType" AS ENUM ('LATIHAN', 'PERSIAPAN_TURNAMEN');

ALTER TABLE "Student" ADD COLUMN "coachId" TEXT;

ALTER TABLE "Program" ADD COLUMN "sportId" TEXT;
ALTER TABLE "Program" ADD COLUMN "type" "ProgramType" NOT NULL DEFAULT 'LATIHAN';
ALTER TABLE "Program" ADD COLUMN "createdById" TEXT;

UPDATE "Program"
SET "sportId" = COALESCE(
    (SELECT "id" FROM "Sport" WHERE ("slug" = 'panahan' OR "name" = 'Panahan') AND "deletedAt" IS NULL LIMIT 1),
    (SELECT "id" FROM "Sport" WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1)
)
WHERE "sportId" IS NULL;

UPDATE "Student" s
SET "coachId" = c."id"
FROM (
    SELECT DISTINCT ON (cc."clubId") cc."clubId", cc."coachId" AS "id"
    FROM "CoachClub" cc
    JOIN "User" u ON u."id" = cc."coachId"
    WHERE u."role" = 'COACH'
      AND u."status" = 'ACTIVE'
      AND u."deletedAt" IS NULL
    ORDER BY cc."clubId", cc."createdAt" ASC
) c
WHERE s."clubId" = c."clubId"
  AND s."coachId" IS NULL;

ALTER TABLE "Program" ALTER COLUMN "sportId" SET NOT NULL;

ALTER TABLE "Student" ADD CONSTRAINT "Student_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Program" ADD CONSTRAINT "Program_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Program" ADD CONSTRAINT "Program_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Student_coachId_idx" ON "Student"("coachId");
CREATE INDEX "Program_sportId_type_status_idx" ON "Program"("sportId", "type", "status");
CREATE INDEX "Program_createdById_idx" ON "Program"("createdById");

INSERT INTO "Sport" ("id", "name", "slug", "icon", "description")
SELECT 'sport_panahan', 'Panahan', 'panahan', 'target', 'Cabang olahraga panahan.'
WHERE NOT EXISTS (SELECT 1 FROM "Sport" WHERE "name" = 'Panahan' OR "slug" = 'panahan');

INSERT INTO "Sport" ("id", "name", "slug", "icon", "description")
SELECT 'sport_boxing', 'Boxing', 'boxing', 'gloves', 'Cabang olahraga tinju.'
WHERE NOT EXISTS (SELECT 1 FROM "Sport" WHERE "name" = 'Boxing' OR "slug" = 'boxing');

INSERT INTO "Sport" ("id", "name", "slug", "icon", "description")
SELECT 'sport_futsal', 'Futsal', 'futsal', 'ball', 'Cabang olahraga futsal.'
WHERE NOT EXISTS (SELECT 1 FROM "Sport" WHERE "name" = 'Futsal' OR "slug" = 'futsal');

INSERT INTO "Sport" ("id", "name", "slug", "icon", "description")
SELECT 'sport_bola', 'Bola', 'bola', 'football', 'Cabang olahraga sepak bola.'
WHERE NOT EXISTS (SELECT 1 FROM "Sport" WHERE "name" = 'Bola' OR "slug" = 'bola');

INSERT INTO "Program" ("id", "slug", "sportId", "type", "name", "level", "duration", "materials", "intensity", "description", "status", "createdAt", "updatedAt")
VALUES
  ('program_panahan_latihan', 'panahan-fondasi-stance', (SELECT "id" FROM "Sport" WHERE ("slug" = 'panahan' OR "name" = 'Panahan') LIMIT 1), 'LATIHAN', 'Panahan - Fondasi Stance & Grip', 'PENGENALAN', '2 minggu', 3, 'Rendah', 'Program latihan teknik dasar panahan.', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('program_panahan_turnamen', 'panahan-persiapan-turnamen', (SELECT "id" FROM "Sport" WHERE ("slug" = 'panahan' OR "name" = 'Panahan') LIMIT 1), 'PERSIAPAN_TURNAMEN', 'Panahan - Persiapan Turnamen 30m', 'PRESTASI', '4 minggu', 3, 'Tinggi', 'Program persiapan scoring, mental, dan simulasi turnamen panahan.', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('program_boxing_latihan', 'boxing-fundamental-combo', (SELECT "id" FROM "Sport" WHERE ("slug" = 'boxing' OR "name" = 'Boxing') LIMIT 1), 'LATIHAN', 'Boxing - Fundamental Combo & Defense', 'DASAR', '3 minggu', 3, 'Sedang', 'Program latihan teknik dasar boxing.', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('program_boxing_turnamen', 'boxing-persiapan-turnamen', (SELECT "id" FROM "Sport" WHERE ("slug" = 'boxing' OR "name" = 'Boxing') LIMIT 1), 'PERSIAPAN_TURNAMEN', 'Boxing - Persiapan Turnamen Sparring', 'PRESTASI', '4 minggu', 3, 'Tinggi', 'Program persiapan sparring, defense, dan recovery ronde.', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('program_futsal_latihan', 'futsal-possession-finishing', (SELECT "id" FROM "Sport" WHERE ("slug" = 'futsal' OR "name" = 'Futsal') LIMIT 1), 'LATIHAN', 'Futsal - Possession & Finishing', 'DASAR', '3 minggu', 3, 'Sedang', 'Program latihan possession dan finishing futsal.', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('program_futsal_turnamen', 'futsal-persiapan-turnamen', (SELECT "id" FROM "Sport" WHERE ("slug" = 'futsal' OR "name" = 'Futsal') LIMIT 1), 'PERSIAPAN_TURNAMEN', 'Futsal - Persiapan Turnamen Tim', 'PRESTASI', '4 minggu', 3, 'Tinggi', 'Program persiapan strategi tim futsal untuk turnamen.', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('program_bola_latihan', 'bola-basic-control-passing', (SELECT "id" FROM "Sport" WHERE ("slug" = 'bola' OR "name" = 'Bola') LIMIT 1), 'LATIHAN', 'Bola - Kontrol, Passing, dan Finishing', 'DASAR', '3 minggu', 3, 'Sedang', 'Program latihan kontrol bola, passing, dan finishing.', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('program_bola_turnamen', 'bola-persiapan-turnamen', (SELECT "id" FROM "Sport" WHERE ("slug" = 'bola' OR "name" = 'Bola') LIMIT 1), 'PERSIAPAN_TURNAMEN', 'Bola - Persiapan Turnamen Matchday', 'PRESTASI', '4 minggu', 3, 'Tinggi', 'Program persiapan matchday dan set piece sepak bola.', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "ProgramMaterial" ("id", "programId", "day", "material", "set", "reps", "duration", "note", "order", "createdAt", "updatedAt")
VALUES
  ('material_panahan_latihan_1', 'program_panahan_latihan', 'Hari 1', 'Postur berdiri dan grip', '3 set', '10 repetisi', '45 menit', 'Fokus teknik dasar', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_panahan_latihan_2', 'program_panahan_latihan', 'Hari 2', 'Anchor point stabil', '3 set', '10 repetisi', '45 menit', 'Fokus konsistensi tarikan', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_panahan_latihan_3', 'program_panahan_latihan', 'Hari 3', 'Release dan follow through', '3 set', '10 repetisi', '45 menit', 'Fokus pelepasan', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_panahan_turnamen_1', 'program_panahan_turnamen', 'Hari 1', 'Simulasi scoring 30m', '4 set', 'Simulasi', '60 menit', 'Fokus kesiapan pertandingan', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_panahan_turnamen_2', 'program_panahan_turnamen', 'Hari 2', 'Manajemen waktu rambahan', '4 set', 'Simulasi', '60 menit', 'Fokus tempo turnamen', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_panahan_turnamen_3', 'program_panahan_turnamen', 'Hari 3', 'Evaluasi grouping turnamen', '4 set', 'Simulasi', '60 menit', 'Fokus koreksi akhir', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_boxing_latihan_1', 'program_boxing_latihan', 'Hari 1', 'Footwork dasar', '3 set', '10 repetisi', '45 menit', 'Fokus teknik dasar', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_boxing_latihan_2', 'program_boxing_latihan', 'Hari 2', 'Jab-cross-hook', '3 set', '10 repetisi', '45 menit', 'Fokus kombinasi', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_boxing_latihan_3', 'program_boxing_latihan', 'Hari 3', 'Slip dan guard', '3 set', '10 repetisi', '45 menit', 'Fokus defense', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_boxing_turnamen_1', 'program_boxing_turnamen', 'Hari 1', 'Skenario sparring ronde', '4 set', 'Simulasi', '60 menit', 'Fokus kesiapan pertandingan', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_boxing_turnamen_2', 'program_boxing_turnamen', 'Hari 2', 'Defense saat tertekan', '4 set', 'Simulasi', '60 menit', 'Fokus respons tekanan', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_boxing_turnamen_3', 'program_boxing_turnamen', 'Hari 3', 'Recovery antar ronde', '4 set', 'Simulasi', '60 menit', 'Fokus stamina', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_futsal_latihan_1', 'program_futsal_latihan', 'Hari 1', 'Passing support', '3 set', '10 repetisi', '45 menit', 'Fokus koneksi tim', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_futsal_latihan_2', 'program_futsal_latihan', 'Hari 2', 'Rotasi posisi', '3 set', '10 repetisi', '45 menit', 'Fokus struktur permainan', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_futsal_latihan_3', 'program_futsal_latihan', 'Hari 3', 'Finishing cepat', '3 set', '10 repetisi', '45 menit', 'Fokus penyelesaian', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_futsal_turnamen_1', 'program_futsal_turnamen', 'Hari 1', 'Set piece kick-in', '4 set', 'Simulasi', '60 menit', 'Fokus strategi turnamen', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_futsal_turnamen_2', 'program_futsal_turnamen', 'Hari 2', 'Transisi pressing', '4 set', 'Simulasi', '60 menit', 'Fokus tekanan kolektif', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_futsal_turnamen_3', 'program_futsal_turnamen', 'Hari 3', 'Simulasi match 2x20', '4 set', 'Simulasi', '60 menit', 'Fokus matchday', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_bola_latihan_1', 'program_bola_latihan', 'Hari 1', 'First touch', '3 set', '10 repetisi', '45 menit', 'Fokus kontrol bola', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_bola_latihan_2', 'program_bola_latihan', 'Hari 2', 'Passing kombinasi', '3 set', '10 repetisi', '45 menit', 'Fokus build up', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_bola_latihan_3', 'program_bola_latihan', 'Hari 3', 'Finishing ke gawang', '3 set', '10 repetisi', '45 menit', 'Fokus penyelesaian', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_bola_turnamen_1', 'program_bola_turnamen', 'Hari 1', 'Game plan matchday', '4 set', 'Simulasi', '60 menit', 'Fokus rencana pertandingan', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_bola_turnamen_2', 'program_bola_turnamen', 'Hari 2', 'Transisi menyerang bertahan', '4 set', 'Simulasi', '60 menit', 'Fokus organisasi tim', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('material_bola_turnamen_3', 'program_bola_turnamen', 'Hari 3', 'Set piece turnamen', '4 set', 'Simulasi', '60 menit', 'Fokus bola mati', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
