# AltLit VPS Security Checklist

## Application
- Set `NODE_ENV=production`, a fresh `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, and `ENABLE_DEV_AUTH=false`.
- Run `npm run security:audit`, `npm run build`, and `npm run prisma:validate` before deployment.
- Rotate default seed passwords immediately after seeding any production-like database.
- Keep `.env` outside backups that may become public, and set restrictive permissions such as `chmod 600 .env`.

## Nginx
- Expose only ports `80` and `443`; run the Node process on localhost, for example `127.0.0.1:3000`.
- Enable HTTPS with Let's Encrypt and redirect all HTTP traffic to HTTPS.
- Set `client_max_body_size 2m` to match the upload limit.
- Add rate limits for auth and API mutation routes, for example separate zones for `/api/auth` and `/api/`.
- Forward `X-Forwarded-For`, `X-Real-IP`, `X-Forwarded-Proto`, and `Host` to Next.js.

## Linux Host
- Use a non-root deploy user and SSH key-only login.
- Enable `ufw` with only SSH, HTTP, and HTTPS allowed.
- Enable `fail2ban` for SSH and Nginx.
- Keep PostgreSQL bound to localhost or a private network only.
- Run database backups on a schedule and test restore regularly.
- Configure log rotation for Nginx and the Node process.
