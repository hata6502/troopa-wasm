import {
  AppBar,
  Grid,
  IconButton,
  TextField,
  Toolbar,
  Tooltip,
  makeStyles,
} from "@material-ui/core";
import {
  FolderOpen,
  InsertDriveFileOutlined,
  Menu,
  PlayArrow,
  Redo,
  Save,
  Stop,
  Undo,
} from "@material-ui/icons";
import { memo, useCallback } from "react";
import type {
  ChangeEventHandler,
  Dispatch,
  FunctionComponent,
  SetStateAction,
} from "react";
import type { SketchHistory } from "./App";
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
  grid: {
    overflow: "auto",
  },
  menuButton: {
    marginRight: spacing(2),
    [breakpoints.up("md")]: {
      display: "none",
    },
  },
  sketchName: {
    minWidth: 240,
  },
}));

const TopBar: FunctionComponent<{
  dispatchErrorComponentIDs: Dispatch<SetStateAction<string[]>>;
  dispatchIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  dispatchPlayer: Dispatch<SetStateAction<Player | undefined>>;
  dispatchSketch: Dispatch<SetStateAction<Sketch>>;
  dispatchSketchHistory: Dispatch<SetStateAction<SketchHistory>>;
  player?: Player;
  sketch: Sketch;
  sketchHistory: SketchHistory;
}> = memo(
  ({
    dispatchErrorComponentIDs,
    dispatchIsSidebarOpen,
    dispatchPlayer,
    dispatchSketch,
    dispatchSketchHistory,
    player,
    sketch,
    sketchHistory,
  }) => {
    const classes = useStyles();

    const handleMenuButtonClick = useCallback(
      () => dispatchIsSidebarOpen(true),
      [dispatchIsSidebarOpen]
    );

    const handleSketchNameChange: ChangeEventHandler<HTMLInputElement> =
      useCallback(
        (event) =>
          dispatchSketch((prevSketch) => ({
            ...prevSketch,
            name: event.target.value,
          })),
        [dispatchSketch]
      );

    const handlePlayButtonClick = useCallback(() => {
      dispatchErrorComponentIDs([]);
      dispatchPlayer(new Player({ dispatchSketch, sketch }));
    }, [dispatchSketch, dispatchErrorComponentIDs, dispatchPlayer, sketch]);

    const handleStopButtonClick = useCallback(() => {
      if (!player) {
        return;
      }

      dispatchPlayer(undefined);

      void player.close();
    }, [dispatchPlayer, player]);

    const handleUndoButtonClick = useCallback(() => {
      dispatchSketch(sketchHistory.sketches[sketchHistory.index - 1]);

      dispatchSketchHistory((prevSketchHistory) => ({
        ...prevSketchHistory,
        index: prevSketchHistory.index - 1,
      }));
    }, [
      dispatchSketch,
      dispatchSketchHistory,
      sketchHistory.index,
      sketchHistory.sketches,
    ]);

    const handleRedoButtonClick = useCallback(() => {
      dispatchSketch(sketchHistory.sketches[sketchHistory.index + 1]);

      dispatchSketchHistory((prevSketchHistory) => ({
        ...prevSketchHistory,
        index: prevSketchHistory.index + 1,
      }));
    }, [
      dispatchSketch,
      dispatchSketchHistory,
      sketchHistory.index,
      sketchHistory.sketches,
    ]);

    const handleNewButtonClick = useCallback(
      () => dispatchSketch(initialSketch),
      [dispatchSketch]
    );

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

            dispatchSketch(loadedSketch);
          });

          fileReader.readAsText(files[0]);
        },
        [dispatchSketch]
      );

    const handleSaveButtonClick = useCallback(
      () => saveSketch({ sketch }),
      [sketch]
    );

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

          <Grid container className={classes.grid} spacing={1} wrap="nowrap">
            <Grid item>
              <TextField
                variant="outlined"
                className={classes.sketchName}
                label="sketch name"
                size="small"
                value={sketch.name}
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
              <Tooltip title="Undo">
                <span>
                  <IconButton
                    disabled={sketchHistory.index < 1}
                    onClick={handleUndoButtonClick}
                  >
                    <Undo />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>

            <Grid item>
              <Tooltip title="Redo">
                <span>
                  <IconButton
                    disabled={
                      sketchHistory.index >= sketchHistory.sketches.length - 1
                    }
                    onClick={handleRedoButtonClick}
                  >
                    <Redo />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>

            <Grid item>
              <Tooltip title="New">
                <span>
                  <IconButton onClick={handleNewButtonClick}>
                    <InsertDriveFileOutlined />
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
