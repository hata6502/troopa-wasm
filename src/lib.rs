pub const COMPONENT_DIFF_TIME_INDEX: usize = 0;

const COMPONENT_INPUT_LENGTH: usize = 8;
const COMPONENT_REGISTER_LENGTH: usize = 8;

use rand::Rng;
use std::cell::RefCell;
use std::collections::VecDeque;
use std::f64;
use std::rc::Weak;

pub enum ComponentType {
    Amplifier,
    Buffer,
    Differentiator,
    Divider,
    Integrator,
    LowerSaturator,
    Mixer,
    NoOperation,
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
    input_components: [Option<Weak<RefCell<Component>>>; COMPONENT_INPUT_LENGTH],
    output_value: f64,
    output_components: Vec<Weak<RefCell<Component>>>,
    registers: [f64; COMPONENT_REGISTER_LENGTH],
}

impl Component {
    pub const fn new(component_type: ComponentType) -> Self {
        const INPUT: Option<Weak<RefCell<Component>>> = None;

        Component {
            component_type,
            input_components: [INPUT; COMPONENT_REGISTER_LENGTH],
            output_value: 0.0,
            output_components: Vec::new(),
            registers: [0.0; COMPONENT_REGISTER_LENGTH],
        }
    }

    pub fn get_output_value(&self) -> f64 {
        self.output_value
    }

    pub fn set_output_value(&mut self, output_value: f64) -> Vec<Weak<RefCell<Component>>> {
        if self.output_value == output_value {
            return Vec::new();
        }

        self.output_value = output_value;

        self.output_components.clone()
    }

    fn get_input_value(&self, index: usize) -> f64 {
        self.input_components[index]
            .as_ref()
            .unwrap()
            .upgrade()
            .unwrap()
            .borrow()
            .output_value
    }

    fn sync(&mut self) -> Vec<Weak<RefCell<Component>>> {
        let output_value = match self.component_type {
            ComponentType::Amplifier => self.get_input_value(1) * self.get_input_value(2),
            ComponentType::Buffer => {
                self.registers[0] = self.get_input_value(1);

                if self.get_input_value(COMPONENT_DIFF_TIME_INDEX) == 0.0 {
                    self.output_value
                } else {
                    self.registers[0]
                }
            }
            ComponentType::Differentiator => {
                let diff_time = self.get_input_value(COMPONENT_DIFF_TIME_INDEX);

                if diff_time == 0.0 {
                    self.output_value
                } else {
                    (self.get_input_value(1) - self.output_value) / diff_time
                }
            }
            ComponentType::Divider => self.get_input_value(1) / self.get_input_value(2),
            ComponentType::Integrator => {
                self.registers[0] +=
                    self.get_input_value(1) * self.get_input_value(COMPONENT_DIFF_TIME_INDEX);
                self.registers[0]
            }
            ComponentType::LowerSaturator => self.get_input_value(1).max(self.get_input_value(2)),
            ComponentType::Mixer => self.get_input_value(1) + self.get_input_value(2),
            ComponentType::NoOperation => self.output_value,
            ComponentType::Noise => {
                if self.get_input_value(COMPONENT_DIFF_TIME_INDEX) == 0.0 {
                    self.output_value
                } else {
                    rand::thread_rng().gen::<f64>() * 2.0 - 1.0
                }
            }
            ComponentType::Saw => {
                self.registers[0] += 2.0
                    * f64::consts::PI
                    * self.get_input_value(1)
                    * self.get_input_value(COMPONENT_DIFF_TIME_INDEX);
                self.registers[0] %= 2.0 * f64::consts::PI;

                (self.registers[0] - f64::consts::PI) / f64::consts::PI
            }
            ComponentType::Sine => {
                self.registers[0] += 2.0
                    * f64::consts::PI
                    * self.get_input_value(1)
                    * self.get_input_value(COMPONENT_DIFF_TIME_INDEX);
                self.registers[0] %= 2.0 * f64::consts::PI;

                self.registers[0].sin()
            }
            ComponentType::Square => {
                self.registers[0] += 2.0
                    * f64::consts::PI
                    * self.get_input_value(1)
                    * self.get_input_value(COMPONENT_DIFF_TIME_INDEX);
                self.registers[0] %= 2.0 * f64::consts::PI;

                if self.registers[0] < f64::consts::PI {
                    1.0
                } else {
                    -1.0
                }
            }
            ComponentType::Subtractor => self.get_input_value(1) - self.get_input_value(2),
            ComponentType::Triangle => {
                self.registers[0] += 2.0
                    * f64::consts::PI
                    * self.get_input_value(1)
                    * self.get_input_value(COMPONENT_DIFF_TIME_INDEX);
                self.registers[0] %= 2.0 * f64::consts::PI;

                if self.registers[0] < f64::consts::PI {
                    self.registers[0] * 2.0 / f64::consts::PI - 1.0
                } else {
                    1.0 - (self.registers[0] - f64::consts::PI) * 2.0 / f64::consts::PI
                }
            }
            ComponentType::UpperSaturator => self.get_input_value(1).min(self.get_input_value(2)),
        };

        self.set_output_value(output_value)
    }
}

pub fn connect(
    input_index: usize,
    input_component: Weak<RefCell<Component>>,
    output_component: Weak<RefCell<Component>>,
) {
    input_component
        .upgrade()
        .unwrap()
        .borrow_mut()
        .input_components[input_index] = Some(Weak::clone(&output_component));
    output_component
        .upgrade()
        .unwrap()
        .borrow_mut()
        .output_components
        .push(input_component);
}

pub fn sync(initial_components: Vec<Weak<RefCell<Component>>>) {
    let mut sync_queue = VecDeque::new();

    sync_queue.append(&mut initial_components.into_iter().collect());

    while let Some(component) = sync_queue.pop_front() {
        let next_components = component.upgrade().unwrap().borrow_mut().sync();

        sync_queue.append(&mut next_components.into_iter().collect());
    }
}
