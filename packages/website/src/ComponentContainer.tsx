import {
  Box,
  Card,
  CardActions,
  Grid,
  IconButton,
  TextField,
  Tooltip,
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
} from "react";
import Draggable, { DraggableEventHandler } from "react-draggable";
import { sketchHeight, sketchWidth } from "./App";
import { ComponentInput } from "./ComponentInput";
import { ComponentOutput } from "./ComponentOutput";
import {
  Component,
  getComponentInputNames,
  getComponentOutputNames,
} from "./component";
import { Destination } from "./destination";
import { SketchV3 } from "./sketch";

const useStyles = makeStyles(({ spacing }) => ({
  card: {
    overflow: "visible",
  },
  container: {
    position: "absolute",
    width: 180,
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

    const outputNames = getComponentOutputNames({ component });
    const classes = useStyles();

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

              <Grid container>
                <Grid item xs>
                  {getComponentInputNames({ component }).map(
                    (name, index) =>
                      name && (
                        <ComponentInput
                          key={index}
                          index={index}
                          name={name}
                          componentID={id}
                          disabled={disabled}
                          sketch={sketch}
                          onRemoveConnectionsRequest={
                            onRemoveConnectionsRequest
                          }
                        />
                      )
                  )}
                </Grid>

                <Grid item xs>
                  {component.outputDestinationsList.map(
                    (outputDestinations, index) => {
                      const name = outputNames[index];

                      return name ? (
                        <ComponentOutput
                          key={index}
                          destinations={outputDestinations}
                          index={index}
                          name={name}
                          componentID={id}
                          disabled={disabled}
                          dispatchComponentEntries={dispatchComponentEntries}
                          sketch={sketch}
                          onRemoveConnectionsRequest={
                            onRemoveConnectionsRequest
                          }
                        />
                      ) : undefined;
                    }
                  )}
                </Grid>
              </Grid>
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
        </div>
      </Draggable>
    );
  }
);

export { ComponentContainer, ComponentContainerProps };
