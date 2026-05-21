# Deployment Guide - Cloudflare Pages

## Setup Cloudflare Pages untuk SYSTEM-SPORT-DIHYAH-ARCHERY-CLUB

### Prerequisites
- ✅ GitHub repo: https://github.com/ibrahim742/SYSTEM-SPORT-DIHYAH-ARCHERY-CLUB
- ✅ MySQL 8 database sudah tersedia
- ✅ `.env` sudah dikonfigurasi di local

### Step-by-Step Setup

#### 1. Login ke Cloudflare Pages
1. Buka https://pages.cloudflare.com
2. Login dengan akun Cloudflare (atau buat gratis)

#### 2. Connect GitHub Repository
1. Klik **"Create a project"** → **"Connect to Git"**
2. Authorize Cloudflare untuk akses GitHub
3. Select organization: `ibrahim742`
4. Select repository: `SYSTEM-SPORT-DIHYAH-ARCHERY-CLUB`
5. Klik **"Begin setup"**

#### 3. Configure Build Settings
Gunakan konfigurasi berikut:

| Setting | Value |
|---------|-------|
| **Production branch** | `main` |
| **Build command** | `npm run build` |
| **Build output directory** | `.next` |
| **Root directory** | `/` |

#### 4. Set Environment Variables
Klik **"Environment variables"** dan tambahkan:

```
DATABASE_URL = mysql://user:password@host:3306/altlit

AUTH_SECRET = (generate random string, contoh: abc123xyz789...)

AUTH_TRUST_HOST = true

NEXT_PUBLIC_API_URL = https://your-domain.com (akan diupdate nanti)
```

⚠️ **PENTING**: Generate AUTH_SECRET yang aman!
```bash
# Run this locally to generate:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 5. Deploy
1. Klik **"Save and Deploy"**
2. Tunggu build complete (2-5 menit)
3. URL deployment akan otomatis di-generate: `https://[project-name].pages.dev`

#### 6. Post-Deployment
1. Update `NEXT_PUBLIC_API_URL` env var dengan domain final Anda
2. Test login dan basic functionality
3. Setup custom domain (optional)

### Troubleshooting

**Build gagal?**
- Check build logs di Cloudflare dashboard
- Pastikan semua env vars sudah set
- Verifikasi database connection

**Database connection error?**
- Pastikan MySQL database online dan user punya akses ke database `altlit`
- Test connection string di local dengan Prisma: `DATABASE_URL="mysql://user:password@host:3306/altlit" npx prisma validate`
- Check Cloudflare Pages build logs

**Auth issue?**
- Verify AUTH_SECRET environment variable
- Check NEXTAUTH_URL/AUTH_TRUST_HOST

### Auto-Deployment
Setelah setup selesai, setiap push ke branch `main` akan otomatis deploy!

```bash
git add .
git commit -m "Your message"
git push origin main
# Deployment akan mulai otomatis di Cloudflare Pages
```

---

**Questions?** Check Cloudflare Pages docs: https://developers.cloudflare.com/pages/
