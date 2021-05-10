import { memo, useEffect, useState } from "react";
import type { FunctionComponent } from "react";
import type { Player } from "../Player";

interface Scale {
  notation: string;
  frequency: number;
}

const KeyboardFrequency: FunctionComponent<{
  id: string;
  player?: Player;
}> = memo(({ id, player }) => {
  const [notation, setNotation] = useState<Scale["notation"]>("");
  const [octave, setOctave] = useState(3);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const octaveBase = Math.pow(2.0, octave - 1);

      const scaleMap = new Map<string, Scale>(
        Object.entries({
          c: {
            notation: `C${octave}`,
            frequency: 32.703 * octaveBase,
          },
          f: {
            notation: `C#${octave}`,
            frequency: 34.648 * octaveBase,
          },
          v: {
            notation: `D${octave}`,
            frequency: 36.708 * octaveBase,
          },
          g: {
            notation: `D#${octave}`,
            frequency: 38.891 * octaveBase,
          },
          b: {
            notation: `E${octave}`,
            frequency: 41.203 * octaveBase,
          },
          n: {
            notation: `F${octave}`,
            frequency: 43.654 * octaveBase,
          },
          j: {
            notation: `F#${octave}`,
            frequency: 46.249 * octaveBase,
          },
          m: {
            notation: `G${octave}`,
            frequency: 48.999 * octaveBase,
          },
          k: {
            notation: `G#${octave}`,
            frequency: 51.913 * octaveBase,
          },
          ",": {
            notation: `A${octave}`,
            frequency: 55.0 * octaveBase,
          },
          l: {
            notation: `A#${octave}`,
            frequency: 58.27 * octaveBase,
          },
          ".": {
            notation: `B${octave}`,
            frequency: 61.735 * octaveBase,
          },

          r: {
            notation: `C${octave + 1}`,
            frequency: 65.406 * octaveBase,
          },
          5: {
            notation: `C#${octave + 1}`,
            frequency: 69.296 * octaveBase,
          },
          t: {
            notation: `D${octave + 1}`,
            frequency: 73.416 * octaveBase,
          },
          6: {
            notation: `D#${octave + 1}`,
            frequency: 77.782 * octaveBase,
          },
          y: {
            notation: `E${octave + 1}`,
            frequency: 82.407 * octaveBase,
          },
          u: {
            notation: `F${octave + 1}`,
            frequency: 87.307 * octaveBase,
          },
          8: {
            notation: `F#${octave + 1}`,
            frequency: 92.499 * octaveBase,
          },
          i: {
            notation: `G${octave + 1}`,
            frequency: 97.999 * octaveBase,
          },
          9: {
            notation: `G#${octave + 1}`,
            frequency: 103.826 * octaveBase,
          },
          o: {
            notation: `A${octave + 1}`,
            frequency: 110.0 * octaveBase,
          },
          0: {
            notation: `A#${octave + 1}`,
            frequency: 116.541 * octaveBase,
          },
          p: {
            notation: `B${octave + 1}`,
            frequency: 123.471 * octaveBase,
          },
        })
      );

      const scale: Scale = scaleMap.get(event.key) ?? {
        notation: "",
        frequency: 0.0,
      };

      if (!player) {
        return;
      }

      player.inputValue({
        componentID: id,
        value: scale.frequency,
      });

      setNotation(scale.notation);
    };

    const handleKeypress = (event: KeyboardEvent) => {
      if (!player) {
        return;
      }

      if (event.key === ";") {
        setOctave((prevOctave) => prevOctave + 1);
      }

      if (event.key === "-") {
        setOctave((prevOctave) => prevOctave - 1);
      }
    };

    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("keypress", handleKeypress);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("keypress", handleKeypress);
    };
  }, [id, octave, player]);

  return (
    <div>
      <div>
        octave {octave}, {octave + 1}
      </div>

      <div>scale {notation}</div>
    </div>
  );
});

export { KeyboardFrequency };
