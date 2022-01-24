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
import { sketchHeight, sketchWidth } from "../App";
import { ComponentActions } from "../ComponentActions";
import { Player } from "../Player";
import {
  Component,
  getComponentInputNames,
  getComponentOutputNames,
} from "../component";
import { Destination } from "../destination";
import { SketchInput, SketchOutput, SketchV3 } from "../sketch";
import { Input } from "./Input";
import { Output } from "./Output";

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
  dispatchComponentEntries: Dispatch<
    SetStateAction<SketchV3["componentEntries"]>
  >;
  isError?: boolean;
  isPlaying?: boolean;
  onRemoveComponentRequest?: (event: { id: string }) => void;
  onRemoveConnectionsRequest?: (event: Destination[]) => void;
  player?: Player;
  sketchComponentEntries: [string, Component][];
  sketchInputs: SketchInput[];
  sketchOutputs: SketchOutput[];
}

const ComponentContainer: FunctionComponent<ComponentContainerProps> = memo(
  ({
    id,
    component,
    dispatchComponentEntries,
    isError = false,
    isPlaying,
    onRemoveComponentRequest,
    onRemoveConnectionsRequest,
    player,
    sketchComponentEntries,
    sketchInputs,
    sketchOutputs,
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
      () => onRemoveComponentRequest?.({ id }),
      [id, onRemoveComponentRequest]
    );

    const outputNames = getComponentOutputNames({ component });
    const classes = useStyles();

    return (
      <Draggable
        cancel=".cancel-component-container-drag"
        disabled={isPlaying}
        position={component.position}
        onStart={handleDrag}
        onDrag={handleDrag}
        onStop={handleDrag}
      >
        <div
          className={clsx(
            classes.container,
            !isPlaying && classes.draggableContainer
          )}
        >
          <Card className={classes.card}>
            <Box pb={2} pt={2}>
              <Box mb={2} pl={2} pr={2}>
                <TextField
                  className="cancel-component-container-drag"
                  disabled={isPlaying}
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
                        <Input
                          key={index}
                          index={index}
                          name={name}
                          componentID={id}
                          disabled={isPlaying}
                          sketchComponentEntries={sketchComponentEntries}
                          sketchInputs={sketchInputs}
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
                        <Output
                          key={index}
                          destinations={outputDestinations}
                          index={index}
                          name={name}
                          componentID={id}
                          disabled={isPlaying}
                          dispatchComponentEntries={dispatchComponentEntries}
                          sketchOutputs={sketchOutputs}
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

            <CardActions>
              <ComponentActions
                id={id}
                component={component}
                dispatchComponentEntries={dispatchComponentEntries}
                isPlaying={isPlaying}
                player={player}
              />
            </CardActions>
          </Card>

          {isError && (
            <ErrorIcon
              className={classes.errorIcon}
              color="error"
              fontSize="small"
            />
          )}

          <Tooltip title="Delete">
            <span className={classes.deleteButton}>
              <IconButton
                className="cancel-component-container-drag"
                disabled={isPlaying}
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
