interface ComponentDestination {
  type: "component";
  id: string;
  inputIndex: number;
}

type Destination =
  | ComponentDestination
  | {
      type: "sketchOutput";
    };

const getDestinationsByPosition = ({
  x,
  y,
}: {
  x: number;
  y: number;
}): Destination[] => {
  const elements = document.elementsFromPoint(x, y);

  return elements.flatMap((element): Destination[] => {
    if (!(element instanceof HTMLElement)) {
      return [];
    }

    const componentID = element.dataset["componentId"];
    const inputIndexString = element.dataset["inputIndex"];

    if (componentID && inputIndexString) {
      return [
        {
          type: "component",
          id: componentID,
          inputIndex: Number(inputIndexString),
        },
      ];
    }

    if (element.dataset["sketchOutput"]) {
      return [
        {
          type: "sketchOutput",
        },
      ];
    }

    return [];
  });
};

const isSameDestination = ({
  a,
  b,
}: {
  a: Destination;
  b: Destination;
}): boolean => {
  switch (a.type) {
    case "component": {
      if (b.type !== a.type) {
        return false;
      }

      let key: keyof typeof a;

      for (key in a) {
        switch (key) {
          case "type":
          case "id":
          case "inputIndex": {
            if (a[key] !== b[key]) {
              return false;
            }

            break;
          }

          default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const exhaustiveCheck: never = key;

            throw new Error("Unhandled key");
          }
        }
      }

      return true;
    }

    case "sketchOutput": {
      if (b.type !== a.type) {
        return false;
      }

      let key: keyof typeof a;

      for (key in a) {
        switch (key) {
          case "type": {
            if (a[key] !== b[key]) {
              return false;
            }

            break;
          }

          default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const exhaustiveCheck: never = key;

            throw new Error("Unhandled key");
          }
        }
      }

      return true;
    }

    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheckA: never = a;

      throw new Error("Unhandled destination type");
    }
  }
};

const serializeDestination = ({
  destination,
}: {
  destination: Destination;
}): string => {
  switch (destination.type) {
    case "component": {
      return `component-${destination.id}-input-${destination.inputIndex}`;
    }

    case "sketchOutput": {
      return "sketch-output";
    }

    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = destination;

      throw new Error();
    }
  }
};

export { getDestinationsByPosition, isSameDestination, serializeDestination };
export type { ComponentDestination, Destination };
