# Hosting Model Barbers

The site is static HTML, CSS, and JavaScript. There is no build step. The repository root is the site.

The current deploy is still Vercel, and `vercel.json` is what that deploy uses. Leave that file in place until `modelbarbers.com` is serving from Cloudflare. The two setups do not conflict: Vercel does not read `_redirects` or `_headers`, and Cloudflare Pages does not read `vercel.json`.

## Cloudflare Pages project

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git**.
2. Choose the GitHub repository `clejcode/model_barbers`.
3. Production branch: `main`.
4. Framework preset: **None**.
5. Build command: leave this empty. Do not enter `npm run build` or any other command.
6. Build output directory: `/` (the repository root).
7. Save and deploy. The first deploy is available at `https://<project>.pages.dev`. Attach the custom domain after that.

`_redirects` and `_headers` live in the repository root, which is the output directory, so Pages picks them up with no build.

## Addresses the site expects

Canonicals, Open Graph URLs, `sitemap.xml`, and `llms.txt` all use the apex host, with no `.html` and no trailing slash:

- `https://modelbarbers.com/`
- `https://modelbarbers.com/about`
- `https://modelbarbers.com/services`
- `https://modelbarbers.com/find-us`

Pages serves `about.html` at `/about` on its own, and it redirects `/about.html` and `/about/` toward `/about`. `_redirects` repeats those as permanent 301s so they match the canonicals. The homepage is the exception: Pages would send `/index.html` to `/index`, which is a second copy of the home page, so `_redirects` sends `/index.html`, `/index`, and `/index/` to `/`.

Do not add a rule that sends `/about` back to `/about.html`. That fights the rule above and loops.

Links inside the pages still end in `.html`. That keeps `python3 -m http.server` working. Both Vercel (`cleanUrls`) and Cloudflare redirect those links to the canonical path.

`404.html` is in the root so Pages does not treat the site as a single-page app. Without that file, an unknown address would return the homepage with status 200. `/404` and `/404/` redirect home. `/404.html` is left alone, because Pages reads that file when it builds the not-found response.

## www to the apex

`_redirects` cannot match on the hostname. Cloudflare ignores a domain-level rule in that file, so the www redirect from `vercel.json` is **not** copied there. After the domain is on Cloudflare DNS, create it as a Bulk Redirect. The steps are in the DNS section below, and they follow [Cloudflare’s Pages guide](https://developers.cloudflare.com/pages/how-to/www-redirect/).

## Domain and DNS

`modelbarbers.com` is registered at Porkbun. Cloudflare’s docs require the apex name to be a zone on the same Cloudflare account as the Pages project. Porkbun keeps the registration. Cloudflare becomes the DNS host.

### 1. Point Porkbun’s nameservers at Cloudflare

1. In Cloudflare, choose **Add a site** and enter `modelbarbers.com`. The free plan is enough.
2. Cloudflare shows two nameservers. They look like `ada.ns.cloudflare.com` and `bob.ns.cloudflare.com`, but the pair is specific to this zone. Copy the two names Cloudflare shows. Do not reuse an example pair.
3. In Porkbun, open the domain, then **Authoritative Nameservers**, and replace the Porkbun nameservers with that pair.
4. If Porkbun has DNSSEC turned on, turn it off before changing nameservers. Leaving it on can make the domain fail to resolve. You can turn DNSSEC back on from Cloudflare after the zone is active.
5. Wait until Cloudflare marks the zone active.

Do not turn on Porkbun URL forwarding. That feature writes its own DNS records and fights with Cloudflare.

### 2. Attach the apex domain to Pages

1. Open the Pages project → **Custom domains** → **Set up a domain** → enter `modelbarbers.com`.
2. Because the zone is already on Cloudflare, Pages creates the apex CNAME to `<project>.pages.dev` for you. You do not add that record by hand.
3. Wait until the custom domain shows **Active**. Pages requests the certificate. If the zone has CAA records, they must allow `letsencrypt.org`, `pki.goog`, and `ssl.com`, or the certificate will not issue. A new domain with no CAA records does not need any added.

In the zone’s **SSL/TLS** settings, turn on **Always Use HTTPS**. `_headers` also sends HSTS (`max-age=15552000`, including subdomains) on `modelbarbers.com`.

### 3. Redirect www to the apex

Do not add `www.modelbarbers.com` as a second Pages custom domain. That would publish the same site on two hostnames. Redirect it.

1. In the Cloudflare dashboard, open **Bulk Redirects** and create a list:

   | Source URL | Target URL | Status | Parameters |
   | --- | --- | --- | --- |
   | `www.modelbarbers.com` | `https://modelbarbers.com` | 301 | Preserve query string, Subpath matching, Preserve path suffix, Include subdomains |

2. Create a Bulk Redirect rule that uses that list.
3. Open **DNS → Records** and add:

   | Type | Name | IPv4 address | Proxy status |
   | --- | --- | --- | --- |
   | A | `www` | `192.0.2.1` | Proxied (orange cloud) |

   `192.0.2.1` is not a machine you run. It is a documentation address. The orange cloud is the part that matters: Cloudflare answers for `www`, and the Bulk Redirect runs before any origin is contacted. This is the record in Cloudflare’s Pages www-redirect guide.

4. Check it:

   ```bash
   curl --head -i https://www.modelbarbers.com/
   ```

   The status should be `301` and `Location` should start with `https://modelbarbers.com/`.

### Keeping DNS at Porkbun

Cloudflare will not activate an apex custom domain while Porkbun is still the DNS host. An ALIAS or CNAME at Porkbun aimed at `<project>.pages.dev` is not the supported setup, and it commonly stays Inactive or returns error 522. Use the nameserver switch above.

The only Porkbun record Cloudflare’s docs describe is for a subdomain, and only after that hostname is added under **Pages → Custom domains**:

| Type | Host | Answer |
| --- | --- | --- |
| CNAME | `www` | `<project>.pages.dev` |

That would make `www` the live site and leave `modelbarbers.com` unmatched. The canonical host is the apex, so do not stop there.

Before adding records, delete Porkbun’s parking records (the ones pointed at `pixie.porkbun.com`).

## What the Pages files do

`_redirects` (all 301):

- `/index.html`, `/index`, and `/index/` → `/`
- `/about.html` and `/about/` → `/about`
- `/services.html` and `/services/` → `/services`
- `/find-us.html` and `/find-us/` → `/find-us`
- `/404` and `/404/` → `/` (the not-found template stays at `404.html`, which Pages reads for missing URLs)

`_headers`:

- Images (`.jpg`, `.jpeg`, `.png`, `.webp`, `.ico`): `Cache-Control: public, max-age=604800` (7 days). Same as `vercel.json`.
- CSS and JavaScript: `Cache-Control: public, max-age=86400, must-revalidate` (1 day). Same as `vercel.json`. The filenames are not hashed, so do not lengthen this.
- HTML is left on Pages’ default, which tells the browser to revalidate.
- `llms.txt` and `robots.txt`: `Content-Type: text/plain; charset=utf-8`
- `sitemap.xml`: `Content-Type: application/xml; charset=utf-8`
- On every response: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, a Permissions-Policy that turns off camera, microphone, geolocation, and payment, and a Content-Security-Policy. The policy allows this site’s own files, Google Fonts, and the Google Maps frame on Find Us. Inline `style` attributes need `'unsafe-inline'` for styles.
- `*.pages.dev` responses also get `X-Robots-Tag: noindex`, so the preview hostname is not a second listing. Pages already noindexes branch previews; the header covers the production `pages.dev` name too.

## After the switch

1. Confirm `https://modelbarbers.com/about` loads, `https://modelbarbers.com/about.html` redirects once to `/about`, and `https://www.modelbarbers.com/about` redirects to the apex.
2. Remove `modelbarbers.com` from the Vercel project so both hosts are not answering for it.
3. Leave `vercel.json` in the repo until nothing is deployed from it. A later change can delete it.
4. In Google Search Console, submit `https://modelbarbers.com/sitemap.xml`.

## Local preview of redirects and headers

`python3 -m http.server` does not apply `_redirects` or `_headers`. From the repository root:

```bash
npx wrangler pages dev . --port 8788
```

Then open `http://127.0.0.1:8788/about.html`. It should land on `/about`.
