use std::cell::RefCell;
use std::rc::Rc;
use synthesizer_core::*;

fn main() {
    let mut components = Vec::new();

    components.push(Rc::new(RefCell::new(Component::new(
        ComponentType::NoOperation,
    ))));
    components.push(Rc::new(RefCell::new(Component::new(ComponentType::Mixer))));
    components.push(Rc::new(RefCell::new(Component::new(ComponentType::Mixer))));

    Component::connect(
        0,
        Rc::downgrade(&components[1]),
        Rc::downgrade(&components[0]),
    );

    Component::connect(
        1,
        Rc::downgrade(&components[1]),
        Rc::downgrade(&components[0]),
    );

    Component::connect(
        0,
        Rc::downgrade(&components[2]),
        Rc::downgrade(&components[1]),
    );

    Component::connect(
        1,
        Rc::downgrade(&components[2]),
        Rc::downgrade(&components[1]),
    );

    components[0].borrow_mut().set_output(1.0);
}
