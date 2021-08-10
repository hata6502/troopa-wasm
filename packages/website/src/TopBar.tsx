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
import { memo, useCallback } from "react";
import type {
  ChangeEventHandler,
  Dispatch,
  FunctionComponent,
  SetStateAction,
} from "react";
import { Player } from "./Player";
import { sidebarWidth } from "./Sidebar";
import { saveSketch } from "./sketch";
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
  dispatchErrorComponentIDs: Dispatch<SetStateAction<string[]>>;
  dispatchIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  dispatchPlayer: Dispatch<SetStateAction<Player | undefined>>;
  dispatchSketch: Dispatch<SetStateAction<Sketch>>;
  player?: Player;
  sketch: Sketch;
  onDrag?: () => void;
}> = memo(
  ({
    dispatchErrorComponentIDs,
    dispatchIsSidebarOpen,
    dispatchPlayer,
    dispatchSketch,
    player,
    sketch,
    onDrag,
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

      dispatchPlayer(
        new Player({
          dispatchSketch: dispatchSketch,
          sketch,
        })
      );
    }, [dispatchSketch, dispatchErrorComponentIDs, dispatchPlayer, sketch]);

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

            dispatchSketch(loadedSketch);
            onDrag?.();
          });

          fileReader.readAsText(files[0]);
        },
        [dispatchSketch, onDrag]
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

          <Grid container spacing={2}>
            <Grid item>
              <TextField
                variant="outlined"
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
