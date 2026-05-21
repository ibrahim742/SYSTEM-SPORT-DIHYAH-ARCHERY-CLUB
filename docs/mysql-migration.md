# PostgreSQL to MySQL Migration

This project now uses Prisma with MySQL. Keep the old PostgreSQL database online until the copy step is verified.

## Environment

Set the MySQL target as the app database:

```bash
DATABASE_URL="mysql://user:password@127.0.0.1:3306/altlit"
SHADOW_DATABASE_URL="mysql://user:password@127.0.0.1:3306/altlit_shadow"
```

Set these extra URLs only when copying existing PostgreSQL data:

```bash
POSTGRES_DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/altlit"
MYSQL_DATABASE_URL="mysql://user:password@127.0.0.1:3306/altlit"
```

## Migration Steps

```bash
npm run prisma:validate
npm run prisma:migrate
npm run db:copy:mysql -- --truncate
npm run db:audit:mysql
npm run build
```

The `--truncate` flag clears the MySQL target tables before copying. Omit it only when the MySQL target is already empty or you intentionally want inserts to fail on duplicate keys.

After the copy, compare the row counts printed by the script with the source PostgreSQL database before switching production traffic.
