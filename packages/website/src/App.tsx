import {
  AppBar,
  Button,
  Divider,
  Drawer,
  Grid,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Toolbar,
  Typography,
  makeStyles,
  useTheme,
} from "@material-ui/core";
import type { SnackbarProps } from "@material-ui/core";
import { Alert, AlertTitle } from "@material-ui/lab";
import type { AlertProps, AlertTitleProps } from "@material-ui/lab";
import * as Sentry from "@sentry/react";
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
import {
  componentInputNames,
  componentNames,
  componentType,
  createComponent,
} from "./component";
import type { Component, OutputDestination } from "./component";
import { initPlayer, closePlayer } from "./player";
import type { Player } from "./player";
import { initialSketch, validateSketch } from "./sketch";

const drawerWidth = 200;

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
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
  },
  archerContainer: {
    position: "relative",
    height: 2160,
    width: 3840,
  },
  container: {
    display: "flex",
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
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
  const [player, setPlayer] = useState<Player>();

  const [originalSketch, setOriginalSketch] = useState(initialSketch);
  const [currentSketch, setCurrentSketch] = useState(originalSketch);

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

  const addComponentToCurrentSketch = useCallback(
    ({ component }: { component: Component }) =>
      setCurrentSketch((prevSketch) => {
        return {
          ...prevSketch,
          components: [...prevSketch.components, component],
        };
      }),
    []
  );

  const handleDistributorButtonClick = useCallback(
    () =>
      addComponentToCurrentSketch({
        component: createComponent({ type: componentType.distributor }),
      }),
    [addComponentToCurrentSketch]
  );

  const handleComponentDrag = useCallback(() => {
    if (!archerContainerElement.current) {
      throw new Error();
    }

    archerContainerElement.current.refreshScreen();
  }, []);

  const handlePlayButtonClick = useCallback(
    () => setPlayer(initPlayer({ sketch: currentSketch })),
    [currentSketch]
  );

  const handleStopButtonClick = useCallback(async () => {
    if (!player) {
      return;
    }

    await closePlayer({ player });
    setPlayer(undefined);
  }, [player]);

  const handleLoadInputChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
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

        const loadedData: unknown = JSON.parse(result);

        if (!validateSketch(loadedData)) {
          // Because validateSketch() may mistaked.
          Sentry.captureMessage("Sketch validation failed.");

          dispatchAlertData({
            isOpen: true,
            severity: "error",
            title: "Failed to load",
            description: "This sketch file is invalid.",
          });

          return;
        }

        setCurrentSketch(loadedData);
        setOriginalSketch(loadedData);
      });

      fileReader.readAsText(files[0]);
    },
    []
  );

  const handleSaveButtonClick = useCallback(async () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(currentSketch)], { type: "application/json" })
    );

    try {
      const anchorElement = document.createElement("a");

      anchorElement.download = `sketch.json`;
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
      setCurrentSketch((prevSketch) => ({
        ...prevSketch,
        components: prevSketch.components.map((component) => ({
          ...component,
          outputDestinations: component.outputDestinations.filter(
            (outputDestination) =>
              targets.every(
                (target) =>
                  outputDestination.componentID !== target.componentID ||
                  outputDestination.inputIndex !== target.inputIndex
              )
          ),
        })),
      })),
    []
  );

  const handleRemoveComponentRequest: NonNullable<
    ComponentContainerProps["onRemoveComponentRequest"]
  > = useCallback(
    (event) => {
      const inputLength =
        componentInputNames[event.component.implementation].length;

      removeConnections(
        [...Array(inputLength).keys()].map((index) => ({
          componentID: event.component.id,
          inputIndex: index,
        }))
      );

      setCurrentSketch((prevSketch) => ({
        ...prevSketch,
        components: prevSketch.components.filter(
          (component) => component.id !== event.component.id
        ),
      }));
    },
    [removeConnections]
  );

  const handleAlertClose = useCallback(
    () =>
      dispatchAlertData((prevAlert) => ({
        ...prevAlert,
        isOpen: false,
      })),
    []
  );

  const componentListItemElements = useMemo(
    () =>
      Object.values(componentType).map((type) => {
        const handleClick = () =>
          addComponentToCurrentSketch({ component: createComponent({ type }) });

        return (
          <ListItem key={type} button onClick={handleClick}>
            <ListItemText primary={componentNames[type]} />
          </ListItem>
        );
      }),
    [addComponentToCurrentSketch]
  );

  const componentContainerElements = useMemo(() => {
    const getDispatchComponent = <T extends Component>({
      component,
    }: {
      component: T;
    }) => {
      const dispatchComponent: Dispatch<SetStateAction<T>> = (action) =>
        setCurrentSketch((prevSketch) => ({
          ...prevSketch,
          components: prevSketch.components.map((prevComponent) => {
            const isComponentTarget = (
              prevComponent: Component
            ): prevComponent is T => prevComponent.id === component.id;

            if (!isComponentTarget(prevComponent)) {
              return prevComponent;
            }

            return typeof action === "function"
              ? action(prevComponent)
              : action;
          }),
        }));

      return dispatchComponent;
    };

    return currentSketch.components.map((component, index) => (
      <ComponentContainer
        key={component.id}
        sketch={currentSketch}
        componentIndex={index}
        dispatchAlertData={dispatchAlertData}
        getDispatchComponent={getDispatchComponent}
        onDistributorButtonClick={handleDistributorButtonClick}
        onDrag={handleComponentDrag}
        onRemoveComponentRequest={handleRemoveComponentRequest}
        onRemoveConnectionsRequest={removeConnections}
      >
        <ComponentActions
          component={component}
          getDispatchComponent={getDispatchComponent}
          player={player}
        />
      </ComponentContainer>
    ));
  }, [
    handleComponentDrag,
    handleDistributorButtonClick,
    handleRemoveComponentRequest,
    player,
    removeConnections,
    currentSketch,
  ]);

  return (
    <div className={classes.container}>
      <AppBar className={classes.appBar} color="inherit" position="fixed">
        <Toolbar>
          <Grid container spacing={2} alignItems="baseline">
            <Grid item>
              <Typography variant="h6">👀 troopa</Typography>
            </Grid>

            <Grid item>
              <Typography variant="subtitle1">web toy synthesizer</Typography>
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

      <Drawer
        variant="permanent"
        className={classes.drawer}
        classes={{
          paper: classes.drawerPaper,
        }}
        anchor="left"
      >
        <div className={classes.toolbar} />

        <Divider />

        <List>{componentListItemElements}</List>
      </Drawer>

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
