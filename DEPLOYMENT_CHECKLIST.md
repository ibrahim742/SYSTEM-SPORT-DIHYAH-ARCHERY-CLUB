# 📋 Deployment Checklist - Jagoan Hosting cPanel

**Application:** SYSTEM-SPORT-DIHYAH-ARCHERY-CLUB  
**Domain:** dihyaharchery.com  
**Server:** Jagoan Hosting (cPanel)  
**Node.js:** 20.20  
**Date Started:** May 21, 2026

---

## ✅ Phase 1: Database Setup

- [ ] **1.1** Login ke cPanel Jagoan Hosting
  - URL: https://magna.jagoanhosting.id:2083
  - Keep credentials safe

- [ ] **1.2** Create MySQL Database
  - Database Name: `dihyaharchery_club_db`
  - Status: _______________

- [ ] **1.3** Create Database User
  - Username: `dihyaharch_user`
  - Password: (SECURE, simpan di password manager)
  - Status: _______________

- [ ] **1.4** Add User to Database with Full Privileges
  - User: `dihyaharch_user`
  - Database: `dihyaharchery_club_db`
  - All privileges: ✓
  - Status: _______________

- [ ] **1.5** Test Database Connection
  - Command: `mysql -u dihyaharch_user -p -h localhost dihyaharchery_club_db`
  - Connection: ✓ Success

---

## ✅ Phase 2: Node.js Application Setup

- [ ] **2.1** Create Node.js Application in cPanel
  - Node.js Version: 20.20.0
  - Domain: dihyaharchery.com
  - Application Root: `/public_html/dihyaharchery.com`
  - Status: _______________

- [ ] **2.2** Clone GitHub Repository
  ```bash
  cd ~/public_html/dihyaharchery.com
  git clone https://github.com/ibrahim742/SYSTEM-SPORT-DIHYAH-ARCHERY-CLUB.git .
  ```
  - Status: _______________
  - Files cloned: _______________

- [ ] **2.3** Create `.env.production` File
  - DATABASE_URL: Configured _______________
  - AUTH_SECRET: Generated _______________
  - AUTH_URL: https://dihyaharchery.com _______________
  - All env vars: ✓ Complete

- [ ] **2.4** Install NPM Dependencies
  ```bash
  npm install --production
  ```
  - Installation: ✓ Success
  - Packages: _____ installed

---

## ✅ Phase 3: Database Migration & Seeding

- [ ] **3.1** Generate Prisma Client
  ```bash
  npx prisma generate
  ```
  - Status: ✓ Complete

- [ ] **3.2** Run Database Migrations
  ```bash
  npx prisma migrate deploy
  ```
  - Migrations: _____ applied
  - Status: ✓ Success

- [ ] **3.3** Seed Database (Optional)
  ```bash
  npx prisma db seed
  ```
  - Seed data: (Completed / Skipped)
  - Status: _______________

---

## ✅ Phase 4: Build & Server Configuration

- [ ] **4.1** Build Next.js Application
  ```bash
  npm run build
  ```
  - Build time: _____ seconds
  - Build size: _____ MB
  - Status: ✓ Success

- [ ] **4.2** Verify Build Output
  - `.next` folder: ✓ Exists
  - `public` folder: ✓ Exists
  - Status: ✓ Complete

- [ ] **4.3** Update Node.js App Settings in cPanel
  - Startup File: `server.js`
  - Port: 3000 (or ________)
  - Application URL: dihyaharchery.com
  - Status: _______________

- [ ] **4.4** Start/Restart Node.js Application
  - Application Status: 🟢 Running
  - Port: 3000 (or ________)
  - Status: ✓ Running

---

## ✅ Phase 5: SSL & Domain Configuration

- [ ] **5.1** Verify SSL Certificate
  - Domain: dihyaharchery.com
  - SSL Status: 🔒 Secure (HTTPS)
  - Certificate: _______________
  - Expiry: _______________

- [ ] **5.2** Test HTTPS Connection
  - URL: https://dihyaharchery.com
  - Connection: ✓ Secure

- [ ] **5.3** Verify DNS Resolution
  - Domain: dihyaharchery.com
  - IP Address: _______________
  - Status: ✓ Resolving

---

## ✅ Phase 6: Application Testing

- [ ] **6.1** Check Homepage
  - URL: https://dihyaharchery.com
  - Status: ✓ Loading
  - No errors: ✓

- [ ] **6.2** Test Login Page
  - URL: https://dihyaharchery.com/login
  - Form displays: ✓
  - Status: ✓ Ready

- [ ] **6.3** Test Database Connection
  - Check API endpoint that queries database
  - Response: ✓ Success
  - Status: ✓ Connected

- [ ] **6.4** Check Error Logs
  - Terminal: `tail -f ~/.pm2/logs/app-out.log`
  - Errors: None / Listed below:
  - _______________

- [ ] **6.5** Test Authentication
  - Login attempt: ✓ Success
  - Session: ✓ Created
  - Status: ✓ Working

---

## ✅ Phase 7: Deployment Completion

- [ ] **7.1** Verify Git Status
  - Branch: `main`
  - Latest commit: _______________
  - Status: ✓ Up to date

- [ ] **7.2** Monitor Application
  - CPU usage: _____ %
  - Memory usage: _____ MB
  - Request count: _____
  - Status: ✓ Healthy

- [ ] **7.3** Document Access Credentials
  - cPanel URL: https://magna.jagoanhosting.id:2083
  - cPanel User: _______________
  - Database: dihyaharchery_club_db
  - DB User: dihyaharch_user
  - Domain: dihyaharchery.com

- [ ] **7.4** Create Backup
  - Backup location: _______________
  - Date: _______________
  - Status: ✓ Complete

---

## 🚀 Deployment Complete!

**Deployment Date:** _______________  
**Deployed by:** _______________  
**Status:** 🟢 Production Live  
**URL:** https://dihyaharchery.com  

### Quick Links
- **Application:** https://dihyaharchery.com
- **cPanel:** https://magna.jagoanhosting.id:2083
- **GitHub:** https://github.com/ibrahim742/SYSTEM-SPORT-DIHYAH-ARCHERY-CLUB
- **Database:** MySQL `dihyaharchery_club_db`

---

## 📞 Support & Troubleshooting

### If Application Doesn't Start
1. Check cPanel Node.js App status
2. Restart application
3. Check logs: `tail -f ~/.pm2/logs/app-out.log`
4. Verify `.env.production` file

### If Database Connection Fails
1. Test: `mysql -u dihyaharch_user -p dihyaharchery_club_db`
2. Verify DATABASE_URL in `.env.production`
3. Check MySQL user privileges in cPanel

### If Domain Not Resolving
1. Verify DNS in cPanel
2. Check domain settings
3. Allow 24 hours for DNS propagation

### Emergency Restart
```bash
cd ~/public_html/dihyaharchery.com
npm stop
npm start
```

---

**Document Version:** 1.0  
**Last Updated:** May 21, 2026
