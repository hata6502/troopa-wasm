import { memo, useEffect, useState } from "react";
import type { FunctionComponent } from "react";
import type { Player } from "../Player";

const KeyboardSwitch: FunctionComponent<{
  id: string;
  player?: Player;
}> = memo(({ id, player }) => {
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!player) {
        return;
      }

      player.inputValue({
        componentID: id,
        value: 1.0,
      });

      setPressedKeys((prevPressedKeys) => [...prevPressedKeys, event.key]);
    };

    const handleKeyup = (event: KeyboardEvent) => {
      if (!player) {
        return;
      }

      const filteredPressedKeys = pressedKeys.filter(
        (pressedKey) => pressedKey !== event.key
      );

      setPressedKeys(filteredPressedKeys);

      if (filteredPressedKeys.length !== 0) {
        return;
      }

      player.inputValue({
        componentID: id,
        value: 0.0,
      });
    };

    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("keyup", handleKeyup);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("keyup", handleKeyup);
    };
  }, [id, player, pressedKeys]);

  return <>{pressedKeys.length === 0 ? "off" : "on"}</>;
});

export { KeyboardSwitch };
