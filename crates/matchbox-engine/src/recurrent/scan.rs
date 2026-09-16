//! Parallel composition of h[t] = decay[t] * h[t-1] + update[t].
//! Inspired by gpu-lexer's MIT-licensed bidirectional affine scan (Shu Ding).
use burn::tensor::{Tensor, backend::Backend};

pub fn scan<B: Backend>(mut decay: Tensor<B, 3>, mut update: Tensor<B, 3>) -> Tensor<B, 3> {
    let [batch, length, hidden] = decay.dims();
    let device = decay.device();
    let mut distance = 1;
    while distance < length {
        let previous_decay = Tensor::cat(
            vec![
                Tensor::ones([batch, distance, hidden], &device),
                decay
                    .clone()
                    .slice([0..batch, 0..length - distance, 0..hidden]),
            ],
            1,
        );
        let previous_update = Tensor::cat(
            vec![
                Tensor::zeros([batch, distance, hidden], &device),
                update
                    .clone()
                    .slice([0..batch, 0..length - distance, 0..hidden]),
            ],
            1,
        );
        update = update + decay.clone() * previous_update;
        decay = decay * previous_decay;
        distance *= 2;
    }
    update
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::Cpu;
    use burn::tensor::TensorData;

    #[test]
    fn scan_matches_serial_recurrence_across_non_power_of_two_length() {
        let device = Default::default();
        let decay = Tensor::<Cpu, 3>::from_data(TensorData::new(vec![0.5; 5], [1, 5, 1]), &device);
        let update = Tensor::from_data(
            TensorData::new(vec![1.0, 2.0, 0.0, 4.0, 5.0], [1, 5, 1]),
            &device,
        );
        let actual = scan(decay, update).into_data().to_vec::<f32>().unwrap();
        assert_eq!(actual, vec![1.0, 2.5, 1.25, 4.625, 7.3125]);
    }

    #[test]
    fn loss_reaches_updates_outside_the_local_neighborhood() {
        type Train = burn::backend::Autodiff<Cpu>;
        let device = Default::default();
        let decay = Tensor::<Train, 3>::full([1, 33, 1], 0.9, &device);
        let update = Tensor::<Train, 3>::ones([1, 33, 1], &device).require_grad();
        let loss = scan(decay, update.clone())
            .slice([0..1, 32..33, 0..1])
            .sum();
        let gradients = loss.backward();
        let gradient = update
            .grad(&gradients)
            .unwrap()
            .into_data()
            .to_vec::<f32>()
            .unwrap();
        assert!((gradient[0] - 0.9f32.powi(32)).abs() < 1e-6);
        assert_eq!(gradient[32], 1.0);
    }
}
