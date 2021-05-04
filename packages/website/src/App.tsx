import {
  AppBar,
  Button,
  Divider,
  Drawer,
  Grid,
  List,
  ListItem,
  ListItemText,
  Toolbar,
  Typography,
  makeStyles,
  useTheme,
} from "@material-ui/core";
import {
  memo,
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { Dispatch, FunctionComponent, SetStateAction } from "react";
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
import { initialSketch } from "./sketch";
import type { Sketch } from "./sketch";

const drawerWidth = 200;

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
    height: 1080,
    width: 1920,
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
  const [sketch, dispatchSketch] = useReducer(
    (prevSketch: Sketch, action: SetStateAction<Sketch>): Sketch => {
      const sketch = typeof action === "function" ? action(prevSketch) : action;

      return {
        ...sketch,
        components: sketch.components.map((component) => {
          const inputLength =
            componentInputNames[component.implementation].length;

          return {
            ...component,
            inputs: [...Array(inputLength).keys()].map((index) => ({
              connected: sketch.components.some((otherComponent) =>
                otherComponent.outputDestinations.some(
                  (outputDestination) =>
                    outputDestination.componentID === component.id &&
                    outputDestination.inputIndex === index
                )
              ),
            })),
          };
        }),
      };
    },
    initialSketch
  );

  const [player, setPlayer] = useState<Player>();

  const archerContainerElement = useRef<ArcherContainer>(null);

  const classes = useStyles();
  const theme = useTheme();

  const handleComponentDrag = useCallback(() => {
    if (!archerContainerElement.current) {
      throw new Error();
    }

    archerContainerElement.current.refreshScreen();
  }, []);

  const handlePlayButtonClick = useCallback(
    () => setPlayer(initPlayer({ sketch })),
    [sketch]
  );

  const handleStopButtonClick = useCallback(async () => {
    if (!player) {
      return;
    }

    await closePlayer({ player });
    setPlayer(undefined);
  }, [player]);

  const removeConnections = useCallback(
    (targets: OutputDestination[]) =>
      dispatchSketch((prevSketch) => ({
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
      removeConnections(
        [...Array(event.component.inputs.length).keys()].map((index) => ({
          componentID: event.component.id,
          inputIndex: index,
        }))
      );

      dispatchSketch((prevSketch) => ({
        ...prevSketch,
        components: prevSketch.components.filter(
          (component) => component.id !== event.component.id
        ),
      }));
    },
    [removeConnections]
  );

  const componentListItemElements = useMemo(
    () =>
      Object.values(componentType).map((type) => {
        const handleClick = () =>
          dispatchSketch((prevSketch) => {
            return {
              ...prevSketch,
              components: [...prevSketch.components, createComponent({ type })],
            };
          });

        return (
          <ListItem key={type} button onClick={handleClick}>
            <ListItemText primary={componentNames[type]} />
          </ListItem>
        );
      }),
    []
  );

  const componentContainerElements = useMemo(() => {
    const getDispatchComponent = <T extends Component>({
      component,
    }: {
      component: T;
    }) => {
      const dispatchComponent: Dispatch<SetStateAction<T>> = (action) =>
        dispatchSketch((prevSketch) => ({
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

    return sketch.components.map((component) => (
      <ComponentContainer
        key={component.id}
        component={component}
        getDispatchComponent={getDispatchComponent}
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
    handleRemoveComponentRequest,
    player,
    removeConnections,
    sketch.components,
  ]);

  return (
    <div className={classes.container}>
      <AppBar className={classes.appBar} color="inherit" position="fixed">
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
                variant="contained"
                color="primary"
                disabled={Boolean(player)}
                onClick={handlePlayButtonClick}
              >
                Play
              </Button>
            </Grid>

            <Grid item>
              <Button
                variant="contained"
                disabled={!player}
                onClick={handleStopButtonClick}
              >
                Stop
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
    </div>
  );
});

export { App };
