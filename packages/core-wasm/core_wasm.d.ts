/* tslint:disable */
/* eslint-disable */
/**
* @param {number} sample_rate
*/
export function initialize(sample_rate: number): void;
/**
* @param {number} output_component_index
*/
export function append_output_component_index(output_component_index: number): void;
/**
* @param {number} input_component_index
* @param {number} input_input_index
* @param {number} output_component_index
*/
export function connect(input_component_index: number, input_input_index: number, output_component_index: number): void;
/**
* @param {number} interface_component_type
* @returns {number}
*/
export function create_component(interface_component_type: number): number;
/**
* @returns {Float64Array}
*/
export function get_buffer(): Float64Array;
/**
* @param {number} component_index
* @param {number} input_index
* @param {number} value
* @returns {number}
*/
export function input_value(component_index: number, input_index: number, value: number): number;
/**
* @returns {number}
*/
export function process(): number;
/**
*/
export enum InterfaceComponentType {
  Amplifier,
  Buffer,
  Differentiator,
  Distributor,
  Divider,
  Integrator,
  LowerSaturator,
  Mixer,
  Noise,
  Saw,
  Sine,
  Square,
  Subtractor,
  Triangle,
  UpperSaturator,
  And,
  Not,
  Or,
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly initialize: (a: number) => void;
  readonly append_output_component_index: (a: number) => void;
  readonly connect: (a: number, b: number, c: number) => void;
  readonly create_component: (a: number) => number;
  readonly get_buffer: (a: number) => void;
  readonly input_value: (a: number, b: number, c: number) => number;
  readonly process: () => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
