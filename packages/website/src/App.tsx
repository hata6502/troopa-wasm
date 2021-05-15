import {
  AppBar,
  Button,
  Grid,
  Snackbar,
  TextField,
  Toolbar,
  makeStyles,
  useTheme,
} from "@material-ui/core";
import type { SnackbarProps } from "@material-ui/core";
import { Alert, AlertTitle } from "@material-ui/lab";
import type { AlertProps, AlertTitleProps } from "@material-ui/lab";
import equal from "fast-deep-equal";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ChangeEventHandler,
  Dispatch,
  FunctionComponent,
  SetStateAction,
} from "react";
import { ArcherContainer } from "react-archer";
import type { ArcherContainerProps } from "react-archer";
import { ComponentActions } from "./ComponentActions";
import { ComponentContainer } from "./ComponentContainer";
import type { ComponentContainerProps } from "./ComponentContainer";
import { Player } from "./Player";
import { Sidebar, sidebarWidth } from "./Sidebar";
import {
  componentInputNames,
  componentType,
  createComponent,
} from "./component";
import type { Component, OutputDestination } from "./component";
import { initialSketch } from "./sketch";
import type { Sketch } from "./sketch";

interface AlertData {
  isOpen?: SnackbarProps["open"];
  severity?: AlertProps["severity"];
  title?: AlertTitleProps["children"];
  description?: AlertProps["children"];
}

const svgContainerStyle: ArcherContainerProps["svgContainerStyle"] = {
  // To display arrows in front of components.
  zIndex: 1,
};

const useStyles = makeStyles(({ mixins, palette, spacing }) => ({
  appBar: {
    width: `calc(100% - ${sidebarWidth}px)`,
    marginLeft: sidebarWidth,
  },
  archerContainer: {
    position: "relative",
    height: 2160,
    width: 3840,
  },
  container: {
    display: "flex",
  },
  main: {
    flexGrow: 1,
    backgroundColor: palette.background.default,
    padding: spacing(3),
  },
  toolbar: mixins.toolbar,
}));

const App: FunctionComponent = memo(() => {
  const [alertData, dispatchAlertData] = useState<AlertData>({});
  const [errorComponentIDs, setErrorComponentIDs] = useState<string[]>([]);
  const [player, setPlayer] = useState<Player>();

  const [originalSketch, setOriginalSketch] = useState(initialSketch);
  const [currentSketch, dispatchCurrentSketch] = useState(originalSketch);

  const archerContainerElement = useRef<ArcherContainer>(null);

  const classes = useStyles();
  const theme = useTheme();

  useEffect(() => {
    if (equal(currentSketch, originalSketch)) {
      return;
    }

    const handleBeforeunload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // For Chrome.
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeunload);

    return () => window.removeEventListener("beforeunload", handleBeforeunload);
  }, [currentSketch, originalSketch]);

  useEffect(() => {
    if (!player) {
      return;
    }

    const handleBufferButtonClick = () => {
      dispatchAlertData((prevAlertData) => ({
        ...prevAlertData,
        isOpen: false,
      }));

      const newComponentEntry = createComponent({ type: componentType.buffer });

      dispatchCurrentSketch((prevCurrentSketch) => ({
        ...prevCurrentSketch,
        component: {
          ...prevCurrentSketch.component,
          [newComponentEntry.id]: newComponentEntry.component,
        },
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

      setErrorComponentIDs([componentID]);
      setPlayer(undefined);

      void player.close();
    });

    return () => player.setCoreInfiniteLoopDetectedHandler(undefined);
  }, [player]);

  const handleDistributorButtonClick = useCallback(() => {
    const newComponentEntry = createComponent({
      type: componentType.distributor,
    });

    dispatchCurrentSketch((prevCurrentSketch) => ({
      ...prevCurrentSketch,
      component: {
        ...prevCurrentSketch.component,
        [newComponentEntry.id]: newComponentEntry.component,
      },
    }));
  }, []);

  const handleComponentDrag = useCallback(() => {
    if (!archerContainerElement.current) {
      throw new Error();
    }

    archerContainerElement.current.refreshScreen();
  }, []);

  const handleSketchNameChange: ChangeEventHandler<HTMLInputElement> =
    useCallback(
      (event) =>
        dispatchCurrentSketch((prevCurrentSketch) => ({
          ...prevCurrentSketch,
          name: event.target.value,
        })),
      []
    );

  const handlePlayButtonClick = useCallback(() => {
    setErrorComponentIDs([]);

    setPlayer(
      new Player({
        sketch: currentSketch,
      })
    );
  }, [currentSketch]);

  const handleStopButtonClick = useCallback(() => {
    if (!player) {
      return;
    }

    setPlayer(undefined);

    void player.close();
  }, [player]);

  const handleLoadInputChange: ChangeEventHandler<HTMLInputElement> =
    useCallback((event) => {
      const files = event.target.files;

      if (!files || files.length < 1) {
        return;
      }

      const fileReader = new FileReader();

      fileReader.addEventListener("load", () => {
        const result = fileReader.result;

        if (typeof result !== "string") {
          throw new Error();
        }

        const loadedSketch = JSON.parse(result) as Sketch;

        dispatchCurrentSketch(loadedSketch);
        setOriginalSketch(loadedSketch);
      });

      fileReader.readAsText(files[0]);
    }, []);

  const handleSaveButtonClick = useCallback(() => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(currentSketch)], { type: "application/json" })
    );

    try {
      const anchorElement = document.createElement("a");

      anchorElement.download = `${currentSketch.name}.json`;
      anchorElement.href = url;
      document.body.append(anchorElement);

      try {
        anchorElement.click();
      } finally {
        anchorElement.remove();
      }
    } finally {
      URL.revokeObjectURL(url);
    }

    setOriginalSketch(currentSketch);
  }, [currentSketch]);

  const removeConnections = useCallback(
    (targets: OutputDestination[]) =>
      dispatchCurrentSketch((prevSketch) => ({
        ...prevSketch,
        component: Object.fromEntries(
          Object.entries(prevSketch.component).map(([id, component]) => [
            id,
            {
              ...component,
              outputDestinations: component.outputDestinations.filter(
                (outputDestination) =>
                  targets.every(
                    (target) =>
                      outputDestination.componentID !== target.componentID ||
                      outputDestination.inputIndex !== target.inputIndex
                  )
              ),
            },
          ])
        ),
      })),
    []
  );

  const handleRemoveComponentRequest: NonNullable<
    ComponentContainerProps["onRemoveComponentRequest"]
  > = useCallback(
    (event) => {
      const inputLength = componentInputNames[event.component.type].length;

      removeConnections(
        [...Array(inputLength).keys()].map((index) => ({
          componentID: event.id,
          inputIndex: index,
        }))
      );

      dispatchCurrentSketch((prevSketch) => ({
        ...prevSketch,
        component: Object.fromEntries(
          Object.entries(prevSketch.component).flatMap(([id, component]) =>
            id === event.id ? [] : [[id, component]]
          )
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

  const componentContainerElements = useMemo(() => {
    const getDispatchComponent = <T extends Component>({
      id,
      component,
    }: {
      id: string;
      component: T;
    }) => {
      const dispatchComponent: Dispatch<SetStateAction<T>> = (action) =>
        dispatchCurrentSketch((prevSketch) => {
          const prevComponent = new Map(
            Object.entries(prevSketch.component)
          ).get(id);

          const isComponentT = (target: Component): target is T =>
            target.type === component.type;

          if (!prevComponent || !isComponentT(prevComponent)) {
            throw new Error();
          }

          return {
            ...prevSketch,
            component: {
              ...prevSketch.component,
              [id]:
                typeof action === "function" ? action(prevComponent) : action,
            },
          };
        });

      return dispatchComponent;
    };

    return Object.entries(currentSketch.component).map(([id, component]) => (
      <ComponentContainer
        id={id}
        key={id}
        component={component}
        sketch={currentSketch}
        dispatchAlertData={dispatchAlertData}
        getDispatchComponent={getDispatchComponent}
        isError={errorComponentIDs.includes(id)}
        onDistributorButtonClick={handleDistributorButtonClick}
        onDrag={handleComponentDrag}
        onRemoveComponentRequest={handleRemoveComponentRequest}
        onRemoveConnectionsRequest={removeConnections}
      >
        <ComponentActions
          id={id}
          component={component}
          getDispatchComponent={getDispatchComponent}
          player={player}
        />
      </ComponentContainer>
    ));
  }, [
    currentSketch,
    errorComponentIDs,
    handleComponentDrag,
    handleDistributorButtonClick,
    handleRemoveComponentRequest,
    player,
    removeConnections,
  ]);

  return (
    <div className={classes.container}>
      <AppBar className={classes.appBar} color="inherit" position="fixed">
        <Toolbar>
          <Grid container spacing={2}>
            <Grid item>
              <TextField
                variant="outlined"
                label="sketch name"
                size="small"
                value={currentSketch.name}
                onChange={handleSketchNameChange}
              />
            </Grid>

            <Grid item>
              <Button
                variant="contained"
                color="primary"
                disabled={Boolean(player)}
                onClick={handlePlayButtonClick}
              >
                play
              </Button>
            </Grid>

            <Grid item>
              <Button
                variant="contained"
                disabled={!player}
                onClick={handleStopButtonClick}
              >
                stop
              </Button>
            </Grid>

            <Grid item>
              <Button variant="contained" component="label">
                load
                <input
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={handleLoadInputChange}
                />
              </Button>
            </Grid>

            <Grid item>
              <Button variant="contained" onClick={handleSaveButtonClick}>
                save
              </Button>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>

      <Sidebar dispatchSketch={dispatchCurrentSketch} />

      <main className={classes.main}>
        <div className={classes.toolbar} />

        <ArcherContainer
          className={classes.archerContainer}
          ref={archerContainerElement}
          strokeColor={theme.palette.divider}
          svgContainerStyle={svgContainerStyle}
        >
          {componentContainerElements}
        </ArcherContainer>
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

export { App };
export type { AlertData };
