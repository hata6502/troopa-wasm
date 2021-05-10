import type { ControlPosition } from "react-draggable";
import { v4 as uuidv4 } from "uuid";

const componentType = {
  // Core components
  amplifier: 0,
  buffer: 1,
  differentiator: 2,
  distributor: 3,
  divider: 4,
  integrator: 5,
  lowerSaturator: 6,
  mixer: 7,
  noise: 8,
  saw: 9,
  sine: 10,
  square: 11,
  subtractor: 12,
  triangle: 13,
  upperSaturator: 14,

  // Interface components
  input: 15,
  keyboardFrequency: 16,
  keyboardSwitch: 17,
  speaker: 18,
  meter: 19,
  scope: 20,
} as const;

type ComponentType =
  | typeof componentType.amplifier
  | typeof componentType.buffer
  | typeof componentType.differentiator
  | typeof componentType.distributor
  | typeof componentType.divider
  | typeof componentType.integrator
  | typeof componentType.lowerSaturator
  | typeof componentType.mixer
  | typeof componentType.noise
  | typeof componentType.saw
  | typeof componentType.sine
  | typeof componentType.square
  | typeof componentType.subtractor
  | typeof componentType.triangle
  | typeof componentType.upperSaturator
  | typeof componentType.input
  | typeof componentType.keyboardFrequency
  | typeof componentType.keyboardSwitch
  | typeof componentType.speaker
  | typeof componentType.meter
  | typeof componentType.scope;

const componentNames = {
  [componentType.amplifier]: "amplifier",
  [componentType.buffer]: "buffer",
  [componentType.differentiator]: "differentiator",
  [componentType.distributor]: "distributor",
  [componentType.divider]: "divider",
  [componentType.integrator]: "integrator",
  [componentType.lowerSaturator]: "lower saturator",
  [componentType.mixer]: "mixer",
  [componentType.noise]: "noise",
  [componentType.saw]: "saw",
  [componentType.sine]: "sine",
  [componentType.square]: "square",
  [componentType.subtractor]: "subtractor",
  [componentType.triangle]: "triangle",
  [componentType.upperSaturator]: "upper saturator",
  [componentType.input]: "input",
  [componentType.keyboardFrequency]: "keyboard frequency",
  [componentType.keyboardSwitch]: "keyboard switch",
  [componentType.speaker]: "speaker",
  [componentType.meter]: "meter",
  [componentType.scope]: "scope",
};

const diffTimeInput = 0;
const diffTimeInputName = "diff time";

const distributorComponentInInput = 1;

const componentInputNames = {
  [componentType.amplifier]: [diffTimeInputName, "in 1", "in 2"],
  [componentType.buffer]: [diffTimeInputName, "in"],
  [componentType.differentiator]: [diffTimeInputName, "in"],
  [componentType.distributor]: [diffTimeInputName, "in"],
  [componentType.divider]: [diffTimeInputName, "in 1", "in 2"],
  [componentType.integrator]: [diffTimeInputName, "in"],
  [componentType.lowerSaturator]: [diffTimeInputName, "in 1", "in 2"],
  [componentType.mixer]: [diffTimeInputName, "in 1", "in 2"],
  [componentType.noise]: [diffTimeInputName],
  [componentType.saw]: [diffTimeInputName, "frequency"],
  [componentType.sine]: [diffTimeInputName, "frequency"],
  [componentType.square]: [diffTimeInputName, "frequency"],
  [componentType.subtractor]: [diffTimeInputName, "in 1", "in 2"],
  [componentType.triangle]: [diffTimeInputName, "frequency"],
  [componentType.upperSaturator]: [diffTimeInputName, "in 1", "in 2"],
  [componentType.input]: [diffTimeInputName],
  [componentType.keyboardFrequency]: [diffTimeInputName],
  [componentType.keyboardSwitch]: [diffTimeInputName],
  [componentType.speaker]: [diffTimeInputName, "sound"],
  [componentType.meter]: [diffTimeInputName, "in"],
  [componentType.scope]: [diffTimeInputName, "in"],
};

interface OutputDestination {
  componentID: string;
  inputIndex: number;
}

interface ComponentBase<
  Implementation extends ComponentType,
  ExtendedData extends Record<string, unknown>
> {
  name: string;
  implementation: Implementation;
  outputDestinations: OutputDestination[];
  position: ControlPosition;
  extendedData: ExtendedData;
}

type InputComponent = ComponentBase<
  typeof componentType.input,
  { value: string }
>;

type Component =
  | ComponentBase<typeof componentType.amplifier, Record<string, never>>
  | ComponentBase<typeof componentType.buffer, Record<string, never>>
  | ComponentBase<typeof componentType.differentiator, Record<string, never>>
  | ComponentBase<typeof componentType.distributor, Record<string, never>>
  | ComponentBase<typeof componentType.divider, Record<string, never>>
  | ComponentBase<typeof componentType.integrator, Record<string, never>>
  | ComponentBase<typeof componentType.lowerSaturator, Record<string, never>>
  | ComponentBase<typeof componentType.mixer, Record<string, never>>
  | ComponentBase<typeof componentType.noise, Record<string, never>>
  | ComponentBase<typeof componentType.saw, Record<string, never>>
  | ComponentBase<typeof componentType.sine, Record<string, never>>
  | ComponentBase<typeof componentType.square, Record<string, never>>
  | ComponentBase<typeof componentType.subtractor, Record<string, never>>
  | ComponentBase<typeof componentType.triangle, Record<string, never>>
  | ComponentBase<typeof componentType.upperSaturator, Record<string, never>>
  | InputComponent
  | ComponentBase<typeof componentType.keyboardFrequency, Record<string, never>>
  | ComponentBase<typeof componentType.keyboardSwitch, Record<string, never>>
  | ComponentBase<typeof componentType.speaker, Record<string, never>>
  | ComponentBase<typeof componentType.meter, Record<string, never>>
  | ComponentBase<typeof componentType.scope, Record<string, never>>;

const createComponent = ({
  type,
}: {
  type: ComponentType;
}): { id: string; component: Component } => {
  const id = uuidv4();

  const componentBase = {
    name: componentNames[type],
    outputDestinations: [],
    position: { x: 0, y: 0 },
  };

  switch (type) {
    case componentType.input: {
      return {
        id,
        component: {
          ...componentBase,
          implementation: type,
          extendedData: {
            value: "0",
          },
        },
      };
    }

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
    case componentType.keyboardFrequency:
    case componentType.keyboardSwitch:
    case componentType.speaker:
    case componentType.meter:
    case componentType.scope: {
      return {
        id,
        component: {
          ...componentBase,
          implementation: type,
          extendedData: {},
        },
      };
    }

    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = type;

      throw new Error();
    }
  }
};

export {
  componentInputNames,
  componentNames,
  componentType,
  createComponent,
  diffTimeInput,
  distributorComponentInInput,
};

export type { Component, InputComponent, OutputDestination };
