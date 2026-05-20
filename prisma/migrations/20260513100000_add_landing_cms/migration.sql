CREATE TABLE "LandingSection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "eyebrow" TEXT,
    "imageUrl" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LandingSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LandingItem" (
    "id" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "eyebrow" TEXT,
    "imageUrl" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "icon" TEXT,
    "value" TEXT,
    "href" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LandingItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LandingSection_key_key" ON "LandingSection"("key");
CREATE INDEX "LandingSection_status_sortOrder_idx" ON "LandingSection"("status", "sortOrder");
CREATE INDEX "LandingItem_sectionKey_status_sortOrder_idx" ON "LandingItem"("sectionKey", "status", "sortOrder");

ALTER TABLE "LandingItem" ADD CONSTRAINT "LandingItem_sectionKey_fkey" FOREIGN KEY ("sectionKey") REFERENCES "LandingSection"("key") ON DELETE CASCADE ON UPDATE CASCADE;
