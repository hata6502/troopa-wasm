import {
  AppBar,
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  TextField,
  Toolbar,
  Typography,
  makeStyles,
  useTheme,
} from "@material-ui/core";
import { memo, useCallback, useRef, useState } from "react";
import type { FunctionComponent, ReactNode } from "react";
import { ArcherContainer, ArcherElement } from "react-archer";
import type { ArcherContainerProps } from "react-archer";
import Draggable from "react-draggable";

const core = await import("core-wasm/core_wasm");

// TODO: Additional components
// TODO: drag limit

// Core components
const amplifierComponentType = 0;
const bufferComponentType = 1;
const differentiatorComponentType = 2;
const distributorComponentType = 3;
const dividerComponentType = 4;
const integratorComponentType = 5;
const lowerSaturatorComponentType = 6;
const mixerComponentType = 7;
const noiseComponentType = 8;
const sawComponentType = 9;
const sineComponentType = 10;
const squareComponentType = 11;
const subtractorComponentType = 12;
const triangleComponentType = 13;
const upperSaturatorComponentType = 14;

// Interface components
const inputComponentType = 15;
const keyboardComponentType = 16;
const speakerComponentType = 17;
const meterComponentType = 18;
const scopeComponentType = 19;

type ComponentType =
  | typeof amplifierComponentType
  | typeof bufferComponentType
  | typeof differentiatorComponentType
  | typeof distributorComponentType
  | typeof dividerComponentType
  | typeof integratorComponentType
  | typeof lowerSaturatorComponentType
  | typeof mixerComponentType
  | typeof noiseComponentType
  | typeof sawComponentType
  | typeof sineComponentType
  | typeof squareComponentType
  | typeof subtractorComponentType
  | typeof triangleComponentType
  | typeof upperSaturatorComponentType
  | typeof inputComponentType
  | typeof keyboardComponentType
  | typeof speakerComponentType
  | typeof meterComponentType
  | typeof scopeComponentType;

const componentNames = {
  [amplifierComponentType]: "amplifier",
  [bufferComponentType]: "buffer",
  [differentiatorComponentType]: "differentiator",
  [distributorComponentType]: "distributor",
  [dividerComponentType]: "divider",
  [integratorComponentType]: "integrator",
  [lowerSaturatorComponentType]: "lower saturator",
  [mixerComponentType]: "mixer",
  [noiseComponentType]: "noise",
  [sawComponentType]: "saw",
  [sineComponentType]: "sine",
  [squareComponentType]: "square",
  [subtractorComponentType]: "subtractor",
  [triangleComponentType]: "triangle",
  [upperSaturatorComponentType]: "upper saturator",
  [inputComponentType]: "input",
  [keyboardComponentType]: "keyboard",
  [speakerComponentType]: "speaker",
  [meterComponentType]: "meter",
  [scopeComponentType]: "scope",
};

const diffTimeInput = 0;
const diffTimeInputName = "diff time";

const distributorComponentInInput = 1;

const componentInputNames = {
  [amplifierComponentType]: [diffTimeInputName, "in 1", "in 2"],
  [bufferComponentType]: [diffTimeInputName, "in"],
  [differentiatorComponentType]: [diffTimeInputName, "in"],
  [distributorComponentType]: [diffTimeInputName, "in"],
  [dividerComponentType]: [diffTimeInputName, "in 1", "in 2"],
  [integratorComponentType]: [diffTimeInputName, "in"],
  [lowerSaturatorComponentType]: [diffTimeInputName, "in 1", "in 2"],
  [mixerComponentType]: [diffTimeInputName, "in 1", "in 2"],
  [noiseComponentType]: [diffTimeInputName],
  [sawComponentType]: [diffTimeInputName, "frequency"],
  [sineComponentType]: [diffTimeInputName, "frequency"],
  [squareComponentType]: [diffTimeInputName, "frequency"],
  [subtractorComponentType]: [diffTimeInputName, "in 1", "in 2"],
  [triangleComponentType]: [diffTimeInputName, "frequency"],
  [upperSaturatorComponentType]: [diffTimeInputName, "in 1", "in 2"],
  [inputComponentType]: [diffTimeInputName],
  [keyboardComponentType]: [diffTimeInputName],
  [speakerComponentType]: [diffTimeInputName, "sound"],
  [meterComponentType]: [diffTimeInputName, "in"],
  [scopeComponentType]: [diffTimeInputName, "in"],
};

interface ComponentBase<
  Implementation extends ComponentType,
  ExtendedData extends {}
> {
  id: string;
  name: string;
  implementation: Implementation;
  outputDestinations: {
    componentID: string;
    inputIndex: number;
  }[];
  extendedData: ExtendedData;
}

type Component =
  | ComponentBase<typeof amplifierComponentType, {}>
  | ComponentBase<typeof bufferComponentType, {}>
  | ComponentBase<typeof differentiatorComponentType, {}>
  | ComponentBase<typeof distributorComponentType, {}>
  | ComponentBase<typeof dividerComponentType, {}>
  | ComponentBase<typeof integratorComponentType, {}>
  | ComponentBase<typeof lowerSaturatorComponentType, {}>
  | ComponentBase<typeof mixerComponentType, {}>
  | ComponentBase<typeof noiseComponentType, {}>
  | ComponentBase<typeof sawComponentType, {}>
  | ComponentBase<typeof sineComponentType, {}>
  | ComponentBase<typeof squareComponentType, {}>
  | ComponentBase<typeof subtractorComponentType, {}>
  | ComponentBase<typeof triangleComponentType, {}>
  | ComponentBase<typeof upperSaturatorComponentType, {}>
  | ComponentBase<typeof inputComponentType, { value: number }>
  | ComponentBase<typeof keyboardComponentType, {}>
  | ComponentBase<typeof speakerComponentType, {}>
  | ComponentBase<typeof meterComponentType, {}>
  | ComponentBase<typeof scopeComponentType, {}>;

interface Sketch {
  name: string;
  components: Component[];
}

const svgContainerStyle: ArcherContainerProps["svgContainerStyle"] = {
  // To display arrows in front of components.
  zIndex: 1,
};

const testSketch: Sketch = {
  name: "test sketch",
  components: [
    {
      id: "1",
      name: "input",
      implementation: 15,
      outputDestinations: [
        {
          componentID: "3",
          inputIndex: 1,
        },
      ],
      extendedData: {
        value: 440.0,
      },
    },
    {
      id: "2",
      name: "input",
      implementation: 15,
      outputDestinations: [
        {
          componentID: "3",
          inputIndex: 2,
        },
      ],
      extendedData: {
        value: 220.0,
      },
    },
    {
      id: "3",
      name: "mixer",
      implementation: 7,
      outputDestinations: [
        {
          componentID: "4",
          inputIndex: 1,
        },
      ],
      extendedData: {},
    },
    {
      id: "4",
      name: "sine",
      implementation: 10,
      outputDestinations: [
        {
          componentID: "5",
          inputIndex: 1,
        },
      ],
      extendedData: {},
    },
    {
      id: "5",
      name: "speaker",
      implementation: speakerComponentType,
      outputDestinations: [],
      extendedData: {},
    },
  ],
};

const useStyles = makeStyles({
  archerContainer: {
    height: 1080,
    width: 1920,
  },
  component: {
    cursor: "move",
    width: 160,
  },
});

type ComponentIndexMap = Map<Component["id"], number>;

const inputValue = ({
  componentIndexMap,
  componentID,
  value,
}: {
  componentIndexMap: ComponentIndexMap;
  componentID: Component["id"];
  value: number;
}) => {
  const componentIndex = componentIndexMap.get(componentID);

  if (componentIndex === undefined) {
    throw new Error();
  }

  core.input_value(componentIndex, distributorComponentInInput, value);
};

const App: FunctionComponent = memo(() => {
  const [playContext, setPlayContext] = useState<{
    audioContext: AudioContext;
    componentIndexMap: ComponentIndexMap;
  }>();

  const archerContainerElement = useRef<ArcherContainer>(null);

  const classes = useStyles();
  const theme = useTheme();

  const handleComponentDrag = useCallback(() => {
    if (!archerContainerElement.current) {
      throw new Error();
    }

    archerContainerElement.current.refreshScreen();
  }, []);

  const handlePlayButtonClick = useCallback(() => {
    const audioContext = new AudioContext();

    core.init(audioContext.sampleRate);

    const componentIndexMap = new Map(
      testSketch.components.map((component) => {
        switch (component.implementation) {
          case amplifierComponentType:
          case bufferComponentType:
          case differentiatorComponentType:
          case distributorComponentType:
          case dividerComponentType:
          case integratorComponentType:
          case lowerSaturatorComponentType:
          case mixerComponentType:
          case noiseComponentType:
          case sawComponentType:
          case sineComponentType:
          case squareComponentType:
          case subtractorComponentType:
          case triangleComponentType:
          case upperSaturatorComponentType: {
            return [
              component.id,
              core.create_component(component.implementation),
            ];
          }

          case inputComponentType:
          case keyboardComponentType:
          case speakerComponentType:
          case meterComponentType:
          case scopeComponentType: {
            return [
              component.id,
              core.create_component(distributorComponentType),
            ];
          }

          default: {
            const exhaustiveCheck: never = component;

            throw new Error();
          }
        }
      })
    );

    testSketch.components.forEach((component) =>
      component.outputDestinations.forEach((outputDestination) => {
        const inputComponentIndex = componentIndexMap.get(
          outputDestination.componentID
        );

        const outputComponentIndex = componentIndexMap.get(component.id);

        if (
          inputComponentIndex === undefined ||
          outputComponentIndex === undefined
        ) {
          throw new Error();
        }

        core.connect(
          inputComponentIndex,
          outputDestination.inputIndex,
          outputComponentIndex
        );
      })
    );

    let outputComponentIndex: number | undefined;

    testSketch.components.forEach((component) => {
      switch (component.implementation) {
        case inputComponentType: {
          inputValue({componentIndexMap, componentID: component.id, value: component.extendedData.value});

          break;
        }

        case speakerComponentType: {
          outputComponentIndex = componentIndexMap.get(component.id);

          break;
        }

        case amplifierComponentType:
        case bufferComponentType:
        case differentiatorComponentType:
        case distributorComponentType:
        case dividerComponentType:
        case integratorComponentType:
        case lowerSaturatorComponentType:
        case mixerComponentType:
        case noiseComponentType:
        case sawComponentType:
        case sineComponentType:
        case squareComponentType:
        case subtractorComponentType:
        case triangleComponentType:
        case upperSaturatorComponentType:
        case keyboardComponentType:
        case meterComponentType:
        case scopeComponentType: {
          break;
        }

        default: {
          const exhaustiveCheck: never = component;

          throw new Error();
        }
      }
    });

    if (outputComponentIndex === undefined) {
      // TODO: Display error alert
      return;
    }

    const freezedOutputComponentIndex = outputComponentIndex;
    const scriptNode = audioContext.createScriptProcessor(undefined, 0, 1);

    scriptNode.addEventListener("audioprocess", (event) => {
      const bufferSize = event.outputBuffer.getChannelData(0).length;
      const buffer = core.process(bufferSize, freezedOutputComponentIndex);

      event.outputBuffer.copyToChannel(buffer, 0);
    });

    scriptNode.connect(audioContext.destination);

    setPlayContext({ audioContext, componentIndexMap });
  }, []);

  const handleStopButtonClick = useCallback(() => {
    playContext?.audioContext.close();
    setPlayContext(undefined);
  }, [playContext]);

  return (
    <>
      <AppBar color="inherit" position="fixed">
        <Toolbar>
          <Grid container spacing={2} alignItems="baseline">
            <Grid item>
              <Typography variant="h6">troopa</Typography>
            </Grid>

            <Grid item>
              <Typography variant="subtitle1">web toy synthesizer</Typography>
            </Grid>

            <Grid item>
              <Button
                disabled={Boolean(playContext)}
                onClick={handlePlayButtonClick}
              >
                Play
              </Button>

              <Button disabled={!playContext} onClick={handleStopButtonClick}>
                Stop
              </Button>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>

      <main>
        <ArcherContainer
          className={classes.archerContainer}
          ref={archerContainerElement}
          strokeColor={theme.palette.divider}
          svgContainerStyle={svgContainerStyle}
        >
          {testSketch.components.map((component) => {
            let actionNode: ReactNode;

            switch (component.implementation) {
              case inputComponentType: {
                actionNode = (
                  <TextField
                    // TODO: control
                    defaultValue={component.extendedData.value}
                    onChange={(event) => {
                      if (!playContext) {
                        return;
                      }

                      // TODO: update sketch
                      inputValue({
                        componentIndexMap: playContext.componentIndexMap,
                        componentID: component.id,
                        value: Number(event.target.value),
                      });
                    }}
                  />
                );

                break;
              }

              case amplifierComponentType:
              case bufferComponentType:
              case differentiatorComponentType:
              case distributorComponentType:
              case dividerComponentType:
              case integratorComponentType:
              case lowerSaturatorComponentType:
              case mixerComponentType:
              case noiseComponentType:
              case sawComponentType:
              case sineComponentType:
              case squareComponentType:
              case subtractorComponentType:
              case triangleComponentType:
              case upperSaturatorComponentType:
              case keyboardComponentType:
              case speakerComponentType:
              case meterComponentType:
              case scopeComponentType: {
                break;
              }

              default: {
                const exhaustiveCheck: never = component;

                throw new Error();
              }
            }

            return (
              <Draggable
                key={component.id}
                onStart={handleComponentDrag}
                onDrag={handleComponentDrag}
                onStop={handleComponentDrag}
              >
                <Card className={classes.component}>
                  <ArcherElement
                    id={`${component.id}-output`}
                    relations={component.outputDestinations.map(
                      (outputDestination) => ({
                        sourceAnchor: "right",
                        targetId: `${outputDestination.componentID}-input-${outputDestination.inputIndex}`,
                        targetAnchor: "left",
                      })
                    )}
                  >
                    {/* ArcherElement can have only single child. */}
                    <div>
                      <CardContent>
                        <Typography variant="body1" gutterBottom>
                          {component.name}
                        </Typography>

                        {componentInputNames[component.implementation].flatMap(
                          (inputName, index) => {
                            if ([diffTimeInput].includes(index)) {
                              return [];
                            }

                            return [
                              <ArcherElement
                                id={`${component.id}-input-${index}`}
                                key={index}
                              >
                                <Typography variant="body2" gutterBottom>
                                  {inputName}
                                </Typography>
                              </ArcherElement>,
                            ];
                          }
                        )}
                      </CardContent>

                      <CardActions>{actionNode}</CardActions>
                    </div>
                  </ArcherElement>
                </Card>
              </Draggable>
            );
          })}
        </ArcherContainer>
      </main>
    </>
  );
});

export { App };
