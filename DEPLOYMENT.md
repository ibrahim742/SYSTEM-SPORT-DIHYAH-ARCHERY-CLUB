# Deployment Guide - Jagoan Hosting (cPanel)

## Setup untuk SYSTEM-SPORT-DIHYAH-ARCHERY-CLUB

**Server:** Jagoan Hosting (cPanel)
**Domain:** dihyaharchery.com
**Database:** MySQL (dihyaharchery_club_db)
**Node.js:** 20.20
**GitHub:** https://github.com/ibrahim742/SYSTEM-SPORT-DIHYAH-ARCHERY-CLUB

---

## STEP 1: Setup Database MySQL di cPanel

### 1.1 Login ke cPanel
1. Buka: https://magna.jagoanhosting.id:2083
2. Login dengan credentials Anda

### 1.2 Buat Database Baru
1. Di cPanel Home, cari **"MySQL Databases"**
2. Di bagian **"Create New Database"**:
   - **Database Name:** `dihyaharchery_club_db`
   - Klik **"Create Database"**
3. Catat: **Username akan auto-generate** (misal: `dihyaharch_user`)

### 1.3 Buat Database User & Set Permissions
1. Di bagian **"MySQL Users"**:
   - **Username:** `dihyaharch_user` (atau sesuaikan)
   - **Password:** (generate strong password) 
   - Klik **"Create User"**
2. Di bagian **"Add User To Database"**:
   - Select User: `dihyaharch_user`
   - Select Database: `dihyaharchery_club_db`
   - Klik **"Add"**
3. Centang semua privileges → Klik **"Make Changes"**

**Catat:**
```
DATABASE_URL = mysql://dihyaharch_user:YOUR_PASSWORD@localhost:3306/dihyaharchery_club_db
```

---

## STEP 2: Setup Node.js App di cPanel

### 2.1 Buat Node.js Application
1. Di cPanel Home, cari **"Setup Node.js App"** (atau "Node.js Selector")
2. Klik **"Create Application"**
3. Isi dengan:
   - **Node.js version:** `20.20.0`
   - **Application root:** `/public_html/dihyaharchery.com` (auto-generated)
   - **Application URL:** `dihyaharchery.com`
   - **Application startup file:** `server.js` atau `app.js`
   - Klik **"Create"**

### 2.2 Clone Repository dari GitHub
1. Di cPanel, buka **"Terminal"** (atau gunakan SSH)
2. Navigate ke application directory:
   ```bash
   cd ~/public_html/dihyaharchery.com
   ```
3. Clone repository:
   ```bash
   git clone https://github.com/ibrahim742/SYSTEM-SPORT-DIHYAH-ARCHERY-CLUB.git .
   ```
4. Verifikasi file ada:
   ```bash
   ls -la
   ```

---

## STEP 3: Setup Environment Variables

### 3.1 Buat File `.env.production`
1. Di Terminal cPanel, edit file:
   ```bash
   nano ~/.env.production
   ```

2. Tambahkan konfigurasi berikut:
   ```bash
   # Database
   DATABASE_URL="mysql://dihyaharch_user:YOUR_PASSWORD@localhost:3306/dihyaharchery_club_db"
   SHADOW_DATABASE_URL="mysql://dihyaharch_user:YOUR_PASSWORD@localhost:3306/dihyaharchery_club_db_shadow"
   
   # NextAuth
   AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   AUTH_TRUST_HOST=true
   AUTH_URL=https://dihyaharchery.com
   NEXTAUTH_URL=https://dihyaharchery.com
   
   # API
   NEXT_PUBLIC_API_URL=https://dihyaharchery.com
   
   # Node Environment
   NODE_ENV=production
   ```

3. Save (Ctrl+X → Y → Enter)

### 3.2 Salin ke Aplikasi
```bash
cp ~/.env.production ~/public_html/dihyaharchery.com/.env.production
```

---

## STEP 4: Install Dependencies & Build

### 4.1 Install NPM Packages
```bash
cd ~/public_html/dihyaharchery.com
npm install --production
```

### 4.2 Generate AUTH_SECRET (Jika Belum)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy hasil output ke `.env.production` sebagai `AUTH_SECRET`

### 4.3 Setup Prisma Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database
npx prisma db seed
```

### 4.4 Build Aplikasi
```bash
npm run build
```

Verifikasi `.next` folder terbuat:
```bash
ls -la .next
```

---

## STEP 5: Konfigurasi Server (Startup File)

### 5.1 Buat File `server.js`
```bash
nano ~/public_html/dihyaharchery.com/server.js
```

Tambahkan:
```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Create the Next.js app in production or development mode
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
```

---

## STEP 6: Konfigurasi di cPanel Node.js App

### 6.1 Update Konfigurasi Aplikasi
1. Di cPanel, buka **"Setup Node.js App"**
2. Click aplikasi yang baru dibuat
3. Edit:
   - **Application startup file:** `server.js`
   - **Application URL:** `dihyaharchery.com` 
   - **Port:** `3000` (default, atau gunakan port yang tersedia)
4. Klik **"Save"**

### 6.2 Restart Aplikasi
1. Di cPanel Node.js App page
2. Klik **"Restart"** pada aplikasi Anda
3. Tunggu hingga status berubah menjadi **"Running"**

---

## STEP 7: Konfigurasi SSL & Domain

### 7.1 Setup SSL/HTTPS
1. Di cPanel Home, cari **"AutoSSL"** atau **"SSL/TLS"**
2. Pastikan SSL certificate sudah aktif untuk domain `dihyaharchery.com`
3. Force HTTPS redirect (optional tapi recommended):
   - Edit `.htaccess` atau konfigurasi di Node.js

### 7.2 Update DNS Jika Perlu
1. Pastikan domain `dihyaharchery.com` pointing ke server Jagoan Hosting
2. Check DNS settings di Jagoan Hosting / cPanel

---

## STEP 8: Verifikasi Deployment

### 8.1 Test Aplikasi
1. Buka di browser: https://dihyaharchery.com
2. Cek:
   - Halaman loading dengan benar
   - Login page dapat diakses
   - Database connection OK (check console/logs)

### 8.2 Check Logs
Di cPanel Terminal:
```bash
cd ~/public_html/dihyaharchery.com
tail -f ~/.pm2/logs/app-out.log  # PM2 logs
# atau
npm run dev  # untuk development testing
```

---

## STEP 9: Setup Auto-Deployment (Optional)

### 9.1 Buat Deployment Script
```bash
nano ~/public_html/dihyaharchery.com/deploy.sh
```

Tambahkan:
```bash
#!/bin/bash
cd /home/username/public_html/dihyaharchery.com

# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Build
npm run build

# Run migrations
npx prisma migrate deploy

# Restart Node.js app (via cPanel)
echo "Deployment complete!"
```

### 9.2 Setup GitHub Webhook (Advanced)
Lihat dokumentasi cPanel untuk webhook/auto-deployment setup

---

## Troubleshooting

### ❌ "Cannot find module 'next'"
```bash
cd ~/public_html/dihyaharchery.com
npm install
```

### ❌ "Database connection refused"
- Pastikan MySQL user sudah punya akses ke database
- Test connection: `mysql -u dihyaharch_user -p -h localhost dihyaharchery_club_db`
- Verify DATABASE_URL di `.env.production`

### ❌ "Node.js app not running"
- Restart aplikasi di cPanel
- Check error logs di cPanel
- Verify startup file path `server.js` ada dan executable

### ❌ "PORT 3000 already in use"
- Change port di Node.js App settings
- Update port number di `server.js` untuk match

### ❌ "SSL certificate error"
- Tunggu AutoSSL selesai (bisa 24 jam)
- Atau manual setup SSL di cPanel

---

## Quick Reference

```bash
# SSH Login (jika tersedia)
ssh username@magna.jagoanhosting.id

# Navigate to app
cd ~/public_html/dihyaharchery.com

# View logs
tail -f ~/.pm2/logs/app-out.log

# Restart app
npm restart

# Check database
mysql -u dihyaharch_user -p dihyaharchery_club_db

# View running processes
pm2 list
```

---

**Status:** Ready for deployment ✅
**Last Updated:** May 21, 2026
