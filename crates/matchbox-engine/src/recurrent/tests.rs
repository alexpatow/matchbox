use super::{Config, data::Data, model::Model, predict, training};
use crate::model::Cpu;
fn config() -> Config {
    Config {
        feature_count: 3,
        label_count: 2,
        max_parts: 4,
    }
}
fn data() -> Data {
    let mut features = vec![0; 32];
    features[0] = 1;
    features[16] = 2;
    Data {
        features,
        targets: vec![2.0, 0.0, 0.0, 3.0],
        offsets: vec![0, 1, 2],
    }
}
#[test]
fn boundaries_and_supervision_are_validated() {
    assert!(data().validate(&config()).is_ok());
    assert!(config().validate_inputs(&vec![1; 80]).is_err());
    assert!(config().validate_inputs(&[0; 16]).is_err());
    let mut wrong = data();
    wrong.offsets = vec![0, 2, 1];
    assert!(wrong.validate(&config()).is_err());
    let mut wrong = data();
    wrong.targets[0] = f32::NAN;
    assert!(wrong.validate(&config()).is_err());
    let mut wrong = data();
    wrong.features[0] = 3;
    assert!(wrong.validate(&config()).is_err());
}
#[test]
fn trained_record_roundtrips_and_rejects_shape_mismatches() {
    let result = training::train(
        config(),
        training::Options {
            epochs: 2,
            learning_rate: 0.003,
            batch_parts: 128,
        },
        data(),
        data(),
        |_, _| {},
    )
    .unwrap();
    assert_eq!(result.loss.len(), 2);
    assert!((1..=2).contains(&result.selected_epoch));
    let model = Model::<Cpu>::load(&config(), result.weights.clone(), &Default::default()).unwrap();
    let before = predict(&model, &config(), data().features).unwrap();
    let restored =
        Model::<Cpu>::load(&config(), model.save().unwrap(), &Default::default()).unwrap();
    assert_eq!(
        before,
        predict(&restored, &config(), data().features).unwrap()
    );
    let wrong = Config {
        label_count: 3,
        ..config()
    };
    assert!(Model::<Cpu>::load(&wrong, result.weights, &Default::default()).is_err());
}
