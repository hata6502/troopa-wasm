import { ListItem, ListItemProps, ListItemText } from "@material-ui/core";
import {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  memo,
  useCallback,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { ComponentV2, componentName, componentType } from "../component";
import { Destination } from "../destination";
import { filePickerOptions } from "../filePickerOptions";
import { Sketch, SketchV2, upgradeSketch } from "../sketch";

const replaceComponentIDInDestination = ({
  destination,
  newComponentIDMap,
}: {
  destination: Destination;
  newComponentIDMap: Map<string, string>;
}): Destination => {
  switch (destination.type) {
    case "component": {
      const newComponentID = newComponentIDMap.get(destination.id);

      if (!newComponentID) {
        throw new Error();
      }

      return {
        ...destination,
        id: newComponentID,
      };
    }

    case "sketchOutput": {
      return destination;
    }

    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = destination;

      throw new Error();
    }
  }
};

const replaceComponentIDsInComponent = ({
  component,
  newComponentIDMap,
}: {
  component: ComponentV2;
  newComponentIDMap: Map<string, string>;
}): ComponentV2 => {
  const newOutputDestinations = component.outputDestinations.map(
    (outputDestination) =>
      replaceComponentIDInDestination({
        destination: outputDestination,
        newComponentIDMap,
      })
  );

  switch (component.type) {
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
    case componentType.input:
    case componentType.keyboardFrequency:
    case componentType.keyboardSwitch:
    case componentType.speaker:
    case componentType.meter: {
      return {
        ...component,
        outputDestinations: newOutputDestinations,
      };
    }

    case componentType.sketch: {
      return {
        ...component,
        outputDestinations: newOutputDestinations,
        extendedData: {
          ...component.extendedData,
          sketch: regenerateComponentIDsInSketch({
            sketch: component.extendedData.sketch,
          }),
        },
      };
    }

    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = component;

      throw new Error();
    }
  }
};

const regenerateComponentIDsInSketch = ({
  sketch,
}: {
  sketch: SketchV2;
}): SketchV2 => {
  const newComponentIDMap = new Map(
    sketch.componentEntries.map(([id]) => [id, uuidv4()])
  );

  return {
    ...sketch,
    componentEntries: sketch.componentEntries.map(([id, component]) => {
      const newComponentID = newComponentIDMap.get(id);

      if (!newComponentID) {
        throw new Error();
      }

      return [
        newComponentID,
        replaceComponentIDsInComponent({
          component,
          newComponentIDMap,
        }),
      ];
    }),
    inputs: sketch.inputs.map((input) => ({
      ...input,
      destination:
        input.destination &&
        replaceComponentIDInDestination({
          destination: input.destination,
          newComponentIDMap,
        }),
    })),
  };
};

interface SketchComponentListItemProps
  extends Omit<ListItemProps<"div">, "button"> {
  dispatchIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  dispatchSketch: Dispatch<SetStateAction<SketchV2>>;
}

const SketchComponentListItem: FunctionComponent<SketchComponentListItemProps> =
  memo(
    ({ dispatchIsSidebarOpen, dispatchSketch, onClick, ...listItemProps }) => {
      const handleClick = useCallback<
        NonNullable<ListItemProps<"div">["onClick"]>
      >(
        async (event) => {
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

            const loadedSketch = JSON.parse(result) as Sketch;
            const upgradedSketch = upgradeSketch({ sketch: loadedSketch });

            const regeneratedSketch = regenerateComponentIDsInSketch({
              sketch: upgradedSketch,
            });

            dispatchSketch((prevSketch) => ({
              ...prevSketch,
              componentEntries: [
                ...prevSketch.componentEntries,
                [
                  uuidv4(),
                  {
                    name: file.name,
                    type: componentType.sketch,
                    outputDestinations: [],
                    position: { x: window.scrollX, y: window.scrollY },
                    extendedData: { sketch: regeneratedSketch },
                  },
                ],
              ],
            }));

            dispatchIsSidebarOpen(false);
          });

          fileReader.readAsText(file);
          onClick?.(event);
        },
        [dispatchIsSidebarOpen, dispatchSketch, onClick]
      );

      return (
        <ListItem {...listItemProps} button onClick={handleClick}>
          <ListItemText primary={componentName[componentType.sketch]} />
        </ListItem>
      );
    }
  );

export { SketchComponentListItem };
