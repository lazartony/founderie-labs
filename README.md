# Founderie Labs — website

Static site for https://founderie-labs.vercel.app (product studio · services · consulting).

Plain HTML/CSS/JS, no build step. Deployed on Vercel (clean URLs and security headers in `vercel.json`).

## To do before this is "finished"

- [ ] **Phone / WhatsApp number** — `+91 99999 99999` and `wa.me/919999999999` are placeholders (contact page, footer, JSON-LD, floating WhatsApp button, CTA bands on every page). Search-and-replace both forms across all `.html` files and `llms.txt`.
- [ ] **Social links** — `linkedin.com/company/founderie-labs` and `github.com/founderie-labs` are assumed; create them or change the URLs (footer, JSON-LD `sameAs`, the "Follow for launches" product card).
- [ ] **Contact form backend** — `FL_CONFIG.formEndpoint` is empty, so the form falls back to opening the visitor's email app. Set a Formspree / Web3Forms endpoint + key in the `FL_CONFIG` block of every page (the CSP already allows both).
- [ ] **Analytics** — `ga4` and `clarity` in `FL_CONFIG` are placeholders; analytics stays off until real IDs are set.
- [ ] **Icons / OG image** — `favicon.ico`, `icon-*.png`, `apple-touch-icon.png` and `og.png` were regenerated from `favicon.svg`; replace with the originals if you have them.
- [ ] **Custom domain** — canonical URLs, sitemap and JSON-LD all point at `founderie-labs.vercel.app`; search-and-replace when a domain is attached.

## Adding a product

Products are listed in two places — keep them in sync:

1. `products.html` — the full list
2. `index.html` — the "Product studio" section on the home page

Copy one `<div class="card product">…</div>` block (between the `PRODUCTS` comments), change the name, status tag, tagline, description, bullet points and link. Put the newest product first and leave the dashed "Next up" card last. Then add the product to `llms.txt` under "Products".

## Theming

All colours, fonts and corner radii live in **`theme.css`** as CSS variables, grouped and commented (brand, typography, light surfaces, dark surfaces, CTA band, status colours, WhatsApp green, shadows, shape). `site.css` contains only layout and refers to those variables; it has no raw colour values. To restyle the site, edit `theme.css` only, then bump the `?v=` on `theme.css`, `site.css` and `site.js` in every HTML file.

Two things are outside CSS and need a manual update if the palette changes: `<meta name="theme-color">` in each page's `<head>` (matches `--dark`), and the PNG icons / `og.png` (generated from `favicon.svg`).

## Editing

- `theme.css` / `site.css` / `site.js` are shared by every page; bump `?v=` in each HTML file when you change them.
- Analytics IDs and the form endpoint live in the `window.FL_CONFIG` block at the top of each page.
- Icons and `og.png` are generated from `favicon.svg`.
