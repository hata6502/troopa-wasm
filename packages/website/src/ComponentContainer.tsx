import {
  Box,
  Button,
  Card,
  CardActions,
  IconButton,
  Radio,
  TextField,
  Typography,
  makeStyles,
} from "@material-ui/core";
import { Delete, Error as ErrorIcon } from "@material-ui/icons";
import clsx from "clsx";
import equal from "fast-deep-equal";
import { memo, useCallback, useMemo } from "react";
import type {
  ChangeEventHandler,
  Dispatch,
  FunctionComponent,
  MouseEventHandler,
  SetStateAction,
} from "react";
import { ArcherElement } from "react-archer";
import Draggable from "react-draggable";
import type { DraggableEventHandler } from "react-draggable";
import { sketchHeight, sketchOutputDestination, sketchWidth } from "./App";
import type { AlertData } from "./App";
import { ConnectableAnchor } from "./ConnectableAnchor";
import { Player } from "./Player";
import { getComponentInputNames } from "./component";
import type { Component } from "./component";
import { getDestinationsByPosition, serializeDestination } from "./destination";
import type { Destination } from "./destination";
import type { Sketch } from "./sketch";

const useStyles = makeStyles(({ palette, spacing }) => ({
  card: {
    overflow: "visible",
  },
  container: {
    position: "absolute",
    cursor: "move",
    width: 160,
  },
  deleteButton: {
    position: "absolute",
    right: spacing(0),
    top: spacing(-4),
  },
  errorIcon: {
    position: "absolute",
    left: spacing(0),
    top: spacing(-4),
  },
  input: {
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: palette.background.paper,
    padding: 0,
    width: 20,
  },
  inputContainer: {
    position: "relative",
    paddingLeft: spacing(2),
    paddingRight: spacing(2),
  },
  output: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translate(50%, -50%)",
  },
}));

interface ComponentContainerProps {
  id: string;
  component: Component;
  sketch: Sketch;
  dispatchAlertData: Dispatch<SetStateAction<AlertData>>;
  dispatchComponent: Dispatch<SetStateAction<Sketch["component"]>>;
  isError?: boolean;
  onDistributorButtonClick?: MouseEventHandler<HTMLButtonElement>;
  onRemoveComponentRequest?: (event: {
    id: string;
    component: Component;
  }) => void;
  onRemoveConnectionsRequest?: (event: Destination[]) => void;
}

const ComponentContainer: FunctionComponent<ComponentContainerProps> = memo(
  ({
    id,
    children,
    component,
    sketch,
    dispatchAlertData,
    dispatchComponent,
    isError = false,
    onDistributorButtonClick,
    onRemoveComponentRequest,
    onRemoveConnectionsRequest,
  }) => {
    const handleNameChange: ChangeEventHandler<HTMLInputElement> = useCallback(
      (event) =>
        dispatchComponent((prevComponent) => ({
          ...prevComponent,
          [id]: {
            ...prevComponent[id],
            name: event.target.value,
          },
        })),
      [dispatchComponent, id]
    );

    const handleDrag: DraggableEventHandler = useCallback(
      (_event, data) =>
        dispatchComponent((prevComponent) => ({
          ...prevComponent,
          [id]: {
            ...prevComponent[id],
            position: {
              x: Math.min(Math.max(data.x, 0.0), sketchWidth),
              y: Math.min(Math.max(data.y, 0.0), sketchHeight),
            },
          },
        })),
      [dispatchComponent, id]
    );

    const handleDeleteButtonClick = useCallback(
      () =>
        onRemoveComponentRequest?.({
          id,
          component,
        }),
      [component, id, onRemoveComponentRequest]
    );

    const handleDistributorButtonClick: MouseEventHandler<HTMLButtonElement> =
      useCallback(
        (event) => {
          dispatchAlertData((prevAlertData) => ({
            ...prevAlertData,
            isOpen: false,
          }));

          onDistributorButtonClick?.(event);
        },
        [dispatchAlertData, onDistributorButtonClick]
      );

    const handleOutputStop: DraggableEventHandler = useCallback(
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

        const newOutputDestinations = getDestinationsByPosition({ x, y });

        const appendedOutputDestinations = [
          ...component.outputDestinations,
          ...newOutputDestinations,
        ];

        const uniqueOutputDestinations = appendedOutputDestinations.some(
          (appendedOutputDestination) =>
            equal(appendedOutputDestination, sketchOutputDestination)
        )
          ? [sketchOutputDestination]
          : [
              ...new Map(
                appendedOutputDestinations.map((outputDestination) => [
                  serializeDestination({ destination: outputDestination }),
                  outputDestination,
                ])
              ).values(),
            ];

        if (
          uniqueOutputDestinations.length <= Player.coreComponentOutputLength
        ) {
          onRemoveConnectionsRequest?.(newOutputDestinations);

          dispatchComponent((prevComponent) => ({
            ...prevComponent,
            [id]: {
              ...prevComponent[id],
              outputDestinations: uniqueOutputDestinations,
            },
          }));
        } else {
          dispatchAlertData({
            isOpen: true,
            severity: "info",
            title: "Please use distributor component",
            description: (
              <>
                A component can output to up to&nbsp;
                {Player.coreComponentOutputLength} destinations. Please
                use&nbsp;
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleDistributorButtonClick}
                >
                  distributor
                </Button>
                &nbsp;component to expand it.
              </>
            ),
          });
        }
      },
      [
        component.outputDestinations,
        dispatchAlertData,
        dispatchComponent,
        handleDistributorButtonClick,
        id,
        onRemoveConnectionsRequest,
      ]
    );

    const classes = useStyles();

    const inputElements = useMemo(
      () =>
        getComponentInputNames({ component }).flatMap(
          (inputName, inputIndex) => {
            if (inputName === undefined) {
              return [];
            }

            const componentDestination: Destination = {
              type: "component",
              id,
              inputIndex,
            };

            const handleInputClick = () =>
              onRemoveConnectionsRequest?.([componentDestination]);

            const isConnected =
              Object.values(sketch.component).some((otherComponent) =>
                otherComponent.outputDestinations.some((outputDestination) =>
                  equal(outputDestination, componentDestination)
                )
              ) ||
              sketch.inputs.some((input) =>
                equal(input.destination, componentDestination)
              );

            return [
              <div key={inputIndex} className={classes.inputContainer}>
                <Typography variant="body2" gutterBottom>
                  {inputName}
                </Typography>

                <ArcherElement
                  id={serializeDestination({
                    destination: componentDestination,
                  })}
                >
                  <Radio
                    data-component-id={id}
                    data-input-index={inputIndex}
                    checked={isConnected}
                    className={clsx(
                      classes.input,
                      "cancel-component-container-drag"
                    )}
                    size="small"
                    onClick={handleInputClick}
                  />
                </ArcherElement>
              </div>,
            ];
          }
        ),
      [
        classes.input,
        classes.inputContainer,
        component,
        id,
        onRemoveConnectionsRequest,
        sketch.component,
        sketch.inputs,
      ]
    );

    const outputRelations = useMemo(
      () =>
        component.outputDestinations.map((outputDestination) => ({
          sourceAnchor: "right" as const,
          targetAnchor: "left" as const,
          targetId: serializeDestination({ destination: outputDestination }),
        })),
      [component.outputDestinations]
    );

    return (
      <Draggable
        cancel=".cancel-component-container-drag"
        position={component.position}
        onStart={handleDrag}
        onDrag={handleDrag}
        onStop={handleDrag}
      >
        <div className={classes.container}>
          <Card className={classes.card}>
            <Box pb={2} pt={2}>
              <Box mb={2} pl={2} pr={2}>
                <TextField
                  className="cancel-component-container-drag"
                  size="small"
                  value={component.name}
                  onChange={handleNameChange}
                />
              </Box>

              {inputElements}
            </Box>

            <CardActions>{children}</CardActions>
          </Card>

          {isError && (
            <ErrorIcon
              className={classes.errorIcon}
              color="error"
              fontSize="small"
            />
          )}

          <IconButton
            className={clsx(
              classes.deleteButton,
              "cancel-component-container-drag"
            )}
            size="small"
            onClick={handleDeleteButtonClick}
          >
            <Delete fontSize="small" />
          </IconButton>

          <div className={classes.output}>
            <ConnectableAnchor
              id={`component-${id}-output`}
              relations={outputRelations}
              onStop={handleOutputStop}
            />
          </div>
        </div>
      </Draggable>
    );
  }
);

export { ComponentContainer };
export type { ComponentContainerProps };
