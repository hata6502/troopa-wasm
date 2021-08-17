import type { Component } from "./component";
import type { Destination } from "./destination";

const sketchComponentMaxLength = 8192;

interface SketchInput {
  name: string;
  destination?: Destination;
}

interface Sketch {
  name: string;
  component: Record<string, Component>;
  inputs: SketchInput[];
  outputComponentID?: string;
}

const initialSketch: Sketch = {
  name: "example",
  component: {
    "df5bb750-e9fe-fbf3-26e0-bbd601fe98c9": {
      name: "sine",
      type: 10,
      outputDestinations: [
        {
          type: "component",
          id: "d417eb39-d2d7-4023-a58f-f058658b7c40",
          inputIndex: 1,
        },
      ],
      position: { x: 285, y: 36 },
      extendedData: {},
    },
    "d417eb39-d2d7-4023-a58f-f058658b7c40": {
      name: "speaker",
      outputDestinations: [],
      position: { x: 545, y: 25 },
      type: -4,
      extendedData: {},
    },
    "e02d7ee9-dcf2-40ab-ba7f-8beac91e411b": {
      name: "input",
      outputDestinations: [
        {
          type: "component",
          id: "df5bb750-e9fe-fbf3-26e0-bbd601fe98c9",
          inputIndex: 1,
        },
      ],
      position: { x: 40, y: 41 },
      type: -1,
      extendedData: { value: "440" },
    },
  },
  inputs: [...Array(8).keys()].map(() => ({ name: "" })),
};

const saveSketch = ({ sketch }: { sketch: Sketch }): void => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(sketch)], { type: "application/json" })
  );

  try {
    const anchorElement = document.createElement("a");

    anchorElement.download = `${sketch.name}.json`;
    anchorElement.href = url;
    document.body.append(anchorElement);

    try {
      anchorElement.click();
    } finally {
      anchorElement.remove();
    }
  } finally {
    URL.revokeObjectURL(url);
  }
};

export { initialSketch, saveSketch, sketchComponentMaxLength };
export type { Sketch, SketchInput };
