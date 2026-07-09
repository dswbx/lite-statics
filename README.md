# Static Harbor

Static Harbor lets you publish a small static website from one HTML file or a ZIP file. You get a public link, can add a password, can set an expiry date, and can see simple visit counts.

Your uploaded site files are stored in Cloudflare R2 under `{siteId}/...` in a single bucket. Site settings and analytics are stored in Cloudflare D1. The public site is served directly from the main Worker, which reads assets from R2.

## How to Open It

You need Bun first. If you do not have it, install it from https://bun.sh.

```bash
cd 2026-07-08-gpt5.5-vite-static-host
bun install
bun run dev
```

Open the local URL shown in the terminal, usually:

```text
http://localhost:5173/
```

This uses Cloudflare's Vite plugin, so the dashboard and Worker API run together. You do not need to build first.

If you need to debug old Wrangler behavior directly, `bun run worker:dev` is still available as a fallback.

## How to Use It

1. Read the short landing page. It explains that Static Harbor hosts static sites, but uploads require an account.
2. Click **Sign up to upload** and create an account with email and password. Use the same screen to sign in later.
3. The dashboard at `/dashboard` shows the sites you have already added.
4. Click **New site**. The create page is `/dashboard/sites/new` and starts with uploading one `.html` file or one `.zip` file. ZIP files must include `index.html` at the top level.
5. The app suggests a name and slug from the file name. The name is optional, and you can overwrite the slug before publishing.
6. After publishing, the site settings page opens at `/dashboard/sites/<site-id>`. Refreshing that address keeps the same site open.
7. The settings page shows the current upload state, public URL, access controls, expiry, replacement upload, and analytics.
8. Open the public link, such as `/s/my-site/`, to see the uploaded static site.

## Deploying to Cloudflare

Before a real deploy, create the Cloudflare resources and replace the placeholder IDs in `wrangler.jsonc`:

- D1 database named `static-host-db`
- R2 bucket named `static-host-assets`
- A real `COOKIE_SECRET` using `wrangler secret put COOKIE_SECRET`

Then run:

```bash
bun run deploy
```

The deploy script builds the dashboard and Worker with the Cloudflare Vite plugin, applies remote D1 migrations, and deploys the generated Worker config.

## Troubleshooting

- If `wrangler d1 migrations apply` asks about a missing database, create the D1 database in Cloudflare and copy its ID into `wrangler.jsonc`.
- If port `5173` is busy, Vite will print the port it chose.
- If `bun run dev` cannot start the Worker runtime, try `bun run worker:dev` as a fallback.
- After schema changes, reset local D1 with `rm -rf .wrangler/state/v3/d1 && bun run db:migration:apply:local`.

## Testing

```bash
bun run test
bun run test:e2e
```

The end-to-end test signs up, creates a site, uploads an HTML file, opens the generated `/s/.../` link in a browser, and checks that the uploaded page appears instead of the dashboard.

## Stack

Vite, React, Tailwind, Supabase Lite, Cloudflare Workers, D1, and R2.

## Todo

- [ ] ensure proper caching for static serve
