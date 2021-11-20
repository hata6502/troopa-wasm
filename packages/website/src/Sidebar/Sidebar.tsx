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
import { Favorite, Help } from "@material-ui/icons";
import {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  memo,
  useCallback,
} from "react";
import {
  ComponentType,
  componentType,
  coreComponentType,
  interfaceComponentType,
  sketchComponentType,
} from "../component";
import { SketchV2 } from "../sketch";
import { PrimitiveComponentListItem } from "./PrimitiveComponentListItem";
import { SketchComponentListItem } from "./SketchComponentListItem";

const sidebarWidth = 200;

const coreComponentTypes = Object.values(coreComponentType);
const interfaceComponentTypes = Object.values(interfaceComponentType);
const sketchComponentTypes = Object.values(sketchComponentType);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const listedComponentTypeExhaustiveCheck: (
  | typeof coreComponentTypes
  | typeof interfaceComponentTypes
  | typeof sketchComponentTypes
)[number] = componentType.amplifier as ComponentType;

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
  dispatchSketch: Dispatch<SetStateAction<SketchV2>>;
  isPlaying?: boolean;
  isSidebarOpen: boolean;
}> = memo(
  ({ dispatchIsSidebarOpen, dispatchSketch, isPlaying, isSidebarOpen }) => {
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
            href="https://helpfeel.com/hata6502/?kinds=troopa"
            rel="noreferrer"
            target="_blank"
            underline="none"
          >
            <ListItem button>
              <ListItemIcon>
                <Help />
              </ListItemIcon>

              <ListItemText primary="Help" />
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
                disabled={isPlaying}
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
                disabled={isPlaying}
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
                disabled={isPlaying}
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
  }
);

export { Sidebar, sidebarWidth };
