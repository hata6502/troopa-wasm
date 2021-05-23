import type { Component } from "./component";
import type { Destination } from "./destination";

interface SketchInput {
  name: string;
  destination?: Destination;
}

interface Sketch {
  name: string;
  component: Record<string, Component>;
  // maxComponentInputLength
  inputs: [
    SketchInput,
    SketchInput,
    SketchInput,
    SketchInput,
    SketchInput,
    SketchInput,
    SketchInput,
    SketchInput
  ];
}

const initialSketch: Sketch = {
  name: "example",
  component: {
    "df5bb750-e9fe-fbf3-26e0-bbd601fe98c9": {
      name: "sine",
      implementation: {
        type: 'primitive',
        componentType: 10
      },
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
      implementation: {
        type: 'primitive',
        componentType: 18
      },
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
      implementation: {
        type: 'primitive',
        componentType: 15
      },
      extendedData: { value: "440" },
    },
  },
  inputs: [
    { name: "" },
    { name: "" },
    { name: "" },
    { name: "" },
    { name: "" },
    { name: "" },
    { name: "" },
    { name: "" },
  ],
};

export { initialSketch };
export type { Sketch, SketchInput };
