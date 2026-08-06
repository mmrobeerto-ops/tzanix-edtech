use tzanix_quantum_engine::*;
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    let json_output = args.iter().any(|arg| arg == "--json");

    let mut field = InformationField::new();
    field.add_wave(1.0, 1.0, 0.0);
    field.add_wave(1.0, 1.0, 0.0);
    let observer = Observer::new(100, 0.01);
    let particles = observer.measure_1d(&field, 0.0, 2.0);

    let mut graph = EntanglementGraph::new();
    let n1 = graph.add_node();
    let n2 = graph.add_node();
    let n3 = graph.add_node();
    graph.entangle(n1, n2, 100.0);
    graph.entangle(n2, n3, 2.0);

    if json_output {
        let json = serde_json::to_string(&particles).unwrap();
        println!("{}", json);
        return;
    }

    println!("--- Tzanix Quantum Engine: Information Physics Demonstration ---");
    println!("\n[1] Frequency Space & Constructive Interference");
    println!("Rendered Particles (peaks of interference):");
    for p in particles {
        println!("  Position: {:.2}, Intensity: {:.2}", p.position, p.intensity);
    }
    
    println!("\n[2] Emergent Geometry from Entanglement");
    if let Some(d) = graph.distance(n1, n3) {
        println!("Distance N1 -> N3: {}", d);
    }

    println!("\n[3] Renormalization (Avoiding Singularities)");
    let renormalizer = Renormalizer::new(0.001);
    println!("Gravitational force at distance 1.0: {}", renormalizer.safe_inverse_square(1.0));
    println!("Gravitational force at distance 0.0001 (below cutoff): {}", renormalizer.safe_inverse_square(0.0001));

    println!("\n[4] Observer filtering perceived distance");
    let perceived_d12 = observer.perceive_distance(&graph, n1, n2).unwrap_or(0.0);
    let perceived_d13 = observer.perceive_distance(&graph, n1, n3).unwrap_or(0.0);
    println!("Observer perceived N1->N2 distance: {} (actual: 0.01)", perceived_d12);
    println!("Observer perceived N1->N3 distance: {} (actual: 0.51)", perceived_d13);
}
