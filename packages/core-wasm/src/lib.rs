const COMPONENT_INPUT_LENGTH: usize = 8;
const COMPONENT_OUTPUT_LENGTH: usize = 8;
const COMPONENT_REGISTER_LENGTH: usize = 8;

const SKETCH_COMPONENT_LENGTH: usize = 1024;

const SAMPLING_RATE: f64 = 44100.0;

extern crate wasm_bindgen;

use once_cell::sync::Lazy;
use rand::Rng;
use std::collections::VecDeque;
use std::f64;
use std::sync::Mutex;
use wasm_bindgen::prelude::*;

#[derive(Clone, Copy)]
enum ComponentType {
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

#[derive(Clone, Copy)]
struct Component {
    component_type: ComponentType,
    input_values: [f64; COMPONENT_INPUT_LENGTH],
    output_value: f64,
    output_destinations: [(usize, usize); COMPONENT_OUTPUT_LENGTH],
    output_destination_length: usize,
    registers: [f64; COMPONENT_REGISTER_LENGTH],
}

impl Component {
    const DIFF_TIME_INPUT_INDEX: usize = 0;

    const fn new(component_type: ComponentType) -> Self {
        Component {
            component_type,
            input_values: [0.0; COMPONENT_REGISTER_LENGTH],
            output_value: 0.0,
            output_destinations: [(0, 0); COMPONENT_OUTPUT_LENGTH],
            output_destination_length: 0,
            registers: [0.0; COMPONENT_REGISTER_LENGTH],
        }
    }

    fn sync(&mut self) -> bool {
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

        let is_changed = (self.output_value - next_output_value).abs() >= f64::EPSILON;

        self.output_value = next_output_value;
        is_changed
    }

    fn update_phase(&mut self) {
        self.registers[0] += 2.0
            * f64::consts::PI
            * self.input_values[1]
            * self.input_values[Self::DIFF_TIME_INPUT_INDEX];

        self.registers[0] %= 2.0 * f64::consts::PI;
    }
}

#[derive(Clone, Copy)]
struct Sketch {
    components: [Component; SKETCH_COMPONENT_LENGTH],
    component_length: usize,
}

impl Sketch {
    const DIFF_TIME_COMPONENT_INDEX: usize = 0;

    fn new() -> Self {
        let mut sketch = Sketch {
            components: [Component::new(ComponentType::Distributor); SKETCH_COMPONENT_LENGTH],
            component_length: 0,
        };

        sketch.init();
        sketch
    }

    fn init(&mut self) {
        assert_eq!(
            self.create_component(ComponentType::Distributor),
            Self::DIFF_TIME_COMPONENT_INDEX
        );
    }

    fn connect(&mut self, input_destination: (usize, usize), output_component_index: usize) {
        let output_destination_index =
            self.components[output_component_index].output_destination_length;

        self.components[output_component_index].output_destinations[output_destination_index] =
            input_destination;

        self.components[output_component_index].output_destination_length += 1;
    }

    fn create_component(&mut self, component_type: ComponentType) -> usize {
        let index = self.component_length;

        self.components[index] = Component::new(component_type);
        self.component_length += 1;

        self.connect(
            (index, Component::DIFF_TIME_INPUT_INDEX),
            Self::DIFF_TIME_COMPONENT_INDEX,
        );

        index
    }

    fn get_output_value(&self, index: usize) -> f64 {
        self.components[index].output_value
    }

    fn input_value(&mut self, initial_destination: (usize, usize), value: f64) {
        self.components[initial_destination.0].input_values[initial_destination.1] = value;

        let mut sync_queue = VecDeque::new();

        sync_queue.push_back(initial_destination);

        while let Some(destination) = sync_queue.pop_front() {
            let is_changed = self.components[destination.0].sync();

            for output_destination_index in
                0..self.components[destination.0].output_destination_length
            {
                let output_destination =
                    self.components[destination.0].output_destinations[output_destination_index];

                self.components[output_destination.0].input_values[output_destination.1] =
                    self.components[destination.0].output_value;

                if is_changed {
                    sync_queue.push_back(output_destination);
                };
            }
        }
    }

    fn next_tick(&mut self) {
        self.input_value((Self::DIFF_TIME_COMPONENT_INDEX, 1), 1.0 / SAMPLING_RATE);
        self.input_value((Self::DIFF_TIME_COMPONENT_INDEX, 1), 0.0);
    }

    fn truncate(&mut self) {
        self.component_length = 0;
        self.init();
    }
}

static SKETCH: Lazy<Mutex<Sketch>> = Lazy::new(|| Mutex::new(Sketch::new()));

#[wasm_bindgen]
pub fn init() {
    let mut sketch = SKETCH.lock().unwrap();

    let sine_component_1 = sketch.create_component(ComponentType::Sine);
    let sine_component_2 = sketch.create_component(ComponentType::Sine);

    sketch.connect((sine_component_2, 1), sine_component_1);

    sketch.input_value((sine_component_1, 1), 440.0);
}

#[wasm_bindgen]
pub fn get_output_value(index: usize) -> f64 {
    SKETCH.lock().unwrap().get_output_value(index)
}

#[wasm_bindgen]
pub fn next_tick() {
    SKETCH.lock().unwrap().next_tick()
}

#[wasm_bindgen]
pub fn truncate() {
    SKETCH.lock().unwrap().truncate()
}
