use burn::tensor::{Int, Tensor, TensorData, backend::Backend};
use serde::Deserialize;
use std::{
    fs::File,
    io::{BufRead, BufReader},
    path::Path,
};

#[derive(Deserialize)]
pub struct Record {
    pub features: Vec<Vec<i32>>,
    pub targets: Vec<Vec<f32>>,
}

pub fn read(path: &Path, features: usize, labels: usize) -> Result<Vec<Record>, String> {
    BufReader::new(File::open(path).map_err(|e| e.to_string())?)
        .lines()
        .map(|line| {
            let record: Record = serde_json::from_str(&line.map_err(|e| e.to_string())?)
                .map_err(|e| e.to_string())?;
            if record.features.is_empty()
                || record.features.len() != record.targets.len()
                || record.features.iter().any(|row| {
                    row.is_empty()
                        || row.len() > 16
                        || row.iter().any(|&id| id <= 0 || id as usize >= features)
                })
                || record.targets.iter().any(|row| {
                    row.len() != labels || row.iter().any(|v| !v.is_finite() || *v < 0.0)
                })
            {
                return Err("Invalid feature/target record".into());
            }
            Ok(record)
        })
        .collect()
}

pub struct Batch<B: Backend> {
    pub inputs: Tensor<B, 3, Int>,
    pub mask: Tensor<B, 3>,
    pub targets: Tensor<B, 3>,
    pub support: f32,
}

pub fn batch<B: Backend>(rows: &[&Record], labels: usize, device: &B::Device) -> Batch<B> {
    let length = rows.iter().map(|row| row.features.len()).max().unwrap();
    let mut inputs = vec![0; rows.len() * length * 16];
    let mut targets = vec![0.0; rows.len() * length * labels];
    let mut mask = vec![0.0; rows.len() * length];
    for (record, row) in rows.iter().enumerate() {
        for (position, (features, counts)) in row.features.iter().zip(&row.targets).enumerate() {
            let offset = record * length + position;
            inputs[offset * 16..offset * 16 + features.len()].copy_from_slice(features);
            targets[offset * labels..(offset + 1) * labels].copy_from_slice(counts);
            mask[offset] = 1.0;
        }
    }
    let support = targets.iter().sum();
    Batch {
        inputs: Tensor::from_data(TensorData::new(inputs, [rows.len(), length, 16]), device),
        mask: Tensor::from_data(TensorData::new(mask, [rows.len(), length, 1]), device),
        targets: Tensor::from_data(
            TensorData::new(targets, [rows.len(), length, labels]),
            device,
        ),
        support,
    }
}
