import { TextField } from "@material-ui/core";
import type { TextFieldProps } from "@material-ui/core";
import { memo, useCallback } from "react";
import type { Dispatch, FunctionComponent, SetStateAction } from "react";
import type { Player } from "../Player";
import { InputComponent, componentType } from "../component";
import type { Sketch } from "../sketch";

const Input: FunctionComponent<{
  id: string;
  component: InputComponent;
  dispatchComponent: Dispatch<SetStateAction<Sketch["component"]>>;
  player?: Player;
}> = memo(({ id, component, dispatchComponent, player }) => {
  const handleChange: NonNullable<TextFieldProps["onChange"]> = useCallback(
    (event) => {
      dispatchComponent((prevComponents) => {
        const prevComponent = prevComponents[id];

        if (prevComponent.type !== componentType.input) {
          throw new Error(`${id} is not an input`);
        }

        return {
          ...prevComponents,
          [id]: {
            ...prevComponent,
            extendedData: {
              ...prevComponent.extendedData,
              value: event.target.value,
            },
          },
        };
      });

      if (!player) {
        return;
      }

      player.inputValue({
        componentID: id,
        value: Number(event.target.value),
      });
    },
    [dispatchComponent, id, player]
  );

  return (
    <TextField
      type="number"
      variant="outlined"
      size="small"
      value={component.extendedData.value}
      onChange={handleChange}
    />
  );
});

export { Input };
