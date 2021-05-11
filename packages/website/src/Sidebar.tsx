import {
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
  makeStyles,
} from "@material-ui/core";
import { memo, useMemo } from "react";
import type {Dispatch, FunctionComponent,SetStateAction} from "react";
import {
  componentNames,
  componentType,
  createComponent,
} from "./component";
import type {
  Sketch,
} from "./sketch";

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

const Sidebar: FunctionComponent<{
  dispatchSketch: Dispatch<SetStateAction<Sketch>>
}> = memo(({dispatchSketch}) => {
  const classes = useStyles();

  const componentListItemElements = useMemo(
    () =>
      Object.values(componentType).map((type) => {
        const handleClick = () => {
          const newComponentEntry = createComponent({ type });

          dispatchSketch((prevSketch) => 
            ({
              ...prevSketch,
              component: {
                ...prevSketch.component,
                [newComponentEntry.id]: newComponentEntry.component,
              },
            }));
        }

        return (
          <ListItem key={type} button onClick={handleClick}>
            <ListItemText primary={componentNames[type]} />
          </ListItem>
        );
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
    <div className={classes.toolbar} />

    <Divider />

    <List>{componentListItemElements}</List>
  </Drawer>
);
});

export { Sidebar, sidebarWidth };
