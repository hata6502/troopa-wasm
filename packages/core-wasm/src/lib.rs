const COMPONENT_INPUT_LENGTH: usize = 8;
const COMPONENT_OUTPUT_LENGTH: usize = 8;
const COMPONENT_REGISTER_LENGTH: usize = 8;

const SKETCH_COMPONENT_LENGTH: usize = 1024;
const SKETCH_MAX_LOOP_COUNT: i32 = 255;

extern crate wasm_bindgen;

use once_cell::sync::Lazy;
use rand::Rng;
use std::collections::VecDeque;
use std::f32;
use std::sync::Mutex;
use wasm_bindgen::prelude::*;

static SKETCH: Lazy<Mutex<Sketch>> = Lazy::new(|| Mutex::new(Sketch::new()));

#[wasm_bindgen]
#[derive(Clone, Copy)]
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

type Destination = (usize, usize);

#[wasm_bindgen]
pub fn init(sample_rate: f32) {
    SKETCH.lock().unwrap().init(sample_rate)
}

#[wasm_bindgen]
pub fn connect(
    input_component_index: usize,
    input_input_index: usize,
    output_component_index: usize,
) {
    SKETCH.lock().unwrap().connect(
        (input_component_index, input_input_index),
        output_component_index,
    )
}

#[wasm_bindgen]
pub fn create_component(component_type: ComponentType) -> usize {
    SKETCH.lock().unwrap().create_component(component_type)
}

#[wasm_bindgen(catch)]
pub fn input_value(component_index: usize, input_index: usize, value: f32) -> Result<(), JsValue> {
    SKETCH
        .lock()
        .unwrap()
        .input_values(vec![((component_index, input_index), value)])
}

#[wasm_bindgen(catch)]
pub fn process(buffer_size: usize, output_component_index: usize) -> Result<Vec<f32>, JsValue> {
    let mut sketch = SKETCH.lock().unwrap();
    let mut buffer = Vec::<f32>::new();

    for _index in 0..buffer_size {
        buffer.push(sketch.get_output_value(output_component_index));

        match sketch.next_tick() {
            Ok(v) => v,
            Err(e) => return Err(e),
        };
    }

    Ok(buffer)
}

const DIFF_TIME_INPUT: usize = 0;

#[derive(Clone, Copy)]
struct Sketch {
    components: [Component; SKETCH_COMPONENT_LENGTH],
    component_length: usize,
    sample_rate: f32,
}

impl Sketch {
    const fn new() -> Self {
        Sketch {
            components: [Component::new(ComponentType::Distributor); SKETCH_COMPONENT_LENGTH],
            component_length: 0,
            sample_rate: 0.0,
        }
    }

    fn init(&mut self, sample_rate: f32) {
        self.component_length = 0;
        self.sample_rate = sample_rate;
    }

    fn connect(&mut self, input_destination: Destination, output_component_index: usize) {
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

        index
    }

    fn get_output_value(&self, index: usize) -> f32 {
        self.components[index].output_value
    }

    fn input_values(&mut self, inputs: Vec<(Destination, f32)>) -> Result<(), JsValue> {
        for index in 0..self.component_length {
            self.components[index].loop_count = 0;
        }

        let mut sync_queue = VecDeque::new();

        for input in inputs {
            self.components[input.0 .0].input_values[input.0 .1] = input.1;
            sync_queue.push_back(input.0);
        }

        while let Some(destination) = sync_queue.pop_front() {
            let is_changed = self.components[destination.0].sync();

            self.components[destination.0].loop_count += 1;

            if self.components[destination.0].loop_count > SKETCH_MAX_LOOP_COUNT {
                return Err(JsValue::from_str("CoreInfiniteLoopDetected"));
            }

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

        Ok(())
    }

    fn next_tick(&mut self) -> Result<(), JsValue> {
        let diff_time = 1.0 / self.sample_rate;
        let mut inputs = Vec::new();

        for index in 0..self.component_length {
            inputs.push(((index, DIFF_TIME_INPUT), diff_time));
        }

        match self.input_values(inputs) {
            Ok(v) => v,
            Err(e) => return Err(e),
        };

        let mut inputs = Vec::new();

        for index in 0..self.component_length {
            inputs.push(((index, DIFF_TIME_INPUT), 0.0));
        }

        self.input_values(inputs)
    }
}

#[derive(Clone, Copy)]
struct Component {
    component_type: ComponentType,
    input_values: [f32; COMPONENT_INPUT_LENGTH],
    loop_count: i32,
    output_value: f32,
    output_destinations: [Destination; COMPONENT_OUTPUT_LENGTH],
    output_destination_length: usize,
    registers: [f32; COMPONENT_REGISTER_LENGTH],
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
            output_destinations: [(0, 0); COMPONENT_OUTPUT_LENGTH],
            output_destination_length: 0,
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

                if self.input_values[DIFF_TIME_INPUT] == 0.0 {
                    self.output_value
                } else {
                    (self.input_values[IN_INPUT] - self.output_value)
                        / self.input_values[DIFF_TIME_INPUT]
                }
            }
            ComponentType::Distributor => {
                const IN_INPUT: usize = 1;

                self.input_values[IN_INPUT]
            }
            ComponentType::Divider => {
                const IN_1_INPUT: usize = 1;
                const IN_2_INPUT: usize = 2;

                self.input_values[IN_1_INPUT] / self.input_values[IN_2_INPUT]
            }
            ComponentType::Integrator => {
                const IN_INPUT: usize = 1;

                const VALUE_REGISTER: usize = 0;

                self.registers[VALUE_REGISTER] +=
                    self.input_values[IN_INPUT] * self.input_values[DIFF_TIME_INPUT];

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
                    rand::thread_rng().gen::<f32>() * 2.0 - 1.0
                }
            }
            ComponentType::Saw => {
                self.update_phase();
                (self.registers[Self::PHASE_REGISTER] - f32::consts::PI) / f32::consts::PI
            }
            ComponentType::Sine => {
                self.update_phase();
                self.registers[Self::PHASE_REGISTER].sin()
            }
            ComponentType::Square => {
                self.update_phase();

                if self.registers[Self::PHASE_REGISTER] < f32::consts::PI {
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

                if self.registers[Self::PHASE_REGISTER] < f32::consts::PI {
                    self.registers[Self::PHASE_REGISTER] * 2.0 / f32::consts::PI - 1.0
                } else {
                    1.0 - (self.registers[Self::PHASE_REGISTER] - f32::consts::PI) * 2.0
                        / f32::consts::PI
                }
            }
            ComponentType::UpperSaturator => {
                const IN_1_INPUT: usize = 1;
                const IN_2_INPUT: usize = 2;

                self.input_values[IN_1_INPUT].min(self.input_values[IN_2_INPUT])
            }
        };

        let is_changed = (self.output_value - next_output_value).abs() >= f32::EPSILON;

        self.output_value = next_output_value;
        is_changed
    }

    fn update_phase(&mut self) {
        self.registers[Self::PHASE_REGISTER] += 2.0
            * f32::consts::PI
            * self.input_values[Self::FREQUENCY_INPUT]
            * self.input_values[DIFF_TIME_INPUT];

        self.registers[0] %= 2.0 * f32::consts::PI;
    }
}
