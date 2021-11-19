import { Dispatch, FunctionComponent, SetStateAction, memo } from "react";
import { Player } from "../Player";
import { ComponentV2, componentType } from "../component";
import { SketchV2 } from "../sketch";
import { Input } from "./Input";
import { KeyboardFrequency } from "./KeyboardFrequency";
import { KeyboardSwitch } from "./KeyboardSwitch";
import { Meter } from "./Meter";
import { SketchAction } from "./SketchAction";

const ComponentActions: FunctionComponent<{
  id: string;
  component: ComponentV2;
  dispatchComponentEntries: Dispatch<
    SetStateAction<SketchV2["componentEntries"]>
  >;
  isPlaying?: boolean;
  player?: Player;
}> = memo(({ id, component, dispatchComponentEntries, isPlaying, player }) => {
  switch (component.type) {
    case componentType.input: {
      return (
        <Input
          id={id}
          component={component}
          dispatchComponentEntries={dispatchComponentEntries}
          isPlaying={isPlaying}
          player={player}
        />
      );
    }

    case componentType.keyboardFrequency: {
      return <KeyboardFrequency id={id} player={player} />;
    }

    case componentType.keyboardSwitch: {
      return (
        // Reset the state on playing or stopping.
        <KeyboardSwitch id={id} key={String(Boolean(player))} player={player} />
      );
    }

    case componentType.meter: {
      return <Meter value={component.extendedData.value} />;
    }

    case componentType.sketch: {
      return <SketchAction sketch={component.extendedData.sketch} />;
    }

    case componentType.amplifier:
    case componentType.buffer:
    case componentType.differentiator:
    case componentType.distributor:
    case componentType.divider:
    case componentType.integrator:
    case componentType.lowerSaturator:
    case componentType.mixer:
    case componentType.noise:
    case componentType.saw:
    case componentType.sine:
    case componentType.square:
    case componentType.subtractor:
    case componentType.triangle:
    case componentType.upperSaturator:
    case componentType.and:
    case componentType.not:
    case componentType.or:
    case componentType.speaker: {
      return null;
    }

    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = component;

      throw new Error();
    }
  }
});

export { ComponentActions };
