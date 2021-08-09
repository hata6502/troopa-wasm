import {
  AppBar,
  Grid,
  IconButton,
  TextField,
  Toolbar,
  Tooltip,
  makeStyles,
} from "@material-ui/core";
import { FolderOpen, Menu, PlayArrow, Save, Stop } from "@material-ui/icons";
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
import { initialSketch, saveSketch } from "./sketch";
import type { Sketch } from "./sketch";

const useStyles = makeStyles(({ breakpoints, spacing }) => ({
  appBar: {
    [breakpoints.up("md")]: {
      width: `calc(100% - ${sidebarWidth}px)`,
      marginLeft: sidebarWidth,
    },
  },
  menuButton: {
    marginRight: spacing(2),
    [breakpoints.up("md")]: {
      display: "none",
    },
  },
}));

const TopBar: FunctionComponent<{
  currentSketch: Sketch;
  dispatchCurrentSketch: Dispatch<SetStateAction<Sketch>>;
  dispatchErrorComponentIDs: Dispatch<SetStateAction<string[]>>;
  dispatchIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  dispatchPlayer: Dispatch<SetStateAction<Player | undefined>>;
  player?: Player;
  onDrag?: () => void;
}> = memo(
  ({
    currentSketch,
    dispatchCurrentSketch,
    dispatchErrorComponentIDs,
    dispatchIsSidebarOpen,
    dispatchPlayer,
    player,
    onDrag,
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

    const handleMenuButtonClick = useCallback(
      () => dispatchIsSidebarOpen(true),
      [dispatchIsSidebarOpen]
    );

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
          dispatchSketch: dispatchCurrentSketch,
          sketch: currentSketch,
        })
      );
    }, [
      currentSketch,
      dispatchCurrentSketch,
      dispatchErrorComponentIDs,
      dispatchPlayer,
    ]);

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

            event.target.value = "";

            dispatchCurrentSketch(loadedSketch);
            setOriginalSketch(loadedSketch);

            onDrag?.();
          });

          fileReader.readAsText(files[0]);
        },
        [dispatchCurrentSketch, onDrag]
      );

    const handleSaveButtonClick = useCallback(() => {
      saveSketch({ sketch: currentSketch });
      setOriginalSketch(currentSketch);
    }, [currentSketch]);

    return (
      <AppBar className={classes.appBar} color="inherit" position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleMenuButtonClick}
            className={classes.menuButton}
          >
            <Menu />
          </IconButton>

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
              <Tooltip title="Play">
                <span>
                  <IconButton
                    color="primary"
                    disabled={Boolean(player)}
                    onClick={handlePlayButtonClick}
                  >
                    <PlayArrow />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>

            <Grid item>
              <Tooltip title="Stop">
                <span>
                  <IconButton
                    disabled={!player}
                    onClick={handleStopButtonClick}
                  >
                    <Stop />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>

            <Grid item>
              <Tooltip title="Open">
                <span>
                  <IconButton component="label">
                    <FolderOpen />

                    <input
                      type="file"
                      accept="application/json"
                      hidden
                      onChange={handleLoadInputChange}
                    />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>

            <Grid item>
              <Tooltip title="Save">
                <span>
                  <IconButton onClick={handleSaveButtonClick}>
                    <Save />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    );
  }
);

export { TopBar };
