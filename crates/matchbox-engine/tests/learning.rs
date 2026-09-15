#![cfg(feature = "training")]
use matchbox_engine::{
    model::{Model, ModelConfig, predict},
    training::train,
};

#[test]
fn learns_from_labels_and_restores_predictions() {
    let config = ModelConfig {
        vocabulary_size: 4,
        label_count: 2,
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
    };
    assert!(train(config.clone(), vec![0, 2, 0], vec![], |_, _| {}).is_err());
    assert!(train(config, vec![0, 2, 0], vec![2], |_, _| {}).is_err());
}
