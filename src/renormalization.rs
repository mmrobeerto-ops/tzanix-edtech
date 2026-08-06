/// Renormalization module to prevent infinities (singularities).
/// Provides a finite resolution limit (akin to the Planck length).

pub struct Renormalizer {
    pub min_resolution: f64,
}

impl Renormalizer {
    pub fn new(min_resolution: f64) -> Self {
        assert!(min_resolution > 0.0, "Resolution must be greater than 0");
        Renormalizer { min_resolution }
    }

    /// Safe division that avoids infinity when the denominator is too small.
    pub fn safe_divide(&self, numerator: f64, denominator: f64) -> f64 {
        let abs_denom = denominator.abs();
        if abs_denom < self.min_resolution {
            numerator / self.min_resolution
        } else {
            numerator / denominator
        }
    }

    /// Calculates gravitational-like force (1/r^2) but avoids singularity at r=0.
    pub fn safe_inverse_square(&self, distance: f64) -> f64 {
        let r_squared = distance * distance;
        let min_r_squared = self.min_resolution * self.min_resolution;
        
        if r_squared < min_r_squared {
            1.0 / min_r_squared
        } else {
            1.0 / r_squared
        }
    }
}
