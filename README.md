# VaultMarket

VaultMarket is an original Next.js marketplace starter for legitimate digital goods and virtual products. It uses a modern dark responsive UI and a PostgreSQL-backed App Router implementation. This source is deliberately not a copy of Eldorado.gg or any other marketplace brand.

## Included in this source

- Next.js + React + TypeScript + Tailwind CSS
- PostgreSQL and Prisma schema/seed data
- Hashed-cookie database sessions, bcrypt password hashing, registration, login/logout, email verification and password-reset link flows
- Database-backed product discovery, text search, category/price/rating filters, sorting, pagination and favorites
- Seller profile, product CRUD, inventory management and store storefront
- AES-256-GCM encryption for digital inventory at rest
- Stripe Checkout destination charges, Stripe Connect Express onboarding, signed webhook verification, payment state transitions, stock reservation/release and buyer-only order delivery
- Buyer orders, seller orders, purchase-tied reviews, messaging, notifications, reports, disputes, and protected admin moderation screens
- Presigned S3-compatible listing-image uploads
- SEO metadata, canonical-friendly slugs, sitemap and robots routes
- Sample policy pages and seeded example listings

## Important launch boundary

This is an actual source project, but a fresh code archive cannot be considered a verified production service until you configure real infrastructure, run the build and security review, test live-like payment/refund/dispute scenarios, and publish jurisdiction-specific policies. This starter has several explicit limitations:

**Validation status for this delivered snapshot:** local imports and TypeScript syntax were checked, but package installation timed out in the build environment, so the Prisma client, database migration and Next.js production build could not be executed here. Run the Windows setup below and verify the full build before using live credentials.

- **Payments and payouts require Stripe setup.** Seller destination charges require Stripe Connect to be enabled on your platform and the seller to complete Stripe Express onboarding. New/demo sellers are not payout-enabled until that process and the `account.updated` webhook complete.
- **Tax/VAT calculation is not included.** Configure Stripe Tax or a reviewed tax workflow before live sales.
- **Refunds are full-refund only in the admin UI.** The Orders & payments screen can request a Stripe refund for a paid destination charge, reverse the connected-account transfer and refund the application fee. The signed webhook applies the final refunded state. Partial refunds, a full audit ledger and a more comprehensive finance console are not included; test refund scenarios in Stripe test mode before launch.
- **Automated delivery currently supports encrypted text/code/instructions.** The inventory model is extensible, but private binary download upload/streaming is not implemented. Do not place public download links or secrets in a listing description.
- **Rate limiting is process-local for development.** Use Redis/Upstash or an edge/WAF rate limiter before production; do not rely on in-memory limits across serverless instances.
- **Email verification and password resets** log the one-time URL to the development terminal when `RESEND_API_KEY` is empty. Configure a verified sender in Resend for actual email delivery.
- **Storage image upload** requires S3-compatible credentials, a public image/CDN base URL and bucket CORS that permits your deployed origin. Digital inventory should not be stored in a publicly readable image bucket.
- The sample policy text is not legal advice. Add real operator contacts, lawful terms, privacy disclosures, seller verification, abuse handling and record-retention rules for your jurisdiction.
- The basic admin panel can moderate users/listings/reports/categories and review orders/disputes, and can submit full refunds through Stripe. It is not a full support console; partial refunds, chargeback automation, a complete financial audit ledger and escalations are not included.

Do not publish demo seed accounts or demo inventory as live products. Do not list stolen or compromised accounts, credentials, payment data, malware, or goods forbidden by law or third-party game/platform rules.

## Requirements

- Node.js 22 LTS (Node 20.9+ is the Next.js 15 minimum)
- npm
- PostgreSQL 14+
- Stripe account with Connect enabled for marketplace transfers (test mode is fine locally)
- Optional Resend account for outgoing mail
- Optional AWS S3 or S3-compatible object store for listing images

## Windows setup (PowerShell)

1. Install Node.js LTS and PostgreSQL. You can use PostgreSQL locally or run it in Docker. For Docker Desktop, one example command is:

   ```powershell
   docker run --name vaultmarket-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=vaultmarket -p 5432:5432 -d postgres:16
   ```

2. Open PowerShell in the folder containing this project, then install dependencies and copy the environment template:

   ```powershell
   npm install
   Copy-Item .env.example .env.local
   ```

3. Generate a private 32-byte encryption key. Put its output into `INVENTORY_ENCRYPTION_KEY` in `.env.local` (the value must be 64 hexadecimal characters):

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. Edit `.env.local` and set `DATABASE_URL`. For the Docker command above, the local connection string is:

   ```text
   postgresql://postgres:postgres@localhost:5432/vaultmarket?schema=public
   ```

   Set `APP_URL=http://localhost:3000`. Generate a new encryption key for each environment and store it in a secret manager. **Losing this key means encrypted inventory cannot be decrypted. Do not rotate it without a planned re-encryption migration.**

5. Create the database tables and seeded sample data:

   ```powershell
   npx prisma generate
   npx prisma migrate dev --name init
   npm run db:seed
   ```

6. Start the site:

   ```powershell
   npm run dev
   ```

   Open `http://localhost:3000`.

### Demo accounts

The seed script creates the following **local demo-only accounts**:

| Role | Email | Password |
|---|---|---|
| Buyer | `buyer@vaultmarket.test` | `VaultDemo2026!` |
| Seller | `seller@vaultmarket.test` | `VaultDemo2026!` |
| Seller | `studio@vaultmarket.test` | `VaultDemo2026!` |

Seed demo emails are marked verified so the local UI can be explored without a mail provider. They cannot complete a successful paid checkout until the seller connects a Stripe Express account and Stripe reports payouts enabled. Never use these credentials in production. To create a local admin, set `SEED_ADMIN_PASSWORD` in `.env.local` to a unique password of at least 14 characters and run `npm run db:seed`; the admin email is `admin@vaultmarket.test`.

## Stripe test setup

1. Create a Stripe account and use **test-mode** API keys in `.env.local`:
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...` (reserved for future client-side Stripe features; Checkout currently uses hosted redirect)
2. Enable Stripe Connect for your platform, review connected-account settings and make sure your account is permitted to create Express accounts and destination charges.
3. Create a test-mode webhook endpoint for `http://localhost:3000/api/webhooks/stripe` via Stripe CLI. Install the official Stripe CLI and run:

   ```powershell
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Copy the `whsec_...` value that the CLI prints into `STRIPE_WEBHOOK_SECRET` in `.env.local`. Restart the dev server after changing `.env.local`.
4. Sign in as a seeded seller, open **Seller center → Store settings → Connect Stripe payouts**, and complete the Stripe Express test onboarding. Stripe must send an `account.updated` event that sets `payoutsEnabled` before buyers can check out that seller's items.
5. Log in as a buyer (demo card numbers are available in Stripe's official test documentation), buy a seeded automatic listing, and watch the webhook logs. The order only unlocks its encrypted demo payload after Stripe confirms payment. Test webhook retries and expired checkout sessions as well.
6. Configure production webhook events on your live domain and keep live/test keys separate. Never paste secret keys into client-side source or commit `.env.local`.

## Email setup

Create a Resend API key, verify your sending domain/address, then set `RESEND_API_KEY` and `EMAIL_FROM`. Until then, verification/reset URLs are printed in the server terminal for development only. Ensure your deployed `APP_URL` is the canonical HTTPS origin.

## Listing image storage setup

The upload endpoint signs time-limited PUT URLs for JPEG, PNG, WebP and AVIF images up to 5 MB. Configure `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, optional `S3_ENDPOINT`, and `S3_PUBLIC_BASE_URL`. Configure bucket CORS for your frontend origin to permit `PUT` with the `Content-Type` header. Keep the write credentials server-side. Only listing images should use the public asset base URL.

## Production build and deployment

Run a local production build before deploying:

```powershell
npm run build
npm run start
```

Deploy the Next.js app to a Node-capable host (for example a managed Next.js host or container platform) and PostgreSQL to a managed Postgres service. Set all environment variables through the host's secret manager. Run `npx prisma migrate deploy` as a release step, not `migrate dev`, in production. Configure a durable rate limiter, HTTPS and security headers, backups, monitoring, error reporting, provider webhooks, support inbox, legal policies, tax handling and incident-response procedures. Confirm that object storage can only accept signed uploads and is configured with correct CORS.

## Project structure

```text
vaultmarket/
├── app/
│   ├── actions/              # server actions for auth, seller, checkout, moderation
│   ├── account/              # account, orders, private order delivery, settings
│   ├── admin/                # server-authorized admin tools
│   ├── api/                  # upload signing and Stripe webhook
│   ├── checkout/             # checkout review and server action
│   ├── listing/              # public product pages
│   ├── marketplace/          # database-backed browse + filters
│   ├── messages/              # participant-scoped messaging
│   ├── policy/                # policy pages
│   └── seller/                # seller dashboard/listings/storefront
├── components/               # reusable UI and forms
├── lib/                      # auth, Prisma, crypto, email, Stripe, storage
├── prisma/schema.prisma       # database schema
├── prisma/seed.ts             # local demo data
├── .env.example
├── package.json
└── README.md
```

## Security model and review checklist

- Passwords are bcrypt-hashed and session cookies are HTTP-only, SameSite=Lax and Secure in production.
- Session bearer tokens are stored in the database as SHA-256 hashes and expire after 30 days.
- Private inventory payloads are encrypted at rest with AES-256-GCM and are decrypted only by the order detail server route after buyer ownership + paid/delivered status checks.
- Checkout creates a server-side order and inventory reservation. Stripe signatures are verified before order state changes. Reservation release handles expired/failed checkout sessions.
- Admin authorization and conversation/owner checks are server-side.
- Every external deployment still needs dependency scanning, penetration testing, CSRF/origin verification review, distributed rate limiting, logging/alerting, webhook replay tests, database backups and legal/compliance review.
