use matchbox_engine::{
    model::{self, Model, ModelConfig},
    training,
};
use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi::{Task, bindgen_prelude::*};
use napi_derive::napi;

#[napi(object)]
pub struct FitResult {
    pub parameters: u32,
    pub weights: Buffer,
    pub loss: Vec<f64>,
}

pub struct FitTask {
    config: ModelConfig,
    inputs: Vec<i32>,
    labels: Vec<i32>,
    progress: ThreadsafeFunction<Vec<f64>, ()>,
}

impl Task for FitTask {
    type Output = training::TrainingResult;
    type JsValue = FitResult;

    fn compute(&mut self) -> Result<Self::Output> {
        training::train(
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
            loss: value.loss.into_iter().map(f64::from).collect(),
        })
    }
}

#[napi]
pub fn fit(
    config: String,
    inputs: Int32Array,
    labels: Int32Array,
    progress: ThreadsafeFunction<Vec<f64>, ()>,
) -> Result<AsyncTask<FitTask>> {
    let config =
        serde_json::from_str(&config).map_err(|error| Error::from_reason(error.to_string()))?;
    Ok(AsyncTask::new(FitTask {
        config,
        inputs: inputs.to_vec(),
        labels: labels.to_vec(),
        progress,
    }))
}

#[napi]
pub fn predict(config: String, weights: Buffer, inputs: Int32Array) -> Result<Vec<f64>> {
    let config: ModelConfig =
        serde_json::from_str(&config).map_err(|error| Error::from_reason(error.to_string()))?;
    let model =
        Model::load(&config, weights.to_vec(), &Default::default()).map_err(Error::from_reason)?;
    Ok(model::predict(&model, &config, inputs.to_vec())
        .map_err(Error::from_reason)?
        .into_iter()
        .map(f64::from)
        .collect())
}

pub mod record;
pub mod recurrent;
