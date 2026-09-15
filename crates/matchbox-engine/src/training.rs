use crate::model::{Cpu, Model, ModelConfig, inputs, validate_inputs};
use burn::{
    module::AutodiffModule,
    nn::loss::CrossEntropyLossConfig,
    optim::{AdamConfig, GradientsParams, Optimizer},
    tensor::{Tensor, TensorData, backend::Backend},
};

pub struct TrainingResult {
    pub weights: Vec<u8>,
    pub untrained: Vec<u8>,
    pub loss: Vec<f32>,
}

pub fn train(
    config: ModelConfig,
    values: Vec<i32>,
    labels: Vec<i32>,
    progress: impl Fn(usize, f32),
) -> Result<TrainingResult, String> {
    config.validate()?;
    validate_inputs(&config, &values)?;
    if labels.len() * 3 != values.len()
        || labels
            .iter()
            .any(|&id| id < 0 || id as usize >= config.label_count)
    {
        return Err("Labels must align with windows and belong to the label set".into());
    }
    type Train = burn::backend::Autodiff<Cpu>;
    let device = Default::default();
    Train::seed(&device, 42);
    let mut model = Model::<Train>::new(&config, &device);
    let untrained = model.valid().save()?;
    let mut optimizer = AdamConfig::new().init();
    let objective = CrossEntropyLossConfig::new().init(&device);
    let mut history = Vec::new();
    for epoch in 0..55 {
        let mut total = 0.0;
        for (batch, targets) in values.chunks(128 * 3).zip(labels.chunks(128)) {
            let output = model.forward(inputs(batch.to_vec(), &device));
            let target =
                Tensor::from_data(TensorData::new(targets.to_vec(), [targets.len()]), &device);
            let loss = objective.forward(output, target);
            total += loss.clone().into_scalar() * targets.len() as f32;
            let grads = GradientsParams::from_grads(loss.backward(), &model);
            model = optimizer.step(0.005, model, grads);
        }
        history.push(total / labels.len() as f32);
        progress(epoch + 1, total / labels.len() as f32);
    }
    Ok(TrainingResult {
        weights: model.valid().save()?,
        untrained,
        loss: history,
    })
}
