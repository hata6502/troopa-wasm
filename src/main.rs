const COMPONENT_LENGTH: usize = 4096;

use synthesizer_core::*;

const COMPONENT: Component = Component::new();
static mut COMPONENTS: [Component; COMPONENT_LENGTH] = [COMPONENT; COMPONENT_LENGTH];

fn main() {
    unsafe {
        COMPONENTS[0].component_type = ComponentType::Mixer;
        COMPONENTS[1].component_type = ComponentType::Sine;

        COMPONENTS[0].connect(&COMPONENTS[1], 0);
    }
}
