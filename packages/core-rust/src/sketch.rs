extern crate wasm_bindgen;

use once_cell::sync::Lazy;
use rand;
use rand::prelude::*;
use std::f64;
use std::sync::Mutex;
use wasm_bindgen::prelude::*;

pub const RETURN_CODE_SUCCESS: i32 = 0;
pub const RETURN_CODE_INFINITE_LOOP_DETECTED: i32 = 1;

const DIFF_TIME_INPUT: usize = 0;

type Destination = (usize, usize);

pub struct Sketch {
    components: Vec<Component>,
    sample_rate: f64,
}

impl Sketch {
    pub const fn new() -> Self {
        Sketch {
            components: Vec::new(),
            sample_rate: 0.0,
        }
    }

    pub fn init(&mut self, sample_rate: f64) {
        self.components.clear();
        self.sample_rate = sample_rate;
    }

    pub fn connect(&mut self, input_destination: Destination, output_component_index: usize) {
        self.components[output_component_index]
            .output_destinations
            .push(input_destination);
    }

    pub fn create_component(&mut self, component_type: ComponentType) -> usize {
        self.components.push(Component::new(component_type));
        self.components.len() - 1
    }

    pub fn get_output_value(&self, index: usize) -> f64 {
        self.components[index].output_value
    }

    pub fn input_values(&mut self, inputs: Vec<(Destination, f64)>) -> Result<(), i32> {
        for component_index in 0..self.components.len() {
            self.components[component_index].loop_count = 0;
        }

        let mut component_indexes = Vec::new();

        for input in inputs {
            self.components[input.0 .0].input_values[input.0 .1] = input.1;
            component_indexes.push(input.0 .0);
        }

        while !component_indexes.is_empty() {
            let mut next_component_indexes = Vec::new();

            for &component_index in &component_indexes {
                const MAX_LOOP_COUNT: i32 = 255;

                self.components[component_index].loop_count += 1;

                if self.components[component_index].loop_count > MAX_LOOP_COUNT {
                    return Err(RETURN_CODE_INFINITE_LOOP_DETECTED + component_index as i32);
                };

                if !self.components[component_index].sync() {
                    continue;
                };

                for output_destination_index in
                    0..self.components[component_index].output_destinations.len()
                {
                    let output_destination = self.components[component_index].output_destinations
                        [output_destination_index];

                    self.components[output_destination.0].input_values[output_destination.1] =
                        self.components[component_index].output_value;

                    next_component_indexes.push(output_destination.0);
                }
            }

            component_indexes.clear();

            for next_component_index in next_component_indexes {
                if component_indexes.contains(&next_component_index) {
                    continue;
                }

                component_indexes.push(next_component_index);
            }
        }

        Ok(())
    }

    pub fn next_tick(&mut self) -> Result<(), i32> {
        let diff_time = 1.0 / self.sample_rate;
        let mut inputs = Vec::new();

        for index in 0..self.components.len() {
            inputs.push(((index, DIFF_TIME_INPUT), diff_time));
        }

        self.input_values(inputs)
    }
}

#[wasm_bindgen]
pub enum ComponentType {
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

static RNG: Lazy<Mutex<rand::rngs::StdRng>> =
    Lazy::new(|| Mutex::new(rand::SeedableRng::from_seed([0; 32])));

const COMPONENT_INPUT_LENGTH: usize = 8;
const COMPONENT_REGISTER_LENGTH: usize = 8;

pub struct Component {
    component_type: ComponentType,
    input_values: [f64; COMPONENT_INPUT_LENGTH],
    loop_count: i32,
    output_value: f64,
    output_destinations: Vec<Destination>,
    registers: [f64; COMPONENT_REGISTER_LENGTH],
}

impl Component {
    const FREQUENCY_INPUT: usize = 1;

    const PHASE_REGISTER: usize = 0;

    const fn new(component_type: ComponentType) -> Self {
        Component {
            component_type,
            input_values: [0.0; COMPONENT_REGISTER_LENGTH],
            loop_count: 0,
            output_value: 0.0,
            output_destinations: Vec::new(),
            registers: [0.0; COMPONENT_REGISTER_LENGTH],
        }
    }

    fn sync(&mut self) -> bool {
        let next_output_value = match self.component_type {
            ComponentType::Amplifier => {
                const IN_1_INPUT: usize = 1;
                const IN_2_INPUT: usize = 2;

                self.input_values[IN_1_INPUT] * self.input_values[IN_2_INPUT]
            }
            ComponentType::Buffer => {
                const IN_INPUT: usize = 1;
                const VALUE_REGISTER: usize = 0;

                self.registers[VALUE_REGISTER] = self.input_values[IN_INPUT];

                if self.input_values[DIFF_TIME_INPUT] == 0.0 {
                    self.output_value
                } else {
                    self.registers[VALUE_REGISTER]
                }
            }
            ComponentType::Differentiator => {
                const IN_INPUT: usize = 1;
                const PREV_REGISTER: usize = 0;

                if self.input_values[DIFF_TIME_INPUT] == 0.0 {
                    self.output_value
                } else {
                    let in_input = self.input_values[IN_INPUT];

                    let output_value = (in_input - self.registers[PREV_REGISTER])
                        / self.input_values[DIFF_TIME_INPUT];

                    self.registers[PREV_REGISTER] = in_input;

                    output_value
                }
            }
            ComponentType::Distributor => {
                const IN_INPUT: usize = 1;

                self.input_values[IN_INPUT]
            }
            ComponentType::Divider => {
                const IN_1_INPUT: usize = 1;
                const IN_2_INPUT: usize = 2;

                if self.input_values[IN_2_INPUT] == 0.0 {
                    self.output_value
                } else {
                    self.input_values[IN_1_INPUT] / self.input_values[IN_2_INPUT]
                }
            }
            ComponentType::Integrator => {
                const IN_INPUT: usize = 1;
                const RESET_INPUT: usize = 2;

                const VALUE_REGISTER: usize = 0;

                if self.input_values[RESET_INPUT] < 0.5 {
                    self.registers[VALUE_REGISTER] +=
                        self.input_values[IN_INPUT] * self.input_values[DIFF_TIME_INPUT];
                } else {
                    self.registers[VALUE_REGISTER] = 0.0;
                }

                self.registers[VALUE_REGISTER]
            }
            ComponentType::LowerSaturator => {
                const IN_1_INPUT: usize = 1;
                const IN_2_INPUT: usize = 2;

                self.input_values[IN_1_INPUT].max(self.input_values[IN_2_INPUT])
            }
            ComponentType::Mixer => {
                const IN_1_INPUT: usize = 1;
                const IN_2_INPUT: usize = 2;

                self.input_values[IN_1_INPUT] + self.input_values[IN_2_INPUT]
            }
            ComponentType::Noise => {
                if self.input_values[DIFF_TIME_INPUT] == 0.0 {
                    self.output_value
                } else {
                    RNG.lock().unwrap().gen::<f64>() * 2.0 - 1.0
                }
            }
            ComponentType::Saw => {
                self.update_phase();
                (self.registers[Self::PHASE_REGISTER] - f64::consts::PI) / f64::consts::PI
            }
            ComponentType::Sine => {
                self.update_phase();
                self.registers[Self::PHASE_REGISTER].sin()
            }
            ComponentType::Square => {
                const DUTY_INPUT: usize = 2;

                self.update_phase();

                if self.registers[Self::PHASE_REGISTER]
                    < 2.0 * f64::consts::PI * self.input_values[DUTY_INPUT]
                {
                    1.0
                } else {
                    -1.0
                }
            }
            ComponentType::Subtractor => {
                const IN_1_INPUT: usize = 1;
                const IN_2_INPUT: usize = 2;

                self.input_values[IN_1_INPUT] - self.input_values[IN_2_INPUT]
            }
            ComponentType::Triangle => {
                self.update_phase();

                if self.registers[Self::PHASE_REGISTER] < f64::consts::PI {
                    self.registers[Self::PHASE_REGISTER] * 2.0 / f64::consts::PI - 1.0
                } else {
                    1.0 - (self.registers[Self::PHASE_REGISTER] - f64::consts::PI) * 2.0
                        / f64::consts::PI
                }
            }
            ComponentType::UpperSaturator => {
                const IN_1_INPUT: usize = 1;
                const IN_2_INPUT: usize = 2;

                self.input_values[IN_1_INPUT].min(self.input_values[IN_2_INPUT])
            }
            ComponentType::And => {
                const IN_1_INPUT: usize = 1;
                const IN_2_INPUT: usize = 2;

                if self.input_values[IN_1_INPUT] >= 0.5 && self.input_values[IN_2_INPUT] >= 0.5 {
                    1.0
                } else {
                    0.0
                }
            }
            ComponentType::Not => {
                const IN_INPUT: usize = 1;

                if self.input_values[IN_INPUT] < 0.5 {
                    1.0
                } else {
                    0.0
                }
            }
            ComponentType::Or => {
                const IN_1_INPUT: usize = 1;
                const IN_2_INPUT: usize = 2;

                if self.input_values[IN_1_INPUT] >= 0.5 || self.input_values[IN_2_INPUT] >= 0.5 {
                    1.0
                } else {
                    0.0
                }
            }
        };

        let is_changed = (self.output_value - next_output_value).abs() >= f64::EPSILON;

        self.output_value = next_output_value;
        self.input_values[DIFF_TIME_INPUT] = 0.0;

        is_changed
    }

    fn update_phase(&mut self) {
        self.registers[Self::PHASE_REGISTER] += 2.0
            * f64::consts::PI
            * self.input_values[Self::FREQUENCY_INPUT]
            * self.input_values[DIFF_TIME_INPUT];

        self.registers[0] %= 2.0 * f64::consts::PI;
    }
}
