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
  const [notation, setNotation] = useState<Scale["notation"]>("　");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const scaleMap = new Map<string, Scale>(
        Object.entries({
          4: { notation: "TEST", frequency: 440.0 },
        })
      );

      const scale = scaleMap.get(event.key);

      if (scale === undefined || !player) {
        return;
      }

      player.inputValue({
        componentID: id,
        value: scale.frequency,
      });

      setNotation(scale.notation);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [id, player]);

  return <>{notation}</>;
});

export { KeyboardFrequency };
