use crate::FitResult;
use matchbox_engine::{
    record::{self, RecordConfig, RecordModel},
    record_training, training,
};
use napi::{
    Task,
    bindgen_prelude::*,
    threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode},
};
use napi_derive::napi;
pub struct RecordTask {
    config: RecordConfig,
    inputs: Vec<f32>,
    labels: Vec<i32>,
    progress: ThreadsafeFunction<Vec<f64>, ()>,
}
impl Task for RecordTask {
    type Output = training::TrainingResult;
    type JsValue = FitResult;
    fn compute(&mut self) -> Result<Self::Output> {
        record_training::train(
            self.config.clone(),
            std::mem::take(&mut self.inputs),
            std::mem::take(&mut self.labels),
            |epoch, loss| {
                self.progress.call(
                    Ok(vec![epoch as f64, loss as f64]),
                    ThreadsafeFunctionCallMode::NonBlocking,
                );
            },
        )
        .map_err(Error::from_reason)
    }
    fn resolve(&mut self, _env: Env, value: Self::Output) -> Result<Self::JsValue> {
        Ok(FitResult {
            parameters: value.parameters as u32,
            weights: value.weights.into(),
            untrained: value.untrained.into(),
            loss: value.loss.into_iter().map(f64::from).collect(),
        })
    }
}
#[napi]
pub fn fit_record(
    config: String,
    inputs: Float32Array,
    labels: Int32Array,
    progress: ThreadsafeFunction<Vec<f64>, ()>,
) -> Result<AsyncTask<RecordTask>> {
    let config = serde_json::from_str(&config).map_err(|e| Error::from_reason(e.to_string()))?;
    Ok(AsyncTask::new(RecordTask {
        config,
        inputs: inputs.to_vec(),
        labels: labels.to_vec(),
        progress,
    }))
}
#[napi]
pub fn predict_record(config: String, weights: Buffer, inputs: Float32Array) -> Result<Vec<f64>> {
    let config: RecordConfig =
        serde_json::from_str(&config).map_err(|e| Error::from_reason(e.to_string()))?;
    let model = RecordModel::load(&config, weights.to_vec(), &Default::default())
        .map_err(Error::from_reason)?;
    Ok(record::predict(&model, &config, inputs.to_vec())
        .map_err(Error::from_reason)?
        .into_iter()
        .map(f64::from)
        .collect())
}
