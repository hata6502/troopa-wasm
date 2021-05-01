use std::cell::RefCell;
use std::rc::Rc;
use synthesizer_core::*;

fn main() {
    let mut components = Vec::new();

    components.push(Rc::new(RefCell::new(Component::new(
        ComponentType::NoOperation,
    ))));
    components.push(Rc::new(RefCell::new(Component::new(ComponentType::Sine))));

    connect(
        1,
        Rc::downgrade(&components[1]),
        Rc::downgrade(&components[0]),
    );

    let sampling_rate = 44100.0;
    let diff_time_component = Rc::new(RefCell::new(Component::new(ComponentType::NoOperation)));

    for component in &components {
        connect(
            COMPONENT_DIFF_TIME_INDEX,
            Rc::downgrade(component),
            Rc::downgrade(&diff_time_component),
        );
    }

    let components_for_sync = components[0].borrow_mut().set_output_value(440.0);

    sync(components_for_sync);
    println!("{}", components[1].borrow().get_output_value());

    let components_for_sync = diff_time_component
        .borrow_mut()
        .set_output_value(1.0 / sampling_rate);

    sync(components_for_sync);
    println!("{}", components[1].borrow().get_output_value());

    let components_for_sync = diff_time_component.borrow_mut().set_output_value(0.0);

    sync(components_for_sync);
    println!("{}", components[1].borrow().get_output_value());

    let components_for_sync = diff_time_component
        .borrow_mut()
        .set_output_value(1.0 / sampling_rate);

    sync(components_for_sync);
    println!("{}", components[1].borrow().get_output_value());

    let components_for_sync = diff_time_component.borrow_mut().set_output_value(0.0);

    sync(components_for_sync);
    println!("{}", components[1].borrow().get_output_value());
}
