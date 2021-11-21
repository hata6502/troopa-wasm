import {
  Button,
  Radio,
  Snackbar,
  SnackbarProps,
  makeStyles,
  useTheme,
} from "@material-ui/core";
import {
  Alert,
  AlertProps,
  AlertTitle,
  AlertTitleProps,
} from "@material-ui/lab";
import {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArcherContainer,
  ArcherContainerProps,
  ArcherElement,
} from "react-archer";
import { v4 as uuidv4 } from "uuid";
import { ComponentActions } from "./ComponentActions";
import {
  ComponentContainer,
  ComponentContainerProps,
} from "./ComponentContainer";
import { Player } from "./Player";
import { Sidebar } from "./Sidebar";
import { SketchInputContainer } from "./SketchInputContainer";
import { TopBar } from "./TopBar";
import {
  componentInputMaxLength,
  componentName,
  componentType,
} from "./component";
import { Destination, serializeDestination } from "./destination";
import { filePickerOptions } from "./filePickerOptions";
import { SketchV3, initialSketch } from "./sketch";

const historyMaxLength = 30;

interface AlertData {
  isOpen?: SnackbarProps["open"];
  severity?: AlertProps["severity"];
  title?: AlertTitleProps["children"];
  description?: AlertProps["children"];
}

interface SketchHistory {
  index: number;
  sketches: SketchV3[];
}

export const sketchOutputDestination: Destination = {
  type: "sketchOutput",
};

const svgContainerStyle: ArcherContainerProps["svgContainerStyle"] = {
  // To display arrows in front of components.
  zIndex: 1,
};

const sketchHeight = 1080;
const sketchWidth = 1920;

const useStyles = makeStyles(({ mixins, palette, spacing }) => ({
  archerContainer: {
    position: "relative",
    height: sketchHeight,
    width: sketchWidth,
  },
  container: {
    display: "flex",
  },
  input: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evenly",
    position: "absolute",
    bottom: 0,
    right: "calc(100% - 10px)",
    top: 0,
  },
  main: {
    flexGrow: 1,
    backgroundColor: palette.background.default,
    padding: spacing(3),
  },
  output: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translate(25%, -50%)",
    backgroundColor: palette.background.paper,
    padding: 0,
    width: 20,
  },
  sketch: {
    position: "relative",
    border: `1px solid ${palette.divider}`,
    marginLeft: spacing(20),
  },
  toolbar: mixins.toolbar,
}));

export const App: FunctionComponent = memo(() => {
  const [alertData, dispatchAlertData] = useState<AlertData>({});
  const [errorComponentIDs, dispatchErrorComponentIDs] = useState<string[]>([]);
  const [fileHandle, dispatchFileHandle] = useState<FileSystemFileHandle>();
  const [isSidebarOpen, dispatchIsSidebarOpen] = useState(false);
  const [player, dispatchPlayer] = useState<Player>();
  const [sketch, dispatchSketch] = useState(initialSketch);

  const [sketchHistory, dispatchSketchHistory] = useState<SketchHistory>({
    index: 0,
    sketches: [sketch],
  });

  useEffect(() => {
    const name = fileHandle?.name;

    document.title = `${name === undefined ? "" : `${name} - `}troopa`;
  }, [fileHandle]);

  useEffect(() => {
    const timeoutID = setTimeout(
      () =>
        void (async () => {
          if (sketch === sketchHistory.sketches[sketchHistory.index]) {
            return;
          }

          dispatchSketchHistory((prevSketchHistory) => {
            const sketches = [
              ...prevSketchHistory.sketches.slice(
                Math.max(prevSketchHistory.index - historyMaxLength, 0),
                prevSketchHistory.index + 1
              ),
              sketch,
            ];

            return {
              ...prevSketchHistory,
              index: sketches.length - 1,
              sketches,
            };
          });

          let resolvedFileHandle = fileHandle;

          if (!resolvedFileHandle) {
            try {
              resolvedFileHandle = await showSaveFilePicker(filePickerOptions);
              dispatchFileHandle(resolvedFileHandle);
            } catch (exception) {
              if (
                exception instanceof Error &&
                exception.name === "AbortError"
              ) {
                return;
              }

              throw exception;
            }
          }

          const writable = await resolvedFileHandle.createWritable();

          await writable.write(JSON.stringify(sketch));
          await writable.close();
        })(),
      500
    );

    return () => clearTimeout(timeoutID);
  }, [fileHandle, sketch, sketchHistory.index, sketchHistory.sketches]);

  const archerContainerElement = useRef<ArcherContainer>(null);

  const classes = useStyles();
  const theme = useTheme();

  const dispatchComponentEntries: Dispatch<
    SetStateAction<SketchV3["componentEntries"]>
  > = (action) =>
    dispatchSketch((prevSketch) => ({
      ...prevSketch,
      componentEntries:
        typeof action === "function"
          ? action(prevSketch.componentEntries)
          : action,
    }));

  const dispatchInputs: Dispatch<SetStateAction<SketchV3["inputs"]>> = (
    action
  ) =>
    dispatchSketch((prevSketch) => ({
      ...prevSketch,
      inputs: typeof action === "function" ? action(prevSketch.inputs) : action,
    }));

  useEffect(() => {
    const intervalID = setInterval(
      () => archerContainerElement.current?.refreshScreen(),
      200
    );

    return () => clearInterval(intervalID);
  }, []);

  useEffect(() => {
    if (!player) {
      return;
    }

    const handleBufferButtonClick = () => {
      dispatchAlertData((prevAlertData) => ({
        ...prevAlertData,
        isOpen: false,
      }));

      dispatchSketch((prevSketch) => ({
        ...prevSketch,
        componentEntries: [
          ...prevSketch.componentEntries,
          [
            uuidv4(),
            {
              name: componentName[componentType.buffer],
              type: componentType.buffer,
              outputDestinations: [],
              position: { x: window.scrollX, y: window.scrollY },
              extendedData: {},
            },
          ],
        ],
      }));
    };

    player.setCoreInfiniteLoopDetectedHandler(({ componentID }) => {
      dispatchAlertData({
        isOpen: true,
        severity: "error",
        title: "Infinite loop detected",
        description: (
          <>
            Please clear the infinite loop.&nbsp;
            <Button
              variant="outlined"
              size="small"
              onClick={handleBufferButtonClick}
            >
              buffer
            </Button>
            &nbsp;component may help to fix it.
          </>
        ),
      });

      dispatchErrorComponentIDs([componentID]);
      dispatchPlayer(undefined);

      void player.close();
    });

    return () => player.setCoreInfiniteLoopDetectedHandler(undefined);
  }, [player]);

  const removeConnections = useCallback(
    (targets: Destination[]) =>
      dispatchSketch((prevSketch) => ({
        ...prevSketch,
        componentEntries: prevSketch.componentEntries.map(([id, component]) => [
          id,
          {
            ...component,
            outputDestinations: component.outputDestinations.filter(
              (outputDestination) =>
                targets.every(
                  (target) =>
                    serializeDestination({ destination: outputDestination }) !==
                    serializeDestination({ destination: target })
                )
            ),
          },
        ]),
        inputs: prevSketch.inputs.map((prevInput) => ({
          ...prevInput,
          destination: targets.some(
            (target) =>
              prevInput.destination &&
              serializeDestination({ destination: prevInput.destination }) ===
                serializeDestination({ destination: target })
          )
            ? undefined
            : prevInput.destination,
        })),
      })),
    []
  );

  const handleRemoveComponentRequest: NonNullable<
    ComponentContainerProps["onRemoveComponentRequest"]
  > = useCallback(
    (event) => {
      removeConnections(
        [...Array(componentInputMaxLength).keys()].map((index) => ({
          type: "component",
          id: event.id,
          inputIndex: index,
        }))
      );

      dispatchSketch((prevSketch) => ({
        ...prevSketch,
        componentEntries: prevSketch.componentEntries.filter(
          ([id]) => id !== event.id
        ),
      }));
    },
    [removeConnections]
  );

  const handleAlertClose = useCallback(
    () =>
      dispatchAlertData((prevAlertData) => ({
        ...prevAlertData,
        isOpen: false,
      })),
    []
  );

  const handleOutputClick = useCallback(
    () => removeConnections([sketchOutputDestination]),
    [removeConnections]
  );

  const isOutputConnected =
    sketch.componentEntries.some(([, otherComponent]) =>
      otherComponent.outputDestinations.some(
        (outputDestination) =>
          serializeDestination({ destination: outputDestination }) ===
          serializeDestination({ destination: sketchOutputDestination })
      )
    ) ||
    sketch.inputs.some(
      (input) =>
        input.destination &&
        serializeDestination({ destination: input.destination }) ===
          serializeDestination({ destination: sketchOutputDestination })
    );

  const isPlaying = Boolean(player);

  const sketchOutputID = serializeDestination({
    destination: sketchOutputDestination,
  });

  return (
    <div className={classes.container}>
      <TopBar
        dispatchErrorComponentIDs={dispatchErrorComponentIDs}
        dispatchFileHandle={dispatchFileHandle}
        dispatchIsSidebarOpen={dispatchIsSidebarOpen}
        dispatchPlayer={dispatchPlayer}
        dispatchSketch={dispatchSketch}
        dispatchSketchHistory={dispatchSketchHistory}
        player={player}
        sketch={sketch}
        sketchHistory={sketchHistory}
      />

      <Sidebar
        dispatchIsSidebarOpen={dispatchIsSidebarOpen}
        dispatchSketch={dispatchSketch}
        isPlaying={isPlaying}
        isSidebarOpen={isSidebarOpen}
      />

      <main className={classes.main}>
        <div className={classes.toolbar} />

        <div className={classes.sketch}>
          <ArcherContainer
            className={classes.archerContainer}
            ref={archerContainerElement}
            strokeColor={theme.palette.divider}
            svgContainerStyle={svgContainerStyle}
          >
            {sketch.componentEntries.map(([id, component]) => (
              <ComponentContainer
                id={id}
                key={id}
                component={component}
                sketch={sketch}
                disabled={isPlaying}
                dispatchComponentEntries={dispatchComponentEntries}
                isError={errorComponentIDs.includes(id)}
                onRemoveComponentRequest={handleRemoveComponentRequest}
                onRemoveConnectionsRequest={removeConnections}
              >
                <ComponentActions
                  id={id}
                  component={component}
                  dispatchComponentEntries={dispatchComponentEntries}
                  isPlaying={isPlaying}
                  player={player}
                />
              </ComponentContainer>
            ))}

            <div className={classes.input}>
              {sketch.inputs.map((input, index) => (
                <SketchInputContainer
                  key={index}
                  index={index}
                  disabled={isPlaying}
                  dispatchInputs={dispatchInputs}
                  input={input}
                  onRemoveConnectionsRequest={removeConnections}
                />
              ))}
            </div>

            <div className={classes.output}>
              <ArcherElement id={sketchOutputID}>
                <Radio
                  data-sketch-output
                  id={sketchOutputID}
                  checked={isOutputConnected}
                  className={classes.output}
                  disabled={isPlaying}
                  size="small"
                  onClick={handleOutputClick}
                />
              </ArcherElement>
            </div>
          </ArcherContainer>
        </div>
      </main>

      <Snackbar open={alertData.isOpen}>
        <Alert severity={alertData.severity} onClose={handleAlertClose}>
          <AlertTitle>{alertData.title}</AlertTitle>
          {alertData.description}
        </Alert>
      </Snackbar>
    </div>
  );
});

export {
  AlertData,
  SketchHistory,
  sketchHeight,
  sketchWidth,
};
