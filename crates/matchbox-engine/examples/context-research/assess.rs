//! Assess fixed per-part confidence without changing the published parser policy.
mod data;
mod model;
mod scan;

use burn::{
    module::Module,
    record::{BinBytesRecorder, FullPrecisionSettings, Recorder},
    tensor::activation,
};
use matchbox_engine::model::Cpu;
use serde_json::json;
use std::{fs, path::PathBuf};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.len() != 3 {
        return Err("Usage: context-assess <run> <prepared-split.jsonl> <new-report.json>".into());
    }
    let run = PathBuf::from(&args[0]);
    let report: serde_json::Value = serde_json::from_slice(&fs::read(run.join("report.json"))?)?;
    let features = report["manifest"]["featureCount"]
        .as_u64()
        .ok_or("Missing features")? as usize;
    let labels = report["manifest"]["labels"]
        .as_array()
        .ok_or("Missing labels")?
        .len();
    let device = Default::default();
    let record = BinBytesRecorder::<FullPrecisionSettings>::default()
        .load(fs::read(run.join("weights.bin"))?, &device)?;
    let model = model::Model::<Cpu>::new(
        features,
        labels,
        report["architecture"] == "recurrent",
        &device,
    )
    .load_record(record);
    let rows = data::read(&PathBuf::from(&args[1]), features, labels)?;
    let mut bins = [[0.0f64; 3]; 10]; // Support, correct, confidence sum; weighted by code points.
    let mut accepted = 0u64;
    let mut accepted_correct = 0u64;
    let mut accepted_documents = 0usize;
    let mut total = 0u64;
    let mut cross_entropy = 0.0f64;
    let mut matrix = vec![vec![0u64; labels]; labels];
    for row in &rows {
        let batch = data::batch(&[row], labels, &device);
        total += batch.support as u64;
        let logits = model.forward(batch.inputs, batch.mask);
        cross_entropy += (activation::log_softmax(logits.clone(), 2) * batch.targets)
            .sum()
            .neg()
            .into_scalar() as f64;
        let scores = activation::softmax(logits, 2).into_data().to_vec::<f32>()?;
        let mut all_confident = true;
        let mut document_support = 0;
        for (counts, scores) in row.targets.iter().zip(scores.chunks(labels)) {
            let (predicted, &confidence) = scores
                .iter()
                .enumerate()
                .max_by(|a, b| a.1.total_cmp(b.1))
                .ok_or("Empty scores")?;
            if !confidence.is_finite() {
                return Err("Non-finite prediction".into());
            }
            let support = counts.iter().sum::<f32>() as u64;
            let correct = counts[predicted] as u64;
            let bin = ((confidence * 10.0) as usize).min(9);
            bins[bin][0] += support as f64;
            bins[bin][1] += correct as f64;
            bins[bin][2] += confidence as f64 * support as f64;
            for (actual, &count) in counts.iter().enumerate() {
                matrix[actual][predicted] += count as u64;
            }
            document_support += support;
            if confidence >= 0.75 {
                accepted += support;
                accepted_correct += correct;
            } else if support > 0 {
                all_confident = false;
            }
        }
        if all_confident && document_support > 0 {
            accepted_documents += 1;
        }
    }
    let result = json!({ "researchOnly": true, "threshold": 0.75, "scoredCharacters": total,
        "crossEntropy": cross_entropy / total.max(1) as f64, "confusion": matrix, "bins": bins, "binColumns": ["support", "correct", "confidenceSum"],
        "acceptedCharacters": accepted, "correctAcceptedCharacters": accepted_correct,
        "characterCoverage": accepted as f64 / total.max(1) as f64,
        "acceptedCharacterAccuracy": accepted_correct as f64 / accepted.max(1) as f64,
        "fullyConfidentDocuments": accepted_documents, "documents": rows.len(),
        "limitation": "Uncalibrated per-part scores. This is a diagnostic threshold assessment, not public parser acceptance; no input limit is applied." });
    use std::io::Write;
    let mut output = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&args[2])?;
    output.write_all(&serde_json::to_vec_pretty(&result)?)?;
    Ok(())
}
