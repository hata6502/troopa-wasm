import {
  Box,
  Card,
  CardActions,
  IconButton,
  Radio,
  Typography,
  makeStyles,
} from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import { memo, useCallback, useMemo, useState } from "react";
import type {
  CSSProperties,
  Dispatch,
  FunctionComponent,
  SetStateAction,
} from "react";
import { ArcherElement } from "react-archer";
import Draggable, { DraggableCore } from "react-draggable";
import type { DraggableData, DraggableEventHandler } from "react-draggable";
import { componentInputNames, diffTimeInput } from "./component";
import type { Component, OutputDestination } from "./component";

const useStyles = makeStyles(({ spacing }) => ({
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
    right: spacing(1),
    top: spacing(1),
  },
  input: {
    position: "relative",
    paddingLeft: spacing(2),
    paddingRight: spacing(2),
  },
  inputAnchor: {
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translate(-50%, -50%)",
  },
  outputAnchor: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translate(50%, -50%)",
    cursor: "alias",
  },
}));

interface ComponentContainerProps {
  component: Component;
  getDispatchComponent: <T extends Component>(props: {
    component: T;
  }) => Dispatch<SetStateAction<T>>;
  onDrag?: DraggableEventHandler;
  onRemoveComponentRequest?: (event: { component: Component }) => void;
  onRemoveConnectionsRequest?: (event: OutputDestination[]) => void;
}

const ComponentContainer: FunctionComponent<ComponentContainerProps> = memo(
  ({
    children,
    component,
    getDispatchComponent,
    onDrag,
    onRemoveComponentRequest,
    onRemoveConnectionsRequest,
  }) => {
    const [connectionCuror, setConnectionCuror] = useState<DraggableData>();

    const dispatchComponent = useMemo(
      () => getDispatchComponent({ component }),
      [component, getDispatchComponent]
    );

    const handleDeleteButtonClick = useCallback(
      () =>
        onRemoveComponentRequest?.({
          component,
        }),
      [component, onRemoveComponentRequest]
    );

    const handleOutputAnchorDrag: DraggableEventHandler = useCallback(
      (event, data) => {
        event.stopPropagation();

        setConnectionCuror(data);

        onDrag?.(event, data);
      },
      [onDrag]
    );

    const handleOutputAnchorStop: DraggableEventHandler = useCallback(
      (event, data) => {
        event.stopPropagation();

        if (event instanceof MouseEvent) {
          const elements = document.elementsFromPoint(
            event.clientX,
            event.clientY
          );

          const outputDestinations = elements.flatMap(
            (element): OutputDestination[] => {
              if (!(element instanceof HTMLElement)) {
                return [];
              }

              const componentID = element.dataset["componentId"];
              const inputIndexString = element.dataset["inputIndex"];

              if (componentID === undefined || inputIndexString === undefined) {
                return [];
              }

              return [
                {
                  componentID,
                  inputIndex: Number(inputIndexString),
                },
              ];
            }
          );

          dispatchComponent((prevComponent) => {
            const appendedOutputDestinations = [
              ...prevComponent.outputDestinations,
              ...outputDestinations,
            ];

            const uniqueOutputDestinations = [
              ...new Map(
                appendedOutputDestinations.map((outputDestination) => [
                  `${outputDestination.componentID}-${outputDestination.inputIndex}`,
                  outputDestination,
                ])
              ).values(),
            ];

            return {
              ...prevComponent,
              outputDestinations: uniqueOutputDestinations,
            };
          });
        } else {
          throw new Error();
        }

        setConnectionCuror(undefined);

        onDrag?.(event, data);
      },
      [dispatchComponent, onDrag]
    );

    const classes = useStyles();

    const inputElements = useMemo(
      () =>
        component.inputs.flatMap((input, index) => {
          if ([diffTimeInput].includes(index)) {
            return [];
          }

          const handleInputAnchorClick = () =>
            onRemoveConnectionsRequest?.([
              {
                componentID: component.id,
                inputIndex: index,
              },
            ]);

          return [
            <Box key={index} className={classes.input}>
              <Typography variant="body2" gutterBottom>
                {componentInputNames[component.implementation][index]}
              </Typography>

              <ArcherElement id={`${component.id}-input-anchor-${index}`}>
                <Radio
                  data-component-id={component.id}
                  data-input-index={index}
                  checked={input.connected}
                  className={classes.inputAnchor}
                  onClick={handleInputAnchorClick}
                />
              </ArcherElement>
            </Box>,
          ];
        }),
      [
        classes.input,
        classes.inputAnchor,
        component.id,
        component.implementation,
        component.inputs,
        onRemoveConnectionsRequest,
      ]
    );

    const connectionCurorStyle = useMemo(
      (): CSSProperties | undefined =>
        connectionCuror && {
          position: "absolute",
          left: connectionCuror.x,
          top: connectionCuror.y,
        },
      [connectionCuror]
    );

    return (
      <Draggable onStart={onDrag} onDrag={onDrag} onStop={onDrag}>
        <div className={classes.container}>
          <Card className={classes.card}>
            <Box pb={2} pt={2}>
              <Box pl={2} pr={2}>
                <Typography variant="body1" gutterBottom>
                  {component.name}
                </Typography>
              </Box>

              {inputElements}
            </Box>

            <CardActions>{children}</CardActions>
          </Card>

          <IconButton
            className={classes.deleteButton}
            size="small"
            onClick={handleDeleteButtonClick}
          >
            <Delete fontSize="small" />
          </IconButton>

          <DraggableCore
            onStart={handleOutputAnchorDrag}
            onDrag={handleOutputAnchorDrag}
            onStop={handleOutputAnchorStop}
          >
            {/* DraggableCore target. */}
            <div>
              <ArcherElement
                id={`${component.id}-output-anchor`}
                relations={[
                  ...component.outputDestinations.map((outputDestination) => ({
                    sourceAnchor: "right" as const,
                    targetId: `${outputDestination.componentID}-input-anchor-${outputDestination.inputIndex}`,
                    targetAnchor: "left" as const,
                  })),
                  ...(connectionCuror
                    ? [
                        {
                          sourceAnchor: "right" as const,
                          targetId: `${component.id}-connection-cursor`,
                          targetAnchor: "middle" as const,
                        },
                      ]
                    : []),
                ]}
              >
                <Radio checked={false} className={classes.outputAnchor} />
              </ArcherElement>
            </div>
          </DraggableCore>

          {connectionCurorStyle && (
            <ArcherElement id={`${component.id}-connection-cursor`}>
              <div style={connectionCurorStyle} />
            </ArcherElement>
          )}
        </div>
      </Draggable>
    );
  }
);

export { ComponentContainer };
export type { ComponentContainerProps };
