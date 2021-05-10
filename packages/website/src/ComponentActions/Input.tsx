import { TextField } from "@material-ui/core";
import type { TextFieldProps } from "@material-ui/core";
import { memo, useCallback } from "react";
import type { Dispatch, FunctionComponent, SetStateAction } from "react";
import type { Player } from "../Player";
import type { InputComponent } from "../component";

const Input: FunctionComponent<{
  id: string;
  component: InputComponent;
  dispatchComponent: Dispatch<SetStateAction<InputComponent>>;
  player?: Player;
}> = memo(({ id, component, dispatchComponent, player }) => {
  const handleChange: NonNullable<TextFieldProps["onChange"]> = useCallback(
    (event) => {
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
