import { Grid, Radio, TextField, makeStyles } from "@material-ui/core";
import {
  ChangeEventHandler,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  memo,
  useCallback,
  useMemo,
} from "react";
import { ArcherElement } from "react-archer";
import { Component } from "./component";
import {
  Destination,
  OutputDestination,
  serializeDestination,
} from "./destination";
import { SketchInput, SketchV3 } from "./sketch";

const useStyles = makeStyles(({ palette, spacing }) => ({
  name: {
    width: spacing(18),
  },
  radio: {
    backgroundColor: palette.background.paper,
    padding: 0,
  },
}));

export const SketchOutputContainer: FunctionComponent<{
  index: number;
  name: string;
  disabled?: boolean;
  dispatchOutputs: Dispatch<SetStateAction<SketchV3["outputs"]>>;
  sketchComponentEntries: [string, Component][];
  sketchInputs: SketchInput[];
  onRemoveConnectionsRequest?: (event: Destination[]) => void;
}> = memo(
  ({
    index,
    name,
    disabled,
    dispatchOutputs,
    sketchComponentEntries,
    sketchInputs,
    onRemoveConnectionsRequest,
  }) => {
    const destination = useMemo<OutputDestination>(
      () => ({
        type: "output",
        index,
      }),
      [index]
    );

    const handleClick = useCallback(
      () => onRemoveConnectionsRequest?.([destination]),
      [destination, onRemoveConnectionsRequest]
    );

    const handleNameChange: ChangeEventHandler<HTMLInputElement> = useCallback(
      (event) =>
        dispatchOutputs((prevOutputs) => {
          const outputs = [...prevOutputs];

          outputs[index] = {
            ...outputs[index],
            name: event.target.value,
          };

          return outputs;
        }),
      [dispatchOutputs, index]
    );

    const isConnected =
      sketchComponentEntries.some(([, otherComponent]) =>
        otherComponent.outputDestinationsList.some((outputDestinations) =>
          outputDestinations.some(
            (outputDestination) =>
              serializeDestination({ destination: outputDestination }) ===
              serializeDestination({ destination })
          )
        )
      ) ||
      sketchInputs.some(
        (input) =>
          input.destination &&
          serializeDestination({ destination: input.destination }) ===
            serializeDestination({ destination })
      );

    const id = serializeDestination({ destination });
    const classes = useStyles();

    return (
      <Grid container alignItems="center" spacing={2} wrap="nowrap">
        <Grid item>
          <ArcherElement id={id}>
            <Radio
              data-sketch-output-index={index}
              id={id}
              checked={isConnected}
              className={classes.radio}
              disabled={disabled}
              size="small"
              onClick={handleClick}
            />
          </ArcherElement>
        </Grid>

        <Grid item>
          <TextField
            variant="outlined"
            className={classes.name}
            disabled={disabled}
            label="output name"
            size="small"
            value={name}
            onChange={handleNameChange}
          />
        </Grid>
      </Grid>
    );
  }
);
