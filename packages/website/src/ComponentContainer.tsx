import {
  Box,
  Card,
  CardActions,
  IconButton,
  Radio,
  TextField,
  Tooltip,
  Typography,
  makeStyles,
} from "@material-ui/core";
import { Delete, Error as ErrorIcon } from "@material-ui/icons";
import clsx from "clsx";
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
import Draggable, { DraggableEventHandler } from "react-draggable";
import { sketchHeight, sketchOutputDestination, sketchWidth } from "./App";
import { ConnectableAnchor } from "./ConnectableAnchor";
import {
  Component,
  getComponentInputNames,
  getComponentOutputName,
} from "./component";
import {
  Destination,
  getDestinationsByPosition,
  serializeDestination,
} from "./destination";
import { SketchV3 } from "./sketch";

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
  card: {
    overflow: "visible",
  },
  container: {
    position: "absolute",
    width: 160,
  },
  deleteButton: {
    position: "absolute",
    right: spacing(0),
    top: spacing(-4),
  },
  draggableContainer: {
    cursor: "move",
  },
  errorIcon: {
    position: "absolute",
    left: spacing(0),
    top: spacing(-4),
  },
  inputContainer: {
    position: "relative",
    paddingLeft: spacing(2),
    paddingRight: spacing(2),
  },
  outputContainer: {
    position: "absolute",
    left: "100%",
    top: "50%",
    paddingLeft: spacing(2),
    transform: "translateY(-50%)",
  },
}));

interface ComponentContainerProps {
  id: string;
  component: Component;
  sketch: SketchV3;
  disabled?: boolean;
  dispatchComponentEntries: Dispatch<
    SetStateAction<SketchV3["componentEntries"]>
  >;
  isError?: boolean;
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
    disabled,
    dispatchComponentEntries,
    isError = false,
    onRemoveComponentRequest,
    onRemoveConnectionsRequest,
  }) => {
    const handleNameChange: ChangeEventHandler<HTMLInputElement> = useCallback(
      (event) =>
        dispatchComponentEntries((prevComponentEntries) => {
          const prevComponentMap = new Map(prevComponentEntries);
          const prevComponent = prevComponentMap.get(id);

          if (!prevComponent) {
            throw new Error("Component not found");
          }

          return [
            ...prevComponentMap
              .set(id, {
                ...prevComponent,
                name: event.target.value,
              })
              .entries(),
          ];
        }),
      [dispatchComponentEntries, id]
    );

    const handleDrag: DraggableEventHandler = useCallback(
      (_event, data) =>
        dispatchComponentEntries((prevComponentEntries) => {
          const prevComponentMap = new Map(prevComponentEntries);
          const prevComponent = prevComponentMap.get(id);

          if (!prevComponent) {
            throw new Error("Component not found");
          }

          return [
            ...prevComponentMap
              .set(id, {
                ...prevComponent,
                position: {
                  x: Math.min(Math.max(data.x, 0.0), sketchWidth),
                  y: Math.min(Math.max(data.y, 0.0), sketchHeight),
                },
              })
              .entries(),
          ];
        }),
      [dispatchComponentEntries, id]
    );

    const handleDeleteButtonClick = useCallback(
      () =>
        onRemoveComponentRequest?.({
          id,
          component,
        }),
      [component, id, onRemoveComponentRequest]
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
            serializeDestination({ destination: appendedOutputDestination }) ===
            serializeDestination({ destination: sketchOutputDestination })
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

        onRemoveConnectionsRequest?.(newOutputDestinations);

        dispatchComponentEntries((prevComponentEntries) => {
          const prevComponentMap = new Map(prevComponentEntries);
          const prevComponent = prevComponentMap.get(id);

          if (!prevComponent) {
            throw new Error("Component not found");
          }

          return [
            ...prevComponentMap
              .set(id, {
                ...prevComponent,
                outputDestinations: uniqueOutputDestinations,
              })
              .entries(),
          ];
        });
      },
      [
        component.outputDestinations,
        dispatchComponentEntries,
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
              sketch.componentEntries.some(([, otherComponent]) =>
                otherComponent.outputDestinations.some(
                  (outputDestination) =>
                    serializeDestination({ destination: outputDestination }) ===
                    serializeDestination({ destination: componentDestination })
                )
              ) ||
              sketch.inputs.some(
                (input) =>
                  input.destination &&
                  serializeDestination({ destination: input.destination }) ===
                    serializeDestination({ destination: componentDestination })
              );

            const radioID = serializeDestination({
              destination: componentDestination,
            });

            return [
              <div key={inputIndex} className={classes.inputContainer}>
                <Typography variant="body2">{inputName}</Typography>

                <ArcherElement id={radioID}>
                  <Radio
                    data-component-id={id}
                    data-input-index={inputIndex}
                    id={radioID}
                    checked={isConnected}
                    className={clsx(
                      classes.anchor,
                      "cancel-component-container-drag"
                    )}
                    disabled={disabled}
                    size="small"
                    onClick={handleInputClick}
                  />
                </ArcherElement>
              </div>,
            ];
          }
        ),
      [
        classes.anchor,
        classes.inputContainer,
        component,
        disabled,
        id,
        onRemoveConnectionsRequest,
        sketch.componentEntries,
        sketch.inputs,
      ]
    );

    const outputRelations = useMemo(
      () =>
        component.outputDestinations.map((outputDestination) => ({
          targetId: serializeDestination({ destination: outputDestination }),
        })),
      [component.outputDestinations]
    );

    return (
      <Draggable
        cancel=".cancel-component-container-drag"
        disabled={disabled}
        position={component.position}
        onStart={handleDrag}
        onDrag={handleDrag}
        onStop={handleDrag}
      >
        <div
          className={clsx(
            classes.container,
            !disabled && classes.draggableContainer
          )}
        >
          <Card className={classes.card}>
            <Box pb={2} pt={2}>
              <Box mb={2} pl={2} pr={2}>
                <TextField
                  className="cancel-component-container-drag"
                  disabled={disabled}
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

          <Tooltip title="Delete">
            <span>
              <IconButton
                className={clsx(
                  classes.deleteButton,
                  "cancel-component-container-drag"
                )}
                disabled={disabled}
                size="small"
                onClick={handleDeleteButtonClick}
              >
                <Delete fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <div className={classes.outputContainer}>
            <div className={classes.anchor}>
              <ConnectableAnchor
                id={`component-${id}-output`}
                anchorlessRelations={outputRelations}
                disabled={disabled}
                onStop={handleOutputStop}
              />
            </div>

            <Typography variant="body2">
              {getComponentOutputName({ component })}
            </Typography>
          </div>
        </div>
      </Draggable>
    );
  }
);

export { ComponentContainer, ComponentContainerProps };
