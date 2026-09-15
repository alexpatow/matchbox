use burn::{
    module::{ModuleMapper, Param, ParamId},
    tensor::{Tensor, backend::Backend},
};

// Burn generates parameter IDs independently of the training seed. Canonical IDs
// make exported records reproducible without changing their tensor values.
#[derive(Default)]
pub(crate) struct CanonicalIds(u64);

impl<B: Backend> ModuleMapper<B> for CanonicalIds {
    fn map_float<const D: usize>(&mut self, parameter: Param<Tensor<B, D>>) -> Param<Tensor<B, D>> {
        self.0 += 1;
        Param::initialized(ParamId::from(self.0), parameter.val())
    }
}
