use matchbox_engine::model::{self, Cpu, Model, ModelConfig};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Predictor {
    model: Model<Cpu>,
    config: ModelConfig,
}

#[wasm_bindgen]
impl Predictor {
    #[wasm_bindgen(constructor)]
    pub fn new(config: &str, weights: &[u8]) -> Result<Predictor, JsError> {
        let config: ModelConfig = serde_json::from_str(config)?;
        let model = Model::load(&config, weights.to_vec(), &Default::default())
            .map_err(|error| JsError::new(&error))?;
        Ok(Self { model, config })
    }

    pub fn predict(&self, inputs: &[i32]) -> Result<Vec<f32>, JsError> {
        model::predict(&self.model, &self.config, inputs.to_vec())
            .map_err(|error| JsError::new(&error))
    }
}

pub mod record;
pub mod recurrent;
