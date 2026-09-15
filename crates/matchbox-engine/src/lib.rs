mod artifact;
pub mod model;
pub mod record;
#[cfg(feature = "training")]
#[path = "record-training.rs"]
pub mod record_training;
#[cfg(feature = "training")]
pub mod training;
