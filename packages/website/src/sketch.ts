import type { Component } from "./component";

interface Sketch {
  name: string;
  component: Record<string, Component>;
}

const initialSketch: Sketch = {
  name: "example",
  component: {
    "df5bb750-e9fe-fbf3-26e0-bbd601fe98c9": {
      name: "sine",
      implementation: 10,
      outputDestinations: [
        { componentID: "d417eb39-d2d7-4023-a58f-f058658b7c40", inputIndex: 1 },
      ],
      position: { x: 285, y: 36 },
      extendedData: {},
    },
    "d417eb39-d2d7-4023-a58f-f058658b7c40": {
      name: "speaker",
      outputDestinations: [],
      position: { x: 545, y: 25 },
      implementation: 18,
      extendedData: {},
    },
    "e02d7ee9-dcf2-40ab-ba7f-8beac91e411b": {
      name: "input",
      outputDestinations: [
        { componentID: "df5bb750-e9fe-fbf3-26e0-bbd601fe98c9", inputIndex: 1 },
      ],
      position: { x: 40, y: 41 },
      implementation: 15,
      extendedData: { value: "440" },
    },
  },
};

export { initialSketch };
export type { Sketch };
