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
import type { ComponentType } from "../component";
import type { Sketch } from "../sketch";
import { PrimitiveComponentListItem } from "./PrimitiveComponentListItem";
import { SketchComponentListItem } from "./SketchComponentListItem";

const sidebarWidth = 200;

const coreComponentTypes = [
  componentType.amplifier,
  componentType.buffer,
  componentType.differentiator,
  componentType.distributor,
  componentType.divider,
  componentType.integrator,
  componentType.lowerSaturator,
  componentType.mixer,
  componentType.noise,
  componentType.not,
  componentType.saw,
  componentType.sine,
  componentType.square,
  componentType.subtractor,
  componentType.triangle,
  componentType.upperSaturator,
];

const interfaceComponentTypes = [
  componentType.input,
  componentType.keyboardFrequency,
  componentType.keyboardSwitch,
  componentType.speaker,
  componentType.meter,
];

const sketchComponentTypes = [componentType.sketch];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const listedComponentTypeExhaustiveCheck: (
  | typeof coreComponentTypes
  | typeof interfaceComponentTypes
  | typeof sketchComponentTypes
)[number] = componentType.amplifier as Exclude<
  ComponentType,
  typeof componentType.and | typeof componentType.or
>;

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

      <List>
        <List subheader={<ListSubheader>Core components</ListSubheader>}>
          {coreComponentTypes.map((coreComponentType) => (
            <PrimitiveComponentListItem
              key={coreComponentType}
              dispatchIsSidebarOpen={dispatchIsSidebarOpen}
              dispatchSketch={dispatchSketch}
              type={coreComponentType}
            />
          ))}
        </List>

        <List subheader={<ListSubheader>Interface components</ListSubheader>}>
          {interfaceComponentTypes.map((interfaceComponentType) => (
            <PrimitiveComponentListItem
              key={interfaceComponentType}
              dispatchIsSidebarOpen={dispatchIsSidebarOpen}
              dispatchSketch={dispatchSketch}
              type={interfaceComponentType}
            />
          ))}
        </List>

        <List subheader={<ListSubheader>Sketch components</ListSubheader>}>
          {sketchComponentTypes.map((sketchComponentType) => (
            <SketchComponentListItem
              key={sketchComponentType}
              dispatchIsSidebarOpen={dispatchIsSidebarOpen}
              dispatchSketch={dispatchSketch}
            />
          ))}
        </List>
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
