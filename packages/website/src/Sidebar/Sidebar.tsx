import {
  Divider,
  Drawer,
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
import { memo } from "react";
import type { Dispatch, FunctionComponent, SetStateAction } from "react";
import { componentType } from "../component";
import type { Sketch } from "../sketch";
import { PrimitiveComponentListItem } from "./PrimitiveComponentListItem";
import { SketchComponentListItem } from "./SketchComponentListItem";

const sidebarWidth = 200;

const useStyles = makeStyles({
  drawer: {
    width: sidebarWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: sidebarWidth,
  },
});

const Sidebar: FunctionComponent<{
  dispatchSketch: Dispatch<SetStateAction<Sketch>>;
}> = memo(({ dispatchSketch }) => {
  const classes = useStyles();

  return (
    <Drawer
      variant="permanent"
      className={classes.drawer}
      classes={{
        paper: classes.drawerPaper,
      }}
      anchor="left"
    >
      <Link
        color="inherit"
        href="https://github.com/hata6502/troopa-wasm"
        rel="noreferrer"
        target="_blank"
        underline="none"
      >
        <ListItem button component="div">
          <ListItemText
            primary={<Typography variant="h6">👀 troopa</Typography>}
            secondary="web toy synthesizer"
          />
        </ListItem>
      </Link>

      <Divider />

      <List>
        <Link
          color="inherit"
          href="https://scrapbox.io/troopa/"
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
                  dispatchSketch={dispatchSketch}
                  type={type}
                />
              );
            }

            case componentType.sketch: {
              return (
                <SketchComponentListItem
                  key={type}
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
    </Drawer>
  );
});

export { Sidebar, sidebarWidth };
