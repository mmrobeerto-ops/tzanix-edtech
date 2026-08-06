use petgraph::graph::{NodeIndex, UnGraph};
use petgraph::algo::dijkstra;
use std::collections::HashMap;

/// A node in the emergent geometry, representing a "quantum of information" or event.
#[derive(Debug, Clone, PartialEq)]
pub struct InfoNode {
    pub id: usize,
}

/// The graph where geometry emerges from entanglement relations.
#[derive(Debug, Clone)]
pub struct EntanglementGraph {
    pub graph: UnGraph<InfoNode, f64>,
    node_map: HashMap<usize, NodeIndex>,
    next_id: usize,
}

impl Default for EntanglementGraph {
    fn default() -> Self {
        Self::new()
    }
}

impl EntanglementGraph {
    pub fn new() -> Self {
        EntanglementGraph {
            graph: UnGraph::new_undirected(),
            node_map: HashMap::new(),
            next_id: 0,
        }
    }

    /// Adds a new node of information to the network.
    pub fn add_node(&mut self) -> usize {
        let id = self.next_id;
        self.next_id += 1;
        let node = InfoNode { id };
        let idx = self.graph.add_node(node);
        self.node_map.insert(id, idx);
        id
    }

    /// Entangles two nodes. A higher entanglement value means they are "closer".
    /// We store the edge weight as 1.0 / entanglement, so higher entanglement -> lower distance.
    pub fn entangle(&mut self, id1: usize, id2: usize, entanglement: f64) {
        if entanglement <= 0.0 {
            return;
        }
        if let (Some(&n1), Some(&n2)) = (self.node_map.get(&id1), self.node_map.get(&id2)) {
            let distance_metric = 1.0 / entanglement;
            self.graph.add_edge(n1, n2, distance_metric);
        }
    }

    /// Calculates the emergent distance between two nodes.
    /// Uses Dijkstra's algorithm to find the shortest path in terms of entanglement distance.
    pub fn distance(&self, id1: usize, id2: usize) -> Option<f64> {
        if let (Some(&n1), Some(&n2)) = (self.node_map.get(&id1), self.node_map.get(&id2)) {
            let node_distances = dijkstra(&self.graph, n1, Some(n2), |e| *e.weight());
            node_distances.get(&n2).copied()
        } else {
            None
        }
    }
}
