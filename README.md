# Founderie Labs — website

Static site for https://founderie-labs.vercel.app (product studio · services · consulting).

Plain HTML/CSS/JS, no build step. Deployed on Vercel (clean URLs and security headers in `vercel.json`).

## Adding a product

Products are listed in two places — keep them in sync:

1. `products.html` — the full list
2. `index.html` — the "Product studio" section on the home page

Copy one `<div class="card product">…</div>` block (between the `PRODUCTS` comments), change the name, status tag, tagline, description, bullet points and link. Put the newest product first and leave the dashed "Next up" card last. Then add the product to `llms.txt` under "Products".

## Editing

- `site.css` / `site.js` are shared by every page; bump `?v=` in each HTML file when you change them.
- Analytics IDs and the form endpoint live in the `window.FL_CONFIG` block at the top of each page.
- Icons and `og.png` are generated from `favicon.svg`.
