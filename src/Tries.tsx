import { Square } from "./Square";

export function Tries(props: {
  currentTry: string;
  word: string;
  tries: string[];
  revealed?: { index: number; letter: string }[];
  peek?: string | null;
}) {
  const { tries, currentTry, word, revealed, peek } = props;

  return (
    <div
      className="gap-s center"
      style={{ margin: "auto", padding: "6px", maxWidth: "calc(100vw - 12px)" }}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const isActiveRow = i === tries.length;
        // A non-counting "peek" word is shown, evaluated, in the active row.
        const isPeekRow = isActiveRow && !!peek;
        return (
          <div className="row center gap-s" key={i}>
            {[0, 1, 2, 3, 4].map((j) => {
              if (isPeekRow) {
                return (
                  <Square
                    index={j}
                    guess={peek!}
                    isCurrentTry={false}
                    word={word}
                    letter={peek![j]}
                    key={"peek" + i + j}
                  />
                );
              }
              const typed = [...tries, currentTry][i]?.[j];
              const revealedHere = revealed?.find((r) => r.index === j);
              const showHint = isActiveRow && !typed && !!revealedHere;
              const letter = showHint ? revealedHere!.letter : typed;
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
          </div>
        );
      })}
    </div>
  );
}
