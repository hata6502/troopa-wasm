import { ComponentV1, ComponentV2, componentType } from "./component";
import { Destination } from "./destination";

const sketchComponentMaxLength = 4096;

export interface SketchInput {
  name: string;
  destination?: Destination;
}

export interface SketchV1 {
  component: Record<string, ComponentV1>;
  inputs: SketchInput[];
  outputComponentID?: string;
}

export type SketchV2 = Omit<SketchV1, "component"> & {
  version: 2;
  componentEntries: [string, ComponentV2][];
};

export type Sketch = SketchV1 | SketchV2;

const countPrimitiveComponents = ({ sketch }: { sketch: SketchV2 }): number => {
  let count = 0;

  sketch.componentEntries.forEach(([, component]) => {
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
        count++;

        break;
      }

      case componentType.sketch: {
        count += countPrimitiveComponents({
          sketch: component.extendedData.sketch,
        });

        break;
      }

      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const exhaustiveCheck: never = component;

        throw new Error("Unrecognized component type");
      }
    }
  });

  return count;
};

export const initialSketch: SketchV2 = {
  version: 2,
  componentEntries: [
    [
      "df5bb750-e9fe-fbf3-26e0-bbd601fe98c9",
      {
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
    ],
    [
      "d417eb39-d2d7-4023-a58f-f058658b7c40",
      {
        name: "speaker",
        outputDestinations: [],
        position: { x: 545, y: 25 },
        type: -4,
        extendedData: {},
      },
    ],
    [
      "e02d7ee9-dcf2-40ab-ba7f-8beac91e411b",
      {
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
    ],
  ],
  inputs: [...Array(8).keys()].map(() => ({ name: "" })),
};

export const upgradeSketch = ({ sketch }: { sketch: Sketch }): SketchV2 => {
  let upgradedSketch = sketch;

  if (!("version" in upgradedSketch)) {
    upgradedSketch = {
      ...upgradedSketch,
      version: 2,
      componentEntries: Object.entries(upgradedSketch.component).map(
        ([id, componentV1]) => {
          switch (componentV1.type) {
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
              return [id, componentV1];
            }

            case componentType.sketch: {
              return [
                id,
                {
                  ...componentV1,
                  extendedData: {
                    ...componentV1.extendedData,
                    sketch: upgradeSketch({
                      sketch: componentV1.extendedData.sketch,
                    }),
                  },
                },
              ];
            }

            default: {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const exhaustiveCheck: never = componentV1;

              throw new Error("Unrecognized component type");
            }
          }
        }
      ),
    };
  }

  return upgradedSketch;
};

export { countPrimitiveComponents, sketchComponentMaxLength };
