type Destination =
  | {
      type: "component";
      id: string;
      inputIndex: number;
    }
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

export { getDestinationsByPosition, serializeDestination };
export type { Destination };
