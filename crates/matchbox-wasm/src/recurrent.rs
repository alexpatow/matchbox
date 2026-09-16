use matchbox_engine::{
    model::Cpu,
    recurrent::{self, Config, model::Model},
};
use wasm_bindgen::prelude::*;
#[wasm_bindgen]
pub struct RecurrentPredictor {
    model: Model<Cpu>,
    config: Config,
}
#[wasm_bindgen]
impl RecurrentPredictor {
    #[wasm_bindgen(constructor)]
    pub fn new(config: &str, weights: &[u8]) -> Result<Self, JsError> {
        let config = serde_json::from_str(config)?;
        let model = Model::load(&config, weights.to_vec(), &Default::default())
            .map_err(|e| JsError::new(&e))?;
        Ok(Self { model, config })
    }
    pub fn predict(&self, features: &[i32]) -> Result<Vec<f32>, JsError> {
        recurrent::predict(&self.model, &self.config, features.to_vec())
            .map_err(|e| JsError::new(&e))
    }
}
