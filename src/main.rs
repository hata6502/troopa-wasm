use std::cell::RefCell;
use std::rc::Rc;
use synthesizer_core::*;

fn main() {
    let mut components = Vec::new();

    components.push(Rc::new(RefCell::new(Component::new(ComponentType::Mixer))));
    components.push(Rc::new(RefCell::new(Component::new(ComponentType::Mixer))));

    println!("{0}", components.len());

    components[0]
        .borrow_mut()
        .connect(Rc::downgrade(&components[1]), 2);
}
