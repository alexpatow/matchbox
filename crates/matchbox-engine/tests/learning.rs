#![cfg(feature = "training")]
use matchbox_engine::{
    model::{Cpu, Model, ModelConfig, predict},
    training::train,
};

#[test]
fn learns_from_labels_and_restores_predictions() {
    let config = ModelConfig {
        vocabulary_size: 4,
        label_count: 2,
        context_radius: 1,
    };
    let values = [vec![0, 2, 0], vec![0, 3, 0]].concat().repeat(32);
    let labels = [0, 1].repeat(32);
    let fit = train(config.clone(), values, labels, |_, _| {}).unwrap();
    assert!(fit.loss.last().unwrap() < &(fit.loss[0] / 10.0));
    let model = Model::load(&config, fit.weights, &Default::default()).unwrap();
    let scores = predict(&model, &config, vec![0, 2, 0, 0, 3, 0]).unwrap();
    assert!(scores[0] > 0.9 && scores[3] > 0.9);
    let restored = Model::load(&config, model.save().unwrap(), &Default::default()).unwrap();
    assert_eq!(
        scores,
        predict(&restored, &config, vec![0, 2, 0, 0, 3, 0]).unwrap()
    );
    assert!(predict(&restored, &config, vec![0, 99, 0]).is_err());
}

#[test]
fn rejects_invalid_supervision_before_training() {
    let config = ModelConfig {
        vocabulary_size: 4,
        label_count: 2,
        context_radius: 1,
    };
    assert!(train(config.clone(), vec![0, 2, 0], vec![], |_, _| {}).is_err());
    assert!(train(config, vec![0, 2, 0], vec![2], |_, _| {}).is_err());
}

#[test]
fn wider_context_learns_information_outside_the_original_window() {
    let config = ModelConfig {
        vocabulary_size: 4,
        label_count: 2,
        context_radius: 4,
    };
    // The middle three tokens are identical. Only the far-left token determines the label.
    let left = vec![2, 0, 0, 0, 2, 0, 0, 0, 0];
    let right = vec![3, 0, 0, 0, 2, 0, 0, 0, 0];
    let probes = [left, right].concat();
    let result = train(
        config.clone(),
        probes.repeat(32),
        [0, 1].repeat(32),
        |_, _| {},
    )
    .unwrap();
    let model = Model::load(&config, result.weights, &Default::default()).unwrap();
    let scores = predict(&model, &config, probes).unwrap();
    assert!(scores[0] > 0.9 && scores[3] > 0.9);
    let wrong = ModelConfig {
        context_radius: 1,
        ..config
    };
    assert!(Model::<Cpu>::load(&wrong, model.save().unwrap(), &Default::default()).is_err());
}
