import { ListItem, ListItemText } from "@material-ui/core";
import type { ListItemProps } from "@material-ui/core";
import { memo, useCallback } from "react";
import type { Dispatch, FunctionComponent, SetStateAction } from "react";
import { v4 as uuidv4 } from "uuid";
import { componentName, componentType } from "../component";
import type { ComponentV1, PrimitiveComponentType } from "../component";
import type { SketchV1 } from "../sketch";

const createPrimitiveComponent = ({
  type,
}: {
  type: PrimitiveComponentType;
}): ComponentV1 => {
  const componentBase = {
    name: componentName[type],
    outputDestinations: [],
    position: { x: window.scrollX, y: window.scrollY },
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

    case componentType.meter: {
      return {
        ...componentBase,
        type: type,
        extendedData: {
          value: 0,
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
    case componentType.and:
    case componentType.not:
    case componentType.or:
    case componentType.keyboardFrequency:
    case componentType.keyboardSwitch:
    case componentType.speaker: {
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

interface PrimitiveComponentListItemProps
  extends Omit<ListItemProps<"div">, "button"> {
  dispatchIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  dispatchSketch: Dispatch<SetStateAction<SketchV1>>;
  type: PrimitiveComponentType;
}

const PrimitiveComponentListItem: FunctionComponent<PrimitiveComponentListItemProps> =
  memo(
    ({
      dispatchIsSidebarOpen,
      dispatchSketch,
      type,
      onClick,
      ...listItemProps
    }) => {
      const handleClick = useCallback<
        NonNullable<ListItemProps<"div">["onClick"]>
      >(
        (event) => {
          dispatchSketch((prevSketch) => ({
            ...prevSketch,
            component: {
              ...prevSketch.component,
              [uuidv4()]: createPrimitiveComponent({ type }),
            },
          }));

          dispatchIsSidebarOpen(false);

          onClick?.(event);
        },
        [dispatchIsSidebarOpen, dispatchSketch, type, onClick]
      );

      return (
        <ListItem {...listItemProps} button onClick={handleClick}>
          <ListItemText primary={componentName[type]} />
        </ListItem>
      );
    }
  );

export { PrimitiveComponentListItem };
