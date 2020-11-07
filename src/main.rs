use std::cell::RefCell;
use std::rc::Rc;
use synthesizer_core::*;

fn main() {
    let mut components = Vec::new();

    components.push(Rc::new(RefCell::new(Component::new(ComponentType::Mixer))));
    components.push(Rc::new(RefCell::new(Component::new(ComponentType::Mixer))));

    Component::connect(
        2,
        Rc::downgrade(&components[0]),
        Rc::downgrade(&components[1]),
    );
    Component::connect(
        2,
        Rc::downgrade(&components[1]),
        Rc::downgrade(&components[0]),
    );
}
