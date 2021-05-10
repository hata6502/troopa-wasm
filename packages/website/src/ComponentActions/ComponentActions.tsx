import { memo } from "react";
import type { Dispatch, FunctionComponent, SetStateAction } from "react";
import type { Player } from "../Player";
import { componentType } from "../component";
import type { Component } from "../component";
import { Input } from "./Input";
import { KeyboardFrequency } from "./KeyboardFrequency";
import { KeyboardSwitch } from "./KeyboardSwitch";

const ComponentActions: FunctionComponent<{
  id: string;
  component: Component;
  getDispatchComponent: <T extends Component>(props: {
    id: string;
    component: T;
  }) => Dispatch<SetStateAction<T>>;
  player?: Player;
}> = memo(({ id, component, getDispatchComponent, player }) => {
  switch (component.implementation) {
    case componentType.input: {
      const dispatchComponent = getDispatchComponent({ id, component });

      return (
        <Input
          id={id}
          component={component}
          dispatchComponent={dispatchComponent}
          player={player}
        />
      );
    }

    case componentType.keyboardFrequency: {
      return <KeyboardFrequency id={id} player={player} />;
    }

    case componentType.keyboardSwitch: {
      return <KeyboardSwitch id={id} player={player} />;
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
    case componentType.speaker:
    case componentType.meter:
    case componentType.scope: {
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
