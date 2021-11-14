import {
  AppBar,
  Grid,
  IconButton,
  Toolbar,
  Tooltip,
  makeStyles,
} from "@material-ui/core";
import {
  FolderOpen,
  Menu,
  PlayArrow,
  Redo,
  Stop,
  Undo,
} from "@material-ui/icons";
import { memo, useCallback } from "react";
import type { Dispatch, FunctionComponent, SetStateAction } from "react";
import type { SketchHistory } from "./App";
import { Player } from "./Player";
import { sidebarWidth } from "./Sidebar";
import { filePickerOptions } from "./filePickerOptions";
import type { SketchV1 } from "./sketch";

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
}));

const TopBar: FunctionComponent<{
  dispatchErrorComponentIDs: Dispatch<SetStateAction<string[]>>;
  dispatchFileHandle: Dispatch<
    SetStateAction<FileSystemFileHandle | undefined>
  >;
  dispatchIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  dispatchPlayer: Dispatch<SetStateAction<Player | undefined>>;
  dispatchSketch: Dispatch<SetStateAction<SketchV1>>;
  dispatchSketchHistory: Dispatch<SetStateAction<SketchHistory>>;
  player?: Player;
  sketch: SketchV1;
  sketchHistory: SketchHistory;
}> = memo(
  ({
    dispatchErrorComponentIDs,
    dispatchFileHandle,
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

    const handleLoadButtonClick = useCallback(async () => {
      let fileHandle;

      try {
        [fileHandle] = await showOpenFilePicker(filePickerOptions);
      } catch (exception) {
        if (exception instanceof Error && exception.name === "AbortError") {
          return;
        }

        throw exception;
      }

      const file = await fileHandle.getFile();
      const fileReader = new FileReader();

      fileReader.addEventListener("load", () => {
        const result = fileReader.result;

        if (typeof result !== "string") {
          throw new Error();
        }

        const loadedSketch = JSON.parse(result) as SketchV1;

        dispatchSketchHistory({
          index: 0,
          sketches: [loadedSketch],
        });

        dispatchSketch(loadedSketch);
      });

      fileReader.readAsText(file);
      dispatchFileHandle(fileHandle);
    }, [dispatchFileHandle, dispatchSketch, dispatchSketchHistory]);

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
                    disabled={Boolean(player) || sketchHistory.index < 1}
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
                      Boolean(player) ||
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
              <Tooltip title="Open">
                <span>
                  <IconButton
                    disabled={Boolean(player)}
                    onClick={handleLoadButtonClick}
                  >
                    <FolderOpen />
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
