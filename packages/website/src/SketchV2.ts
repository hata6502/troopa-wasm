export interface SketchV2 {
  version: 2;
  componentEntries: [string, Component][];
  inputs: SketchInput[];
}

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
  | ComponentBase<typeof componentType.and, Record<string, never>>
  | ComponentBase<typeof componentType.not, Record<string, never>>
  | ComponentBase<typeof componentType.or, Record<string, never>>
  | InputComponent
  | ComponentBase<typeof componentType.keyboardFrequency, Record<string, never>>
  | ComponentBase<typeof componentType.keyboardSwitch, Record<string, never>>
  | ComponentBase<typeof componentType.speaker, Record<string, never>>
  | ComponentBase<typeof componentType.meter, { value: number }>
  | SketchComponent;

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

type ControlPosition = { x: number; y: number };

type InputComponent = ComponentBase<
  typeof componentType.input,
  { value: string }
>;

type SketchComponent = ComponentBase<
  typeof componentType.sketch,
  { sketch: SketchV2 }
>;

interface SketchInput {
  name: string;
  destination?: Destination;
}

interface ComponentDestination {
  type: "component";
  id: string;
  inputIndex: number;
}

interface SketchOutputDestination {
  type: "sketchOutput";
}

type Destination = ComponentDestination | SketchOutputDestination;

const coreComponentType = {
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

const interfaceComponentType = {
  input: -1,
  keyboardFrequency: -2,
  keyboardSwitch: -3,
  speaker: -4,
  meter: -5,
  // scope: -6
} as const;

const sketchComponentType = {
  sketch: -7,
} as const;

const componentType = {
  ...coreComponentType,
  ...interfaceComponentType,
  ...sketchComponentType,
};

type ComponentType = typeof componentType[keyof typeof componentType];
