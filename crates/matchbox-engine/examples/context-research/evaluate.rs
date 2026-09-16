use super::{
    data::{self, Record},
    model::Model,
};
use matchbox_engine::model::Cpu;
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Metrics {
    pub accuracy: f64,
    pub styled_macro_f1: f64,
    pub confusion: Vec<Vec<u64>>,
    pub documents: Vec<[u64; 2]>,
}

pub fn evaluate(model: &Model<Cpu>, rows: &[Record], labels: usize) -> Metrics {
    let mut matrix = vec![vec![0u64; labels]; labels];
    let mut documents = Vec::new();
    for row in rows {
        let batch = data::batch(&[row], labels, &Default::default());
        let predictions = model
            .forward(batch.inputs, batch.mask)
            .argmax(2)
            .into_data()
            .to_vec::<i32>()
            .unwrap();
        let mut correct = 0;
        let mut total = 0;
        for (counts, prediction) in row.targets.iter().zip(predictions) {
            for (actual, &count) in counts.iter().enumerate() {
                let count = count as u64;
                matrix[actual][prediction as usize] += count;
                total += count;
                if actual == prediction as usize {
                    correct += count;
                }
            }
        }
        documents.push([correct, total]);
    }
    let correct: u64 = documents.iter().map(|row| row[0]).sum();
    let total: u64 = documents.iter().map(|row| row[1]).sum();
    let styled_macro_f1 = (1..labels)
        .map(|id| {
            let support: u64 = matrix[id].iter().sum();
            let predicted: u64 = matrix.iter().map(|row| row[id]).sum();
            2.0 * matrix[id][id] as f64 / (support + predicted).max(1) as f64
        })
        .sum::<f64>()
        / (labels - 1) as f64;
    Metrics {
        accuracy: correct as f64 / total.max(1) as f64,
        styled_macro_f1,
        confusion: matrix,
        documents,
    }
}
