use matchbox_engine::{
    model::Cpu,
    record::{self, RecordConfig, RecordModel},
};
use wasm_bindgen::prelude::*;
#[wasm_bindgen]
pub struct RecordPredictor {
    model: RecordModel<Cpu>,
    config: RecordConfig,
}
#[wasm_bindgen]
impl RecordPredictor {
    #[wasm_bindgen(constructor)]
    pub fn new(config: &str, weights: &[u8]) -> Result<RecordPredictor, JsError> {
        let config: RecordConfig = serde_json::from_str(config)?;
        let model = RecordModel::load(&config, weights.to_vec(), &Default::default())
            .map_err(|e| JsError::new(&e))?;
        Ok(Self { model, config })
    }
    pub fn predict(&self, inputs: &[f32]) -> Result<Vec<f32>, JsError> {
        record::predict(&self.model, &self.config, inputs.to_vec()).map_err(|e| JsError::new(&e))
    }
}
