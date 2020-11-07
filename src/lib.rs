const COMPONENT_INPUT_LENGTH: usize = 8;
const COMPONENT_REGISTER_LENGTH: usize = 8;

use std::cell::RefCell;
use std::rc::Weak;

pub enum ComponentType {
    Mixer,
    Sine,
}

pub struct Component {
    component_type: ComponentType,
    inputs: [Option<Weak<RefCell<Component>>>; COMPONENT_INPUT_LENGTH],
    outputs: Vec<Weak<RefCell<Component>>>,
    registers: [f64; COMPONENT_REGISTER_LENGTH],
}

impl Component {
    pub const fn new(component_type: ComponentType) -> Self {
        const INPUT: Option<Weak<RefCell<Component>>> = None;

        Component {
            component_type,
            inputs: [INPUT; COMPONENT_REGISTER_LENGTH],
            outputs: Vec::new(),
            registers: [0.0; COMPONENT_REGISTER_LENGTH],
        }
    }

    pub fn connect(
        index: usize,
        input: Weak<RefCell<Component>>,
        output: Weak<RefCell<Component>>,
    ) {
        // TODO: disconnect prev connection
        input.upgrade().unwrap().borrow_mut().inputs[index] = Some(Weak::clone(&output));
        output.upgrade().unwrap().borrow_mut().outputs.push(input);
    }
}
