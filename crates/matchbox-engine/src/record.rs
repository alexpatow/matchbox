use crate::model::Cpu;
use burn::{
    module::{Initializer, Module},
    nn::{Linear, LinearConfig},
    record::{BinBytesRecorder, FullPrecisionSettings, Recorder},
    tensor::{Tensor, TensorData, activation, backend::Backend},
};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RecordConfig {
    pub vocabulary_size: usize,
    pub fields: Vec<usize>,
}
impl RecordConfig {
    pub fn validate(&self) -> Result<(), String> {
        if !(1..=10000).contains(&self.vocabulary_size)
            || self.fields.is_empty()
            || self.fields.len() > 32
            || self.fields.iter().any(|n| !(1..=256).contains(n))
        {
            return Err("Unsupported record dimensions".into());
        }
        Ok(())
    }
    pub fn validate_inputs(&self, values: &[f32]) -> Result<(), String> {
        self.validate()?;
        if values.is_empty()
            || !values.len().is_multiple_of(self.vocabulary_size)
            || values.len() > 10_000_000
            || values.iter().any(|v| !v.is_finite())
        {
            return Err("Expected finite record features aligned with the vocabulary".into());
        }
        Ok(())
    }
}
#[derive(Module, Debug)]
pub struct RecordModel<B: Backend> {
    hidden: Linear<B>,
    output: Linear<B>,
}
impl<B: Backend> RecordModel<B> {
    pub fn new(config: &RecordConfig, device: &B::Device) -> Self {
        Self {
            hidden: LinearConfig::new(config.vocabulary_size, 32)
                .with_initializer(Initializer::XavierUniform { gain: 1.0 })
                .init(device),
            output: LinearConfig::new(32, config.fields.iter().sum())
                .with_initializer(Initializer::XavierUniform { gain: 1.0 })
                .init(device),
        }
    }
    pub fn forward(&self, input: Tensor<B, 2>) -> Tensor<B, 2> {
        self.output.forward(self.hidden.forward(input).tanh())
    }
    pub fn save(&self) -> Result<Vec<u8>, String> {
        BinBytesRecorder::<FullPrecisionSettings>::default()
            .record(
                self.clone()
                    .map(&mut crate::artifact::CanonicalIds::default())
                    .into_record(),
                (),
            )
            .map_err(|e| e.to_string())
    }
    pub fn load(
        config: &RecordConfig,
        weights: Vec<u8>,
        device: &B::Device,
    ) -> Result<Self, String> {
        config.validate()?;
        let record = BinBytesRecorder::<FullPrecisionSettings>::default()
            .load(weights, device)
            .map_err(|e| e.to_string())?;
        let model = Self::new(config, device).load_record(record);
        let outputs: usize = config.fields.iter().sum();
        if model.hidden.weight.val().dims() != [config.vocabulary_size, 32]
            || model.output.weight.val().dims() != [32, outputs]
            || model.hidden.bias.as_ref().map(|b| b.val().dims()) != Some([32])
            || model.output.bias.as_ref().map(|b| b.val().dims()) != Some([outputs])
        {
            return Err("Burn record dimensions do not match the task".into());
        }
        Ok(model)
    }
}
pub fn inputs<B: Backend>(
    config: &RecordConfig,
    values: Vec<f32>,
    device: &B::Device,
) -> Tensor<B, 2> {
    let rows = values.len() / config.vocabulary_size;
    Tensor::from_data(
        TensorData::new(values, [rows, config.vocabulary_size]),
        device,
    )
}
pub fn predict(
    model: &RecordModel<Cpu>,
    config: &RecordConfig,
    values: Vec<f32>,
) -> Result<Vec<f32>, String> {
    config.validate_inputs(&values)?;
    let rows = values.len() / config.vocabulary_size;
    let logits = model.forward(inputs(config, values, &Default::default()));
    let mut offset = 0;
    let heads = config
        .fields
        .iter()
        .map(|count| {
            let head =
                activation::softmax(logits.clone().slice([0..rows, offset..offset + count]), 1);
            offset += count;
            head
        })
        .collect();
    let scores = Tensor::cat(heads, 1)
        .into_data()
        .to_vec::<f32>()
        .map_err(|e| e.to_string())?;
    if scores.iter().any(|v| !v.is_finite()) {
        return Err("Model produced non-finite scores".into());
    }
    Ok(scores)
}
