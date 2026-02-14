# World at a Glance

A GitHub Pages dashboard with 27 country-level choropleths. Data is refreshed daily via GitHub Actions.

## Local dev

```bash
npm install
node scripts/build-data.mjs
npm run dev
```

## Deploy

Push to GitHub and enable **Settings → Pages → Source: GitHub Actions**.
