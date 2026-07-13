# Ordla Kids Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Ordla (a Swedish Wordle) into a kid-friendly variant with a curated word list, three one-time hints, and deployment to the owner's GitHub Page.

**Architecture:** Keep the existing 5-letter daily-word game intact. Restrict the `words` list to a kid-friendly subset. Add an isolated `useHints` hook that owns all hint state (persisted per day like `tries`) and pick logic; render a three-button hint row and thread hint results into the keyboard (colors) and grid (revealed guide tile). Show hint usage in the summary. Fix the GitHub Pages base path.

**Tech Stack:** Preact 10 (hooks), TypeScript 4 (strict), Vite 2, no new dependencies.

## Global Constraints

- No new npm dependencies.
- Preact hooks only (`preact/hooks`); JSX factory is `h` / `Fragment` (configured in tsconfig, handled by the Vite preset — write JSX normally).
- TypeScript strict mode; code must pass `npx tsc --noEmit`.
- All user-facing copy in Swedish.
- Keep the `words` export name in `src/words.ts` unchanged (consumed by `app.tsx`).
- Do not change the daily-word rotation math in `app.tsx`.
- Hint state persists per day using the existing `usePersistedState` hook, keyed by word (mirrors `tries_<word>`).
- Verification per task (no test runner in repo): `npx tsc --noEmit` passes, then a specific manual browser check via `yarn dev`.

---

## File Structure

**New**
- `src/words.full.ts` — archived copy of the original full word list (reference for re-curation).
- `src/useHints.ts` — hint state + pick logic; single interface consumed by `app.tsx`.
- `src/Hints.tsx` — the three-button "Ledtrådar" row.

**Modified**
- `package.json` — `build-ci` base path.
- `src/words.ts` — regenerated kid-friendly subset (same `words` export).
- `src/app.tsx` — instantiate `useHints`, render `<Hints>`, pass hint data to `Keyboard`/`Tries`, persist hint count.
- `src/Keyboard.tsx` — accept `hints`, apply hint-derived key colors.
- `src/Tries.tsx` — accept `revealed`, pass guide tile into the active row.
- `src/Square.tsx` — accept `isHint`, render the green guide tile.
- `src/SummaryModal.tsx` — show hints-used line and add it to the share text.

---

## Task 1: Fix GitHub Pages base path

**Files:**
- Modify: `package.json` (the `build-ci` script)

**Interfaces:**
- Consumes: nothing.
- Produces: a `dist/` whose asset URLs are rooted at `/ordla-kids/`.

- [ ] **Step 1: Change the base path**

In `package.json`, change the `build-ci` script from:

```json
"build-ci": "tsc && vite build --base=/ordla/",
```

to:

```json
"build-ci": "tsc && vite build --base=/ordla-kids/",
```

- [ ] **Step 2: Verify the build produces the new base**

Run: `yarn build-ci`
Expected: build succeeds; `dist/index.html` references assets under `/ordla-kids/` (e.g. `<script ... src="/ordla-kids/assets/...">`).

Confirm with: `grep -o '/ordla-kids/[^"]*' dist/index.html | head`
Expected: at least one match printed.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "build: set GitHub Pages base path to /ordla-kids/"
```

> **Manual step for the owner (not part of this task):** In the GitHub repo, go to **Settings → Pages** and set the source to the `gh-pages` branch. After the next push to `master`, the site is served at `https://kroxelikrax.github.io/ordla-kids/`.

---

## Task 2: Archive the original word list

**Files:**
- Create: `src/words.full.ts`

**Interfaces:**
- Consumes: current `src/words.ts`.
- Produces: `src/words.full.ts` exporting `wordsFull` (the untouched original list). Reference only; not imported by the app.

- [ ] **Step 1: Copy the current list to the archive file**

Run: `cp src/words.ts src/words.full.ts`

- [ ] **Step 2: Rename the export so it does not collide**

In `src/words.full.ts`, change the first line from:

```ts
export const words = [
```

to:

```ts
// Archived original Ordla word list, kept for re-curation. Not imported by the app.
export const wordsFull = [
```

- [ ] **Step 3: Verify typecheck still passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/words.full.ts
git commit -m "chore: archive original word list as words.full.ts"
```

---

## Task 3: Curate the kid-friendly word list

**Files:**
- Modify: `src/words.ts` (replace the array contents; keep `export const words = [...]`)

**Interfaces:**
- Consumes: `src/words.full.ts` (`wordsFull`).
- Produces: `src/words.ts` — `export const words: string[]`, kid-friendly subset, each entry a lowercase 5-letter Swedish word. Consumed by `app.tsx` for both the daily answer and guess validation.

**Curation criteria** (keep a word only if ALL hold):
- Common, concrete, and understandable to a young child (roughly ages 5–9): animals, food, colors, family, toys, nature, body, everyday objects and simple verbs.
- Not vulgar, violent, sexual, morbid, or otherwise inappropriate (e.g. drop words about death, weapons, alcohol, bodily crudeness).
- Not obscure, archaic, dialectal, technical, or a rare inflection.
- Exactly 5 letters, lowercase, letters only within the Swedish alphabet (`a–z`, `å`, `ä`, `ö`).

- [ ] **Step 1: Produce the filtered subset**

Classify every entry in `wordsFull` against the criteria above and keep only those that pass. This is a manual/LLM-assisted judgment pass over the full list (process in batches to stay accurate). Target a subset large enough for daily variety (a few hundred to ~1,500 words is fine — quality over quantity).

Write the result into `src/words.ts` in this exact shape (same export name as before):

```ts
export const words = [
  "katts",
  "hunds",
  // ... curated kid-friendly words, one per line ...
];
```

- [ ] **Step 2: Sanity-check the list mechanically**

Check every entry is exactly 5 letters:

```bash
grep -oE '"[a-zåäö]+"' src/words.ts | tr -d '"' | awk 'length!=5 { print "BAD:", $0 }'
```

Expected: no `BAD:` lines (every entry is exactly 5 letters). Note: `å`/`ä`/`ö` are multi-byte in UTF-8, so if `awk` miscounts, run the same pipe through `LC_ALL=en_US.UTF-8 awk` instead.

Then check for duplicates:

```bash
grep -oE '"[a-zåäö]+"' src/words.ts | sort | uniq -d
```

Expected: no output (no duplicates).

- [ ] **Step 3: Verify typecheck and build**

Run: `npx tsc --noEmit && yarn build`
Expected: no errors; build succeeds.

- [ ] **Step 4: Manual spot check in the browser**

Run: `yarn dev`, open the app. Confirm the day's word tiles render and that typing a curated word and pressing Enter is accepted (no "Ordet finns inte med i ordlistan" for a word that is in the list).

- [ ] **Step 5: Commit**

```bash
git add src/words.ts
git commit -m "feat: curate kid-friendly word list"
```

> **Owner review:** After this commit, the owner should skim `src/words.ts` and remove any remaining words they judge unsuitable, then amend/commit. This review is expected before deployment.

---

## Task 4: Hint state and pick logic (`useHints`)

**Files:**
- Create: `src/useHints.ts`

**Interfaces:**
- Consumes: `usePersistedState` from `./usePersistedState`; `word: string`, `tries: string[]`.
- Produces:
  - `export type Hints = { removed?: string[]; misplaced?: string; revealed?: { index: number; letter: string } }`
  - `export function useHints(word: string, tries: string[]): { hints: Hints; usedCount: number; canRemoveLetters: boolean; canShowMisplaced: boolean; canRevealCorrect: boolean; useRemoveLetters: () => void; useShowMisplaced: () => void; useRevealCorrect: () => void }`

- [ ] **Step 1: Create the hook with full implementation**

Create `src/useHints.ts`:

```ts
import { usePersistedState } from "./usePersistedState";

export type Hints = {
  removed?: string[];
  misplaced?: string;
  revealed?: { index: number; letter: string };
};

const ALPHABET = "abcdefghijklmnopqrstuvwxyzåäö".split("");

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useHints(word: string, tries: string[]) {
  const [hints, setHints] = usePersistedState<Hints>("hints_" + word, {});

  // Positions the player has already guessed correctly (green in any try).
  const correctPositions = new Set<number>();
  tries.forEach((t) =>
    t.split("").forEach((l, i) => {
      if (word[i] === l) correctPositions.add(i);
    })
  );

  const lettersInWord = new Set(word.split(""));

  // Hint 1: letters not in the word (candidates to grey out).
  const absentLetters = ALPHABET.filter((l) => !lettersInWord.has(l));
  const canRemoveLetters = !hints.removed && absentLetters.length > 0;

  // Hint 2: a letter that is in the word at a position not yet guessed correctly.
  const misplaceableLetters = word
    .split("")
    .filter((_, i) => !correctPositions.has(i));
  const canShowMisplaced = !hints.misplaced && misplaceableLetters.length > 0;

  // Hint 3: a position not yet guessed correctly.
  const unrevealedPositions = [0, 1, 2, 3, 4].filter(
    (i) => !correctPositions.has(i)
  );
  const canRevealCorrect = !hints.revealed && unrevealedPositions.length > 0;

  const useRemoveLetters = () => {
    if (!canRemoveLetters) return;
    const shuffled = [...absentLetters].sort(() => Math.random() - 0.5);
    setHints((h) => ({ ...h, removed: shuffled.slice(0, 3) }));
  };

  const useShowMisplaced = () => {
    if (!canShowMisplaced) return;
    setHints((h) => ({ ...h, misplaced: pickOne(misplaceableLetters) }));
  };

  const useRevealCorrect = () => {
    if (!canRevealCorrect) return;
    const index = pickOne(unrevealedPositions);
    setHints((h) => ({ ...h, revealed: { index, letter: word[index] } }));
  };

  const usedCount =
    (hints.removed ? 1 : 0) +
    (hints.misplaced ? 1 : 0) +
    (hints.revealed ? 1 : 0);

  return {
    hints,
    usedCount,
    canRemoveLetters,
    canShowMisplaced,
    canRevealCorrect,
    useRemoveLetters,
    useShowMisplaced,
    useRevealCorrect,
  };
}
```

Notes: `Math.random` runs in the app at runtime (allowed); the chosen letters/position are persisted so the hint is stable after first use and across reloads. Fewer than 3 absent letters is impossible for a 5-letter word (the alphabet has 29 letters), but `slice(0, 3)` degrades safely if it ever were.

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (The hook is not yet consumed; typecheck confirms the file compiles.)

- [ ] **Step 3: Commit**

```bash
git add src/useHints.ts
git commit -m "feat: add useHints hook with hint state and pick logic"
```

---

## Task 5: Hint button row (`Hints`)

**Files:**
- Create: `src/Hints.tsx`

**Interfaces:**
- Consumes: the boolean flags and handlers produced by `useHints` (Task 4).
- Produces: `export function Hints(props: { canRemoveLetters: boolean; canShowMisplaced: boolean; canRevealCorrect: boolean; onRemoveLetters: () => void; onShowMisplaced: () => void; onRevealCorrect: () => void }): JSX.Element`. A button is disabled when its `can*` flag is false (already used or nothing to reveal).

- [ ] **Step 1: Create the component**

Create `src/Hints.tsx`:

```tsx
export function Hints(props: {
  canRemoveLetters: boolean;
  canShowMisplaced: boolean;
  canRevealCorrect: boolean;
  onRemoveLetters: () => void;
  onShowMisplaced: () => void;
  onRevealCorrect: () => void;
}) {
  return (
    <div
      className="row gap-s center"
      style={{ margin: "6px auto", maxWidth: "calc(100vw - 12px)" }}
    >
      <HintButton
        label="Ta bort 3 bokstäver"
        enabled={props.canRemoveLetters}
        onPress={props.onRemoveLetters}
      />
      <HintButton
        label="Visa en bokstav (gul)"
        enabled={props.canShowMisplaced}
        onPress={props.onShowMisplaced}
      />
      <HintButton
        label="Visa en rätt bokstav"
        enabled={props.canRevealCorrect}
        onPress={props.onRevealCorrect}
      />
    </div>
  );
}

function HintButton(props: {
  label: string;
  enabled: boolean;
  onPress: () => void;
}) {
  return (
    <button
      className="keyboard__key center"
      disabled={!props.enabled}
      onClick={props.enabled ? props.onPress : undefined}
      style={{
        height: "auto",
        minHeight: "38px",
        padding: "6px 8px",
        fontSize: "0.7rem",
        lineHeight: "1.1",
        flex: "1 1 0",
        opacity: props.enabled ? 1 : 0.4,
        cursor: props.enabled ? "pointer" : "default",
      }}
    >
      💡 {props.label}
    </button>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/Hints.tsx
git commit -m "feat: add Hints button row component"
```

---

## Task 6: Wire hints into the keyboard colors

**Files:**
- Modify: `src/Keyboard.tsx`

**Interfaces:**
- Consumes: `Hints` type from `./useHints` (Task 4).
- Produces: `Keyboard` and `Key` accept an added `hints: Hints` prop. `removed` letters render with the `miss` background; `misplaced` letter renders with the `almost` background. A real hit or almost from `tries` still takes precedence over the removed-hint color.

- [ ] **Step 1: Import the type and extend the props**

In `src/Keyboard.tsx`, add the import at the top:

```ts
import { Hints } from "./useHints";
```

Change the `Keyboard` props type and destructuring from:

```tsx
export function Keyboard(props: {
  onPress: (key: string) => void;
  word: string;
  tries: string[];
}) {
  const { word, tries, onPress } = props;
```

to:

```tsx
export function Keyboard(props: {
  onPress: (key: string) => void;
  word: string;
  tries: string[];
  hints: Hints;
}) {
  const { word, tries, onPress, hints } = props;
```

- [ ] **Step 2: Pass `hints` down to each `Key`**

In `Keyboard`'s render, change:

```tsx
          {keys[i].map((k) => (
            <Key word={word} tries={tries} key_={k} onPress={onPress} />
          ))}
```

to:

```tsx
          {keys[i].map((k) => (
            <Key word={word} tries={tries} key_={k} onPress={onPress} hints={hints} />
          ))}
```

- [ ] **Step 3: Apply hint colors in `Key`**

Change the `Key` props type and destructuring from:

```tsx
export function Key(props: {
  key_: string;
  onPress: (key: string) => void;
  tries: string[];
  word: string;
}) {
  const { key_, onPress, tries, word } = props;
```

to:

```tsx
export function Key(props: {
  key_: string;
  onPress: (key: string) => void;
  tries: string[];
  word: string;
  hints: Hints;
}) {
  const { key_, onPress, tries, word, hints } = props;
```

Then change the derived color booleans from:

```tsx
  const hit = tries.some((try_) =>
    try_.split("").some((letter, i) => letter === key_ && letter === word[i])
  );

  const almost =
    !hit && word.indexOf(key_) > -1 && tries.some((t) => t.indexOf(key_) > -1);
  const miss =
    word.indexOf(key_) === -1 && tries.some((t) => t.indexOf(key_) > -1);
```

to:

```tsx
  const hit = tries.some((try_) =>
    try_.split("").some((letter, i) => letter === key_ && letter === word[i])
  );

  const almost =
    !hit &&
    ((word.indexOf(key_) > -1 && tries.some((t) => t.indexOf(key_) > -1)) ||
      hints.misplaced === key_);
  const miss =
    !hit &&
    !almost &&
    ((word.indexOf(key_) === -1 && tries.some((t) => t.indexOf(key_) > -1)) ||
      (hints.removed?.includes(key_) ?? false));
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: an error in `app.tsx` that `Keyboard` is missing the `hints` prop. This is expected and fixed in Task 8. To confirm `Keyboard.tsx` itself is well-typed, this task is complete once the only remaining error is the missing-prop error at the `<Keyboard ... />` call site.

- [ ] **Step 5: Commit**

```bash
git add src/Keyboard.tsx
git commit -m "feat: color keyboard keys from hints"
```

---

## Task 7: Render the revealed-correct guide tile in the grid

**Files:**
- Modify: `src/Square.tsx`
- Modify: `src/Tries.tsx`

**Interfaces:**
- Consumes: `Hints["revealed"]` shape `{ index: number; letter: string }` from `./useHints`.
- Produces:
  - `Square` accepts an added optional `isHint?: boolean`. When true, the tile shows the letter with the `hit` (green) background at reduced opacity, regardless of other coloring.
  - `Tries` accepts an added optional `revealed?: { index: number; letter: string }`. In the active guess row, at the revealed position, when the player has not typed there yet, it renders the letter as a hint tile.

- [ ] **Step 1: Add `isHint` to `Square`**

In `src/Square.tsx`, change the props type from:

```tsx
export function Square(props: {
  letter?: string;
  index: number;
  guess?: string;
  isCurrentTry: boolean;
  word: string;
}) {
  const { index, letter, word, isCurrentTry, guess } = props;
```

to:

```tsx
export function Square(props: {
  letter?: string;
  index: number;
  guess?: string;
  isCurrentTry: boolean;
  word: string;
  isHint?: boolean;
}) {
  const { index, letter, word, isCurrentTry, guess, isHint } = props;
```

Then change the returned `<div>`'s `style` so the hint tile wins and is visually distinct. Replace:

```tsx
        background: hit
          ? "var(--letter-bg--hit)"
          : almost && !isExtranousAlmost
          ? "var(--letter-bg--almost)"
          : "var(--letter-bg)",
      }}
    >
```

with:

```tsx
        background: isHint
          ? "var(--letter-bg--hit)"
          : hit
          ? "var(--letter-bg--hit)"
          : almost && !isExtranousAlmost
          ? "var(--letter-bg--almost)"
          : "var(--letter-bg)",
        opacity: isHint ? 0.55 : 1,
      }}
    >
```

- [ ] **Step 2: Pass `revealed` through `Tries`**

In `src/Tries.tsx`, change the props type and destructuring from:

```tsx
export function Tries(props: {
  currentTry: string;
  word: string;
  tries: string[];
}) {
  const { tries, currentTry, word } = props;
```

to:

```tsx
export function Tries(props: {
  currentTry: string;
  word: string;
  tries: string[];
  revealed?: { index: number; letter: string };
}) {
  const { tries, currentTry, word, revealed } = props;
```

- [ ] **Step 3: Render the hint tile in the active row**

In `src/Tries.tsx`, replace the inner `.map` body:

```tsx
          {[0, 1, 2, 3, 4].map((j) => {
            const letter = [...tries, currentTry][i]?.[j];
            return (
              <Square
                index={j}
                guess={[...tries, currentTry][i]}
                isCurrentTry={i >= tries.length}
                word={word}
                letter={letter}
                key={"" + letter + i + j}
              />
            );
          })}
```

with:

```tsx
          {[0, 1, 2, 3, 4].map((j) => {
            const typed = [...tries, currentTry][i]?.[j];
            const isActiveRow = i === tries.length;
            const showHint =
              isActiveRow && !typed && revealed?.index === j;
            const letter = showHint ? revealed!.letter : typed;
            return (
              <Square
                index={j}
                guess={[...tries, currentTry][i]}
                isCurrentTry={i >= tries.length}
                word={word}
                letter={letter}
                isHint={showHint}
                key={"" + letter + i + j}
              />
            );
          })}
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: the only remaining error is the missing `hints` prop at the `<Keyboard>` call in `app.tsx` (from Task 6). `Square.tsx` and `Tries.tsx` compile clean; the new `revealed`/`isHint` props are optional so existing call sites still typecheck.

- [ ] **Step 5: Commit**

```bash
git add src/Square.tsx src/Tries.tsx
git commit -m "feat: render revealed-correct hint tile in grid"
```

---

## Task 8: Wire hints into `app.tsx` and persist hint count

**Files:**
- Modify: `src/app.tsx`

**Interfaces:**
- Consumes: `useHints` (Task 4), `Hints` component (Task 5), the extended `Keyboard` (Task 6) and `Tries` (Task 7), the extended `SummaryModal` (Task 9 — prop added there; this task passes `hintsUsed`).
- Produces: a fully wired game — hint buttons visible while playing, hint colors/guide live, and `hintsUsed_<word>` persisted on game end.

- [ ] **Step 1: Add imports**

In `src/app.tsx`, add near the other imports:

```ts
import { Hints } from "./Hints";
import { useHints } from "./useHints";
```

- [ ] **Step 2: Instantiate the hook**

Immediately after the `hasLost` line:

```tsx
  const hasLost = useMemo(() => !hasWon && tries.length === 6, [tries, hasWon]);
```

add:

```tsx
  const hintState = useHints(word, tries);
```

- [ ] **Step 3: Persist the hint count on game end**

In the existing effect that saves results, change:

```tsx
  useEffect(() => {
    if (hasWon || hasLost) {
      const results = JSON.parse(localStorage.getItem("results") ?? "{}");
      localStorage.setItem(
        "results",
        JSON.stringify({ ...results, [word]: hasLost ? -1 : tries.length })
      );
    }
  }, [hasWon, hasLost]);
```

to:

```tsx
  useEffect(() => {
    if (hasWon || hasLost) {
      const results = JSON.parse(localStorage.getItem("results") ?? "{}");
      localStorage.setItem(
        "results",
        JSON.stringify({ ...results, [word]: hasLost ? -1 : tries.length })
      );
      localStorage.setItem("hintsUsed_" + word, String(hintState.usedCount));
    }
  }, [hasWon, hasLost]);
```

- [ ] **Step 4: Pass `revealed` to `Tries` and render `Hints` + `hints` on `Keyboard`**

Change the JSX block:

```tsx
      <Tries word={word} tries={tries} currentTry={currentTry} />
      {hasWon || hasLost ? (
        <ResultsLink onPress={() => setShowModal(true)} />
      ) : (
        <Keyboard word={word} tries={tries} onPress={handlePress} />
      )}
```

to:

```tsx
      <Tries
        word={word}
        tries={tries}
        currentTry={currentTry}
        revealed={hintState.hints.revealed}
      />
      {hasWon || hasLost ? (
        <ResultsLink onPress={() => setShowModal(true)} />
      ) : (
        <>
          <Hints
            canRemoveLetters={hintState.canRemoveLetters}
            canShowMisplaced={hintState.canShowMisplaced}
            canRevealCorrect={hintState.canRevealCorrect}
            onRemoveLetters={hintState.useRemoveLetters}
            onShowMisplaced={hintState.useShowMisplaced}
            onRevealCorrect={hintState.useRevealCorrect}
          />
          <Keyboard
            word={word}
            tries={tries}
            onPress={handlePress}
            hints={hintState.hints}
          />
        </>
      )}
```

- [ ] **Step 5: Pass `hintsUsed` to the `SummaryModal`**

Change the `SummaryModal` render:

```tsx
          <SummaryModal
            tries={tries}
            word={word}
            className={c}
            onClose={() => setShowModal(false)}
          />
```

to:

```tsx
          <SummaryModal
            tries={tries}
            word={word}
            className={c}
            hintsUsed={hintState.usedCount}
            onClose={() => setShowModal(false)}
          />
```

- [ ] **Step 6: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: the only remaining error is that `SummaryModal` does not yet accept `hintsUsed` — fixed in Task 9. All hint wiring in `app.tsx`, `Keyboard`, `Tries`, `Square` now typechecks.

- [ ] **Step 7: Commit**

```bash
git add src/app.tsx
git commit -m "feat: wire hints into app and persist hint count"
```

---

## Task 9: Show hints in the summary and share text

**Files:**
- Modify: `src/SummaryModal.tsx`

**Interfaces:**
- Consumes: `hintsUsed: number` prop from `app.tsx` (Task 8).
- Produces: `SummaryModal` accepts `hintsUsed`; displays a "💡 × N" line when `hintsUsed > 0`; the shared text includes a `💡 N ledtrådar` line when `hintsUsed > 0`.

- [ ] **Step 1: Add the prop**

In `src/SummaryModal.tsx`, change the component signature from:

```tsx
export function SummaryModal({
  className,
  onClose,
  tries,
  word,
}: {
  onClose(): void;
  className: string;
  tries: string[];
  word: string;
}) {
```

to:

```tsx
export function SummaryModal({
  className,
  onClose,
  tries,
  word,
  hintsUsed,
}: {
  onClose(): void;
  className: string;
  tries: string[];
  word: string;
  hintsUsed: number;
}) {
```

- [ ] **Step 2: Show the hints-used line**

In `SummaryModal`'s JSX, immediately after the `Dagens ord` paragraph block (the closing `</p>` that ends the word link), add:

```tsx
        {hintsUsed > 0 ? (
          <p style={{ fontSize: "0.875rem" }}>
            Ledtrådar: 💡 × {hintsUsed}
          </p>
        ) : null}
```

- [ ] **Step 3: Pass `hintsUsed` into `Share` and add the line**

Change the `Share` render call:

```tsx
          <Share word={word} tries={tries} />
```

to:

```tsx
          <Share word={word} tries={tries} hintsUsed={hintsUsed} />
```

Change the `Share` function signature from:

```tsx
function Share({ tries, word }: { word: string; tries: string[] }) {
```

to:

```tsx
function Share({
  tries,
  word,
  hintsUsed,
}: {
  word: string;
  tries: string[];
  hintsUsed: number;
}) {
```

Then change the `data.text` construction from:

```tsx
  const data = {
    url: window.location.href,
    text: `Ordla, ${new Date().getDate()} ${monthStr(new Date().getMonth())}:

${resultsString}
`,
    title: "Ordla",
  };
```

to:

```tsx
  const hintLine = hintsUsed > 0 ? `\n💡 ${hintsUsed} ledtrådar` : "";
  const data = {
    url: window.location.href,
    text: `Ordla, ${new Date().getDate()} ${monthStr(new Date().getMonth())}:

${resultsString}${hintLine}
`,
    title: "Ordla",
  };
```

- [ ] **Step 4: Verify typecheck and build**

Run: `npx tsc --noEmit && yarn build`
Expected: no errors; build succeeds. (All previously-expected missing-prop errors are now resolved.)

- [ ] **Step 5: Full manual verification in the browser**

Run: `yarn dev`, open the app, and confirm:
1. Three hint buttons appear between the grid and keyboard while playing.
2. "Ta bort 3 bokstäver" greys out 3 absent keys on the keyboard and disables itself.
3. "Visa en bokstav (gul)" turns one in-word key yellow and disables itself.
4. "Visa en rätt bokstav" shows a faded green letter in the active row at its correct spot; typing over that spot replaces it; it disables itself.
5. Reload the page — used hints stay used and their effects persist.
6. Finish a game (win or lose). The summary shows `Ledtrådar: 💡 × N`, and pressing "Dela" copies text containing `💡 N ledtrådar`.

- [ ] **Step 6: Commit**

```bash
git add src/SummaryModal.tsx
git commit -m "feat: show hints used in summary and share text"
```

---

## Self-Review Notes

- **Spec coverage:** word list (Tasks 2–3), kid-only guesses (Task 3 — same list drives validation), 5-letter/grid unchanged (no task needed), hint state model (Task 4), three hints + button row + between grid and keyboard (Tasks 4/5/8), keyboard colors (Task 6), revealed guide tile guide-only (Task 7), parallel `hintsUsed_<word>` (Task 8), summary line + share line (Task 9), deploy base path + manual Pages note (Task 1). Tests intentionally omitted per spec.
- **Type consistency:** `Hints` type defined in Task 4 and imported by Tasks 6/7(shape)/8; `useHints` return shape consumed unchanged in Tasks 5/8; `hintsUsed: number` defined in Task 8's call and consumed in Task 9; `revealed?: { index: number; letter: string }` consistent across Tasks 4/7/8.
- **Cross-task typecheck:** Tasks 6, 7, and 8 each intentionally leave a single known missing-prop error that the next task resolves; this is called out in each task's verify step so an out-of-order reader is not surprised. The final `yarn build` in Task 9 is the clean gate.
