import { Radio, Typography, makeStyles } from "@material-ui/core";
import clsx from "clsx";
import { FunctionComponent, memo, useCallback, useMemo } from "react";
import { ArcherElement } from "react-archer";
import { Component } from "./component";
import {
  ComponentDestination,
  Destination,
  serializeDestination,
} from "./destination";
import { SketchInput } from "./sketch";

const useStyles = makeStyles(({ palette, spacing }) => ({
  anchor: {
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: palette.background.paper,
    padding: 0,
    width: 20,
  },
  container: {
    position: "relative",
    paddingLeft: spacing(2),
    paddingRight: spacing(2),
  },
}));

export const ComponentInput: FunctionComponent<{
  index: number;
  name: string;
  componentID: string;
  disabled?: boolean;
  sketchComponentEntries: [string, Component][];
  sketchInputs: SketchInput[];
  onRemoveConnectionsRequest?: (event: Destination[]) => void;
}> = memo(
  ({
    index,
    name,
    componentID,
    disabled,
    sketchComponentEntries,
    sketchInputs,
    onRemoveConnectionsRequest,
  }) => {
    const destination = useMemo<ComponentDestination>(
      () => ({
        type: "component",
        id: componentID,
        inputIndex: index,
      }),
      [componentID, index]
    );

    const handleClick = useCallback(
      () => onRemoveConnectionsRequest?.([destination]),
      [destination, onRemoveConnectionsRequest]
    );

    const isConnected =
      sketchComponentEntries.some(([, otherComponent]) =>
        otherComponent.outputDestinationsList.some((outputDestinations) =>
          outputDestinations.some(
            (outputDestination) =>
              serializeDestination({
                destination: outputDestination,
              }) ===
              serializeDestination({
                destination,
              })
          )
        )
      ) ||
      sketchInputs.some(
        (input) =>
          input.destination &&
          serializeDestination({ destination: input.destination }) ===
            serializeDestination({ destination })
      );

    const radioID = serializeDestination({ destination });
    const classes = useStyles();

    return (
      <div className={classes.container}>
        <Typography variant="body2">{name}</Typography>

        <ArcherElement id={radioID}>
          <Radio
            data-component-id={componentID}
            data-input-index={index}
            id={radioID}
            checked={isConnected}
            className={clsx(classes.anchor, "cancel-component-container-drag")}
            disabled={disabled}
            size="small"
            onClick={handleClick}
          />
        </ArcherElement>
      </div>
    );
  }
);
