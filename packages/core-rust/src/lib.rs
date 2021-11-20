const BUFFER_SIZE: usize = 4096;
const OUTPUT_COMPONENT_INDEXES_MAX_LENGTH: usize = 64;

extern crate wasm_bindgen;

use once_cell::sync::Lazy;
use std::f64;
use std::sync::Mutex;
use wasm_bindgen::prelude::*;

mod sketch;

use sketch::*;

static BUFFER: Lazy<Mutex<[f64; BUFFER_SIZE * OUTPUT_COMPONENT_INDEXES_MAX_LENGTH]>> =
    Lazy::new(|| Mutex::new([0.0; BUFFER_SIZE * OUTPUT_COMPONENT_INDEXES_MAX_LENGTH]));

static OUTPUT_COMPONENT_INDEXES: Lazy<Mutex<[usize; OUTPUT_COMPONENT_INDEXES_MAX_LENGTH]>> =
    Lazy::new(|| Mutex::new([0; OUTPUT_COMPONENT_INDEXES_MAX_LENGTH]));

static OUTPUT_COMPONENT_INDEXES_LENGTH: Lazy<Mutex<usize>> = Lazy::new(|| Mutex::new(0));

static SKETCH: Lazy<Mutex<Sketch>> = Lazy::new(|| Mutex::new(Sketch::new()));

#[wasm_bindgen]
pub enum InterfaceComponentType {
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

#[wasm_bindgen]
pub fn initialize(sample_rate: f64) {
    *OUTPUT_COMPONENT_INDEXES_LENGTH.lock().unwrap() = 0;
    SKETCH.lock().unwrap().init(sample_rate);
}

#[wasm_bindgen]
pub fn append_output_component_index(output_component_index: usize) {
    let mut output_component_indexes_length = OUTPUT_COMPONENT_INDEXES_LENGTH.lock().unwrap();

    OUTPUT_COMPONENT_INDEXES.lock().unwrap()[*output_component_indexes_length] =
        output_component_index;

    *output_component_indexes_length += 1;
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
pub fn create_component(interface_component_type: InterfaceComponentType) -> usize {
    let component_type = match interface_component_type {
        InterfaceComponentType::Amplifier => ComponentType::Amplifier,
        InterfaceComponentType::Buffer => ComponentType::Buffer,
        InterfaceComponentType::Differentiator => ComponentType::Differentiator,
        InterfaceComponentType::Distributor => ComponentType::Distributor,
        InterfaceComponentType::Divider => ComponentType::Divider,
        InterfaceComponentType::Integrator => ComponentType::Integrator,
        InterfaceComponentType::LowerSaturator => ComponentType::LowerSaturator,
        InterfaceComponentType::Mixer => ComponentType::Mixer,
        InterfaceComponentType::Noise => ComponentType::Noise,
        InterfaceComponentType::Saw => ComponentType::Saw,
        InterfaceComponentType::Sine => ComponentType::Sine,
        InterfaceComponentType::Square => ComponentType::Square,
        InterfaceComponentType::Subtractor => ComponentType::Subtractor,
        InterfaceComponentType::Triangle => ComponentType::Triangle,
        InterfaceComponentType::UpperSaturator => ComponentType::UpperSaturator,
        InterfaceComponentType::And => ComponentType::And,
        InterfaceComponentType::Not => ComponentType::Not,
        InterfaceComponentType::Or => ComponentType::Or,
    };

    SKETCH.lock().unwrap().create_component(component_type)
}

#[wasm_bindgen]
pub fn get_buffer() -> Vec<f64> {
    BUFFER.lock().unwrap().iter().cloned().collect()
}

#[wasm_bindgen]
pub fn input_value(component_index: usize, input_index: usize, value: f64) -> i32 {
    match SKETCH
        .lock()
        .unwrap()
        .input_values(vec![((component_index, input_index), value)])
    {
        Ok(_v) => RETURN_CODE_SUCCESS,
        Err(e) => e,
    }
}

#[wasm_bindgen]
pub fn process() -> i32 {
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
