import { TextField } from "@material-ui/core";
import type { TextFieldProps } from "@material-ui/core";
import { memo, useMemo } from "react";
import type { Dispatch, FunctionComponent, SetStateAction } from "react";
import { componentType } from "./component";
import type { Component } from "./component";
import { inputValueToPlayer } from "./player";
import type { Player } from "./player";

const ComponentActions: FunctionComponent<{
  id: string;
  component: Component;
  getDispatchComponent: <T extends Component>(props: {
    id: string;
    component: T;
  }) => Dispatch<SetStateAction<T>>;
  player?: Player;
}> = memo(({ id, component, getDispatchComponent, player }) =>
  useMemo(() => {
    switch (component.implementation) {
      case componentType.input: {
        const dispatchComponent = getDispatchComponent({ id, component });

        const handleChange: TextFieldProps["onChange"] = (event) => {
          dispatchComponent((prevComponent) => ({
            ...prevComponent,
            extendedData: {
              ...prevComponent.extendedData,
              value: event.target.value,
            },
          }));

          if (!player) {
            return;
          }

          inputValueToPlayer({
            player,
            componentID: id,
            value: Number(event.target.value),
          });
        };

        return (
          <TextField
            type="number"
            variant="outlined"
            size="small"
            value={component.extendedData.value}
            onChange={handleChange}
          />
        );
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
      case componentType.keyboard:
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
  }, [component, getDispatchComponent, id, player])
);

export { ComponentActions };
