const COMPONENT_INPUT_LENGTH: usize = 8;
const COMPONENT_REGISTER_LENGTH: usize = 8;

extern crate wasm_bindgen;

use rand::Rng;
use std::collections::VecDeque;
use std::f64;
use wasm_bindgen::prelude::*;

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
}

pub struct Component {
    component_type: ComponentType,
    input_values: [f64; COMPONENT_INPUT_LENGTH],
    output_value: f64,
    output_indexes: Vec<(usize, usize)>,
    registers: [f64; COMPONENT_REGISTER_LENGTH],
}

impl Component {
    const DIFF_TIME_INPUT_INDEX: usize = 0;

    pub const fn new(component_type: ComponentType) -> Self {
        Component {
            component_type,
            input_values: [0.0; COMPONENT_REGISTER_LENGTH],
            output_value: 0.0,
            output_indexes: Vec::new(),
            registers: [0.0; COMPONENT_REGISTER_LENGTH],
        }
    }

    fn sync(&mut self) -> Vec<(usize, usize)> {
        let next_output_value = match self.component_type {
            ComponentType::Amplifier => self.input_values[1] * self.input_values[2],
            ComponentType::Buffer => {
                self.registers[0] = self.input_values[1];

                if self.input_values[Self::DIFF_TIME_INPUT_INDEX] == 0.0 {
                    self.output_value
                } else {
                    self.registers[0]
                }
            }
            ComponentType::Differentiator => {
                if self.input_values[Self::DIFF_TIME_INPUT_INDEX] == 0.0 {
                    self.output_value
                } else {
                    (self.input_values[1] - self.output_value)
                        / self.input_values[Self::DIFF_TIME_INPUT_INDEX]
                }
            }
            ComponentType::Distributor => self.input_values[1],
            ComponentType::Divider => self.input_values[1] / self.input_values[2],
            ComponentType::Integrator => {
                self.registers[0] +=
                    self.input_values[1] * self.input_values[Self::DIFF_TIME_INPUT_INDEX];
                self.registers[0]
            }
            ComponentType::LowerSaturator => self.input_values[1].max(self.input_values[2]),
            ComponentType::Mixer => self.input_values[1] + self.input_values[2],
            ComponentType::Noise => {
                if self.input_values[Self::DIFF_TIME_INPUT_INDEX] == 0.0 {
                    self.output_value
                } else {
                    rand::thread_rng().gen::<f64>() * 2.0 - 1.0
                }
            }
            ComponentType::Saw => {
                self.update_phase();
                (self.registers[0] - f64::consts::PI) / f64::consts::PI
            }
            ComponentType::Sine => {
                self.update_phase();
                self.registers[0].sin()
            }
            ComponentType::Square => {
                self.update_phase();

                if self.registers[0] < f64::consts::PI {
                    1.0
                } else {
                    -1.0
                }
            }
            ComponentType::Subtractor => self.input_values[1] - self.input_values[2],
            ComponentType::Triangle => {
                self.update_phase();

                if self.registers[0] < f64::consts::PI {
                    self.registers[0] * 2.0 / f64::consts::PI - 1.0
                } else {
                    1.0 - (self.registers[0] - f64::consts::PI) * 2.0 / f64::consts::PI
                }
            }
            ComponentType::UpperSaturator => self.input_values[1].min(self.input_values[2]),
        };

        if (self.output_value - next_output_value).abs() < f64::EPSILON {
            return Vec::new();
        };

        self.output_value = next_output_value;
        self.output_indexes.clone()
    }

    fn update_phase(&mut self) {
        self.registers[0] += 2.0
            * f64::consts::PI
            * self.input_values[1]
            * self.input_values[Self::DIFF_TIME_INPUT_INDEX];

        self.registers[0] %= 2.0 * f64::consts::PI;
    }
}

pub struct Sketch {
    components: Vec<Component>,
    sampling_rate: f64,
}

impl Sketch {
    const DIFF_TIME_COMPONENT_INDEX: usize = 0;

    pub fn new(sampling_rate: f64) -> Self {
        let mut sketch = Sketch {
            components: Vec::new(),
            sampling_rate,
        };

        assert_eq!(
            sketch.create_component(ComponentType::Distributor),
            Self::DIFF_TIME_COMPONENT_INDEX
        );

        sketch
    }

    pub fn connect(&mut self, input_index: (usize, usize), output_component_index: usize) {
        self.components[output_component_index]
            .output_indexes
            .push(input_index);
    }

    pub fn create_component(&mut self, component_type: ComponentType) -> usize {
        let index = self.components.len();

        self.components.push(Component::new(component_type));

        self.connect(
            (index, Component::DIFF_TIME_INPUT_INDEX),
            Self::DIFF_TIME_COMPONENT_INDEX,
        );

        index
    }

    pub fn get_output_value(&self, index: usize) -> f64 {
        self.components[index].output_value
    }

    pub fn input_value(&mut self, index: (usize, usize), value: f64) {
        self.components[index.0].input_values[index.1] = value;

        let mut sync_queue = VecDeque::new();

        sync_queue.push_back(index);

        while let Some(index) = sync_queue.pop_front() {
            let next_indexes = self.components[index.0].sync();

            for next_index in &next_indexes {
                self.components[next_index.0].input_values[next_index.1] =
                    self.components[index.0].output_value;
            }

            sync_queue.append(&mut next_indexes.into_iter().collect());
        }
    }

    pub fn next_tick(&mut self) {
        self.input_value(
            (Self::DIFF_TIME_COMPONENT_INDEX, 1),
            1.0 / self.sampling_rate,
        );

        self.input_value((Self::DIFF_TIME_COMPONENT_INDEX, 1), 0.0);
    }
}
