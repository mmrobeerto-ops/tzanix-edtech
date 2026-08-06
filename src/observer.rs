use crate::frequency_space::InformationField;
use crate::emergent_geometry::EntanglementGraph;

/// Represents an Observer that filters and projects information.
pub struct Observer {
    pub max_processing_capacity: usize,
    pub resolution_limit: f64,
}

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct RenderedParticle {
    pub position: f64,
    pub intensity: f64,
}

impl Observer {
    pub fn new(capacity: usize, resolution: f64) -> Self {
        Observer {
            max_processing_capacity: capacity,
            resolution_limit: resolution,
        }
    }

    /// The act of measuring. It collapses the frequency space into discrete positions.
    /// It scans the field within a certain "view port" and renders particles where
    /// constructive interference exceeds a threshold.
    pub fn measure_1d(&self, field: &InformationField, start: f64, end: f64) -> Vec<RenderedParticle> {
        let mut particles = Vec::new();
        
        let peaks = field.find_constructive_peaks(start, end, self.resolution_limit);
        
        for pos in peaks {
            if particles.len() >= self.max_processing_capacity {
                break; // Observer cannot process more information
            }
            
            let intensity = field.evaluate_at(pos).norm_sqr();
            particles.push(RenderedParticle {
                position: pos,
                intensity,
            });
        }
        
        particles
    }

    pub fn measure_3d_flat(&self, field: &mut InformationField, start: f64, end: f64, step: f64) -> Vec<f32> {
        let mut flat_data = Vec::new();
        let peaks = field.find_constructive_peaks_3d(start, end, step);
        
        let mut count = 0;
        let mut total_intensity = 0.0;

        for (x, y, z) in peaks {
            if count >= self.max_processing_capacity {
                break;
            }
            let intensity = field.evaluate_at_3d(x, y, z).norm_sqr();
            flat_data.push(x as f32);
            flat_data.push(y as f32);
            flat_data.push(z as f32);
            flat_data.push(intensity as f32);
            total_intensity += intensity;
            count += 1;
        }
        
        // Retroactive Effect: Δϕ = Noise * (Total_Intensity / Resolution)
        if count > 0 {
            // A base noise factor
            let noise = 0.0001; 
            let delta_phi = noise * (total_intensity / self.resolution_limit);
            field.perturb_phases(delta_phi);
        }
        
        flat_data
    }

    /// Measures the "emergent distance" between two nodes, representing how an observer
    /// perceives the distance through their finite resolution filter.
    pub fn perceive_distance(&self, graph: &EntanglementGraph, node1: usize, node2: usize) -> Option<f64> {
        graph.distance(node1, node2).map(|d| {
            // Observer cannot perceive distance smaller than their resolution limit
            if d < self.resolution_limit {
                0.0
            } else {
                d
            }
        })
    }
}
