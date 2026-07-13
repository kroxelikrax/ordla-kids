export function Hints(props: {
  removeUsed: number;
  removeMax: number;
  misplacedUsed: number;
  misplacedMax: number;
  revealUsed: number;
  revealMax: number;
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
        used={props.removeUsed}
        max={props.removeMax}
        enabled={props.canRemoveLetters}
        onPress={props.onRemoveLetters}
      />
      <HintButton
        label="Visa gul bokstav"
        used={props.misplacedUsed}
        max={props.misplacedMax}
        enabled={props.canShowMisplaced}
        onPress={props.onShowMisplaced}
      />
      <HintButton
        label="Visa rätt bokstav"
        used={props.revealUsed}
        max={props.revealMax}
        enabled={props.canRevealCorrect}
        onPress={props.onRevealCorrect}
      />
    </div>
  );
}

function HintButton(props: {
  label: string;
  used: number;
  max: number;
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
        lineHeight: "1.15",
        flex: "1 1 0",
        opacity: props.enabled ? 1 : 0.4,
        cursor: props.enabled ? "pointer" : "default",
      }}
    >
      💡 {props.label}
      <br />
      <span style={{ fontWeight: 700 }}>
        {props.used}/{props.max}
      </span>
    </button>
  );
}
