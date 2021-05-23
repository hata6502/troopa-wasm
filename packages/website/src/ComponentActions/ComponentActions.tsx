import { memo } from "react";
import type { Dispatch, FunctionComponent, SetStateAction } from "react";
import type { Player } from "../Player";
import { primitiveComponentType } from "../component";
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
    case primitiveComponentType.input: {
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

    case primitiveComponentType.keyboardFrequency: {
      return <KeyboardFrequency id={id} player={player} />;
    }

    case primitiveComponentType.keyboardSwitch: {
      return (
        // Reset the state on playing or stopping.
        <KeyboardSwitch id={id} key={String(Boolean(player))} player={player} />
      );
    }

    case primitiveComponentType.amplifier:
    case primitiveComponentType.buffer:
    case primitiveComponentType.differentiator:
    case primitiveComponentType.distributor:
    case primitiveComponentType.divider:
    case primitiveComponentType.integrator:
    case primitiveComponentType.lowerSaturator:
    case primitiveComponentType.mixer:
    case primitiveComponentType.noise:
    case primitiveComponentType.saw:
    case primitiveComponentType.sine:
    case primitiveComponentType.square:
    case primitiveComponentType.subtractor:
    case primitiveComponentType.triangle:
    case primitiveComponentType.upperSaturator:
    case primitiveComponentType.speaker:
    case primitiveComponentType.meter:
    case primitiveComponentType.scope: {
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
