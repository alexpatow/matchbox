use super::{
    Config,
    data::{Data, batch},
    model::Model,
};
use crate::model::Cpu;
use burn::{
    module::{AutodiffModule, Module},
    optim::{AdamConfig, GradientsParams, Optimizer},
    tensor::{activation, backend::Backend},
};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Options {
    pub epochs: usize,
    pub learning_rate: f64,
    pub batch_parts: usize,
}
pub struct Result {
    pub weights: Vec<u8>,
    pub parameters: usize,
    pub loss: Vec<f32>,
    pub validation_accuracy: Vec<f64>,
    pub selected_epoch: usize,
}
fn accuracy(model: &Model<Cpu>, data: &Data, labels: usize) -> f64 {
    let mut correct = 0.0f64;
    let mut support = 0.0f64;
    for index in 0..data.len() {
        let batch = batch(data, &[index], labels, &Default::default());
        let predictions = model
            .forward(batch.inputs, batch.mask)
            .argmax(2)
            .into_data()
            .to_vec::<i32>()
            .unwrap();
        let start = data.offsets[index] as usize;
        let end = data.offsets[index + 1] as usize;
        for (counts, prediction) in data.targets[start * labels..end * labels]
            .chunks_exact(labels)
            .zip(predictions)
        {
            correct += counts[prediction as usize] as f64;
            support += counts.iter().map(|&x| x as f64).sum::<f64>();
        }
    }
    correct / support
}
pub fn train(
    config: Config,
    options: Options,
    training: Data,
    validation: Data,
    progress: impl Fn(usize, f32),
) -> std::result::Result<Result, String> {
    training.validate(&config)?;
    validation.validate(&config)?;
    if !(1..=100).contains(&options.epochs)
        || !options.learning_rate.is_finite()
        || !(0.0..=0.1).contains(&options.learning_rate)
        || options.learning_rate == 0.0
        || !(128..=16384).contains(&options.batch_parts)
    {
        return Err("Unsupported recurrent training options".into());
    }
    if (0..config.label_count).any(|label| {
        !training
            .targets
            .chunks_exact(config.label_count)
            .any(|row| row[label] > 0.0)
    }) {
        return Err("Every label needs recurrent training supervision".into());
    }
    type Train = burn::backend::Autodiff<Cpu>;
    let device = Default::default();
    Train::seed(&device, 42);
    let mut model = Model::<Train>::new(config.feature_count, config.label_count, true, &device);
    let parameters = model.num_params();
    let mut optimizer = AdamConfig::new().init();
    let groups = training.groups(options.batch_parts);
    let mut seed = 9187u32;
    let mut result = Result {
        weights: Vec::new(),
        parameters,
        loss: Vec::new(),
        validation_accuracy: Vec::new(),
        selected_epoch: 0,
    };
    let mut best = f64::NEG_INFINITY;
    for epoch in 1..=options.epochs {
        let mut order: Vec<_> = (0..groups.len()).collect();
        for i in (1..order.len()).rev() {
            seed = seed.wrapping_mul(1664525).wrapping_add(1013904223);
            order.swap(i, seed as usize % (i + 1));
        }
        let mut loss_sum = 0.0f64;
        let mut support = 0.0f64;
        for index in order {
            let batch = batch(&training, &groups[index], config.label_count, &device);
            if batch.support == 0.0 {
                continue;
            }
            let logits = model.forward(batch.inputs, batch.mask);
            let loss = (activation::log_softmax(logits, 2) * batch.targets)
                .sum()
                .neg()
                / batch.support;
            let value: f32 = loss.clone().into_scalar();
            if !value.is_finite() {
                return Err("Non-finite recurrent loss".into());
            }
            loss_sum += value as f64 * batch.support as f64;
            support += batch.support as f64;
            let gradients = GradientsParams::from_grads(loss.backward(), &model);
            model = optimizer.step(options.learning_rate, model, gradients);
        }
        let loss = (loss_sum / support) as f32;
        result.loss.push(loss);
        let valid = model.valid();
        let score = accuracy(&valid, &validation, config.label_count);
        result.validation_accuracy.push(score);
        if score > best {
            best = score;
            result.selected_epoch = epoch;
            result.weights = valid.save()?;
        }
        progress(epoch, loss);
    }
    Ok(result)
}
