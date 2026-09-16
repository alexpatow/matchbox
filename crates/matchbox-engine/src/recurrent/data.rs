use super::Config;
use burn::tensor::{Int, Tensor, TensorData, backend::Backend};

pub struct Data {
    pub features: Vec<i32>,
    pub targets: Vec<f32>,
    pub offsets: Vec<u32>,
}
impl Data {
    pub fn validate(&self, config: &Config) -> Result<(), String> {
        config.validate()?;
        let parts = self.features.len() / 16;
        if self.offsets.len() < 2
            || self.offsets[0] != 0
            || self.offsets.last().copied() != Some(parts as u32)
            || self.targets.len() != parts * config.label_count
            || !self.features.len().is_multiple_of(16)
            || self
                .targets
                .iter()
                .any(|value| !value.is_finite() || *value < 0.0 || *value > 16_777_216.0)
            || !self.targets.iter().any(|&value| value > 0.0)
        {
            return Err("Invalid recurrent supervision dimensions or counts".into());
        }
        for pair in self.offsets.windows(2) {
            if pair[0] >= pair[1] || pair[1] as usize > parts {
                return Err("Invalid recurrent sequence boundaries".into());
            }
            config.validate_inputs(&self.features[pair[0] as usize * 16..pair[1] as usize * 16])?;
        }
        Ok(())
    }
    pub fn len(&self) -> usize {
        self.offsets.len() - 1
    }
    pub fn is_empty(&self) -> bool {
        self.offsets.len() < 2
    }
    pub fn parts(&self, index: usize) -> usize {
        (self.offsets[index + 1] - self.offsets[index]) as usize
    }
    pub fn groups(&self, budget: usize) -> Vec<Vec<usize>> {
        let mut order: Vec<_> = (0..self.len()).collect();
        order.sort_by_key(|&i| self.parts(i));
        let mut result = Vec::new();
        let mut group = Vec::new();
        for index in order {
            if !group.is_empty() && (group.len() + 1) * self.parts(index) > budget {
                result.push(std::mem::take(&mut group));
            }
            group.push(index);
        }
        if !group.is_empty() {
            result.push(group);
        }
        result
    }
}
pub struct Batch<B: Backend> {
    pub inputs: Tensor<B, 3, Int>,
    pub mask: Tensor<B, 3>,
    pub targets: Tensor<B, 3>,
    pub support: f32,
}
pub fn batch<B: Backend>(
    data: &Data,
    indices: &[usize],
    labels: usize,
    device: &B::Device,
) -> Batch<B> {
    let length = indices.iter().map(|&i| data.parts(i)).max().unwrap();
    let mut inputs = vec![0; indices.len() * length * 16];
    let mut targets = vec![0.0; indices.len() * length * labels];
    let mut mask = vec![0.0; indices.len() * length];
    for (record, &index) in indices.iter().enumerate() {
        let start = data.offsets[index] as usize;
        let parts = data.parts(index);
        let offset = record * length;
        inputs[offset * 16..(offset + parts) * 16]
            .copy_from_slice(&data.features[start * 16..(start + parts) * 16]);
        targets[offset * labels..(offset + parts) * labels]
            .copy_from_slice(&data.targets[start * labels..(start + parts) * labels]);
        mask[offset..offset + parts].fill(1.0);
    }
    Batch {
        support: targets.iter().sum(),
        inputs: Tensor::from_data(TensorData::new(inputs, [indices.len(), length, 16]), device),
        mask: Tensor::from_data(TensorData::new(mask, [indices.len(), length, 1]), device),
        targets: Tensor::from_data(
            TensorData::new(targets, [indices.len(), length, labels]),
            device,
        ),
    }
}
