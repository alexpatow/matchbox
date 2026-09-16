use super::{
    data::{self, Record},
    model::Model,
};
use burn::{
    module::{AutodiffModule, Module},
    record::{BinBytesRecorder, FullPrecisionSettings, Recorder},
    tensor::{activation, backend::Backend},
};
use matchbox_engine::model::Cpu;

fn row(length: usize) -> Record {
    Record {
        features: (0..length).map(|i| vec![1 + (i % 3) as i32]).collect(),
        targets: (0..length)
            .map(|i| vec![f32::from(i % 2 == 0), f32::from(i % 2 != 0)])
            .collect(),
    }
}

#[test]
fn padding_does_not_change_real_predictions_in_either_direction() {
    let device = Default::default();
    Cpu::seed(&device, 42);
    let model = Model::<Cpu>::new(8, 2, true, &device);
    let short = row(5);
    let long = row(13);
    let single = data::batch(&[&short], 2, &device);
    let padded = data::batch(&[&short, &long], 2, &device);
    let expected = model
        .forward(single.inputs, single.mask)
        .into_data()
        .to_vec::<f32>()
        .unwrap();
    let actual = model
        .forward(padded.inputs, padded.mask)
        .slice([0..1, 0..5, 0..2])
        .into_data()
        .to_vec::<f32>()
        .unwrap();
    for (a, b) in expected.iter().zip(actual) {
        assert!((a - b).abs() < 1e-6);
    }
}

#[test]
fn recurrent_model_supports_gradients_and_burn_round_trip() {
    type Train = burn::backend::Autodiff<Cpu>;
    let device = Default::default();
    Train::seed(&device, 42);
    let model = Model::<Train>::new(8, 2, true, &device);
    let example = row(5);
    let batch = data::batch(&[&example], 2, &device);
    let logits = model.forward(batch.inputs, batch.mask);
    let loss = (activation::log_softmax(logits, 2) * batch.targets)
        .sum()
        .neg();
    let _gradients = loss.backward();
    let valid = model.valid();
    let bytes = BinBytesRecorder::<FullPrecisionSettings>::default()
        .record(valid.clone().into_record(), ())
        .unwrap();
    let record = BinBytesRecorder::<FullPrecisionSettings>::default()
        .load(bytes, &device)
        .unwrap();
    let restored = Model::<Cpu>::new(8, 2, true, &device).load_record(record);
    let batch = data::batch(&[&example], 2, &device);
    let before = valid
        .forward(batch.inputs.clone(), batch.mask.clone())
        .into_data();
    let after = restored.forward(batch.inputs, batch.mask).into_data();
    assert_eq!(before, after);
}
