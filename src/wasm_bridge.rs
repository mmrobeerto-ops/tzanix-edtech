use wasm_bindgen::prelude::*;
use crate::{InformationField, Observer, EntanglementGraph};

#[wasm_bindgen]
pub struct QuantumEngineWasm {
    field: InformationField,
    observer: Observer,
    graph: EntanglementGraph,
    current_edges: Vec<f32>,
}

#[wasm_bindgen]
impl QuantumEngineWasm {
    #[wasm_bindgen(constructor)]
    pub fn new(capacity: usize, resolution: f64) -> Self {
        console_error_panic_hook::set_once();
        
        QuantumEngineWasm {
            field: InformationField::new(),
            observer: Observer::new(capacity, resolution),
            graph: EntanglementGraph::new(),
            current_edges: Vec::new(),
        }
    }

    pub fn add_wave(&mut self, fx: f64, fy: f64, fz: f64, amplitude: f64, phase: f64) {
        self.field.add_wave(fx, fy, fz, amplitude, phase);
    }

    pub fn clear_waves(&mut self) {
        self.field.waves.clear();
    }

    pub fn set_observer_capacity(&mut self, capacity: usize) {
        self.observer.max_processing_capacity = capacity;
    }

    pub fn set_observer_resolution(&mut self, resolution: f64) {
        self.observer.resolution_limit = resolution;
    }

    /// Measures the field in 3D, applies retroactive feedback, and computes graph topology
    pub fn render_particles(&mut self, start: f64, end: f64, step: f64) -> js_sys::Float32Array {
        let data = self.observer.measure_3d_flat(&mut self.field, start, end, step);
        
        // Dynamic graph generation based on particle proximity (resonance similarity projection)
        let num_particles = data.len() / 4;
        self.graph = EntanglementGraph::new();
        let mut nodes = Vec::new();
        for _ in 0..num_particles {
            nodes.push(self.graph.add_node());
        }

        let mut edge_data = Vec::new();
        let mut edge_count = 0;
        let max_edges = 15000; // Hard limit to avoid WebGL context loss

        'outer: for i in 0..num_particles {
            let x1 = data[i * 4];
            let y1 = data[i * 4 + 1];
            let z1 = data[i * 4 + 2];
            let i1 = data[i * 4 + 3];

            for j in (i + 1)..num_particles {
                if edge_count >= max_edges {
                    break 'outer;
                }
                
                let x2 = data[j * 4];
                let y2 = data[j * 4 + 1];
                let z2 = data[j * 4 + 2];
                let i2 = data[j * 4 + 3];

                let dx = x1 - x2;
                let dy = y1 - y2;
                let dz = z1 - z2;
                let dist_sq = dx * dx + dy * dy + dz * dz;

                // High resonance (intensity) and close spatial projection = High Entanglement
                let combined_intensity = i1 * i2;
                
                if dist_sq < 1.0 && combined_intensity > 2.0 {
                    let entanglement = combined_intensity / (dist_sq + 0.01);
                    if entanglement > 10.0 { // Increased threshold to reduce spam
                        self.graph.entangle(nodes[i], nodes[j], entanglement as f64);
                        
                        edge_data.push(x1); edge_data.push(y1); edge_data.push(z1);
                        edge_data.push(x2); edge_data.push(y2); edge_data.push(z2);
                        edge_data.push(entanglement);
                        edge_count += 1;
                    }
                }
            }
        }
        
        // Save computed edges for frontend to retrieve in the same frame
        self.current_edges = edge_data;

        js_sys::Float32Array::from(data.as_slice())
    }

    /// Returns the edges of the emergent graph computed in the last render_particles call
    pub fn get_graph_edges(&self) -> js_sys::Float32Array {
        js_sys::Float32Array::from(self.current_edges.as_slice())
    }
}
