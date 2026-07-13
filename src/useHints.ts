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

  // Hint 2: a letter that is in the word at a position not yet guessed
  // correctly, and that isn't already shown green elsewhere. Excluding
  // already-correct letters avoids "wasting" the hint on a letter whose key is
  // already a hit (green wins over the hint's yellow, so nothing would change).
  const correctLetters = new Set<string>();
  correctPositions.forEach((i) => correctLetters.add(word[i]));
  const misplaceableLetters = word
    .split("")
    .filter((l, i) => !correctPositions.has(i) && !correctLetters.has(l));
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
