import {
  AppBar,
  Button,
  Grid,
  Toolbar,
  Typography,
  makeStyles,
  useTheme,
} from "@material-ui/core";
import { memo, useCallback, useRef, useState } from "react";
import type { FunctionComponent } from "react";
import { ArcherContainer } from "react-archer";
import type { ArcherContainerProps } from "react-archer";
import { Component } from "./Component";
import { componentType } from "./componentInfo";
import type { ComponentData } from "./componentInfo";
import { initPlayer, closePlayer } from "./player";
import type { Player } from "./player";

// TODO: Additional components
// TODO: drag limit

interface SketchData {
  name: string;
  components: ComponentData[];
}

const initialSketchData: SketchData = {
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
      implementation: componentType.speaker,
      outputDestinations: [],
      extendedData: {},
    },
  ],
};

const svgContainerStyle: ArcherContainerProps["svgContainerStyle"] = {
  // To display arrows in front of components.
  zIndex: 1,
};

const useStyles = makeStyles({
  archerContainer: {
    height: 1080,
    width: 1920,
  },
});

const App: FunctionComponent = memo(() => {
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
    () => setPlayer(initPlayer({ sketchData: initialSketchData })),
    []
  );

  const handleStopButtonClick = useCallback(() => {
    if (!player) {
      return;
    }

      closePlayer({ player });
    setPlayer(undefined);
  }, []);

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
                disabled={Boolean(player)}
                onClick={handlePlayButtonClick}
              >
                Play
              </Button>

              <Button disabled={!player} onClick={handleStopButtonClick}>
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
          {initialSketchData.components.map((data) => (
            <Component
              key={data.id}
              data={data}
              player={player}
              onDrag={handleComponentDrag}
            />
          ))}
        </ArcherContainer>
      </main>
    </>
  );
});

export { App };
export type { SketchData };
