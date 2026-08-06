import subprocess
import json
import matplotlib.pyplot as plt

def run_engine_and_visualize():
    print("Running Tzanix Quantum Engine to fetch JSON data...")
    # Run the cargo project with --json argument
    result = subprocess.run(
        ["cargo", "run", "--", "--json"], 
        capture_output=True, 
        text=True,
        check=True
    )
    
    # Parse the JSON output (particles)
    output = result.stdout.strip()
    try:
        # Find where the JSON array starts in case cargo prints something before
        start_idx = output.find("[")
        if start_idx != -1:
            json_str = output[start_idx:]
            particles = json.loads(json_str)
        else:
            raise ValueError("No JSON found in output")
    except Exception as e:
        print("Failed to parse JSON. Engine output was:\n", output)
        return

    # Extract positions and intensities
    positions = [p["position"] for p in particles]
    intensities = [p["intensity"] for p in particles]

    # Plot
    plt.figure(figsize=(10, 5))
    plt.plot(positions, intensities, marker='o', linestyle='-', color='#00a8ff', linewidth=2)
    plt.fill_between(positions, intensities, alpha=0.3, color='#00a8ff')
    
    plt.title("Tzanix Quantum Engine: Constructive Interference (Rendered Particles)", fontsize=14)
    plt.xlabel("Observer Rendered Position (1D)", fontsize=12)
    plt.ylabel("Intensity (Amplitude Squared)", fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.6)
    
    # Save the plot
    output_img = "interference_plot.png"
    plt.savefig(output_img, dpi=300, bbox_inches='tight')
    print(f"Visualization saved to {output_img}")
    plt.show()

if __name__ == "__main__":
    run_engine_and_visualize()
