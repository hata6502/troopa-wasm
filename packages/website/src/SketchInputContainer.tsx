import { Grid, TextField, makeStyles } from "@material-ui/core";
import { memo, useCallback } from "react";
import type {
  ChangeEventHandler,
  Dispatch,
  FunctionComponent,
  SetStateAction,
} from "react";
import type { DraggableEventHandler } from "react-draggable";
import { ConnectableAnchor } from "./ConnectableAnchor";
import type { SketchInput } from "./sketch";

const useStyles = makeStyles(({ spacing }) => ({
  name: {
    width: spacing(18),
  },
}));

interface SketchInputProps {
  index: number;
  dispatchInput: Dispatch<SetStateAction<SketchInput>>;
  input: SketchInput;
  onDrag?: DraggableEventHandler;
}

const SketchInputContainer: FunctionComponent<SketchInputProps> = memo(
  ({ index, dispatchInput, input, onDrag }) => {
    const classes = useStyles();

    const handleInputNameChange: ChangeEventHandler<HTMLInputElement> =
      useCallback(
        (event) =>
          dispatchInput((prevInput) => ({
            ...prevInput,
            name: event.target.value,
          })),
        [dispatchInput]
      );

    return (
      <Grid container alignItems="center" spacing={2} wrap="nowrap">
        <Grid item>
          <TextField
            variant="outlined"
            className={classes.name}
            label="input name"
            size="small"
            value={input.name}
            onChange={handleInputNameChange}
          />
        </Grid>

        <Grid item>
          <ConnectableAnchor
            id={`sketch-input-${index}`}
            //relations={anchorRelations}
            onDrag={onDrag}
            onStop={onDrag}
          />
        </Grid>
      </Grid>
    );
  }
);

export { SketchInputContainer };
