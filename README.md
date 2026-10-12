# Daily Finds

A Next.js affiliate catalog. Products come from two places:

- **Demo products** hardcoded in `lib/products.ts` (always shown).
- **Your products**, added at **`/admin`** and stored in Cloudflare:
  - the text (name, price, platform, category, tag, description, buy link, reel link) in a **D1** database
  - the cover image and up to 6 extra photos in a **Workers KV** namespace, served by the app at `/images/<key>`

Clicking a product opens its own page at `/item/<id>`, with a photo gallery, the details, the reel
(Instagram reels, YouTube Shorts/videos and `.mp4` links are embedded) and similar products.

Both D1 and Workers KV are on Cloudflare's free plan, which does **not** need a credit card.

## Running locally

```bash
npm install
cp .env.example .env   # then fill it in, see below
npm run dev
```

Open http://localhost:3000 for the site and http://localhost:3000/admin to add products.
Without the Cloudflare variables the site still works and shows only the demo products.

You can put the values in `.env` or `.env.local`; both are git-ignored. Never commit real keys.

## Where to get each environment variable

| Variable | What it is | Where to get it | Looks like |
| --- | --- | --- | --- |
| `ADMIN_PASSWORD` | Password for `/admin` | You make it up | any long string |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Dashboard → **Workers & Pages** → right side, **Account ID** | 32 hex characters |
| `CLOUDFLARE_API_TOKEN` | Token that lets the app use D1 and KV | My Profile → **API Tokens** → Create Custom Token ([step 4](#4-api-token)) | ~40 characters |
| `D1_DATABASE_ID` | ID of your D1 database | **Storage & Databases → D1 SQL Database** → your database → **Database ID** ([step 2](#2-d1-database-for-product-data)) | UUID, e.g. `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `KV_NAMESPACE_ID` | ID of your KV namespace | **Storage & Databases → Workers KV** → your namespace → **Namespace ID** ([step 3](#3-workers-kv-namespace-for-images)) | 32 hex characters |

## Cloudflare setup (one time)

Free plan limits: D1 5 GB; Workers KV 1 GB storage, 100,000 reads/day, 1,000 writes/day
(each product added = 1 KV write). Images are cached by the browser/CDN, so KV reads stay low.

### 1. Create a Cloudflare account

Sign up at https://dash.cloudflare.com/sign-up and verify your email.

**Account ID:** open https://dash.cloudflare.com, click **Workers & Pages** in the left sidebar,
and copy **Account ID** from the right side. Put it in `CLOUDFLARE_ACCOUNT_ID`.

### 2. D1 database for product data

1. Left sidebar → **Storage & Databases** → **D1 SQL Database** → **Create Database**.
   Name it `daily-finds`, then **Create**.
2. Copy the **Database ID** shown on the database page into `D1_DATABASE_ID`.
3. Open the database's **Console** tab, paste the contents of [`db/schema.sql`](db/schema.sql), and click **Execute**.
   This creates the `products` table.

**Created the database before product pages had photos and reels?** Run
[`db/migrations/001_photos_and_reel.sql`](db/migrations/001_photos_and_reel.sql) once in the same Console
(or `npx wrangler d1 execute daily-finds --remote --file path/to/daily-finds/db/migrations/001_photos_and_reel.sql`).
Until then the site still shows your products, but saving in `/admin` fails with a message pointing here.

### 3. Workers KV namespace for images

1. Left sidebar → **Storage & Databases** → **Workers KV** → **Create Instance** (or **Create namespace**).
   Name it `daily-finds-images`, then **Create**.
2. Copy its **ID** from the namespace list into `KV_NAMESPACE_ID`.

### 4. API token

1. Go to https://dash.cloudflare.com/profile/api-tokens → **Create Token** → **Create Custom Token**.
2. Name: `daily-finds`. Add two permissions (use **+ Add more** for the second):
   - **Account** → **D1** → **Edit**
   - **Account** → **Workers KV Storage** → **Edit**

   Account Resources: **Include** → your account.
3. **Continue to summary** → **Create Token**, and copy it into `CLOUDFLARE_API_TOKEN`.

Already have a D1-only token? On the API Tokens page click **⋯ → Edit** next to it, add the
**Workers KV Storage → Edit** permission, and **Save**. The token value stays the same.

### 5. Admin password

Set `ADMIN_PASSWORD` to a long password of your choice. Changing it later logs out every admin session.

Your `.env` should now have every variable from `.env.example` filled in. Restart `npm run dev`,
go to `/admin`, log in, and add a product.

### Doing steps 2–3 with Wrangler instead

If you have the Wrangler CLI logged in (`npx wrangler login`), you can create the resources from a terminal.
Run these **outside** this project folder: Wrangler reads this folder's `.env`, and the app's token there
isn't allowed to create resources.

```bash
npx wrangler d1 create daily-finds
npx wrangler d1 execute daily-finds --remote --file path/to/daily-finds/db/schema.sql
npx wrangler kv namespace create daily-finds-images
```

## Deploying to Vercel

1. Push the repo to GitHub and import it at https://vercel.com/new.
2. In **Project → Settings → Environment Variables**, add every variable from `.env`
   (for Production, and Preview if you want).
3. Deploy. New products added at `https://your-site/admin` show up on the home page immediately.

## Notes

- Images can be JPG, PNG, WebP, GIF or AVIF. The admin form shrinks large photos in the browser before
  uploading; all images in one save must add up to 4 MB (Vercel's request body limit is 4.5 MB).
- Deleting a product in `/admin` removes both the D1 row and its image from KV.
- To edit the demo products, change `dummyProducts` in `lib/products.ts`.
