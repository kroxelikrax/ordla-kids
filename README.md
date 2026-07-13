# Ordla Kids

A kid-friendly Swedish word‑guessing game — a children's take on Wordle
(*ordla* ≈ "to word"). Guess the five‑letter word of the day in six tries, with
gentle hints and a forgiving word list built for young readers.

**▶ Play: https://kroxelikrax.github.io/ordla-kids/**

Ordla Kids is a fork of [eldh/ordla](https://github.com/eldh/ordla), reworked to
be approachable for children.

## How to play

- A new five‑letter Swedish word is chosen each day — the same word for everyone.
- You have six guesses. After each guess the tiles are colored:
  - 🟩 **green** — right letter, right spot
  - 🟨 **yellow** — right letter, wrong spot
  - ⬛ **grey** — not in the word
- The on‑screen keyboard mirrors the colors as you play. Progress is saved in
  your browser, so you can close the tab and come back to the same day's game.

### Kid‑friendly words

Two word lists keep the game gentle:

- **Answers and counting guesses** come from `src/kidWords.ts` (~2,000 common,
  child‑appropriate words).
- **Any approved word** in `src/words.ts` (~2,200) can be typed. If you enter a
  real word that isn't one of the kid words, it flashes its colors as a free
  hint but **does not use up a guess** — a friendly note explains why.

### Hints

Three optional hints sit between the grid and the keyboard. Each can be used
several times and shows `used / max`:

- **Ta bort 3 bokstäver** — greys out three letters that aren't in the word
  (up to 5×, so up to 15 letters).
- **Visa gul bokstav** — marks one in‑word letter yellow on the keyboard
  (up to 4).
- **Visa rätt bokstav** — reveals one correct letter in its place (up to 3).

Hints never block a win; the end‑of‑game summary shows how many of each you
used.

## Tech stack

- [Preact](https://preactjs.com/) + TypeScript
- [Vite](https://vitejs.dev/) for the dev server and build
- Installable **PWA** (web app manifest + home‑screen icons)
- **No backend** — the daily word is derived deterministically from the date,
  and all state lives in `localStorage`

## Development

Requires [Node.js](https://nodejs.org/) and [Yarn](https://yarnpkg.com/).

```bash
yarn install     # install dependencies
yarn dev         # start the dev server (Vite prints the local URL)
yarn build       # type-check (tsc) and build to dist/
yarn preview     # preview the production build locally
```

## Project structure

```
src/
  app.tsx            Game state, daily word, guess/peek/hint wiring
  Tries.tsx          The 6×5 guess grid
  Square.tsx         A single letter tile and its coloring
  Keyboard.tsx       On-screen + physical keyboard
  Hints.tsx          The three hint buttons
  useHints.ts        Hint state, limits and pick logic
  SummaryModal.tsx   End-of-game stats and share
  kidWords.ts        ~2,000 kid-friendly answer words
  words.ts           ~2,200 approved words allowed as guesses
  use*.ts(x)         Small hooks (persistence, timer, viewport)
public/              Web app manifest and home-screen icons
```

## Deployment

Pushes to `master` are built and published to **GitHub Pages** by
[`.github/workflows/main.yml`](.github/workflows/main.yml) using GitHub's
official Pages deployment (no `gh-pages` branch). The production build uses the
`/ordla-kids/` base path (`yarn build-ci`).

## Editing the word lists

Both lists are plain arrays of lowercase, five‑letter words:

- **`src/kidWords.ts`** — the daily answers and the guesses that count. Keep the
  total **even**: the daily‑word index uses `length / 2`, so an odd count would
  land on a fractional index.
- **`src/words.ts`** — the full set of words a player is allowed to type. The app
  treats the union of both lists as valid input, so every answer is guessable
  even if it isn't listed here.

## Credits

Forked from [eldh/ordla](https://github.com/eldh/ordla) — thanks to the original
authors for the game this is built on.
