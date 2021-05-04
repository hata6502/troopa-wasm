import { componentType } from "./component";
import type { Component } from "./component";

interface Sketch {
  name: string;
  components: Component[];
}

const initialSketch: Sketch = {
  name: "test sketch",
  components: [
    {
      id: "1",
      name: "input",
      implementation: 15,
      // TODO
      inputs: [],
      outputDestinations: [],
      extendedData: {
        value: "440",
      },
    },
    {
      id: "2",
      name: "input",
      implementation: 15,
      // TODO
      inputs: [],
      outputDestinations: [],
      extendedData: {
        value: "220",
      },
    },
    {
      id: "3",
      name: "mixer",
      implementation: 7,
      // TODO
      inputs: [],
      outputDestinations: [],
      extendedData: {},
    },
    {
      id: "4",
      name: "sine",
      implementation: 10,
      // TODO
      inputs: [],
      outputDestinations: [],
      extendedData: {},
    },
    {
      id: "5",
      name: "speaker",
      implementation: componentType.speaker,
      // TODO
      inputs: [],
      outputDestinations: [],
      extendedData: {},
    },
  ],
};

export { initialSketch };
export type { Sketch };
