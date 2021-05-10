import { memo, useEffect, useState } from "react";
import type { FunctionComponent } from "react";
import type { Player } from "../Player";

const KeyboardSwitch: FunctionComponent<{
  id: string;
  player?: Player;
}> = memo(({ id, player }) => {
  const [isKeyDown, setIsKeyDown] = useState(false);

  useEffect(() => {
    const handleKeyDown = () => {
      if (!player) {
        return;
      }

      player.inputValue({
        componentID: id,
        value: 1.0,
      });

      setIsKeyDown(true);
    };

    const handleKeyUp = () => {
      if (!player) {
        return;
      }

      player.inputValue({
        componentID: id,
        value: 0.0,
      });

      setIsKeyDown(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [id, player]);

  return <>{isKeyDown ? "on" : "off"}</>;
});

export { KeyboardSwitch };
