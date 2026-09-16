use burn::{
    backend::{
        Wgpu,
        wgpu::{WgpuDevice, graphics::WebGpu, init_setup_async},
    },
    tensor::{Tensor, TensorData, activation},
};
use matchbox_engine::recurrent::{Config, model::Model};
use wasm_bindgen::prelude::*;
type Gpu = Wgpu<f32, i32>;
#[wasm_bindgen]
pub async fn initialize() {
    console_error_panic_hook::set_once();
    init_setup_async::<WebGpu>(&WgpuDevice::default(), Default::default()).await;
}
#[wasm_bindgen]
pub struct Predictor {
    model: Model<Gpu>,
    config: Config,
    device: WgpuDevice,
}
#[wasm_bindgen]
impl Predictor {
    pub fn load(config: &str, weights: Vec<u8>) -> Result<Predictor, JsError> {
        let config: Config = serde_json::from_str(config)?;
        config.validate().map_err(|e| JsError::new(&e))?;
        let device = WgpuDevice::default();
        let model = Model::load(&config, weights, &device).map_err(|e| JsError::new(&e))?;
        Ok(Predictor {
            model,
            config,
            device,
        })
    }
    pub async fn predict(&self, features: Vec<i32>) -> Result<Vec<f32>, JsError> {
        let parts = self
            .config
            .validate_inputs(&features)
            .map_err(|e| JsError::new(&e))?;
        let inputs = Tensor::from_data(TensorData::new(features, [1, parts, 16]), &self.device);
        let mask = Tensor::ones([1, parts, 1], &self.device);
        let scores = activation::softmax(self.model.forward(inputs, mask), 2)
            .into_data_async()
            .await
            .map_err(|e| JsError::new(&e.to_string()))?
            .to_vec::<f32>()
            .map_err(|e| JsError::new(&e.to_string()))?;
        if scores.iter().any(|score| !score.is_finite()) {
            return Err(JsError::new("Non-finite recurrent prediction"));
        }
        Ok(scores)
    }
}
