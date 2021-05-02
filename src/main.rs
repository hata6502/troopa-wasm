use synthesizer_core::*;

fn main() {
    let mut sketch = Sketch::new(44100.0);

    let sine_1_index = sketch.create_component(ComponentType::Sine);
    let sine_2_index = sketch.create_component(ComponentType::Sine);

    sketch.connect((sine_2_index, 1), sine_1_index);

    sketch.input_value((sine_1_index, 1), 440.0);
    println!("{}", sketch.get_output_value(sine_1_index));
    println!("{}", sketch.get_output_value(sine_2_index));

    sketch.next_tick();
    println!("{}", sketch.get_output_value(sine_1_index));
    println!("{}", sketch.get_output_value(sine_2_index));

    sketch.next_tick();
    println!("{}", sketch.get_output_value(sine_1_index));
    println!("{}", sketch.get_output_value(sine_2_index));
}
