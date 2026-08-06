pub mod frequency_space;
pub mod emergent_geometry;
pub mod renormalization;
pub mod observer;
pub mod wasm_bridge;

// Re-export core structs for easier access
pub use frequency_space::{InformationField, InformationWave};
pub use emergent_geometry::{EntanglementGraph, InfoNode};
pub use renormalization::Renormalizer;
pub use observer::{Observer, RenderedParticle};
