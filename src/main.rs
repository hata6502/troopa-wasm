mod synthesizer_core {
    const COMPONENT_IN_PORT_LENGTH: usize = 8;
    const COMPONENT_REGISTER_LENGTH: usize = 8;

    pub enum ComponentType {
        Mixer,
        Sine,
    }

    pub struct Component<'a> {
        component_type: ComponentType,
        in_ports: [InPort<'a>; COMPONENT_IN_PORT_LENGTH],
        out_port: OutPort<'a>,
        registers: [f64; COMPONENT_REGISTER_LENGTH],
    }

    struct InPort<'a> {
        component: &'a Component<'a>,
        out_port: &'a OutPort<'a>,
    }

    struct OutPort<'a> {
        pub in_ports: Vec<&'a InPort<'a>>,
        value: f64,
    }
}

fn main() {
    let component = synthesizer_core::Component {
        component_type: synthesizer_core::ComponentType::Mixer,
        in_ports: 0,
        out_port: 0,
        registers: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    };
}
