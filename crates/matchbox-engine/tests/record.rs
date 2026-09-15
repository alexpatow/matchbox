#![cfg(feature = "training")]
use matchbox_engine::{
    record::{self, RecordConfig, RecordModel},
    record_training,
};
#[test]
fn learns_independent_fields_and_restores_exact_predictions() {
    let config = RecordConfig {
        vocabulary_size: 2,
        fields: vec![2, 2, 1],
    };
    let values = vec![1., 0., 0., 1., 1., 1., 0., 0.];
    let labels = vec![1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0];
    let result = record_training::train(config.clone(), values.clone(), labels, |_, _| {}).unwrap();
    assert!(result.loss.last().unwrap() < &(result.loss[0] * 0.1));
    let model = RecordModel::load(&config, result.weights, &Default::default()).unwrap();
    let scores = record::predict(&model, &config, values.clone()).unwrap();
    for (i, expected) in [1, 0, 0, 1, 1, 1, 0, 0].into_iter().enumerate() {
        assert!(scores[i / 2 * 5 + i % 2 * 2 + expected] > 0.9);
    }
    let restored = RecordModel::load(&config, model.save().unwrap(), &Default::default()).unwrap();
    assert_eq!(scores, record::predict(&restored, &config, values).unwrap());
    assert!(record::predict(&model, &config, vec![f32::NAN, 0.]).is_err());
    let mismatch = RecordConfig {
        vocabulary_size: 3,
        fields: config.fields.clone(),
    };
    assert!(
        RecordModel::<matchbox_engine::model::Cpu>::load(
            &mismatch,
            model.save().unwrap(),
            &Default::default()
        )
        .is_err()
    );
    assert!(record_training::train(config, vec![1., 0.], vec![2, 0, 0], |_, _| {}).is_err());
}
