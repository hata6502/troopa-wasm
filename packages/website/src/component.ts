import type { ControlPosition } from "react-draggable";
import { v4 as uuidv4 } from "uuid";
import type { Destination } from "./destination";
import type { Sketch } from "./sketch";

const primitiveComponentType = {
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

type PrimitiveComponentType =
  | typeof primitiveComponentType.amplifier
  | typeof primitiveComponentType.buffer
  | typeof primitiveComponentType.differentiator
  | typeof primitiveComponentType.distributor
  | typeof primitiveComponentType.divider
  | typeof primitiveComponentType.integrator
  | typeof primitiveComponentType.lowerSaturator
  | typeof primitiveComponentType.mixer
  | typeof primitiveComponentType.noise
  | typeof primitiveComponentType.saw
  | typeof primitiveComponentType.sine
  | typeof primitiveComponentType.square
  | typeof primitiveComponentType.subtractor
  | typeof primitiveComponentType.triangle
  | typeof primitiveComponentType.upperSaturator
  | typeof primitiveComponentType.input
  | typeof primitiveComponentType.keyboardFrequency
  | typeof primitiveComponentType.keyboardSwitch
  | typeof primitiveComponentType.speaker
  | typeof primitiveComponentType.meter
  | typeof primitiveComponentType.scope;

const primitiveComponentNames: Record<PrimitiveComponentType, string> = {
  [primitiveComponentType.amplifier]: "amplifier",
  [primitiveComponentType.buffer]: "buffer",
  [primitiveComponentType.differentiator]: "differentiator",
  [primitiveComponentType.distributor]: "distributor",
  [primitiveComponentType.divider]: "divider",
  [primitiveComponentType.integrator]: "integrator",
  [primitiveComponentType.lowerSaturator]: "lower saturator",
  [primitiveComponentType.mixer]: "mixer",
  [primitiveComponentType.noise]: "noise",
  [primitiveComponentType.saw]: "saw",
  [primitiveComponentType.sine]: "sine",
  [primitiveComponentType.square]: "square",
  [primitiveComponentType.subtractor]: "subtractor",
  [primitiveComponentType.triangle]: "triangle",
  [primitiveComponentType.upperSaturator]: "upper saturator",
  [primitiveComponentType.input]: "input",
  [primitiveComponentType.keyboardFrequency]: "keyboard frequency",
  [primitiveComponentType.keyboardSwitch]: "keyboard switch",
  [primitiveComponentType.speaker]: "speaker",
  [primitiveComponentType.meter]: "meter",
  [primitiveComponentType.scope]: "scope",
};

const diffTimeInput = 0;
const diffTimeInputName = "diff time";

const distributorComponentInInput = 1;

const primitiveComponentInputNames: Record<PrimitiveComponentType, string[]> = {
  [primitiveComponentType.amplifier]: [diffTimeInputName, "in 1", "in 2"],
  [primitiveComponentType.buffer]: [diffTimeInputName, "in"],
  [primitiveComponentType.differentiator]: [diffTimeInputName, "in"],
  [primitiveComponentType.distributor]: [diffTimeInputName, "in"],
  [primitiveComponentType.divider]: [diffTimeInputName, "in 1", "in 2"],
  [primitiveComponentType.integrator]: [diffTimeInputName, "in"],
  [primitiveComponentType.lowerSaturator]: [diffTimeInputName, "in 1", "in 2"],
  [primitiveComponentType.mixer]: [diffTimeInputName, "in 1", "in 2"],
  [primitiveComponentType.noise]: [diffTimeInputName],
  [primitiveComponentType.saw]: [diffTimeInputName, "frequency"],
  [primitiveComponentType.sine]: [diffTimeInputName, "frequency"],
  [primitiveComponentType.square]: [diffTimeInputName, "frequency"],
  [primitiveComponentType.subtractor]: [diffTimeInputName, "in 1", "in 2"],
  [primitiveComponentType.triangle]: [diffTimeInputName, "frequency"],
  [primitiveComponentType.upperSaturator]: [diffTimeInputName, "in 1", "in 2"],
  [primitiveComponentType.input]: [diffTimeInputName],
  [primitiveComponentType.keyboardFrequency]: [diffTimeInputName],
  [primitiveComponentType.keyboardSwitch]: [diffTimeInputName],
  [primitiveComponentType.speaker]: [diffTimeInputName, "sound"],
  [primitiveComponentType.meter]: [diffTimeInputName, "in"],
  [primitiveComponentType.scope]: [diffTimeInputName, "in"],
};

interface ComponentBase<
  Implementation extends Record<string, unknown>,
  ExtendedData extends Record<string, unknown>
> {
  name: string;
  implementation: Implementation;
  outputDestinations: Destination[];
  position: ControlPosition;
  extendedData: ExtendedData;
}

type PrimitiveComponent<
  Type extends PrimitiveComponentType,
  ExtendedData extends Record<string, unknown>
> = ComponentBase<{
  type: 'primitive',
  componentType: Type
}, ExtendedData>

type InputComponent = PrimitiveComponent<
  typeof primitiveComponentType.input,
  { value: string }
>;

type Component =
  | PrimitiveComponent<typeof primitiveComponentType.amplifier, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.buffer, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.differentiator, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.distributor, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.divider, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.integrator, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.lowerSaturator, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.mixer, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.noise, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.saw, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.sine, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.square, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.subtractor, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.triangle, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.upperSaturator, Record<string, never>>
  | InputComponent
  | PrimitiveComponent<typeof primitiveComponentType.keyboardFrequency, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.keyboardSwitch, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.speaker, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.meter, Record<string, never>>
  | PrimitiveComponent<typeof primitiveComponentType.scope, Record<string, never>>
  | ComponentBase<{
    type: 'sketch',
    sketch: Sketch
  }, Record<string, never>>;

// TODO: delete
/*const createComponent = ({
  type,
}: {
  type: PrimitiveComponentType;
}): { id: string; component: Component } => {
  const id = uuidv4();

  const componentBase = {
    name: primitiveComponentNames[type],
    outputDestinations: [],
    position: { x: 0, y: 0 },
  };

  switch (type) {
    case primitiveComponentType.input: {
      return {
        id,
        component: {
          ...componentBase,
          implementation: {
            type: 'primitive',
            componentType
          },
          extendedData: {
            value: "0",
          },
        },
      };
    }

    case primitiveComponentType.amplifier:
    case primitiveComponentType.buffer:
    case primitiveComponentType.differentiator:
    case primitiveComponentType.distributor:
    case primitiveComponentType.divider:
    case primitiveComponentType.integrator:
    case primitiveComponentType.lowerSaturator:
    case primitiveComponentType.mixer:
    case primitiveComponentType.noise:
    case primitiveComponentType.saw:
    case primitiveComponentType.sine:
    case primitiveComponentType.square:
    case primitiveComponentType.subtractor:
    case primitiveComponentType.triangle:
    case primitiveComponentType.upperSaturator:
    case primitiveComponentType.keyboardFrequency:
    case primitiveComponentType.keyboardSwitch:
    case primitiveComponentType.speaker:
    case primitiveComponentType.meter:
    case primitiveComponentType.scope: {
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
};*/

const maxComponentInputLength = 8;

export {
  diffTimeInput,
  distributorComponentInInput,
  maxComponentInputLength,
  primitiveComponentInputNames,
  primitiveComponentNames,
  primitiveComponentType,
};

export type { Component, InputComponent };
