import { Square } from "./Square";

export function Tries(props: {
  currentTry: string;
  word: string;
  tries: string[];
  revealed?: { index: number; letter: string };
}) {
  const { tries, currentTry, word, revealed } = props;

  return (
    <div
      className="gap-s center"
      style={{ margin: "auto", padding: "6px", maxWidth: "calc(100vw - 12px)" }}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div className="row center gap-s">
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
        </div>
      ))}
    </div>
  );
}
