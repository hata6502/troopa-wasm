import { TextField, TextFieldProps } from "@material-ui/core";
import {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  memo,
  useCallback,
} from "react";
import { Player } from "../Player";
import { InputComponent, componentType } from "../component";
import { SketchV3 } from "../sketch";

const Input: FunctionComponent<{
  id: string;
  component: InputComponent;
  dispatchComponentEntries: Dispatch<
    SetStateAction<SketchV3["componentEntries"]>
  >;
  isPlaying?: boolean;
  player?: Player;
}> = memo(({ id, component, dispatchComponentEntries, isPlaying, player }) => {
  const handleChange: NonNullable<TextFieldProps["onChange"]> = useCallback(
    (event) => {
      dispatchComponentEntries((prevComponentEntries) => {
        const prevComponentMap = new Map(prevComponentEntries);
        const prevComponent = prevComponentMap.get(id);

        if (!prevComponent || prevComponent.type !== componentType.input) {
          throw new Error(`${id} is not an input`);
        }

        return [
          ...prevComponentMap
            .set(id, {
              ...prevComponent,
              extendedData: {
                ...prevComponent.extendedData,
                value: event.target.value,
              },
            })
            .entries(),
        ];
      });

      if (!player) {
        return;
      }

      player.inputValue({
        componentID: id,
        value: Number(event.target.value),
      });
    },
    [dispatchComponentEntries, id, player]
  );

  return (
    <TextField
      type="number"
      variant="outlined"
      className="cancel-component-container-drag"
      focused={isPlaying}
      size="small"
      value={component.extendedData.value}
      onChange={handleChange}
    />
  );
});

export { Input };
