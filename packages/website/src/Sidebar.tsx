import {
  Divider,
  Drawer,
  Link,
  List,
  ListItem,
  ListItemText,
  Typography,
  makeStyles,
} from "@material-ui/core";
import { memo, useMemo } from "react";
import type {
  ChangeEventHandler,
  Dispatch,
  FunctionComponent,
  SetStateAction,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { componentName, componentType } from "./component";
import type { Component, PrimitiveComponentType } from "./component";
import type { Sketch } from "./sketch";

const sidebarWidth = 200;

const useStyles = makeStyles(({ mixins }) => ({
  drawer: {
    width: sidebarWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: sidebarWidth,
  },
  toolbar: mixins.toolbar,
}));

const createPrimitiveComponent = ({
  type,
}: {
  type: PrimitiveComponentType;
}): Component => {
  const componentBase = {
    name: componentName[type],
    outputDestinations: [],
    position: { x: 0, y: 0 },
  };

  switch (type) {
    case componentType.input: {
      return {
        ...componentBase,
        type: type,
        extendedData: {
          value: "0",
        },
      };
    }

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
    case componentType.keyboardFrequency:
    case componentType.keyboardSwitch:
    case componentType.speaker:
    case componentType.meter:
    case componentType.scope: {
      return {
        ...componentBase,
        type: type,
        extendedData: {},
      };
    }

    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = type;

      throw new Error();
    }
  }
};

const Sidebar: FunctionComponent<{
  dispatchSketch: Dispatch<SetStateAction<Sketch>>;
}> = memo(({ dispatchSketch }) => {
  const classes = useStyles();

  const componentListItemElements = useMemo(
    () =>
      Object.values(componentType).map((type) => {
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
          case componentType.meter:
          case componentType.scope: {
            const handleClick = () =>
              dispatchSketch((prevSketch) => ({
                ...prevSketch,
                component: {
                  ...prevSketch.component,
                  [uuidv4()]: createPrimitiveComponent({ type }),
                },
              }));

            return (
              <ListItem key={type} button onClick={handleClick}>
                <ListItemText primary={componentName[type]} />
              </ListItem>
            );
          }

          // TODO: implementation
          case componentType.sketch: {
            const handleInputChange: ChangeEventHandler<HTMLInputElement> = (
              event
            ) => {
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

                const sketch = JSON.parse(result) as Sketch;

                dispatchSketch((prevSketch) => ({
                  ...prevSketch,
                  component: {
                    ...prevSketch.component,
                    [uuidv4()]: {
                      name: sketch.name,
                      type: type,
                      outputDestinations: [],
                      position: { x: 0, y: 0 },
                      extendedData: { sketch },
                    },
                  },
                }));
              });

              fileReader.readAsText(files[0]);
            };

            return (
              <ListItem key={type} button component="label">
                <ListItemText primary={componentName[type]} />

                <input
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={handleInputChange}
                />
              </ListItem>
            );
          }

          default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const exhaustiveCheck: never = type;

            throw new Error();
          }
        }
      }),
    [dispatchSketch]
  );

  return (
    <Drawer
      variant="permanent"
      className={classes.drawer}
      classes={{
        paper: classes.drawerPaper,
      }}
      anchor="left"
    >
      <ListItem className={classes.toolbar} component="div">
        <Link
          color="inherit"
          href="https://github.com/hata6502/troopa-wasm"
          rel="noreferrer"
          target="_blank"
        >
          <ListItemText
            primary={<Typography variant="h6">👀 troopa</Typography>}
            secondary="web toy synthesizer"
          />
        </Link>
      </ListItem>

      <Divider />

      <List>{componentListItemElements}</List>
    </Drawer>
  );
});

export { Sidebar, sidebarWidth };
