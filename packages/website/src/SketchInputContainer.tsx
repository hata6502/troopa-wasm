import { Grid, TextField, makeStyles } from "@material-ui/core";
import { memo, useCallback, useMemo } from "react";
import type {
  ChangeEventHandler,
  Dispatch,
  FunctionComponent,
  SetStateAction,
} from "react";
import type { DraggableEventHandler } from "react-draggable";
import { ConnectableAnchor } from "./ConnectableAnchor";
import { getDestinationsByPosition, serializeDestination } from "./destination";
import type { Destination } from "./destination";
import type { SketchInput } from "./sketch";

const useStyles = makeStyles(({ spacing }) => ({
  name: {
    width: spacing(18),
  },
}));

const SketchInputContainer: FunctionComponent<{
  index: number;
  dispatchInput: Dispatch<SetStateAction<SketchInput>>;
  input: SketchInput;
  onDrag?: DraggableEventHandler;
  onRemoveConnectionsRequest?: (event: Destination[]) => void;
}> = memo(
  ({ index, dispatchInput, input, onDrag, onRemoveConnectionsRequest }) => {
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

    const handleAnchorStop: DraggableEventHandler = useCallback(
      (event, data) => {
        if (event instanceof MouseEvent) {
          const destinations = getDestinationsByPosition({
            x: event.clientX,
            y: event.clientY,
          });

          onRemoveConnectionsRequest?.(destinations);

          if (destinations.length !== 0) {
            dispatchInput((prevInput) => ({
              ...prevInput,
              destination: destinations[0],
            }));
          }
        } else {
          throw new Error();
        }

        onDrag?.(event, data);
      },
      [dispatchInput, onDrag, onRemoveConnectionsRequest]
    );

    const anchorRelations = useMemo(
      () =>
        input.destination
          ? [
              {
                sourceAnchor: "right" as const,
                targetAnchor: "left" as const,
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
            label="input name"
            size="small"
            value={input.name}
            onChange={handleInputNameChange}
          />
        </Grid>

        <Grid item>
          <ConnectableAnchor
            id={`sketch-input-${index}`}
            relations={anchorRelations}
            onDrag={onDrag}
            onStop={handleAnchorStop}
          />
        </Grid>
      </Grid>
    );
  }
);

export { SketchInputContainer };
