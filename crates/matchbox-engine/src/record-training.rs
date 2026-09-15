use crate::{
    model::Cpu,
    record::{RecordConfig, RecordModel, inputs},
    training::TrainingResult,
};
use burn::{
    module::{AutodiffModule, Module},
    nn::loss::CrossEntropyLossConfig,
    optim::{AdamConfig, GradientsParams, Optimizer},
    tensor::{Int, Tensor, TensorData, backend::Backend},
};
pub fn train(
    config: RecordConfig,
    values: Vec<f32>,
    labels: Vec<i32>,
    progress: impl Fn(usize, f32),
) -> Result<TrainingResult, String> {
    config.validate_inputs(&values)?;
    let rows = values.len() / config.vocabulary_size;
    if labels.len() != rows * config.fields.len()
        || labels
            .iter()
            .enumerate()
            .any(|(i, &id)| id < 0 || id as usize >= config.fields[i % config.fields.len()])
    {
        return Err("Record labels must align with rows and field classes".into());
    }
    type Train = burn::backend::Autodiff<Cpu>;
    let device = Default::default();
    Train::seed(&device, 42);
    let mut model = RecordModel::<Train>::new(&config, &device);
    let mut optimizer = AdamConfig::new().init();
    let objective = CrossEntropyLossConfig::new().init(&device);
    let mut history = Vec::new();
    for epoch in 0..100 {
        let mut total = 0.0;
        for (batch, targets) in values
            .chunks(128 * config.vocabulary_size)
            .zip(labels.chunks(128 * config.fields.len()))
        {
            let count = batch.len() / config.vocabulary_size;
            let logits = model.forward(inputs(&config, batch.to_vec(), &device));
            let targets: Tensor<Train, 2, Int> = Tensor::from_data(
                TensorData::new(targets.to_vec(), [count, config.fields.len()]),
                &device,
            );
            let mut offset = 0;
            let mut loss = Tensor::<Train, 1>::zeros([1], &device);
            for (field, classes) in config.fields.iter().enumerate() {
                let head = logits.clone().slice([0..count, offset..offset + classes]);
                let target = targets
                    .clone()
                    .slice([0..count, field..field + 1])
                    .reshape([count]);
                loss = loss + objective.forward(head, target);
                offset += classes;
            }
            total += loss.clone().into_scalar() * count as f32;
            let gradients = GradientsParams::from_grads(loss.backward(), &model);
            model = optimizer.step(0.02, model, gradients);
        }
        history.push(total / rows as f32);
        progress(epoch + 1, total / rows as f32);
    }
    Ok(TrainingResult {
        parameters: model.num_params(),
        weights: model.valid().save()?,
        loss: history,
    })
}
