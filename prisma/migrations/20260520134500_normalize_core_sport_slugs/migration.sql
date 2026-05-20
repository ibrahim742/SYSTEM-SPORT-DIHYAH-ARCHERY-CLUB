UPDATE "Sport"
SET "slug" = 'futsal'
WHERE "name" = 'Futsal'
  AND "slug" <> 'futsal'
  AND NOT EXISTS (SELECT 1 FROM "Sport" WHERE "slug" = 'futsal');
