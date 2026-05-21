# Deployment Guide - JagoanHosting cPanel

Target produksi:

- Domain: `dihyaharchery.com`
- Runtime: Node.js 20.19+ atau 22.x
- Database: MySQL 8 / MariaDB compatible dari cPanel
- Repository: `https://github.com/ibrahim742/SYSTEM-SPORT-DIHYAH-ARCHERY-CLUB`
- Startup file cPanel: `server.js`

## 1. Siapkan Database

Di cPanel, buka **MySQL Databases** lalu buat:

- Database: `dihyaharchery_club_db`
- Shadow database: `dihyaharchery_club_db_shadow`
- User MySQL: contoh `dihyaharch_user`

Tambahkan user ke kedua database dan beri semua privileges. Format URL produksi:

```bash
DATABASE_URL="mysql://dihyaharch_user:YOUR_PASSWORD@localhost:3306/dihyaharchery_club_db"
SHADOW_DATABASE_URL="mysql://dihyaharch_user:YOUR_PASSWORD@localhost:3306/dihyaharchery_club_db_shadow"
```

## 2. Clone Repository

Di cPanel Terminal atau SSH:

```bash
cd ~/public_html
git clone https://github.com/ibrahim742/SYSTEM-SPORT-DIHYAH-ARCHERY-CLUB.git dihyaharchery.com
cd ~/public_html/dihyaharchery.com
```

Jika folder sudah dibuat oleh Node.js Selector, masuk ke folder tersebut lalu clone ke direktori kosong:

```bash
git clone https://github.com/ibrahim742/SYSTEM-SPORT-DIHYAH-ARCHERY-CLUB.git .
```

## 3. Buat Environment Produksi

Generate secret di terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Buat file `.env.production` di root aplikasi:

```bash
cp .env.production.example .env.production
nano .env.production
```

Isi nilai final:

```bash
DATABASE_URL="mysql://dihyaharch_user:YOUR_PASSWORD@localhost:3306/dihyaharchery_club_db"
SHADOW_DATABASE_URL="mysql://dihyaharch_user:YOUR_PASSWORD@localhost:3306/dihyaharchery_club_db_shadow"
AUTH_SECRET="PASTE_RANDOM_SECRET_DI_SINI"
AUTH_TRUST_HOST="true"
AUTH_URL="https://dihyaharchery.com"
NEXTAUTH_URL="https://dihyaharchery.com"
NEXT_PUBLIC_API_URL="https://dihyaharchery.com"
ENABLE_DEV_AUTH="false"
NODE_ENV="production"
```

Jangan commit `.env.production`.

## 4. Install, Migrasi, Build

Gunakan install penuh saat build karena Prisma CLI berada di dependency development:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

Opsional setelah build selesai, kurangi paket development:

```bash
npm prune --omit=dev
```

Kalau data lama dari PostgreSQL masih perlu dipindahkan, set `POSTGRES_DATABASE_URL` dan `MYSQL_DATABASE_URL`, lalu jalankan sebelum aplikasi dipakai:

```bash
npm run db:copy:mysql -- --truncate
npm run db:audit:mysql
```

## 5. Setup Node.js App

Di **Setup Node.js App** / **Node.js Selector**:

- Node.js version: `20.19+` atau `22.x`
- Application root: folder repo, contoh `public_html/dihyaharchery.com`
- Application URL: `dihyaharchery.com`
- Application startup file: `server.js`
- Environment: `production`

Restart aplikasi dari panel setelah build berhasil.

## 6. Update Deployment Berikutnya

Untuk update manual:

```bash
cd ~/public_html/dihyaharchery.com
git pull origin main
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm prune --omit=dev
```

Lalu restart aplikasi dari Node.js Selector.

## 7. Verifikasi

Checklist setelah restart:

- `https://dihyaharchery.com` terbuka.
- Login berhasil.
- Dashboard, murid, coach, program, dan audit log bisa dibuka.
- Coach pada form murid tampil sesuai club dan cabang olahraga.
- `npm run db:audit:mysql` tidak menunjukkan error.

## Troubleshooting

**Cannot find module `next`**

Jalankan `npm ci`, lalu restart aplikasi.

**Command `prisma` tidak ditemukan**

Jalankan install penuh dengan `npm ci`, bukan `npm install --production`, sebelum `npx prisma migrate deploy`.

**Database connection refused**

Pastikan `DATABASE_URL` menggunakan host cPanel yang benar. Untuk MySQL lokal cPanel biasanya `localhost`.

**Aplikasi tidak start**

Cek startup file harus `server.js`, pastikan `.env.production` sudah ada, lalu restart dari Node.js Selector.

**Migration gagal di production**

Jangan jalankan `prisma migrate dev` di production. Gunakan:

```bash
npx prisma migrate deploy
```
