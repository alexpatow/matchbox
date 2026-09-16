#[cfg(feature = "training")]
pub mod data;
pub mod model;
mod scan;
#[cfg(feature = "training")]
pub mod training;
use crate::model::Cpu;
use burn::tensor::{Tensor, TensorData, activation};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Config {
    pub feature_count: usize,
    pub label_count: usize,
    pub max_parts: usize,
}
impl Config {
    pub fn validate(&self) -> Result<(), String> {
        if !(2..=4096).contains(&self.feature_count)
            || !(2..=64).contains(&self.label_count)
            || !(1..=65536).contains(&self.max_parts)
        {
            return Err("Unsupported recurrent feature, label, or sequence size".into());
        }
        Ok(())
    }
    pub fn validate_inputs(&self, inputs: &[i32]) -> Result<usize, String> {
        self.validate()?;
        let parts = inputs.len() / 16;
        if parts == 0
            || parts > self.max_parts
            || !inputs.len().is_multiple_of(16)
            || inputs
                .iter()
                .any(|&id| id < 0 || id as usize >= self.feature_count)
            || inputs
                .as_chunks::<16>()
                .0
                .iter()
                .any(|part| part.iter().all(|&id| id == 0))
        {
            return Err(
                "Expected nonempty bounded sequences of 16 categorical feature slots".into(),
            );
        }
        Ok(parts)
    }
}
pub fn predict(
    model: &model::Model<Cpu>,
    config: &Config,
    inputs: Vec<i32>,
) -> Result<Vec<f32>, String> {
    let parts = config.validate_inputs(&inputs)?;
    let device = Default::default();
    let input = Tensor::from_data(TensorData::new(inputs, [1, parts, 16]), &device);
    let mask = Tensor::ones([1, parts, 1], &device);
    let scores = activation::softmax(model.forward(input, mask), 2)
        .into_data()
        .to_vec::<f32>()
        .map_err(|error| error.to_string())?;
    if scores.iter().any(|score| !score.is_finite()) {
        return Err("Non-finite recurrent prediction".into());
    }
    Ok(scores)
}

#[cfg(all(test, feature = "training"))]
mod tests;
