import { Typography, makeStyles } from "@material-ui/core";
import {
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
  OutputDestination,
  getDestinationsByPosition,
  serializeDestination,
} from "./destination";
import { SketchV3 } from "./sketch";

const useStyles = makeStyles(({ palette, spacing }) => ({
  anchor: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translate(50%, -50%)",
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

export const ComponentOutput: FunctionComponent<{
  destinations: Destination[];
  index: number;
  name: string;
  componentID: string;
  disabled?: boolean;
  dispatchComponentEntries: Dispatch<
    SetStateAction<SketchV3["componentEntries"]>
  >;
  sketch: SketchV3;
  onRemoveConnectionsRequest?: (event: Destination[]) => void;
}> = memo(
  ({
    destinations,
    index,
    name,
    componentID,
    disabled,
    dispatchComponentEntries,
    sketch,
    onRemoveConnectionsRequest,
  }) => {
    const handleStop: DraggableEventHandler = useCallback(
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

        const newDestinations = getDestinationsByPosition({ x, y });
        const appendedDestinations = [...destinations, ...newDestinations];

        const outputDestination = sketch.outputs
          .map(
            (_output, index): OutputDestination => ({
              type: "output",
              index,
            })
          )
          .find((outputDestination) =>
            appendedDestinations.some(
              (appendedOutputDestination) =>
                serializeDestination({
                  destination: appendedOutputDestination,
                }) === serializeDestination({ destination: outputDestination })
            )
          );

        const uniqueDestinations = outputDestination
          ? [outputDestination]
          : [
              ...new Map(
                appendedDestinations.map((outputDestination) => [
                  serializeDestination({ destination: outputDestination }),
                  outputDestination,
                ])
              ).values(),
            ];

        onRemoveConnectionsRequest?.(newDestinations);

        dispatchComponentEntries((prevComponentEntries) => {
          const prevComponentMap = new Map(prevComponentEntries);
          const prevComponent = prevComponentMap.get(componentID);

          if (!prevComponent) {
            throw new Error("Component not found");
          }

          const outputDestinationsList = [
            ...prevComponent.outputDestinationsList,
          ];

          outputDestinationsList[index] = uniqueDestinations;

          return [
            ...prevComponentMap
              .set(componentID, {
                ...prevComponent,
                outputDestinationsList,
              })
              .entries(),
          ];
        });
      },
      [
        componentID,
        destinations,
        dispatchComponentEntries,
        index,
        onRemoveConnectionsRequest,
        sketch.outputs,
      ]
    );

    const relations = useMemo(
      () =>
        destinations.map((destination) => ({
          targetId: serializeDestination({ destination }),
        })),
      [destinations]
    );

    const classes = useStyles();

    return (
      <div className={classes.container}>
        <Typography variant="body2" align="right">
          {name}
        </Typography>

        <ConnectableAnchor
          id={`component-${componentID}-output-${index}`}
          anchorlessRelations={relations}
          className={classes.anchor}
          disabled={disabled}
          onStop={handleStop}
        />
      </div>
    );
  }
);
