import {
  Divider,
  Drawer,
  Hidden,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
  makeStyles,
} from "@material-ui/core";
import { Description, Favorite } from "@material-ui/icons";
import { memo, useCallback } from "react";
import type { Dispatch, FunctionComponent, SetStateAction } from "react";
import { componentType } from "../component";
import type { Sketch } from "../sketch";
import { PrimitiveComponentListItem } from "./PrimitiveComponentListItem";
import { SketchComponentListItem } from "./SketchComponentListItem";

const sidebarWidth = 200;

const useStyles = makeStyles(({ breakpoints }) => ({
  nav: {
    [breakpoints.up("md")]: {
      width: sidebarWidth,
      flexShrink: 0,
    },
  },
  paper: {
    width: sidebarWidth,
  },
}));

const Sidebar: FunctionComponent<{
  dispatchIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  dispatchSketch: Dispatch<SetStateAction<Sketch>>;
  isSidebarOpen: boolean;
}> = memo(({ dispatchIsSidebarOpen, dispatchSketch, isSidebarOpen }) => {
  const classes = useStyles();

  const content = (
    <>
      <ListItem component="div">
        <ListItemText
          primary={<Typography variant="h6">troopa 👀</Typography>}
          secondary="web toy synthesizer"
        />
      </ListItem>

      <Divider />

      <List>
        <Link
          color="inherit"
          href="https://scrapbox.io/hata6502/troopa_%F0%9F%91%80"
          rel="noreferrer"
          target="_blank"
          underline="none"
        >
          <ListItem button>
            <ListItemIcon>
              <Description />
            </ListItemIcon>

            <ListItemText primary="Documents" />
          </ListItem>
        </Link>

        <Link
          color="inherit"
          href="https://github.com/sponsors/hata6502"
          rel="noreferrer"
          target="_blank"
          underline="none"
        >
          <ListItem button>
            <ListItemIcon>
              <Favorite />
            </ListItemIcon>

            <ListItemText primary="Sponsor" />
          </ListItem>
        </Link>
      </List>

      <Divider />

      <List subheader={<ListSubheader>Components</ListSubheader>}>
        {Object.values(componentType).map((type) => {
          switch (type) {
            case componentType.amplifier:
            case componentType.buffer:
            case componentType.differentiator:
            case componentType.distributor:
            case componentType.divider:
            case componentType.integrator:
            case componentType.lowerSaturator:
            case componentType.mixer:
            case componentType.noise:
            case componentType.saw:
            case componentType.sine:
            case componentType.square:
            case componentType.subtractor:
            case componentType.triangle:
            case componentType.upperSaturator:
            case componentType.input:
            case componentType.keyboardFrequency:
            case componentType.keyboardSwitch:
            case componentType.speaker:
            case componentType.meter: {
              return (
                <PrimitiveComponentListItem
                  key={type}
                  dispatchIsSidebarOpen={dispatchIsSidebarOpen}
                  dispatchSketch={dispatchSketch}
                  type={type}
                />
              );
            }

            case componentType.sketch: {
              return (
                <SketchComponentListItem
                  key={type}
                  dispatchIsSidebarOpen={dispatchIsSidebarOpen}
                  dispatchSketch={dispatchSketch}
                />
              );
            }

            default: {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const exhaustiveCheck: never = type;

              throw new Error();
            }
          }
        })}
      </List>
    </>
  );

  const handleClose = useCallback(
    () => dispatchIsSidebarOpen(false),
    [dispatchIsSidebarOpen]
  );

  return (
    <nav className={classes.nav}>
      <Hidden mdUp>
        <Drawer
          variant="temporary"
          classes={{
            paper: classes.paper,
          }}
          container={document.body}
          open={isSidebarOpen}
          onClose={handleClose}
        >
          {content}
        </Drawer>
      </Hidden>

      <Hidden smDown>
        <Drawer
          variant="permanent"
          classes={{
            paper: classes.paper,
          }}
          open
        >
          {content}
        </Drawer>
      </Hidden>
    </nav>
  );
});

export { Sidebar, sidebarWidth };
