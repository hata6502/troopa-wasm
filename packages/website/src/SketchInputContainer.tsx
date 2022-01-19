import { Grid, TextField, makeStyles } from "@material-ui/core";
import {
  ChangeEventHandler,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  memo,
  useCallback,
  useMemo,
} from "react";
import { DraggableEventHandler } from "react-draggable";
import { ConnectableAnchor } from "./ConnectableAnchor";
import {
  Destination,
  getDestinationsByPosition,
  serializeDestination,
} from "./destination";
import { SketchV3, SketchInput } from "./sketch";

const useStyles = makeStyles(({ spacing }) => ({
  name: {
    width: spacing(18),
  },
}));

const SketchInputContainer: FunctionComponent<{
  index: number;
  disabled?: boolean;
  dispatchInputs: Dispatch<SetStateAction<SketchV3["inputs"]>>;
  input: SketchInput;
  onRemoveConnectionsRequest?: (event: Destination[]) => void;
}> = memo(
  ({ index, disabled, dispatchInputs, input, onRemoveConnectionsRequest }) => {
    const classes = useStyles();

    const handleNameChange: ChangeEventHandler<HTMLInputElement> = useCallback(
      (event) =>
        dispatchInputs((prevInputs) => {
          const inputs: SketchV3["inputs"] = [...prevInputs];

          inputs[index] = {
            ...inputs[index],
            name: event.target.value,
          };

          return inputs;
        }),
      [dispatchInputs, index]
    );

    const handleAnchorStop: DraggableEventHandler = useCallback(
      (event) => {
        let x;
        let y;

        if (event instanceof MouseEvent) {
          x = event.clientX;
          y = event.clientY;
        } else if (event instanceof TouchEvent) {
          x = event.changedTouches[0].clientX;
          y = event.changedTouches[0].clientY;
        } else {
          throw new Error("Unsupported event type");
        }

        const destinations = getDestinationsByPosition({ x, y });

        onRemoveConnectionsRequest?.(destinations);

        if (destinations.length !== 0) {
          dispatchInputs((prevInputs) => {
            const inputs: SketchV3["inputs"] = [...prevInputs];

            inputs[index] = {
              ...inputs[index],
              destination: destinations[0],
            };

            return inputs;
          });
        }
      },
      [dispatchInputs, index, onRemoveConnectionsRequest]
    );

    const relations = useMemo(
      () =>
        input.destination
          ? [
              {
                targetId: serializeDestination({
                  destination: input.destination,
                }),
              },
            ]
          : [],
      [input.destination]
    );

    return (
      <Grid container alignItems="center" spacing={2} wrap="nowrap">
        <Grid item>
          <TextField
            variant="outlined"
            className={classes.name}
            disabled={disabled}
            label="input name"
            size="small"
            value={input.name}
            onChange={handleNameChange}
          />
        </Grid>

        <Grid item>
          <ConnectableAnchor
            id={`sketch-input-${index}`}
            anchorlessRelations={relations}
            disabled={disabled}
            onStop={handleAnchorStop}
          />
        </Grid>
      </Grid>
    );
  }
);

export { SketchInputContainer };
