import { memo, useEffect, useState } from "react";
import type { FunctionComponent } from "react";
import type { Player } from "../Player";

const KeyboardSwitch: FunctionComponent<{
  id: string;
  player?: Player;
}> = memo(({ id, player }) => {
  const [isKeyDown, setIsKeyDown] = useState(false);

  useEffect(() => {
    const handleKeydown = () => {
      if (!player) {
        return;
      }

      player.inputValue({
        componentID: id,
        value: 1.0,
      });

      setIsKeyDown(true);
    };

    const handleKeyup = () => {
      if (!player) {
        return;
      }

      player.inputValue({
        componentID: id,
        value: 0.0,
      });

      setIsKeyDown(false);
    };

    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("keyup", handleKeyup);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("keyup", handleKeyup);
    };
  }, [id, player]);

  return <>{isKeyDown ? "on" : "off"}</>;
});

export { KeyboardSwitch };
