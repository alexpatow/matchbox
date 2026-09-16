use super::scan::scan;
use burn::{
    module::{Initializer, Module},
    nn::{Embedding, EmbeddingConfig, Linear, LinearConfig},
    tensor::{Int, Tensor, activation, backend::Backend},
};

const CHANNELS: usize = 32;

#[derive(Module, Debug)]
pub struct State<B: Backend> {
    value: Linear<B>,
    gate: Linear<B>,
    mix: Linear<B>,
}

#[derive(Module, Debug)]
pub struct Model<B: Backend> {
    embedding: Embedding<B>,
    local: Linear<B>,
    state: Option<State<B>>,
    hidden: Linear<B>,
    output: Linear<B>,
}

fn linear<B: Backend>(input: usize, output: usize, device: &B::Device) -> Linear<B> {
    LinearConfig::new(input, output)
        .with_initializer(Initializer::XavierUniform { gain: 1.0 })
        .init(device)
}

impl<B: Backend> Model<B> {
    pub fn new(features: usize, labels: usize, recurrent: bool, device: &B::Device) -> Self {
        Self {
            embedding: EmbeddingConfig::new(features, CHANNELS)
                .with_initializer(Initializer::Uniform {
                    min: -0.05,
                    max: 0.05,
                })
                .init(device),
            local: linear(CHANNELS * 5, CHANNELS, device),
            state: recurrent.then(|| State {
                value: linear(CHANNELS, CHANNELS, device),
                gate: linear(CHANNELS, CHANNELS, device),
                mix: linear(CHANNELS * 2, CHANNELS, device),
            }),
            hidden: linear(CHANNELS, 64, device),
            output: linear(64, labels, device),
        }
    }

    pub fn forward(&self, ids: Tensor<B, 3, Int>, mask: Tensor<B, 3>) -> Tensor<B, 3> {
        let [batch, length, slots] = ids.dims();
        let ids = ids.reshape([batch * length, slots]);
        let present = ids.clone().not_equal_elem(0).float().unsqueeze_dim::<3>(2);
        let raw = (self.embedding.forward(ids) * present)
            .sum_dim(1)
            .reshape([batch, length, CHANNELS])
            * mask.clone();
        let device = raw.device();
        let padded = Tensor::cat(
            vec![
                Tensor::zeros([batch, 2, CHANNELS], &device),
                raw,
                Tensor::zeros([batch, 2, CHANNELS], &device),
            ],
            1,
        );
        let neighborhoods = (0..5)
            .map(|offset| {
                padded
                    .clone()
                    .slice([0..batch, offset..offset + length, 0..CHANNELS])
            })
            .collect();
        let mut local = self.local.forward(Tensor::cat(neighborhoods, 2)).tanh() * mask.clone();
        if let Some(state) = &self.state {
            let decay = activation::sigmoid(state.gate.forward(local.clone()));
            let update = (decay.clone().neg() + 1.0)
                * state.value.forward(local.clone()).tanh()
                * mask.clone();
            // Padded positions have the identity transition in either direction.
            let decay = decay * mask.clone() + mask.neg() + 1.0;
            let forward = scan(decay.clone(), update.clone());
            let reverse = scan(decay.flip([1]), update.flip([1])).flip([1]);
            local = (local + state.mix.forward(Tensor::cat(vec![forward, reverse], 2))).tanh();
        }
        self.output.forward(self.hidden.forward(local).tanh())
    }
}

impl<B: Backend> Model<B> {
    pub fn save(&self) -> Result<Vec<u8>, String> {
        use burn::record::{BinBytesRecorder, FullPrecisionSettings, Recorder};
        BinBytesRecorder::<FullPrecisionSettings>::default()
            .record(
                self.clone()
                    .map(&mut crate::artifact::CanonicalIds::default())
                    .into_record(),
                (),
            )
            .map_err(|error| error.to_string())
    }
    pub fn load(
        config: &super::Config,
        bytes: Vec<u8>,
        device: &B::Device,
    ) -> Result<Self, String> {
        use burn::record::{BinBytesRecorder, FullPrecisionSettings, Recorder};
        config.validate()?;
        let record = BinBytesRecorder::<FullPrecisionSettings>::default()
            .load(bytes, device)
            .map_err(|error| error.to_string())?;
        let model =
            Self::new(config.feature_count, config.label_count, true, device).load_record(record);
        if model.embedding.weight.val().dims() != [config.feature_count, CHANNELS]
            || !valid_linear(&model.local, CHANNELS * 5, CHANNELS)
            || !valid_linear(&model.hidden, CHANNELS, 64)
            || !valid_linear(&model.output, 64, config.label_count)
            || !model.state.as_ref().is_some_and(|state| {
                valid_linear(&state.value, CHANNELS, CHANNELS)
                    && valid_linear(&state.gate, CHANNELS, CHANNELS)
                    && valid_linear(&state.mix, CHANNELS * 2, CHANNELS)
            })
        {
            return Err("Recurrent record dimensions do not match the task".into());
        }
        Ok(model)
    }
}
fn valid_linear<B: Backend>(layer: &Linear<B>, input: usize, output: usize) -> bool {
    layer.weight.val().dims() == [input, output]
        && layer.bias.as_ref().map(|bias| bias.val().dims()) == Some([output])
}
