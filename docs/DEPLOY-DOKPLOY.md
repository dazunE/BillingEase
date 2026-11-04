# Hosting on Dokploy, with Stalwart mail and S3 file storage

BillingEase is three containers: `db` (PostgreSQL), `api` (Fastify) and `web` (Next.js). Only `web` is public. The API sends email and stores files. With the settings below, email goes through **Stalwart** over SMTP and files go to a private bucket on **Silo** (or any S3-compatible store).

```
Browser ──https──▶ Traefik (Dokploy) ──▶ web:3000 ──▶ api:4000 ──▶ db:5432
                                                        │
                                                        ├─ SMTP 465 ──▶ Stalwart ──▶ recipients
                                                        └─ S3 https ──▶ Silo bucket (private)
```

## 1. Create the app in Dokploy

1. **Create Service → Compose**, source = this Git repository, branch to deploy, compose path `./docker-compose.yml`.
2. **Domains**: add your domain (e.g. `app.example.com`) → service `web`, port `3000`, HTTPS on (Let's Encrypt). Don't add a domain for `api` or `db`: they stay private.
   - Dokploy's Traefik handles the domain, so the `ports: "3000:3000"` mapping isn't needed. Remove it (or firewall port 3000) so the app is reachable only through HTTPS.
3. **Environment** tab: paste the variables from sections 2–4 below. Dokploy writes them into the compose project's `.env`, and `docker-compose.yml` passes each one to the `api` service.
4. **Deploy**. Database migrations run when the API starts.

## 2. Core settings

```env
APP_URL=https://app.example.com
# Long random string; the web app and API must share it. e.g. openssl rand -hex 32
API_INTERNAL_KEY=<random>
```

Also change the Postgres password in `docker-compose.yml` (`POSTGRES_PASSWORD` and the matching `DATABASE_URL`), or point `DATABASE_URL` at a Dokploy-managed Postgres database instead.

## 3. Email through Stalwart (SMTP)

### In Stalwart

1. **Domain**: add the domain you'll send from (e.g. `example.com`) under *Management → Domains*. Stalwart generates DKIM keys and lists the DNS records the domain needs.
2. **DNS** (at your DNS provider): publish what Stalwart lists. At minimum:

   | Record | Example |
   |---|---|
   | `MX` | `example.com → mail.example.com` |
   | `A` | `mail.example.com → <Stalwart server IP>` |
   | SPF `TXT` on `example.com` | `v=spf1 mx -all` (or `a:mail.example.com`) |
   | DKIM `TXT` | `<selector>._domainkey.example.com` as Stalwart shows it |
   | DMARC `TXT` on `_dmarc.example.com` | `v=DMARC1; p=quarantine; rua=mailto:postmaster@example.com` |
   | **PTR** (reverse DNS, set at your VPS provider) | `<server IP> → mail.example.com` |

   Without SPF, DKIM, DMARC and reverse DNS, Gmail and Outlook will send invoices to spam or reject them.
3. **Sending account**: create an account just for the app, e.g. `billing@example.com`, with a strong password. Use an app password if the account has 2FA.
4. **Listeners**: check that submission is enabled on **465 (implicit TLS)** or **587 (STARTTLS)** with a valid certificate for `mail.example.com`.
5. **Outbound port 25**: many VPS providers (Hetzner, DigitalOcean, AWS…) block it by default, and Stalwart needs it to deliver to other servers. Ask the provider to unblock it, or set up a relay in Stalwart.

### In Dokploy (environment)

```env
SMTP_HOST=mail.example.com
SMTP_PORT=465
SMTP_USER=billing@example.com
SMTP_PASSWORD=<the account's password>
EMAIL_FROM=BillingEase <billing@example.com>
```

- `EMAIL_FROM` must be the account's own address (or an alias Stalwart lets it send as). Stalwart rejects mail whose sender doesn't match the login.
- Use port `587` if 465 isn't open. The app then requires STARTTLS and never sends the password in plain text. `SMTP_SECURE=true|false` overrides what the port implies.
- Use the **public hostname** (the one the certificate is issued for), even when Stalwart runs on the same Dokploy server. A Docker service name like `stalwart` fails TLS certificate checks.
- Invoices go out from `EMAIL_FROM`, with *Reply-To* set to the business's own email, so customer replies reach the business, not the sending mailbox.
- When `SMTP_HOST` is set, SMTP is used even if `POSTMARK_TOKEN` is also set. Leave `POSTMARK_TOKEN` empty.

## 4. Files on Silo (S3-compatible)

Logos, receipt photos, bill and expense attachments, and bank statements go here. The bucket stays **private**: people only ever download files through the API, which checks they can see them. Don't make the bucket public, and don't add CORS rules.

### In Silo

1. Create a bucket, e.g. `billingease`.
2. Create an access key limited to that bucket, with permission to **list the bucket** and to **get, put and delete objects** (`s3:ListBucket`, `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`). Delete permission is needed: when a business is closed, all its files are removed.
3. Note the S3 endpoint URL (the API address, not the web console's), and the region Silo expects (many self-hosted stores accept any value; use `us-east-1` if unsure).
4. Optional but worthwhile: turn on versioning or backups for the bucket. These are people's financial records.

### In Dokploy (environment)

```env
S3_ENDPOINT=https://silo.example.com
S3_REGION=us-east-1
S3_BUCKET=billingease
S3_ACCESS_KEY_ID=<key id>
S3_SECRET_ACCESS_KEY=<secret>
# Optional: a folder inside the bucket, e.g. to share one bucket between staging and prod.
S3_PREFIX=prod
```

- With `S3_ENDPOINT` set, the app uses path-style URLs (`https://silo.example.com/billingease/…`), which self-hosted stores expect. If Silo serves buckets as subdomains (`https://billingease.silo.example.com`), set `S3_FORCE_PATH_STYLE=false`.
- Once S3 is on, the `files` volume in `docker-compose.yml` is no longer used. Keep it until you've moved old files (below).

### Moving existing files (only if the app already has uploads on disk)

Files are stored under the same key on disk and in the bucket (`<business id>/<file id>.<ext>`), so a straight copy is enough. On the Dokploy server:

```sh
docker volume ls | grep files          # find the volume, e.g. billingease-abc123_files
docker run --rm -v <that volume>:/data:ro \
  -e AWS_ACCESS_KEY_ID=<key id> -e AWS_SECRET_ACCESS_KEY=<secret> -e AWS_DEFAULT_REGION=us-east-1 \
  amazon/aws-cli s3 sync /data/files s3://billingease/prod/ --endpoint-url https://silo.example.com
```

Leave out `prod/` if you don't use `S3_PREFIX`. Run the copy, set the S3 variables and redeploy. Then run the copy once more to pick up anything uploaded during the switch.

## 5. Check it works

1. **Logs** (Dokploy → the compose project → `api` → Logs): after start-up there's a `providers` line such as
   `email: "smtp mail.example.com:465"`, `files: "s3 https://silo.example.com/billingease/prod/"`.
   If it says `outbox` or `disk`, the variables didn't reach the API container. Check the Environment tab and redeploy.
2. **Email**: invite someone under *Business → People and access*, or send an invoice to yourself. Emails go out within about 30 seconds. If one doesn't arrive, look at the `outbox_emails` table: `status` is `sent`, `failed` (the `error` column says why, and the app retries up to 5 times) or `kept` (SMTP isn't configured).
   Check the received message's headers for `spf=pass`, `dkim=pass` and `dmarc=pass`, or use mail-tester.com.
3. **Files**: upload a logo under *Account → Invoice branding*, then check that an object appeared in the bucket under `<prefix>/<business id>/`.

## Troubleshooting

| What you see | Likely cause |
|---|---|
| `failed`, error mentions `ECONNREFUSED` / timeout on 465 or 587 | Port not open on Stalwart, a firewall in between, or the wrong hostname. |
| `Invalid login` / `535` | Wrong `SMTP_USER` / `SMTP_PASSWORD`. Use the full email address as the user. |
| `certificate` / `altnames` errors | `SMTP_HOST` isn't the name on Stalwart's certificate (e.g. a Docker service name or an IP). |
| `Sender address rejected` / `not allowed to send as` | `EMAIL_FROM` isn't the logged-in account or one of its aliases. |
| Status `sent` but the mail never arrives / lands in spam | DNS (SPF/DKIM/DMARC/PTR), or outbound port 25 blocked on the Stalwart server. Check Stalwart's delivery queue and logs. |
| API won't start: `S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be set with S3_BUCKET` | `S3_BUCKET` is set but a key is missing. |
| Uploads fail with `AccessDenied` | The key lacks put/get/delete/list on the bucket. |
| `NoSuchBucket` or odd host-name errors | Wrong bucket name, or path-style mismatch (try `S3_FORCE_PATH_STYLE`). |
| `SignatureDoesNotMatch` | Wrong secret, `S3_ENDPOINT` points at the web console instead of the S3 API, or the server clock is off. |
| Old logos and attachments missing after switching | Existing files weren't copied: see *Moving existing files*. |
