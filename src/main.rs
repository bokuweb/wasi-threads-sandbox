use rayon::prelude::*;

fn sum_of_squares(input: &[i32]) -> i32 {
    input
        .par_iter() // <-- just change that!
        .map(|&i| i * i)
        .sum()
}

fn main() {
    let x = sum_of_squares(&[10, 20, 30, 40]);
    println!("{x}");
}
