CREATE TYPE "Gender" AS ENUM ('LAKI_LAKI', 'PEREMPUAN');

CREATE TABLE "Sport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoachCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CoachCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoachProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "birthDate" TIMESTAMP(3),
    "address" TEXT,
    "photoUrl" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "certification" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Sport_name_key" ON "Sport"("name");
CREATE UNIQUE INDEX "Sport_slug_key" ON "Sport"("slug");
CREATE UNIQUE INDEX "CoachCategory_name_key" ON "CoachCategory"("name");
CREATE UNIQUE INDEX "CoachCategory_slug_key" ON "CoachCategory"("slug");
CREATE UNIQUE INDEX "CoachProfile_userId_key" ON "CoachProfile"("userId");
CREATE UNIQUE INDEX "CoachProfile_phone_key" ON "CoachProfile"("phone");
CREATE INDEX "CoachProfile_sportId_idx" ON "CoachProfile"("sportId");
CREATE INDEX "CoachProfile_categoryId_idx" ON "CoachProfile"("categoryId");

INSERT INTO "Sport" ("id", "name", "slug", "icon", "description")
VALUES ('sport_panahan', 'Panahan', 'panahan', 'target', 'Cabang olahraga default untuk data lama.')
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "CoachCategory" ("id", "name", "slug", "description")
VALUES ('coach_category_umum', 'Coach Umum', 'coach-umum', 'Kategori default untuk coach lama.')
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "Student" ADD COLUMN "sportId" TEXT;

UPDATE "Student"
SET "sportId" = COALESCE(
    (SELECT "id" FROM "Sport" WHERE "slug" = 'panahan' LIMIT 1),
    'sport_panahan'
)
WHERE "sportId" IS NULL;

INSERT INTO "CoachProfile" (
    "id",
    "userId",
    "sportId",
    "categoryId",
    "phone",
    "gender",
    "experienceYears"
)
SELECT
    'coach_profile_' || u."id",
    u."id",
    (SELECT "id" FROM "Sport" WHERE "slug" = 'panahan' LIMIT 1),
    (SELECT "id" FROM "CoachCategory" WHERE "slug" = 'coach-umum' LIMIT 1),
    'coach-' || u."id",
    'LAKI_LAKI',
    0
FROM "User" u
WHERE u."role" = 'COACH'
ON CONFLICT ("userId") DO NOTHING;

ALTER TABLE "Student" ALTER COLUMN "sportId" SET NOT NULL;

ALTER TABLE "Student" ADD CONSTRAINT "Student_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CoachCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Student_sportId_idx" ON "Student"("sportId");
