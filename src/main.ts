import './style.css';
import * as THREE from 'three';
import { GUI } from 'lil-gui';
import init, { QuantumEngineWasm } from 'tzanix_quantum_engine';

async function bootstrap() {
    await init();
    
    const engine = new QuantumEngineWasm(2000, 0.05);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#05050f');

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 6;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x05050f, 1);
    document.querySelector('#app')?.appendChild(renderer.domElement);

    // Group for rotation
    const universeGroup = new THREE.Group();
    scene.add(universeGroup);

    // 1. Particles Setup (The Rendered Matter)
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            attribute float intensity;
            varying float vIntensity;
            void main() {
                vIntensity = intensity;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                // Drastically reduce size to make individual nodes visible instead of a giant blob
                gl_PointSize = (0.5 + vIntensity) * (15.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying float vIntensity;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                float softEdge = smoothstep(0.5, 0.0, dist);
                
                vec3 normalColor = mix(vec3(0.0, 0.4, 0.9), vec3(0.2, 1.0, 1.0), vIntensity);
                vec3 anomalyColor = vec3(1.0, 0.1, 0.1);
                
                float anomalyFactor = smoothstep(0.5, 0.1, vIntensity);
                vec3 color = mix(normalColor, anomalyColor, anomalyFactor * 0.8); 
                
                // Extremely low alpha
                float alpha = (0.01 + vIntensity * 0.05) * softEdge;
                
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    universeGroup.add(particleSystem);

    // 2. Graph Setup (The Emergent Geometry)
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const lineSystem = new THREE.LineSegments(lineGeometry, lineMaterial);
    universeGroup.add(lineSystem);

    // UI Configuration
    const gui = new GUI({ title: 'Tzanix Quantum Engine' });
    const config = {
        capacity: 2000,
        resolution: 0.05,
        phase1: 0.0,
        phase2: Math.PI / 4,
        frequency: 1.0,
        rotationSpeed: 0.005,
        mode: 'physics', // 'physics' or 'cyber'
        // Presets
        presetStableParticle: () => {
            config.mode = 'physics';
            config.capacity = 2000;
            config.resolution = 0.05;
            config.frequency = 2.0;
            config.phase1 = 0.0;
            config.phase2 = 0.0; 
            gui.controllersRecursive().forEach(c => c.updateDisplay());
            applyWaves();
        },
        presetVacuum: () => {
            config.mode = 'physics';
            config.capacity = 5000;
            config.resolution = 0.15; 
            config.frequency = 3.5;
            config.phase1 = 0.0;
            config.phase2 = Math.PI; 
            gui.controllersRecursive().forEach(c => c.updateDisplay());
            applyWaves();
        },
        // Cyber and Gravity removed for EdTech specific build
        presetEdTech: () => {
            config.mode = 'edtech';
            // Stage 1: Probability Cloud (Unmeasured)
            config.capacity = 100;
            config.resolution = 0.01;
            config.frequency = 1.5;
            config.phase1 = 0.0;
            config.phase2 = 0.0;
            config.rotationSpeed = 0.005;
            edTechStage = 1;
            edTechTime = 0;
            gui.controllersRecursive().forEach(c => c.updateDisplay());
            applyWaves();
        }
    };

    function applyWaves() {
        if (config.mode === 'cyber') return;
        engine.clear_waves();
        engine.add_wave(config.frequency, config.frequency, config.frequency, 1.0, config.phase1);
        engine.add_wave(config.frequency * 1.2, config.frequency * 0.8, config.frequency * 1.1, 0.8, config.phase2);
    }

    // Store DOM references
    const infoTitle = document.getElementById('info-title')!;
    const infoDesc = document.getElementById('info-desc')!;
    const metricFreq = document.getElementById('metric-freq')!;
    const metricRes = document.getElementById('metric-res')!;
    const metricCap = document.getElementById('metric-cap')!;
    
    // Parallax state
    let targetCameraX = 0;
    let targetCameraY = 2;
    document.addEventListener('mousemove', (e) => {
        const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        targetCameraX = mouseX * 2.0;
        targetCameraY = 2.0 + mouseY * 1.5;
    });

    const simFolder = gui.addFolder('Observer Filter');
    simFolder.add(config, 'capacity', 100, 10000, 100).listen();
    simFolder.add(config, 'resolution', 0.01, 0.2, 0.01).listen();
    
    const waveFolder = gui.addFolder('Information Field');
    waveFolder.add(config, 'frequency', 0.1, 5.0, 0.1).listen().onChange(applyWaves);
    waveFolder.add(config, 'phase1', 0, Math.PI * 2, 0.1).name('Phase 1').listen().onChange(applyWaves);
    waveFolder.add(config, 'phase2', 0, Math.PI * 2, 0.1).name('Phase 2').listen().onChange(applyWaves);
    
    const presetFolder = gui.addFolder('Presets (Entities)');
    presetFolder.add(config, 'presetStableParticle').name('Stable Particle');
    presetFolder.add(config, 'presetVacuum').name('Quantum Vacuum');
    presetFolder.add(config, 'presetEdTech').name('Edu: Observer Effect');

    // UI Buttons Binding
    const btnEdtech = document.getElementById('btn-edtech')!;
    const btnToggleGui = document.getElementById('btn-toggle-gui')!;

    function setActiveBtn(active: HTMLElement) {
        btnEdtech.classList.remove('active');
        active.classList.add('active');
    }

    btnEdtech.addEventListener('click', () => {
        setActiveBtn(btnEdtech);
        config.presetEdTech();
    });
    
    btnToggleGui.addEventListener('click', () => {
        const guiRoot = document.querySelector('.lil-gui.root');
        if (guiRoot) guiRoot.classList.toggle('visible');
    });

    // Init first wave (default to EdTech for demo purposes)
    config.presetEdTech();
    setActiveBtn(btnEdtech);

    let edTechTime = 0;
    let edTechStage = 1;

    // Render loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Camera parallax
        camera.position.x += (targetCameraX - camera.position.x) * 0.05;
        camera.position.y += (targetCameraY - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        // Cyber mode removed

        // EdTech mode dynamic updating
        if (config.mode === 'edtech') {
            edTechTime += 0.02;
            
            // Stage 1
            if (edTechStage === 1) {
                infoTitle.innerText = "Acto 1: Nube de Probabilidad";
                infoDesc.innerText = "La partícula cuántica no tiene posición. Es una onda de probabilidad.";
            }

            // Stage 2: Measurement (Collapse) at 4 seconds
            if (edTechStage === 1 && edTechTime > 4.0) {
                edTechStage = 2;
                config.capacity = 4500;
                config.resolution = 0.15;
                infoTitle.innerText = "Acto 2: Colapso por Medición";
                infoDesc.innerText = "El acto consciente de medir obligó a la naturaleza a definir una posición.";
            }
            
            // Stage 3: Uncertainty (Heisenberg) at 8 seconds
            if (edTechStage === 2 && edTechTime > 8.0) {
                edTechStage = 3;
                config.frequency = 3.5;
                config.phase2 = Math.PI; // Inject turbulence
                applyWaves();
                infoTitle.innerText = "Acto 3: Incertidumbre de Heisenberg";
                infoDesc.innerText = "Intentar fijar el momento exacto inyectó entropía, disipando la partícula.";
            }
            
            // Reset at 14 seconds
            if (edTechStage === 3 && edTechTime > 14.0) {
                edTechStage = 1;
                edTechTime = 0;
                config.capacity = 100;
                config.resolution = 0.01;
                config.frequency = 1.5;
                config.phase2 = 0.0;
                applyWaves();
            }
        }

        // Update UI Metrics
        metricFreq.innerText = config.frequency.toFixed(2) + " Hz";
        metricRes.innerText = config.resolution.toFixed(2);
        metricCap.innerText = config.capacity.toString();

        // Sync observer state
        engine.set_observer_capacity(config.capacity);
        engine.set_observer_resolution(config.resolution);

        // 1. Get raw flat array of particles (This also mutates phase inside Rust!)
        const step = Math.max(0.08, config.resolution * 2.0); 
        const particleData = engine.render_particles(-2.5, 2.5, step);

        const numParticles = particleData.length / 4;
        const positions = new Float32Array(numParticles * 3);
        const intensities = new Float32Array(numParticles);

        for (let i = 0; i < numParticles; i++) {
            positions[i * 3 + 0] = particleData[i * 4 + 0];
            positions[i * 3 + 1] = particleData[i * 4 + 1];
            positions[i * 3 + 2] = particleData[i * 4 + 2];
            intensities[i] = particleData[i * 4 + 3];
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('intensity', new THREE.BufferAttribute(intensities, 1));
        
        // 2. Get Graph Edges (Emergent Geometry)
        const edgeData = engine.get_graph_edges();
        const numEdges = edgeData.length / 7; // [x1, y1, z1, x2, y2, z2, strength]
        const linePositions = new Float32Array(numEdges * 6);
        // Note: we could map strength to colors, but for performance we just use a uniform material
        // and adjust opacity globally, or use VertexColors. For simplicity, we just draw them.
        
        for (let i = 0; i < numEdges; i++) {
            linePositions[i * 6 + 0] = edgeData[i * 7 + 0];
            linePositions[i * 6 + 1] = edgeData[i * 7 + 1];
            linePositions[i * 6 + 2] = edgeData[i * 7 + 2];
            linePositions[i * 6 + 3] = edgeData[i * 7 + 3];
            linePositions[i * 6 + 4] = edgeData[i * 7 + 4];
            linePositions[i * 6 + 5] = edgeData[i * 7 + 5];
        }
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

        // Rotate scene to appreciate 3D depth
        universeGroup.rotation.y += config.rotationSpeed;
        universeGroup.rotation.x += config.rotationSpeed * 0.5;

        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}

bootstrap().catch(console.error);
