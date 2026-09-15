use matchbox_engine::model::{Model, ModelConfig, predict, validate_inputs};

fn config() -> ModelConfig {
    ModelConfig {
        vocabulary_size: 4,
        label_count: 2,
    }
}

#[test]
fn dataset_validation_accepts_more_than_a_prediction_batch() {
    let values = vec![0; 3_000_003];
    assert!(validate_inputs(&config(), &values).is_ok());
    let model = Model::new(&config(), &Default::default());
    assert_eq!(
        predict(&model, &config(), values).unwrap_err(),
        "Prediction batch exceeds 1,000,000 three-token windows"
    );
}

#[test]
fn dataset_validation_preserves_shape_and_vocabulary_checks() {
    for values in [vec![], vec![0, 1], vec![0, -1, 0], vec![0, 4, 0]] {
        assert!(validate_inputs(&config(), &values).is_err());
    }
    let mut values = vec![0; 3_000_003];
    *values.last_mut().unwrap() = 4;
    assert_eq!(
        validate_inputs(&config(), &values).unwrap_err(),
        "Token ID is outside the model vocabulary"
    );
}

#[cfg(feature = "training")]
#[test]
fn large_training_datasets_reach_supervision_validation() {
    let result = matchbox_engine::training::train(config(), vec![0; 3_000_003], vec![], |_, _| {});
    assert_eq!(
        result.err().unwrap(),
        "Labels must align with windows and belong to the label set"
    );
}
