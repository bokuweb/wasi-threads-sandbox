use std::thread;

fn main() {
    let mut x = 10;
    thread::scope(|s| {
        s.spawn(|| {
            x += 20;
        });
    });
    println!("{x}");
}
