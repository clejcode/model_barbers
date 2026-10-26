# Model Barbers Landing Page

Simple static website for the Model Barbers storefront and service information. No build step. The repository root is the site.

The current deploy is still Vercel (`vercel.json`). Cloudflare Pages is the planned host. See `HOSTING.md`. Vercel does not read `_redirects` or `_headers`, and Cloudflare Pages does not read `vercel.json`.

## Domain (not attached yet)

The planned public address is **https://modelbarbers.com** (no `www`). Do not treat the site as live on that host until the domain is connected, or until these files are updated to the real host:

- `index.html`
- `about.html`
- `services.html`
- `find-us.html`
- `robots.txt`
- `sitemap.xml`
- `llms.txt`
- `vercel.json` (www → apex redirect on Vercel)
- `HOSTING.md` (Cloudflare Pages setup, including the www redirect)

In-page links still use `about.html` and the other `.html` files so `python3 -m http.server` keeps working. On Vercel, `cleanUrls` redirects those to `/about`, `/services`, and `/find-us`. Cloudflare Pages serves those same paths, and `_redirects` sends the `.html` and trailing-slash forms there too. Those are the canonical URLs.

## Run locally

1. Open a terminal in this project folder.
2. Start a local static server:

```bash
python3 -m http.server 8000
```

3. Open your browser to:

```text
http://localhost:8000
```

## Alternative quick-open

You can also open `index.html` directly in a browser, but using a local server is recommended so relative assets and embeds behave more consistently.
