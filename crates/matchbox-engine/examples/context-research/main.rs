//! Research-only executable, not part of the published trainer or artifact contract.
mod batching;
mod data;
mod evaluate;
mod model;
mod scan;

use burn::{
    module::{AutodiffModule, Module},
    optim::{AdamConfig, GradientsParams, Optimizer},
    record::{BinBytesRecorder, FullPrecisionSettings, Recorder},
    tensor::{activation, backend::Backend},
};
use matchbox_engine::model::Cpu;
use serde_json::json;
use std::{fs, path::PathBuf, time::Instant};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.len() != 4 || !["local", "recurrent"].contains(&args[2].as_str()) {
        return Err(
            "Usage: context-research <prepared-data> <new-output> <local|recurrent> <epochs>"
                .into(),
        );
    }
    let source = PathBuf::from(&args[0]);
    let output = PathBuf::from(&args[1]);
    fs::create_dir(&output)?;
    let start = Instant::now();
    let manifest: serde_json::Value =
        serde_json::from_slice(&fs::read(source.join("manifest.json"))?)?;
    let features = manifest["featureCount"]
        .as_u64()
        .ok_or("Missing features")? as usize;
    let labels = manifest["labels"].as_array().ok_or("Missing labels")?.len();
    let epochs: usize = args[3].parse()?;
    if !(1..=100).contains(&epochs) {
        return Err("Expected 1..100 epochs".into());
    }
    let training = data::read(&source.join("train.jsonl"), features, labels)?;
    let validation = data::read(&source.join("validation.jsonl"), features, labels)?;
    let groups = batching::batches(&training);
    type Train = burn::backend::Autodiff<Cpu>;
    let device = Default::default();
    Train::seed(&device, 42);
    let mut model = model::Model::<Train>::new(features, labels, args[2] == "recurrent", &device);
    let parameters = model.num_params();
    let mut optimizer = AdamConfig::new().init();
    let mut best = f64::NEG_INFINITY;
    let mut best_epoch = 0;
    let mut history = Vec::new();
    let mut seed = 9187u32;
    let mut optimizer_ms = 0.0;
    let mut selection_ms = 0.0;
    for epoch in 1..=epochs {
        let epoch_start = Instant::now();
        let mut order: Vec<_> = (0..groups.len()).collect();
        for i in (1..order.len()).rev() {
            seed = seed.wrapping_mul(1664525).wrapping_add(1013904223);
            order.swap(i, seed as usize % (i + 1));
        }
        let mut total_loss = 0.0;
        let mut support = 0.0;
        for index in order {
            let rows: Vec<_> = groups[index].iter().map(|&i| &training[i]).collect();
            let batch = data::batch(&rows, labels, &device);
            if batch.support == 0.0 {
                continue;
            }
            let logits = model.forward(batch.inputs, batch.mask);
            let loss = (activation::log_softmax(logits, 2) * batch.targets)
                .sum()
                .neg()
                / batch.support;
            let value: f32 = loss.clone().into_scalar();
            if !value.is_finite() {
                return Err("Non-finite training loss".into());
            }
            total_loss += value as f64 * batch.support as f64;
            support += batch.support as f64;
            let gradients = GradientsParams::from_grads(loss.backward(), &model);
            model = optimizer.step(0.003, model, gradients);
        }
        let fit_ms = epoch_start.elapsed().as_secs_f64() * 1000.0;
        optimizer_ms += fit_ms;
        let eval_start = Instant::now();
        let valid_model = model.valid();
        let metrics = evaluate::evaluate(&valid_model, &validation, labels);
        let eval_ms = eval_start.elapsed().as_secs_f64() * 1000.0;
        selection_ms += eval_ms;
        if metrics.accuracy > best {
            best = metrics.accuracy;
            best_epoch = epoch;
            let bytes = BinBytesRecorder::<FullPrecisionSettings>::default()
                .record(valid_model.into_record(), ())?;
            fs::write(output.join("weights.bin"), bytes)?;
            fs::write(
                output.join("validation.json"),
                serde_json::to_vec_pretty(&metrics)?,
            )?;
        }
        let summary = json!({ "epoch": epoch, "loss": total_loss / support,
            "validationAccuracy": metrics.accuracy, "styledMacroF1": metrics.styled_macro_f1, "fitMs": fit_ms, "validationMs": eval_ms });
        println!("{summary}");
        history.push(summary);
        fs::write(
            output.join("progress.json"),
            serde_json::to_vec_pretty(&history)?,
        )?;
    }
    // Test is loaded only after validation selects the checkpoint.
    let record = BinBytesRecorder::<FullPrecisionSettings>::default()
        .load(fs::read(output.join("weights.bin"))?, &device)?;
    let selected = model::Model::<Cpu>::new(features, labels, args[2] == "recurrent", &device)
        .load_record(record);
    let test = data::read(&source.join("test.jsonl"), features, labels)?;
    let test_metrics = evaluate::evaluate(&selected, &test, labels);
    fs::write(
        output.join("test.json"),
        serde_json::to_vec_pretty(&test_metrics)?,
    )?;
    let report = json!({ "researchOnly": true, "backend": "Burn 0.21 Flex CPU", "architecture": args[2],
        "manifest": manifest, "seed": 42, "epochs": epochs, "learningRate": 0.003, "batchPartBudget": 4096,
        "parameters": parameters, "weightBytes": fs::metadata(output.join("weights.bin"))?.len(),
        "bestEpoch": best_epoch, "validationAccuracy": best, "testAccuracy": test_metrics.accuracy,
        "testStyledMacroF1": test_metrics.styled_macro_f1, "optimizerMs": optimizer_ms, "selectionMs": selection_ms,
        "wallMs": start.elapsed().as_secs_f64() * 1000.0, "history": history });
    fs::write(
        output.join("report.json"),
        serde_json::to_vec_pretty(&report)?,
    )?;
    println!("{report}");
    Ok(())
}

#[cfg(test)]
mod tests;
