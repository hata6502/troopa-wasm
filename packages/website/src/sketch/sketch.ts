import { Component, componentType } from "../component";
import { Destination } from "../destination";
import { SketchV1 } from "./SketchV1";
import { DestinationV2, SketchV2 } from "./SketchV2";

export interface SketchInput {
  name: string;
  destination?: Destination;
}

export interface SketchOutput {
  name: string;
}

export interface SketchV3 {
  version: 3;
  componentEntries: [string, Component][];
  inputs: SketchInput[];
  outputs: SketchOutput[];
}

export type Sketch = SketchV1 | SketchV2 | SketchV3;

export const initialSketch: SketchV3 = {
  version: 3,
  componentEntries: [
    [
      "df5bb750-e9fe-fbf3-26e0-bbd601fe98c9",
      {
        name: "sine",
        type: 10,
        outputDestinationsList: [
          [
            {
              type: "component",
              id: "d417eb39-d2d7-4023-a58f-f058658b7c40",
              inputIndex: 1,
            },
          ],
        ],
        position: { x: 285, y: 36 },
        extendedData: {},
      },
    ],
    [
      "d417eb39-d2d7-4023-a58f-f058658b7c40",
      {
        name: "speaker",
        outputDestinationsList: [[]],
        position: { x: 545, y: 25 },
        type: -4,
        extendedData: {},
      },
    ],
    [
      "e02d7ee9-dcf2-40ab-ba7f-8beac91e411b",
      {
        name: "input",
        outputDestinationsList: [
          [
            {
              type: "component",
              id: "df5bb750-e9fe-fbf3-26e0-bbd601fe98c9",
              inputIndex: 1,
            },
          ],
        ],
        position: { x: 40, y: 41 },
        type: -1,
        extendedData: { value: "440" },
      },
    ],
  ],
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
  outputs: [
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

export const upgradeSketch = ({ sketch }: { sketch: Sketch }): SketchV3 => {
  let upgradedSketch = sketch;

  if (!("version" in upgradedSketch)) {
    upgradedSketch = upgradeSketchToV2({ sketchV1: upgradedSketch });
  }

  if (upgradedSketch.version === 2) {
    upgradedSketch = upgradeSketchToV3({ sketchV2: upgradedSketch });
  }

  return upgradedSketch;
};

const upgradeDestinationToV3 = ({
  destinationV2,
}: {
  destinationV2: DestinationV2;
}): Destination => {
  switch (destinationV2.type) {
    case "component": {
      return destinationV2;
    }

    case "sketchOutput": {
      return {
        type: "output",
        index: 0,
      };
    }

    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = destinationV2;

      throw new Error();
    }
  }
};

const upgradeSketchToV2 = ({ sketchV1 }: { sketchV1: SketchV1 }): SketchV2 => ({
  ...sketchV1,
  version: 2,
  componentEntries: Object.entries(sketchV1.component).map(
    ([id, component]) => {
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
          return [id, component];
        }

        case componentType.sketch: {
          return [
            id,
            {
              ...component,
              extendedData: {
                ...component.extendedData,
                sketch: upgradeSketchToV2({
                  sketchV1: component.extendedData.sketch,
                }),
              },
            },
          ];
        }

        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const exhaustiveCheck: never = component;

          throw new Error("Unrecognized component type");
        }
      }
    }
  ),
});

const upgradeSketchToV3 = ({ sketchV2 }: { sketchV2: SketchV2 }): SketchV3 => ({
  ...sketchV2,
  version: 3,
  componentEntries: sketchV2.componentEntries.map(([id, component]) => {
    const upgradedComponent = {
      ...component,
      outputDestinationsList: [
        component.outputDestinations.map((outputDestination) =>
          upgradeDestinationToV3({ destinationV2: outputDestination })
        ),
      ],
    };

    switch (upgradedComponent.type) {
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
        return [id, upgradedComponent];
      }

      case componentType.sketch: {
        return [
          id,
          {
            ...upgradedComponent,
            extendedData: {
              ...upgradedComponent.extendedData,
              sketch: upgradeSketchToV3({
                sketchV2: upgradedComponent.extendedData.sketch,
              }),
            },
          },
        ];
      }

      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const exhaustiveCheck: never = upgradedComponent;

        throw new Error("Unrecognized component type");
      }
    }
  }),
  inputs: sketchV2.inputs.map((input) => ({
    ...input,
    destination:
      input.destination &&
      upgradeDestinationToV3({ destinationV2: input.destination }),
  })),
  outputs: [
    { name: "output" },
    ...[...Array(7).keys()].map(() => ({ name: "" })),
  ],
});
