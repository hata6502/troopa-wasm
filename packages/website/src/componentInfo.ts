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
  keyboard: 16,
  speaker: 17,
  meter: 18,
  scope: 19,
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
  | typeof componentType.keyboard
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
  [componentType.keyboard]: "keyboard",
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
  [componentType.keyboard]: [diffTimeInputName],
  [componentType.speaker]: [diffTimeInputName, "sound"],
  [componentType.meter]: [diffTimeInputName, "in"],
  [componentType.scope]: [diffTimeInputName, "in"],
};

interface ComponentDataBase<
  Implementation extends ComponentType,
  ExtendedData extends Record<string, unknown>
> {
  id: string;
  name: string;
  implementation: Implementation;
  outputDestinations: {
    componentID: string;
    inputIndex: number;
  }[];
  extendedData: ExtendedData;
}

type ComponentData =
  | ComponentDataBase<typeof componentType.amplifier, Record<string, never>>
  | ComponentDataBase<typeof componentType.buffer, Record<string, never>>
  | ComponentDataBase<
      typeof componentType.differentiator,
      Record<string, never>
    >
  | ComponentDataBase<typeof componentType.distributor, Record<string, never>>
  | ComponentDataBase<typeof componentType.divider, Record<string, never>>
  | ComponentDataBase<typeof componentType.integrator, Record<string, never>>
  | ComponentDataBase<
      typeof componentType.lowerSaturator,
      Record<string, never>
    >
  | ComponentDataBase<typeof componentType.mixer, Record<string, never>>
  | ComponentDataBase<typeof componentType.noise, Record<string, never>>
  | ComponentDataBase<typeof componentType.saw, Record<string, never>>
  | ComponentDataBase<typeof componentType.sine, Record<string, never>>
  | ComponentDataBase<typeof componentType.square, Record<string, never>>
  | ComponentDataBase<typeof componentType.subtractor, Record<string, never>>
  | ComponentDataBase<typeof componentType.triangle, Record<string, never>>
  | ComponentDataBase<
      typeof componentType.upperSaturator,
      Record<string, never>
    >
  | ComponentDataBase<typeof componentType.input, { value: number }>
  | ComponentDataBase<typeof componentType.keyboard, Record<string, never>>
  | ComponentDataBase<typeof componentType.speaker, Record<string, never>>
  | ComponentDataBase<typeof componentType.meter, Record<string, never>>
  | ComponentDataBase<typeof componentType.scope, Record<string, never>>;

export {
  componentInputNames,
  componentType,
  diffTimeInput,
  distributorComponentInInput,
};

export type { ComponentData };
