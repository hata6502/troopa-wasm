import { ControlPosition } from "react-draggable";
import { Destination } from "./destination";
import { SketchV3 } from "./sketch";

export const coreComponentType = {
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
  and: 15,
  not: 16,
  or: 17,
} as const;

export const interfaceComponentType = {
  input: -1,
  keyboardFrequency: -2,
  keyboardSwitch: -3,
  speaker: -4,
  meter: -5,
  // scope: -6
} as const;

export const sketchComponentType = {
  sketch: -7,
} as const;

export const componentType = {
  ...coreComponentType,
  ...interfaceComponentType,
  ...sketchComponentType,
};

export type ComponentType = typeof componentType[keyof typeof componentType];

export const componentName: Record<ComponentType, string> = {
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
  [componentType.sketch]: "sketch",
  [componentType.and]: "and",
  [componentType.not]: "not",
  [componentType.or]: "or",
};

const distributorComponentInInput = 1;

interface ComponentBase<Type extends ComponentType, ExtendedData> {
  name: string;
  type: Type;
  outputDestinationsList: Destination[][];
  position: ControlPosition;
  extendedData: ExtendedData;
}

export interface InputComponentExtendedData {
  value: string;
}

export type InputComponent = ComponentBase<
  typeof componentType.input,
  InputComponentExtendedData
>;

export type SketchComponent = ComponentBase<
  typeof componentType.sketch,
  { sketch: SketchV3 }
>;

export type Component =
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
  | ComponentBase<typeof componentType.and, Record<string, never>>
  | ComponentBase<typeof componentType.not, Record<string, never>>
  | ComponentBase<typeof componentType.or, Record<string, never>>
  | InputComponent
  | ComponentBase<typeof componentType.keyboardFrequency, Record<string, never>>
  | ComponentBase<typeof componentType.keyboardSwitch, Record<string, never>>
  | ComponentBase<typeof componentType.speaker, Record<string, never>>
  | ComponentBase<typeof componentType.meter, { value: number }>
  | SketchComponent;

const componentInputMaxLength = 8;

export const getComponentInputNames = ({
  component,
}: {
  component: Component;
}): (string | undefined)[] => {
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
      return {
        [componentType.amplifier]: [undefined, "in 1", "in 2"],
        [componentType.buffer]: [undefined, "in"],
        [componentType.differentiator]: [undefined, "in"],
        [componentType.distributor]: [undefined, "in"],
        [componentType.divider]: [undefined, "in 1", "in 2"],
        [componentType.integrator]: [undefined, "in", "reset"],
        [componentType.lowerSaturator]: [undefined, "in 1", "in 2"],
        [componentType.mixer]: [undefined, "in 1", "in 2"],
        [componentType.noise]: [undefined],
        [componentType.saw]: [undefined, "frequency"],
        [componentType.sine]: [undefined, "frequency"],
        [componentType.square]: [undefined, "frequency", "duty"],
        [componentType.subtractor]: [undefined, "in 1", "in 2"],
        [componentType.triangle]: [undefined, "frequency"],
        [componentType.upperSaturator]: [undefined, "in 1", "in 2"],
        [componentType.input]: [undefined],
        [componentType.keyboardFrequency]: [undefined],
        [componentType.keyboardSwitch]: [undefined],
        [componentType.speaker]: [undefined, "sound"],
        [componentType.meter]: [undefined, "in"],
        [componentType.and]: [undefined, "in 1", "in 2"],
        [componentType.not]: [undefined, "in"],
        [componentType.or]: [undefined, "in 1", "in 2"],
      }[component.type];
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

export const getComponentOutputNames = ({
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
    case componentType.and:
    case componentType.not:
    case componentType.or:
    case componentType.input:
    case componentType.keyboardFrequency:
    case componentType.keyboardSwitch:
    case componentType.speaker:
    case componentType.meter: {
      return {
        [componentType.amplifier]: ["amplified"],
        [componentType.buffer]: ["delayed"],
        [componentType.differentiator]: ["differentiated"],
        [componentType.distributor]: ["thru"],
        [componentType.divider]: ["divided"],
        [componentType.integrator]: ["integrated"],
        [componentType.lowerSaturator]: ["lower saturated"],
        [componentType.mixer]: ["mixed"],
        [componentType.noise]: ["noise"],
        [componentType.saw]: ["saw"],
        [componentType.sine]: ["sine"],
        [componentType.square]: ["square"],
        [componentType.subtractor]: ["subtracted"],
        [componentType.triangle]: ["triangle"],
        [componentType.upperSaturator]: ["upper saturated"],
        [componentType.input]: ["input"],
        [componentType.keyboardFrequency]: ["frequency"],
        [componentType.keyboardSwitch]: ["on/off"],
        [componentType.speaker]: ["thru"],
        [componentType.meter]: ["thru"],
        [componentType.and]: ["and"],
        [componentType.not]: ["not"],
        [componentType.or]: ["or"],
      }[component.type];
    }

    case componentType.sketch: {
      return component.extendedData.sketch.outputs.map(({ name }) => name);
    }

    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = component;

      throw new Error();
    }
  }
};

export { componentInputMaxLength, distributorComponentInInput };
