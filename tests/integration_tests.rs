use tzanix_quantum_engine::*;

#[test]
fn test_destructive_interference() {
    let mut field = InformationField::new();
    // Two waves with same frequency and amplitude but opposite phase (π difference)
    field.add_wave(1.0, 1.0, 0.0);
    field.add_wave(1.0, 1.0, std::f64::consts::PI);
    
    // They should destructively interfere to 0 everywhere
    let val = field.evaluate_at(0.5);
    // Due to floating point precision, it might not be exactly 0
    assert!(val.norm() < 1e-10, "Interference was not destructive: {}", val.norm());
}

#[test]
fn test_emergent_distance_zero() {
    let mut graph = EntanglementGraph::new();
    let n1 = graph.add_node();
    let n2 = graph.add_node();
    
    // Entanglement is extremely high (infinity representation) -> distance should be effectively zero
    graph.entangle(n1, n2, 1e15);
    
    let dist = graph.distance(n1, n2).unwrap();
    assert!(dist < 1e-10, "Distance was not effectively zero: {}", dist);
}

#[test]
fn test_renormalization_no_divide_by_zero() {
    let renormalizer = Renormalizer::new(1e-10);
    // At exactly distance 0, force should not be infinity but capped by resolution
    let force = renormalizer.safe_inverse_square(0.0);
    
    // Should be capped at 1/(1e-10)^2 = 1e20
    assert!(force > 1e19 && force < 1e21, "Force was not properly renormalized: {}", force);
}
