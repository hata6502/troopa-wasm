interface Destination {
  componentID: string;
  inputIndex: number;
}

const getDestinationsByPosition = ({
  x,
  y,
}: {
  x: number;
  y: number;
}): Destination[] => {
  const elements = document.elementsFromPoint(x, y);

  return elements.flatMap((element) => {
    if (!(element instanceof HTMLElement)) {
      return [];
    }

    const componentID = element.dataset["componentId"];
    const inputIndexString = element.dataset["inputIndex"];

    if (componentID === undefined || inputIndexString === undefined) {
      return [];
    }

    return [
      {
        componentID,
        inputIndex: Number(inputIndexString),
      },
    ];
  });
};

export { getDestinationsByPosition };
export type { Destination };
