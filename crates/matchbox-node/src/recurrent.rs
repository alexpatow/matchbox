use matchbox_engine::recurrent::{
    self, Config,
    data::Data,
    model::Model,
    training::{self, Options},
};
use napi::{
    Task,
    bindgen_prelude::*,
    threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode},
};
use napi_derive::napi;

#[napi(object)]
pub struct RecurrentData {
    pub features: Int32Array,
    pub targets: Float32Array,
    pub offsets: Uint32Array,
}
impl From<RecurrentData> for Data {
    fn from(value: RecurrentData) -> Self {
        Self {
            features: value.features.to_vec(),
            targets: value.targets.to_vec(),
            offsets: value.offsets.to_vec(),
        }
    }
}
#[napi(object)]
pub struct RecurrentFitResult {
    pub weights: Buffer,
    pub parameters: u32,
    pub loss: Vec<f64>,
    pub validation_accuracy: Vec<f64>,
    pub selected_epoch: u32,
}
pub struct FitTask {
    config: Config,
    options: Options,
    train: Option<Data>,
    validation: Option<Data>,
    progress: ThreadsafeFunction<Vec<f64>, ()>,
}
impl Task for FitTask {
    type Output = training::Result;
    type JsValue = RecurrentFitResult;
    fn compute(&mut self) -> Result<Self::Output> {
        training::train(
            self.config.clone(),
            self.options.clone(),
            self.train.take().unwrap(),
            self.validation.take().unwrap(),
            |epoch, loss| {
                self.progress.call(
                    Ok(vec![epoch as f64, loss as f64]),
                    ThreadsafeFunctionCallMode::NonBlocking,
                );
            },
        )
        .map_err(Error::from_reason)
    }
    fn resolve(&mut self, _env: Env, result: Self::Output) -> Result<Self::JsValue> {
        Ok(RecurrentFitResult {
            weights: result.weights.into(),
            parameters: result.parameters as u32,
            loss: result.loss.into_iter().map(f64::from).collect(),
            validation_accuracy: result.validation_accuracy,
            selected_epoch: result.selected_epoch as u32,
        })
    }
}
#[napi]
pub fn fit_recurrent(
    config: String,
    options: String,
    train: RecurrentData,
    validation: RecurrentData,
    progress: ThreadsafeFunction<Vec<f64>, ()>,
) -> Result<AsyncTask<FitTask>> {
    Ok(AsyncTask::new(FitTask {
        config: serde_json::from_str(&config).map_err(|e| Error::from_reason(e.to_string()))?,
        options: serde_json::from_str(&options).map_err(|e| Error::from_reason(e.to_string()))?,
        train: Some(train.into()),
        validation: Some(validation.into()),
        progress,
    }))
}
#[napi]
pub struct RecurrentPredictor {
    model: Model<matchbox_engine::model::Cpu>,
    config: Config,
}
#[napi]
impl RecurrentPredictor {
    #[napi(constructor)]
    pub fn new(config: String, weights: Buffer) -> Result<Self> {
        let config =
            serde_json::from_str(&config).map_err(|e| Error::from_reason(e.to_string()))?;
        let model = Model::load(&config, weights.to_vec(), &Default::default())
            .map_err(Error::from_reason)?;
        Ok(Self { model, config })
    }
    #[napi]
    pub fn predict(&self, features: Int32Array) -> Result<Vec<f64>> {
        Ok(
            recurrent::predict(&self.model, &self.config, features.to_vec())
                .map_err(Error::from_reason)?
                .into_iter()
                .map(f64::from)
                .collect(),
        )
    }
}
