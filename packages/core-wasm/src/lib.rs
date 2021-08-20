const BUFFER_SIZE: usize = 4096;

const COMPONENT_INPUT_LENGTH: usize = 8;
const COMPONENT_OUTPUT_LENGTH: usize = 8;
const COMPONENT_REGISTER_LENGTH: usize = 8;

const OUTPUT_COMPONENT_INDEXES_MAX_LENGTH: usize = 64;

const RETURN_CODE_SUCCESS: i32 = 0;
const RETURN_CODE_INFINITE_LOOP_DETECTED: i32 = 1;

const SKETCH_COMPONENT_MAX_LENGTH: usize = 4096;
const SKETCH_MAX_LOOP_COUNT: i32 = 255;

use once_cell::sync::Lazy;
use rand;
use rand::prelude::*;
use std::f64;
use std::sync::Mutex;

static BUFFER: Lazy<Mutex<[f64; BUFFER_SIZE * OUTPUT_COMPONENT_INDEXES_MAX_LENGTH]>> =
    Lazy::new(|| Mutex::new([0.0; BUFFER_SIZE * OUTPUT_COMPONENT_INDEXES_MAX_LENGTH]));

static OUTPUT_COMPONENT_INDEXES: Lazy<Mutex<[usize; OUTPUT_COMPONENT_INDEXES_MAX_LENGTH]>> =
    Lazy::new(|| Mutex::new([0; OUTPUT_COMPONENT_INDEXES_MAX_LENGTH]));

static OUTPUT_COMPONENT_INDEXES_LENGTH: Lazy<Mutex<usize>> = Lazy::new(|| Mutex::new(0));

static RNG: Lazy<Mutex<rand::rngs::StdRng>> =
    Lazy::new(|| Mutex::new(rand::SeedableRng::from_seed([0; 32])));

static SKETCH: Lazy<Mutex<Sketch>> = Lazy::new(|| Mutex::new(Sketch::new()));

#[derive(Clone, Copy)]
#[repr(C)]
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

type Destination = (usize, usize);

#[no_mangle]
pub extern "C" fn init(sample_rate: f64) {
    *OUTPUT_COMPONENT_INDEXES_LENGTH.lock().unwrap() = 0;
    SKETCH.lock().unwrap().init(sample_rate);
}

#[no_mangle]
pub extern "C" fn append_output_component_index(output_component_index: usize) {
    let mut output_component_indexes_length = OUTPUT_COMPONENT_INDEXES_LENGTH.lock().unwrap();

    OUTPUT_COMPONENT_INDEXES.lock().unwrap()[*output_component_indexes_length] =
        output_component_index;

    *output_component_indexes_length += 1;
}

#[no_mangle]
pub extern "C" fn connect(
    input_component_index: usize,
    input_input_index: usize,
    output_component_index: usize,
) {
    SKETCH.lock().unwrap().connect(
        (input_component_index, input_input_index),
        output_component_index,
    )
}

#[no_mangle]
pub extern "C" fn create_component(component_type: ComponentType) -> usize {
    SKETCH.lock().unwrap().create_component(component_type)
}

#[no_mangle]
pub extern "C" fn get_buffer_address() -> *const f64 {
    &BUFFER.lock().unwrap()[0]
}

#[no_mangle]
pub extern "C" fn input_value(component_index: usize, input_index: usize, value: f64) -> i32 {
    match SKETCH
        .lock()
        .unwrap()
        .input_values(vec![((component_index, input_index), value)])
    {
        Ok(_v) => RETURN_CODE_SUCCESS,
        Err(e) => e,
    }
}

#[no_mangle]
pub extern "C" fn process() -> i32 {
    let output_component_indexes = OUTPUT_COMPONENT_INDEXES.lock().unwrap();
    let output_component_indexes_length = OUTPUT_COMPONENT_INDEXES_LENGTH.lock().unwrap();

    let mut buffer = BUFFER.lock().unwrap();
    let mut sketch = SKETCH.lock().unwrap();

    for buffer_index in 0..BUFFER_SIZE {
        for output_component_indexes_index in 0..*output_component_indexes_length {
            buffer[(BUFFER_SIZE * output_component_indexes_index) + buffer_index] =
                sketch.get_output_value(output_component_indexes[output_component_indexes_index]);
        }

        match sketch.next_tick() {
            Ok(v) => v,
            Err(e) => return e,
        };
    }

    RETURN_CODE_SUCCESS
}

const DIFF_TIME_INPUT: usize = 0;

#[derive(Clone, Copy)]
struct Sketch {
    components: [Component; SKETCH_COMPONENT_MAX_LENGTH],
    component_length: usize,
    sample_rate: f64,
}

impl Sketch {
    const fn new() -> Self {
        Sketch {
            components: [Component::new(ComponentType::Distributor); SKETCH_COMPONENT_MAX_LENGTH],
            component_length: 0,
            sample_rate: 0.0,
        }
    }

    fn init(&mut self, sample_rate: f64) {
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

    fn get_output_value(&self, index: usize) -> f64 {
        self.components[index].output_value
    }

    fn input_values(&mut self, inputs: Vec<(Destination, f64)>) -> Result<(), i32> {
        for index in 0..self.component_length {
            self.components[index].loop_count = 0;
        }

        let mut component_indexes = Vec::new();

        for input in inputs {
            self.components[input.0 .0].input_values[input.0 .1] = input.1;
            component_indexes.push(input.0 .0);
        }

        while !component_indexes.is_empty() {
            let mut next_component_indexes = Vec::new();

            for &component_index in &component_indexes {
                self.components[component_index].loop_count += 1;

                if self.components[component_index].loop_count > SKETCH_MAX_LOOP_COUNT {
                    return Err(RETURN_CODE_INFINITE_LOOP_DETECTED + component_index as i32);
                };

                if !self.components[component_index].sync() {
                    continue;
                };

                for output_destination_index in
                    0..self.components[component_index].output_destination_length
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

    fn next_tick(&mut self) -> Result<(), i32> {
        let diff_time = 1.0 / self.sample_rate;
        let mut inputs = Vec::new();

        for index in 0..self.component_length {
            inputs.push(((index, DIFF_TIME_INPUT), diff_time));
        }

        self.input_values(inputs)
    }
}

#[derive(Clone, Copy)]
struct Component {
    component_type: ComponentType,
    input_values: [f64; COMPONENT_INPUT_LENGTH],
    loop_count: i32,
    output_value: f64,
    output_destinations: [Destination; COMPONENT_OUTPUT_LENGTH],
    output_destination_length: usize,
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

                self.input_values[IN_1_INPUT] / self.input_values[IN_2_INPUT]
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
