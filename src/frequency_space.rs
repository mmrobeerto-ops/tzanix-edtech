use num_complex::Complex;

#[derive(Debug, Clone)]
pub struct InformationWave {
    pub frequency_x: f64,
    pub frequency_y: f64,
    pub frequency_z: f64,
    pub amplitude: f64,
    pub phase: f64,
}

#[derive(Debug, Clone, Default)]
pub struct InformationField {
    pub waves: Vec<InformationWave>,
}

impl InformationField {
    pub fn new() -> Self {
        InformationField { waves: Vec::new() }
    }

    pub fn add_wave(&mut self, fx: f64, fy: f64, fz: f64, amplitude: f64, phase: f64) {
        self.waves.push(InformationWave {
            frequency_x: fx,
            frequency_y: fy,
            frequency_z: fz,
            amplitude,
            phase,
        });
    }

    pub fn add_wave_1d(&mut self, frequency: f64, amplitude: f64, phase: f64) {
        self.add_wave(frequency, 0.0, 0.0, amplitude, phase);
    }

    /// Evaluates the field at a 3D spatial coordinate.
    pub fn evaluate_at_3d(&self, x: f64, y: f64, z: f64) -> Complex<f64> {
        let mut sum = Complex::new(0.0, 0.0);
        for wave in &self.waves {
            let argument = 2.0 * std::f64::consts::PI * (wave.frequency_x * x + wave.frequency_y * y + wave.frequency_z * z) + wave.phase;
            let val = Complex::new(0.0, argument).exp() * wave.amplitude;
            sum += val;
        }
        sum
    }

    pub fn evaluate_at(&self, s: f64) -> Complex<f64> {
        self.evaluate_at_3d(s, 0.0, 0.0)
    }

    pub fn find_constructive_peaks_3d(&self, start: f64, end: f64, step: f64) -> Vec<(f64, f64, f64)> {
        let mut peaks = Vec::new();
        // A simple scanning grid for demonstration
        let steps = ((end - start) / step) as i32;
        for i in 0..=steps {
            for j in 0..=steps {
                for k in 0..=steps {
                    let x = start + (i as f64) * step;
                    let y = start + (j as f64) * step;
                    let z = start + (k as f64) * step;
                    
                    let intensity = self.evaluate_at_3d(x, y, z).norm_sqr();
                    if intensity > 1.0 { // Arbitrary threshold
                        peaks.push((x, y, z));
                    }
                }
            }
        }
        peaks
    }

    pub fn find_constructive_peaks(&self, start_s: f64, end_s: f64, resolution: f64) -> Vec<f64> {
        let mut peaks = Vec::new();
        let mut s = start_s;
        
        let mut prev_intensity = self.evaluate_at(s - resolution).norm_sqr();
        let mut curr_intensity = self.evaluate_at(s).norm_sqr();
        
        s += resolution;
        while s <= end_s {
            let next_intensity = self.evaluate_at(s).norm_sqr();
            
            if curr_intensity > prev_intensity && curr_intensity > next_intensity {
                if curr_intensity > 0.5 { 
                    peaks.push(s - resolution);
                }
            }
            
            prev_intensity = curr_intensity;
            curr_intensity = next_intensity;
            s += resolution;
        }
        
        peaks
    }

    /// Appplies a retroactive perturbation to the phases of all waves
    pub fn perturb_phases(&mut self, delta_phi: f64) {
        for (i, wave) in self.waves.iter_mut().enumerate() {
            // Give each wave a slightly different perturbation to create turbulence
            let variation = ((i as f64) + 1.0).sin(); 
            wave.phase += delta_phi * variation;
            
            // Normalize
            wave.phase %= 2.0 * std::f64::consts::PI;
            if wave.phase < 0.0 {
                wave.phase += 2.0 * std::f64::consts::PI;
            }
        }
    }
}
