import {
  AppBar,
  Button,
  Grid,
  TextField,
  Toolbar,
  makeStyles,
} from "@material-ui/core";
import equal from "fast-deep-equal";
import { memo, useCallback, useEffect, useState } from "react";
import type {
  ChangeEventHandler,
  Dispatch,
  FunctionComponent,
  SetStateAction,
} from "react";
import { Player } from "./Player";
import { sidebarWidth } from "./Sidebar";
import { initialSketch } from "./sketch";
import type { Sketch } from "./sketch";

const useStyles = makeStyles({
  appBar: {
    width: `calc(100% - ${sidebarWidth}px)`,
    marginLeft: sidebarWidth,
  },
});

const TopBar: FunctionComponent<{
  currentSketch: Sketch;
  dispatchCurrentSketch: Dispatch<SetStateAction<Sketch>>;
  dispatchErrorComponentIDs: Dispatch<SetStateAction<string[]>>;
  dispatchPlayer: Dispatch<SetStateAction<Player | undefined>>;
  player?: Player;
}> = memo(
  ({
    currentSketch,
    dispatchCurrentSketch,
    dispatchErrorComponentIDs,
    dispatchPlayer,
    player,
  }) => {
    const [originalSketch, setOriginalSketch] = useState(initialSketch);

    const classes = useStyles();

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

      return () =>
        window.removeEventListener("beforeunload", handleBeforeunload);
    }, [currentSketch, originalSketch]);

    const handleSketchNameChange: ChangeEventHandler<HTMLInputElement> =
      useCallback(
        (event) =>
          dispatchCurrentSketch((prevCurrentSketch) => ({
            ...prevCurrentSketch,
            name: event.target.value,
          })),
        [dispatchCurrentSketch]
      );

    const handlePlayButtonClick = useCallback(() => {
      dispatchErrorComponentIDs([]);

      dispatchPlayer(
        new Player({
          sketch: currentSketch,
        })
      );
    }, [currentSketch, dispatchErrorComponentIDs, dispatchPlayer]);

    const handleStopButtonClick = useCallback(() => {
      if (!player) {
        return;
      }

      dispatchPlayer(undefined);

      void player.close();
    }, [dispatchPlayer, player]);

    const handleLoadInputChange: ChangeEventHandler<HTMLInputElement> =
      useCallback(
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

            const loadedSketch = JSON.parse(result) as Sketch;

            dispatchCurrentSketch(loadedSketch);
            setOriginalSketch(loadedSketch);
          });

          fileReader.readAsText(files[0]);
        },
        [dispatchCurrentSketch]
      );

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

    return (
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
    );
  }
);

export { TopBar };
