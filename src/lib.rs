const COMPONENT_INPUT_LENGTH: usize = 8;
const COMPONENT_REGISTER_LENGTH: usize = 8;

pub enum ComponentType {
    Mixer,
    Sine,
}

pub struct Component<'a> {
    pub component_type: ComponentType,
    inputs: [Option<&'a Component<'a>>; COMPONENT_INPUT_LENGTH],
    registers: [f64; COMPONENT_REGISTER_LENGTH],
}

impl Component<'_> {
    pub const fn new() -> Self {
        Component {
            // TODO: use NOP component
            component_type: ComponentType::Mixer,
            inputs: [None; COMPONENT_REGISTER_LENGTH],
            registers: [0.0; COMPONENT_REGISTER_LENGTH],
        }
    }

    pub fn connect(&mut self, component: &'static Component, index: usize) {
        self.inputs[index] = Some(component);
    }
}
