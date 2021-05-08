import {
  Box,
  Button,
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
  MouseEventHandler,
  SetStateAction,
} from "react";
import { ArcherElement } from "react-archer";
import type { Relation } from "react-archer";
import Draggable, { DraggableCore } from "react-draggable";
import type {
  ControlPosition,
  DraggableData,
  DraggableEventHandler,
} from "react-draggable";
import type { AlertData } from "./App";
import { componentInputNames, diffTimeInput } from "./component";
import type { Component, OutputDestination } from "./component";
import { coreComponentOutputLength } from "./player";
import type { Sketch } from "./sketch";

const detectArcherAnchorPosition = ({
  sourceX,
  targetX,
}: {
  sourceX: ControlPosition["x"];
  targetX: ControlPosition["x"];
}): Pick<Relation, "sourceAnchor" | "targetAnchor"> => {
  return sourceX < targetX
    ? {
        sourceAnchor: "right",
        targetAnchor: "left",
      }
    : {
        sourceAnchor: "left",
        targetAnchor: "right",
      };
};

const anchorWidth = 20;
const containerWidth = 160;

const useStyles = makeStyles(({ palette, spacing }) => ({
  card: {
    overflow: "visible",
  },
  container: {
    position: "absolute",
    cursor: "move",
    width: containerWidth,
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
    backgroundColor: palette.background.paper,
    padding: 0,
    width: anchorWidth,
  },
  outputAnchor: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translate(50%, -50%)",
    backgroundColor: palette.background.paper,
    cursor: "alias",
    padding: 0,
    width: anchorWidth,
  },
}));

interface ComponentContainerProps {
  sketch: Sketch;
  componentIndex: number;
  dispatchAlertData: Dispatch<SetStateAction<AlertData>>;
  getDispatchComponent: <T extends Component>(props: {
    component: T;
  }) => Dispatch<SetStateAction<T>>;
  onDistributorButtonClick?: MouseEventHandler<HTMLButtonElement>;
  onDrag?: DraggableEventHandler;
  onRemoveComponentRequest?: (event: { component: Component }) => void;
  onRemoveConnectionsRequest?: (event: OutputDestination[]) => void;
}

const ComponentContainer: FunctionComponent<ComponentContainerProps> = memo(
  ({
    children,
    sketch,
    componentIndex,
    dispatchAlertData,
    getDispatchComponent,
    onDistributorButtonClick,
    onDrag,
    onRemoveComponentRequest,
    onRemoveConnectionsRequest,
  }) => {
    const component = sketch.components[componentIndex];

    const [connectionCuror, setConnectionCuror] = useState<DraggableData>();

    const dispatchComponent = useMemo(
      () => getDispatchComponent({ component }),
      [component, getDispatchComponent]
    );

    const handleDrag: DraggableEventHandler = useCallback(
      (event, data) => {
        dispatchComponent((prevComponent) => ({
          ...prevComponent,
          position: { x: data.x, y: data.y },
        }));

        onDrag?.(event, data);
      },
      [dispatchComponent, onDrag]
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

    const handleDistributorButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(
      (event) => {
        dispatchAlertData({ isOpen: false });
        onDistributorButtonClick?.(event);
      },
      [dispatchAlertData, onDistributorButtonClick]
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

          const appendedOutputDestinations = [
            ...component.outputDestinations,
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

          if (uniqueOutputDestinations.length <= coreComponentOutputLength) {
            dispatchComponent((prevComponent) => ({
              ...prevComponent,
              outputDestinations: uniqueOutputDestinations,
            }));
          } else {
            dispatchAlertData({
              isOpen: true,
              severity: "info",
              title: "Please use distributor component",
              description: (
                <>
                  A component can output to up to {coreComponentOutputLength}{" "}
                  destinations. Please use&nbsp;
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
        } else {
          throw new Error();
        }

        setConnectionCuror(undefined);

        onDrag?.(event, data);
      },
      [
        component.outputDestinations,
        dispatchAlertData,
        dispatchComponent,
        handleDistributorButtonClick,
        onDrag,
      ]
    );

    const classes = useStyles();

    const inputElements = useMemo(() => {
      const inputLength = componentInputNames[component.implementation].length;

      return [...Array(inputLength).keys()].flatMap((inputIndex) => {
        if ([diffTimeInput].includes(inputIndex)) {
          return [];
        }

        const handleInputAnchorClick = () =>
          onRemoveConnectionsRequest?.([
            {
              componentID: component.id,
              inputIndex,
            },
          ]);

        const isConnected = sketch.components.some((otherComponent) =>
          otherComponent.outputDestinations.some(
            (outputDestination) =>
              outputDestination.componentID === component.id &&
              outputDestination.inputIndex === inputIndex
          )
        );

        return [
          <Box key={inputIndex} className={classes.input}>
            <Typography variant="body2" gutterBottom>
              {componentInputNames[component.implementation][inputIndex]}
            </Typography>

            <ArcherElement id={`${component.id}-input-anchor-${inputIndex}`}>
              <Radio
                data-component-id={component.id}
                data-input-index={inputIndex}
                checked={isConnected}
                className={classes.inputAnchor}
                size="small"
                onClick={handleInputAnchorClick}
              />
            </ArcherElement>
          </Box>,
        ];
      });
    }, [
      classes.input,
      classes.inputAnchor,
      component.id,
      component.implementation,
      onRemoveConnectionsRequest,
      sketch.components,
    ]);

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
      <Draggable
        position={component.position}
        onStart={handleDrag}
        onDrag={handleDrag}
        onStop={handleDrag}
      >
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
                  ...component.outputDestinations.map((outputDestination) => {
                    const destinationComponent = sketch.components.find(
                      (component) =>
                        component.id === outputDestination.componentID
                    );

                    if (!destinationComponent) {
                      throw new Error();
                    }

                    return {
                      ...detectArcherAnchorPosition({
                        sourceX:
                          component.position.x +
                          containerWidth +
                          anchorWidth / 2,
                        targetX:
                          destinationComponent.position.x - anchorWidth / 2,
                      }),
                      targetId: `${destinationComponent.id}-input-anchor-${outputDestination.inputIndex}`,
                    };
                  }),
                  ...(connectionCuror
                    ? [
                        {
                          ...detectArcherAnchorPosition({
                            sourceX:
                              component.position.x +
                              containerWidth +
                              anchorWidth / 2,
                            targetX: component.position.x + connectionCuror.x,
                          }),
                          targetId: `${component.id}-connection-cursor`,
                        },
                      ]
                    : []),
                ]}
              >
                <Radio
                  checked={false}
                  className={classes.outputAnchor}
                  size="small"
                />
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
