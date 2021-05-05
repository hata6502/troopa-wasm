import { componentType } from "./component";
import type { Component } from "./component";

interface Sketch {
  components: Component[];
}

const initialSketch: Sketch = {
  components: [
    {
      id: "75e51c9e-5edf-345e-e4b8-7ed5716a3b0d",
      name: "input",
      implementation: 15,
      outputDestinations: [],
      position: {x: 0, y: 0},
      extendedData: {
        value: "440",
      },
    },
    {
      id: "05c98f49-b0c0-11da-ffc5-5833ac73a6ec",
      name: "input",
      implementation: 15,
      outputDestinations: [],
      position: {x: 300, y: 0},
      extendedData: {
        value: "220",
      },
    },
    {
      id: "ef8b1beb-391d-c62c-fd74-0579a569077b",
      name: "mixer",
      implementation: 7,
      outputDestinations: [],
      position: {x: 0, y: 300},
      extendedData: {},
    },
    {
      id: "df5bb750-e9fe-fbf3-26e0-bbd601fe98c9",
      name: "sine",
      implementation: 10,
      outputDestinations: [],
      position: {x: 300, y: 300},
      extendedData: {},
    },
    {
      id: "54720eee-e900-16b7-bc0f-d8617d7f08ea",
      name: "speaker",
      implementation: componentType.speaker,
      outputDestinations: [],
      position: {x: 600, y: 600},
      extendedData: {},
    },
  ],
};

export { initialSketch };
export type { Sketch };
