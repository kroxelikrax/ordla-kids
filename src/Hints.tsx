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
