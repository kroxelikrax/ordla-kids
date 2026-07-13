# Ordla Kids — Design

**Date:** 2026-07-13
**Status:** Approved (design), pending implementation plan

## Summary

Turn Ordla (a Swedish Wordle) into a kid-friendly variant, "Ordla Kids". Three
changes: (1) restrict the word list to kid-appropriate words, (2) add three
one-time hints per game, and (3) deploy the variant to the owner's GitHub Page.

This is a **full replacement** of the game (the repo is `ordla-kids`), not a
toggle between an adult and a kids mode.

## Decisions (locked)

- **Word length:** stays 5 letters — the grid and guess-validation are unchanged.
- **Word list:** a curated kid-friendly subset of the existing list.
- **Valid guesses:** kid list only (the answer pool and the accepted-guess pool
  are the same list).
- **Hints:** three buttons, each usable once per game.
- **Hint scoring:** hints do not penalize; the summary shows how many were used.
- **Hint 3 behavior:** guide only (does not auto-type into the guess).
- **Results storage:** add a parallel `hintsUsed_<word>` entry; leave the
  existing `results` map structure untouched.
- **Tests:** out of scope for now (no test runner in the repo).

## 1. Word list

- Archive the current full list as `src/words.full.ts` (kept for future
  re-curation).
- Generate `src/words.ts` (keeping the same `words` export name) containing only
  the curated kid-friendly subset. Because `getWordForDay` and guess-validation
  both read `words`, no logic changes are needed — a smaller list just yields a
  different (still deterministic) daily rotation.
- **Curation** is a one-time offline step: classify each of the ~4,590 words as
  kid-friendly (concrete, common, age-appropriate) or not (Approach A —
  LLM-assisted). The source list is already SAOL-based, so the subset inherits
  SAOL membership (best-effort; no separate SAOL data available). The owner does
  a final review pass before the subset is committed.

## 2. Hint state

One new persisted object per day, keyed like `tries_<word>`:

```
hints_<word> = {
  removed?:   string[],           // 3 letters NOT in the word -> greyed on keyboard
  misplaced?: string,             // 1 letter IN the word, wrong spot -> yellow on keyboard
  revealed?:  { index: number, letter: string }, // 1 correct letter at its correct position
}
```

Presence of a key means that hint has been used. State persists across reloads
within the same day, exactly like `tries`.

The hint **selection logic** (which letters/position to pick) lives in one place,
`src/useHints.ts`, exposing a clear interface. Components only render what it
returns. This isolates the tricky "pick a not-yet-revealed letter/position" logic.

## 3. The three hints

Presented as a "Ledtrådar" button row **between the grid and the keyboard**. Each
button greys out once used.

1. **Remove 3 letters** — pick 3 letters that are *not* in the word and not
   already eliminated by prior guesses; store them; render greyed/disabled
   ("miss") on the keyboard.
2. **Show a misplaced letter** — pick a letter that *is* in the word but the kid
   has not yet placed correctly; store it; color that key **yellow** ("almost")
   on the keyboard.
3. **Reveal a correct letter** — pick a (position, letter) the kid has not yet
   gotten right; show it as a **green tile at that position in the active guess
   row** as a visual guide. Guide only — the kid still types their own 5 letters;
   the hint does not affect win-detection.

### Edge cases the pick logic must handle

- Hint 1 when fewer than 3 unused absent letters remain (reveal as many as
  available).
- Hint 2 when every present letter is already correctly placed (nothing to
  show — button should no-op / stay disabled).
- Hint 3 when every position is already correctly guessed (nothing to reveal).

## 4. Keyboard & grid coloring

- **Keyboard** (`Keyboard.tsx` / `Key`): today key color derives purely from
  `tries`. Add a `hints` input so keys also reflect hints — `removed` letters
  render as **miss**, `misplaced` as **almost**. Hint colors merge with
  guess-derived colors; a real hit from a guess always wins over a hint's yellow.
- **Grid** (`Tries.tsx` / `Square.tsx`): the active guess row shows the
  `revealed` hint as a green tile at its position wherever the kid has not typed
  there yet. Thread a `revealed` prop through `Tries` → `Square`. Purely visual;
  does not affect win-detection.

## 5. Summary & sharing

- Add a parallel `hintsUsed_<word>` count in localStorage alongside the existing
  `results` map (no restructuring of `results`).
- Pass the current game's hint count into `SummaryModal` as a prop.
- `SummaryModal` shows a small **"💡 × N"** line (no penalty; transparency only).
- The share text gains one extra line when hints were used, e.g.
  `💡 2 ledtrådar`. The emoji-grid logic is unchanged.

## 6. Deployment

- GitHub Pages for this project repo serves at
  **`https://kroxelikrax.github.io/ordla-kids/`**.
- Change the `build-ci` script's base path from `--base=/ordla/` to
  **`--base=/ordla-kids/`** so asset URLs resolve on the owner's Page.
- The existing workflow (`.github/workflows/main.yml`) already deploys the `dist`
  folder to the `gh-pages` branch of this repo — no change needed there.
- **Manual one-time step (owner):** in repo **Settings → Pages**, set the source
  to the `gh-pages` branch.
- Existing GitHub Action versions are left as-is to keep this change focused.

## 7. Files

**New**
- `src/words.full.ts` — archived original word list.
- `src/words.ts` — regenerated kid-friendly subset (same export name).
- `src/useHints.ts` — hint state + pick logic (single, isolated interface).
- `src/Hints.tsx` — the three-button hint row.

**Edited**
- `app.tsx` — wire hint state; pass `hints` / `revealed` / hint count to children;
  persist `hintsUsed_<word>` on game end.
- `Keyboard.tsx` — accept and apply hint-derived key colors.
- `Tries.tsx`, `Square.tsx` — render the revealed correct-letter guide tile.
- `SummaryModal.tsx` — show hints-used line and add it to the share text.
- `package.json` — `build-ci` base path.

## 8. Testing

Out of scope for now — the repo has no test runner. The pick logic in
`useHints.ts` is the only piece with real edge cases; if tests are added later,
that pure logic is the place to start.

## Out of scope / non-goals

- No adult/kid mode toggle (full replacement).
- No word-length selector or variable-length words.
- No changes to the daily-word rotation math.
- No modernization of the GitHub Action versions.
- No automated tests.
