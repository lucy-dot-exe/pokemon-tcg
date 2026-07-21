# Pokemon TCG Deck Builder

A browser-based tool for building Pokémon Trading Card Game decks. Search
for cards using the [Pokemon TCG API](https://pokemontcg.io/), assemble a
60-card deck, and check it against Standard-format deck-building rules,
opening-hand odds, and card-to-card synergies — all without a backend.

Live at: https://lucy-dot-exe.github.io/pokemon-tcg-deck-builder/

## Features

- **Card search** — look up cards by name via the Pokemon TCG API and add
  them straight to your deck.
- **Deck building** — a 60-card deck with standard rules enforced (max 4
  copies of any card, unlimited basic Energy).
- **Import / export** — paste a deck list in the common
  `<count> <name> <set code> <number>` exchange format to resolve and add
  every card at once, or export your current deck back to that format for
  sharing (see [Deck list format](#deck-list-format)).
- **Statistics** — deck composition breakdown plus opening-hand math:
  mulligan chance, odds of drawing one or more basic Pokémon, and the
  chance to open each specific basic.
- **Interactions** — a force-directed graph of card-to-card synergies
  (search/tutor effects, evolution lines) built from a set of built-in
  rules, plus a rule builder for defining your own.
- **Review** — a legality checklist (deck size, Standard regulation,
  at least one basic Pokémon) and a full list breakdown for a final pass
  before you take a deck to a table.
- Deck state is persisted to `localStorage`, so it survives a page reload.

## Deck list format

Import/export uses the same plain-text format shared by other deck-building
tools: a `Supertype: count` header per section, followed by one line per
card.

```
Pokémon: 2
1 Pikachu ex SVI 40
1 Raichu SVI 41

Trainer: 2
2 Ultra Ball SVI 196

Energy: 1
1 Lightning Energy SVE 4
```

On import, each line is matched by exact set code + card number first; if
that print isn't found, it falls back to matching by name, but only when
every card with that name plays identically (otherwise it's reported as
ambiguous rather than guessed at).

## Stack

- [Vite](https://vite.dev/) + React + TypeScript
- [Pokemon TCG API](https://docs.pokemontcg.io/) for card data (no API key required for this usage)
- [d3-force](https://github.com/d3/d3-force) for the interaction graph layout
- Deck state persisted to `localStorage`
- Deployed to GitHub Pages via GitHub Actions

## Development

```bash
npm install
npm run dev
```

## Lint

```bash
npm run lint
```

## Build

```bash
npm run build
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
app and publishes it to GitHub Pages. In the repo settings, set **Pages →
Source** to **GitHub Actions**.

The Vite `base` path in `vite.config.ts` is set to `/pokemon-tcg-deck-builder/`
to match this repo's Pages URL. If the repo is renamed, update that value to match.
