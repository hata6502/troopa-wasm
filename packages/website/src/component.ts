import type { ControlPosition } from "react-draggable";
import type { Destination } from "./destination";
import type { Sketch } from "./sketch";

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

  sketch: 21,
} as const;

type PrimitiveComponentType =
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

type ComponentType = PrimitiveComponentType | typeof componentType.sketch;

const componentName: Record<ComponentType, string> = {
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
  [componentType.sketch]: "sketch",
};

const distributorComponentInInput = 1;

const primitiveComponentInputNames: Record<PrimitiveComponentType, string[]> = {
  [componentType.amplifier]: ["", "in 1", "in 2"],
  [componentType.buffer]: ["", "in"],
  [componentType.differentiator]: ["", "in"],
  [componentType.distributor]: ["", "in"],
  [componentType.divider]: ["", "in 1", "in 2"],
  [componentType.integrator]: ["", "in"],
  [componentType.lowerSaturator]: ["", "in 1", "in 2"],
  [componentType.mixer]: ["", "in 1", "in 2"],
  [componentType.noise]: [""],
  [componentType.saw]: ["", "frequency"],
  [componentType.sine]: ["", "frequency"],
  [componentType.square]: ["", "frequency"],
  [componentType.subtractor]: ["", "in 1", "in 2"],
  [componentType.triangle]: ["", "frequency"],
  [componentType.upperSaturator]: ["", "in 1", "in 2"],
  [componentType.input]: [""],
  [componentType.keyboardFrequency]: [""],
  [componentType.keyboardSwitch]: [""],
  [componentType.speaker]: ["", "sound"],
  [componentType.meter]: ["", "in"],
  [componentType.scope]: ["", "in"],
};

interface ComponentBase<
  Type extends ComponentType,
  ExtendedData extends Record<string, unknown>
> {
  name: string;
  type: Type;
  outputDestinations: Destination[];
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
  | ComponentBase<typeof componentType.scope, Record<string, never>>
  | ComponentBase<typeof componentType.sketch, { sketch: Sketch }>;

const componentInputMaxLength = 8;

const getComponentInputNames = ({
  component,
}: {
  component: Component;
}): string[] => {
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
    case componentType.input:
    case componentType.keyboardFrequency:
    case componentType.keyboardSwitch:
    case componentType.speaker:
    case componentType.meter:
    case componentType.scope: {
      return primitiveComponentInputNames[component.type];
    }

    case componentType.sketch: {
      return component.extendedData.sketch.inputs.map((input) => input.name);
    }

    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = component;

      throw new Error();
    }
  }
};

export {
  componentInputMaxLength,
  componentName,
  componentType,
  distributorComponentInInput,
  getComponentInputNames,
};

export type {
  Component,
  ComponentType,
  InputComponent,
  PrimitiveComponentType,
};
