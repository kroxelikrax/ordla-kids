import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "preact/hooks";
import { Fade } from "./Fade";
import { Help } from "./Help";
import { Hints } from "./Hints";
import { Keyboard } from "./Keyboard";
import { ResultsLink } from "./ResultsLink";
import { SummaryModal } from "./SummaryModal";
import { Tries } from "./Tries";
import { useHints } from "./useHints";
import { usePersistedState } from "./usePersistedState";
import { useTimer } from "./useTimer";
import { useViewportHeight } from "./useViewportHeight";
import { kidWords } from "./kidWords";
import { words } from "./words";

// Kid-friendly words are the daily answers and the only guesses that count
// toward the 6-guess limit. VALID_WORDS also includes the full dictionary, so
// any real word can be typed — but a real word that isn't kid-friendly only
// shows feedback (a "peek") and does not consume a guess.
const KID_WORDS = new Set(kidWords);
const VALID_WORDS = new Set<string>([...words, ...kidWords]);

export function App() {
  const [, endOfDay] = useTimer(10000);
  const word = useMemo(() => {
    return getWordForDay(endOfDay);
  }, [endOfDay]);
  const [tries, setTries] = usePersistedState<string[]>("tries_" + word, []);
  const [currentTry, setCurrentTry] = useState("");
  // A real, non-kid-friendly word being shown as feedback only (does not count).
  const [peek, setPeek] = useState<string | null>(null);
  const [warning, setWarning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const hasWon = useMemo(() => tries[tries.length - 1] === word, [tries]);
  const hasLost = useMemo(() => !hasWon && tries.length === 6, [tries, hasWon]);
  const hintState = useHints(word, tries);
  const height = useViewportHeight();
  useEffect(() => {
    if (warning) {
      const v = setTimeout(() => {
        setWarning(false);
      }, 2000);
      return () => clearTimeout(v);
    }
  }, [warning]);
  useEffect(() => {
    if (peek) {
      const v = setTimeout(() => {
        setPeek(null);
      }, 1800);
      return () => clearTimeout(v);
    }
  }, [peek]);
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
  useLayoutEffect(() => {
    if (hasWon || hasLost) {
      setShowModal(true);
    }
  }, [hasWon, hasLost]);
  useEffect(() => {
    setShowModal(false);
  }, [word]);
  const handlePress = useCallback(
    (key: string) => {
      if (key === "Backspace") {
        if (peek) {
          setPeek(null);
          return;
        }
        setCurrentTry((v) => v.substring(0, v.length - 1));
      } else if (key === "Enter") {
        if (peek) {
          setPeek(null);
          return;
        }
        if (hasWon) {
          setShowModal(true);
          return;
        }
        if (currentTry.length === 5 && KID_WORDS.has(currentTry)) {
          // Kid-friendly word: a real guess that counts.
          setTries((t) => [...t, currentTry]);
          setCurrentTry("");
        } else if (currentTry.length === 5 && VALID_WORDS.has(currentTry)) {
          // Real word but not kid-friendly: show feedback only, do not count.
          setPeek(currentTry);
          setCurrentTry("");
        } else {
          setWarning(true);
        }
      } else if (!hasWon) {
        if (peek) setPeek(null);
        setCurrentTry((value) => (value.length < 5 ? value + key : value));
      }
    },
    [currentTry, peek, hasWon]
  );

  return (
    <div className="center" style={{ height: `${height}px` }}>
      <Help />
      <Fade show={warning}>{(c) => <Warning className={c} />}</Fade>
      <Fade show={!!peek}>{(c) => <PeekNote className={c} />}</Fade>
      <Fade show={showModal}>
        {(c) => (
          <SummaryModal
            tries={tries}
            word={word}
            className={c}
            hintsUsed={hintState.usedCount}
            onClose={() => setShowModal(false)}
          />
        )}
      </Fade>
      <h2>Ordla</h2>
      <Tries
        word={word}
        tries={tries}
        currentTry={currentTry}
        revealed={hasWon || hasLost ? undefined : hintState.hints.revealed}
        peek={peek}
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
    </div>
  );
}

function Warning({ className }: { className: string }) {
  return (
    <div className={"warning " + className}>
      Ordet finns inte med i ordlistan.
    </div>
  );
}

function PeekNote({ className }: { className: string }) {
  return (
    <div
      className={"warning " + className}
      style={{
        width: "auto",
        maxWidth: "min(300px, calc(100vw - 24px))",
        fontSize: "1rem",
      }}
    >
      Rätt ord! 🙂 Men inte ett av barnorden i den här Ordlan, så det räknas
      inte.
    </div>
  );
}

// Pick a start date
const inception =
  new Date(1641680371437).setUTCHours(0, 0, 0, 0).valueOf() /
  (1000 * 60 * 60 * 24);

function getWordForDay(date: Date) {
  const today = date.setUTCHours(0, 0, 0, 0);
  const index = today / (1000 * 60 * 60 * 24);
  return kidWords[
    (kidWords.length / 2 + (index - inception)) % kidWords.length
  ];
}
