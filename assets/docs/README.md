# Screenshots

Visual documentation of the live product, referenced from the root `README.md`.

Generate them with:

```bash
npm install --save-dev playwright
npx playwright install chromium
node scripts/screenshots.mjs
```

The script serves the site locally and captures:

| File | What |
| --- | --- |
| `hero-desktop.png` | Landing page hero, 1440×900 |
| `catalog-desktop.png` | Racket catalogue |
| `pricing-desktop.png` | Pricing tiers |
| `reservation-modal.png` | The reservation form, mid-fill |
| `mobile.png` | Full landing page at 390px |
| `case-study.png` | The case-study page |

Playwright is not a committed dependency and is not installed in CI — screenshots are a manual,
occasional task, and adding a browser download to every `npm install` would be a poor trade.
