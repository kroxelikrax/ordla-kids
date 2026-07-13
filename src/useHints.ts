import { usePersistedState } from "./usePersistedState";

export type Hints = {
  removed: string[]; // greyed-out absent letters (added 3 per click)
  misplaced: string[]; // letters shown yellow on the keyboard (1 per click)
  revealed: { index: number; letter: string }[]; // green guide tiles (1 per click)
};

const ALPHABET = "abcdefghijklmnopqrstuvwxyzåäö".split("");

// Click limits per hint.
export const MAX_REMOVE_CLICKS = 5; // 3 letters each -> up to 15
export const REMOVE_PER_CLICK = 3;
export const MAX_MISPLACED = 4; // 1 letter each -> up to 4 of 5
export const MAX_REVEAL = 3; // 1 tile each -> up to 3 of 5

const EMPTY: Hints = { removed: [], misplaced: [], revealed: [] };

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Coerce persisted state to the current shape (tolerates the older single-value
// shape from a previous version so an in-progress day doesn't crash).
function normalize(raw: any): Hints {
  const removed = Array.isArray(raw?.removed) ? raw.removed : [];
  const misplaced = Array.isArray(raw?.misplaced)
    ? raw.misplaced
    : typeof raw?.misplaced === "string"
    ? [raw.misplaced]
    : [];
  const revealed = Array.isArray(raw?.revealed)
    ? raw.revealed
    : raw?.revealed && typeof raw.revealed === "object"
    ? [raw.revealed]
    : [];
  return { removed, misplaced, revealed };
}

export function useHints(word: string, tries: string[]) {
  const [stored, setStored] = usePersistedState<Hints>("hints_" + word, EMPTY);
  const { removed, misplaced, revealed } = normalize(stored);

  // Positions already guessed correctly (green from a real guess).
  const correctPositions = new Set<number>();
  tries.forEach((t) =>
    t.split("").forEach((l, i) => {
      if (word[i] === l) correctPositions.add(i);
    })
  );
  const correctLetters = new Set<string>();
  correctPositions.forEach((i) => correctLetters.add(word[i]));
  const lettersInWord = new Set(word.split(""));

  // Hint 1: absent letters not yet removed.
  const removableLetters = ALPHABET.filter(
    (l) => !lettersInWord.has(l) && !removed.includes(l)
  );
  const removeUsed = Math.floor(removed.length / REMOVE_PER_CLICK);
  const canRemoveLetters =
    removeUsed < MAX_REMOVE_CLICKS && removableLetters.length > 0;

  // Hint 2: letters in the word not yet placed, not already green, not already yellow.
  const alreadyYellow = new Set(misplaced);
  const misplaceableLetters = word
    .split("")
    .filter(
      (l, i) =>
        !correctPositions.has(i) &&
        !correctLetters.has(l) &&
        !alreadyYellow.has(l)
    );
  const canShowMisplaced =
    misplaced.length < MAX_MISPLACED && misplaceableLetters.length > 0;

  // Hint 3: positions not correct and not already revealed.
  const revealedIdx = new Set(revealed.map((r) => r.index));
  const unrevealedPositions = [0, 1, 2, 3, 4].filter(
    (i) => !correctPositions.has(i) && !revealedIdx.has(i)
  );
  const canRevealCorrect =
    revealed.length < MAX_REVEAL && unrevealedPositions.length > 0;

  const useRemoveLetters = () => {
    if (!canRemoveLetters) return;
    const batch = shuffle(removableLetters).slice(0, REMOVE_PER_CLICK);
    setStored((h) => {
      const n = normalize(h);
      return { ...n, removed: [...n.removed, ...batch] };
    });
  };
  const useShowMisplaced = () => {
    if (!canShowMisplaced) return;
    const letter = pickOne(misplaceableLetters);
    setStored((h) => {
      const n = normalize(h);
      return { ...n, misplaced: [...n.misplaced, letter] };
    });
  };
  const useRevealCorrect = () => {
    if (!canRevealCorrect) return;
    const index = pickOne(unrevealedPositions);
    setStored((h) => {
      const n = normalize(h);
      return { ...n, revealed: [...n.revealed, { index, letter: word[index] }] };
    });
  };

  return {
    hints: { removed, misplaced, revealed },
    removeUsed,
    removeMax: MAX_REMOVE_CLICKS,
    misplacedUsed: misplaced.length,
    misplacedMax: MAX_MISPLACED,
    revealUsed: revealed.length,
    revealMax: MAX_REVEAL,
    totalUsed: removeUsed + misplaced.length + revealed.length,
    canRemoveLetters,
    canShowMisplaced,
    canRevealCorrect,
    useRemoveLetters,
    useShowMisplaced,
    useRevealCorrect,
  };
}
