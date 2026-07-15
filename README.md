# Pokemon TCG Deck Builder

A browser-based tool for building Pokemon Trading Card Game decks. Search
for cards using the [Pokemon TCG API](https://pokemontcg.io/) and assemble
a 60-card deck, with standard deck-building rules enforced (max 4 copies
per card, unlimited basic Energy).

## Stack

- [Vite](https://vite.dev/) + React + TypeScript
- [Pokemon TCG API](https://docs.pokemontcg.io/) for card data (no API key required for this usage)
- Deck state persisted to `localStorage`
- Deployed to GitHub Pages via GitHub Actions

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
app and publishes it to GitHub Pages. In the repo settings, set **Pages →
Source** to **GitHub Actions**.

The Vite `base` path in `vite.config.ts` is set to `/pokemon-tcg/` to match
this repo's Pages URL. If the repo is renamed, update that value to match.
