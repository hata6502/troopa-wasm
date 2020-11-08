const COMPONENT_INPUT_LENGTH: usize = 8;
const COMPONENT_REGISTER_LENGTH: usize = 8;

use std::cell::RefCell;
use std::rc::Weak;

pub enum ComponentType {
    Mixer,
    NoOperation,
    Sine,
}

pub struct Component {
    component_type: ComponentType,
    inputs: [Option<Weak<RefCell<Component>>>; COMPONENT_INPUT_LENGTH],
    output: f64,
    outputs: Vec<Weak<RefCell<Component>>>,
    registers: [f64; COMPONENT_REGISTER_LENGTH],
}

impl Component {
    pub const fn new(component_type: ComponentType) -> Self {
        const INPUT: Option<Weak<RefCell<Component>>> = None;

        Component {
            component_type,
            inputs: [INPUT; COMPONENT_REGISTER_LENGTH],
            output: 0.0,
            outputs: Vec::new(),
            registers: [0.0; COMPONENT_REGISTER_LENGTH],
        }
    }

    pub fn connect(
        index: usize,
        input: Weak<RefCell<Component>>,
        output: Weak<RefCell<Component>>,
    ) {
        input.upgrade().unwrap().borrow_mut().inputs[index] = Some(Weak::clone(&output));
        output.upgrade().unwrap().borrow_mut().outputs.push(input);
    }

    pub fn set_output(&mut self, output: f64) {
        println!("{0}", output);

        self.output = output;

        for output in &self.outputs {
            if let Some(output) = output.upgrade() {
                output.borrow_mut().sync();
            }
        }
    }

    fn sync(&mut self) {
        // TODO: implement each component behavior
        // TODO: use queue instead of stack
        self.set_output(1.0);
    }
}
