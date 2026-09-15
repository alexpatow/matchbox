use burn::{
    module::{Initializer, Module},
    nn::{Embedding, EmbeddingConfig, Linear, LinearConfig},
    record::{BinBytesRecorder, FullPrecisionSettings, Recorder},
    tensor::{Int, Tensor, TensorData, activation, backend::Backend},
};
use serde::{Deserialize, Serialize};

pub type Cpu = burn::backend::Flex;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ModelConfig {
    pub vocabulary_size: usize,
    pub label_count: usize,
}

impl ModelConfig {
    pub fn validate(&self) -> Result<(), String> {
        if !(3..=10002).contains(&self.vocabulary_size) || !(2..=64).contains(&self.label_count) {
            return Err("Unsupported vocabulary or label count".into());
        }
        Ok(())
    }

    pub fn parameters(&self) -> usize {
        self.vocabulary_size * 8 + 24 * 16 + 16 + 16 * self.label_count + self.label_count
    }
}

#[derive(Module, Debug)]
pub struct Model<B: Backend> {
    embedding: Embedding<B>,
    hidden: Linear<B>,
    output: Linear<B>,
}

impl<B: Backend> Model<B> {
    pub fn new(config: &ModelConfig, device: &B::Device) -> Self {
        Self {
            embedding: EmbeddingConfig::new(config.vocabulary_size, 8)
                .with_initializer(Initializer::Uniform {
                    min: -0.1,
                    max: 0.1,
                })
                .init(device),
            hidden: LinearConfig::new(24, 16)
                .with_initializer(Initializer::XavierUniform { gain: 1.0 })
                .init(device),
            output: LinearConfig::new(16, config.label_count)
                .with_initializer(Initializer::XavierUniform { gain: 1.0 })
                .init(device),
        }
    }

    pub fn forward(&self, input: Tensor<B, 2, Int>) -> Tensor<B, 2> {
        let features = self.embedding.forward(input).flatten(1, 2);
        self.output.forward(self.hidden.forward(features).tanh())
    }

    pub fn save(&self) -> Result<Vec<u8>, String> {
        BinBytesRecorder::<FullPrecisionSettings>::default()
            .record(
                self.clone()
                    .map(&mut crate::artifact::CanonicalIds::default())
                    .into_record(),
                (),
            )
            .map_err(|error| error.to_string())
    }

    pub fn load(config: &ModelConfig, bytes: Vec<u8>, device: &B::Device) -> Result<Self, String> {
        config.validate()?;
        let record = BinBytesRecorder::<FullPrecisionSettings>::default()
            .load(bytes, device)
            .map_err(|error| error.to_string())?;
        let model = Self::new(config, device).load_record(record);
        if model.embedding.weight.val().dims() != [config.vocabulary_size, 8]
            || model.hidden.weight.val().dims() != [24, 16]
            || model.output.weight.val().dims() != [16, config.label_count]
            || model.hidden.bias.as_ref().map(|bias| bias.val().dims()) != Some([16])
            || model.output.bias.as_ref().map(|bias| bias.val().dims())
                != Some([config.label_count])
        {
            return Err("Burn record dimensions do not match the task".into());
        }
        Ok(model)
    }
}

pub fn inputs<B: Backend>(values: Vec<i32>, device: &B::Device) -> Tensor<B, 2, Int> {
    let rows = values.len() / 3;
    Tensor::from_data(TensorData::new(values, [rows, 3]), device)
}

pub fn validate_inputs(config: &ModelConfig, values: &[i32]) -> Result<(), String> {
    if values.is_empty() || !values.len().is_multiple_of(3) || values.len() > 3_000_000 {
        return Err("Expected a nonempty batch of three-token windows".into());
    }
    if values
        .iter()
        .any(|&id| id < 0 || id as usize >= config.vocabulary_size)
    {
        return Err("Token ID is outside the model vocabulary".into());
    }
    Ok(())
}

pub fn predict(
    model: &Model<Cpu>,
    config: &ModelConfig,
    values: Vec<i32>,
) -> Result<Vec<f32>, String> {
    validate_inputs(config, &values)?;
    let scores = activation::softmax(model.forward(inputs(values, &Default::default())), 1)
        .into_data()
        .to_vec::<f32>()
        .map_err(|error| error.to_string())?;
    if scores.iter().any(|score| !score.is_finite()) {
        return Err("Model produced non-finite scores".into());
    }
    Ok(scores)
}
