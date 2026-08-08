import './style.css';
import * as THREE from 'three';
import { GUI } from 'lil-gui';
import init, { QuantumEngineWasm } from 'tzanix_quantum_engine';
import { ipToFrequencies } from './mockData';

// Estado global para datos en vivo desde el WebSocket (TZANiX Q-Balam)
interface LiveServer {
    ip: string;
    magnitude: number;
    entropy: number;
    lastSeen: number;
    blocked: boolean;
}
const liveServers = new Map<string, LiveServer>();

function connectQGuardWebSocket() {
    const ws = new WebSocket('ws://127.0.0.1:8081');
    ws.onopen = () => console.log('📡 Conectado al TZANiX Q-Balam Telemetry');
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            const now = performance.now();
            
            if (data.type === 'TELEMETRY') {
                const ip = data.x_vector;
                const existing = liveServers.get(ip);
                if (!existing?.blocked) {
                    liveServers.set(ip, {
                        ip,
                        magnitude: data.y_magnitude,
                        entropy: data.z_entropy,
                        lastSeen: now,
                        blocked: false
                    });
                }
            } else if (data.type === 'KILL_SWITCH') {
                const ip = data.x_vector;
                liveServers.set(ip, {
                    ip,
                    magnitude: data.y_magnitude,
                    entropy: 0,
                    lastSeen: now,
                    blocked: true
                });
                console.warn(`🛑 KILL-SWITCH ACTIVADO: ${ip}`);
            }
        } catch (e) {
            console.error('Error parseando WebSocket:', e);
        }
    };
    ws.onclose = () => {
        console.warn('WebSocket desconectado. Reconectando en 2s...');
        setTimeout(connectQGuardWebSocket, 2000);
    };
}
connectQGuardWebSocket();

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
                
                // Si la intensidad es muy alta (Kill-Switch), saturar en rojo
                float anomalyFactor = smoothstep(0.3, 0.6, vIntensity);
                vec3 color = mix(normalColor, anomalyColor, anomalyFactor); 
                
                float alpha = (0.02 + vIntensity * 0.1) * softEdge;
                
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
    const gui = new GUI({ title: 'Tzanix Q-Balam' });
    const config = {
        capacity: 2000,
        resolution: 0.05,
        phase1: 0.0,
        phase2: Math.PI / 4,
        frequency: 1.0,
        rotationSpeed: 0.005,
        mode: 'cyber', // Default to cyber mode to receive Q-Balam data
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
        presetCybersecurity: () => {
            config.mode = 'cyber';
            config.capacity = 5000;
            config.resolution = 0.02;
            config.rotationSpeed = 0.001;
            gui.controllersRecursive().forEach(c => c.updateDisplay());
        },
        presetEdTech: () => {
            config.mode = 'edtech';
            config.capacity = 100;
            config.resolution = 0.01;
            config.frequency = 1.5;
            config.phase1 = 0.0;
            config.phase2 = 0.0;
            config.rotationSpeed = 0.005;
            isSimRunning = true;
            edTechTime = 0;
            edTechStage = 0;
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

    // DOM references (safely handled if they don't exist)
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const metricFreq = document.getElementById('metric-freq');
    const metricRes = document.getElementById('metric-res');
    const metricCap = document.getElementById('metric-cap');
    const btnStartSim = document.getElementById('btn-start-sim');
    
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
    presetFolder.add(config, 'presetCybersecurity').name('Cybersecurity Live');
    presetFolder.add(config, 'presetEdTech').name('Edu: Observer Effect');

    // Init state
    applyWaves();

    let edTechTime = 0;
    let edTechStage = 0;
    let isSimRunning = false;

    if (btnStartSim) {
        btnStartSim.addEventListener('click', () => {
            if (!isSimRunning) {
                isSimRunning = true;
                edTechTime = 0;
                edTechStage = 0;
                btnStartSim.innerText = "⏹ Detener Simulación";
                btnStartSim.classList.add('running');
                config.presetEdTech();
            } else {
                isSimRunning = false;
                btnStartSim.innerText = "▶ Iniciar Simulación Educativa";
                btnStartSim.classList.remove('running');
                if (infoTitle) infoTitle.innerText = "Modo Libre";
                if (infoDesc) infoDesc.innerText = "Simulación detenida. Ajusta los parámetros libremente.";
            }
        });
    }

    let lastTime = performance.now();

    // Render loop
    function animate(time: number) {
        const deltaTime = (time - lastTime) / 1000;
        lastTime = time;

        requestAnimationFrame(animate);
        
        // Camera parallax
        camera.position.x += (targetCameraX - camera.position.x) * 0.05;
        camera.position.y += (targetCameraY - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        // Cyber mode dynamic updating (Live Telemetry from Q-Balam)
        if (config.mode === 'cyber') {
            engine.clear_waves();
            const now = performance.now();
            
            for (const [ip, server] of liveServers.entries()) {
                // Limpiar nodos inactivos después de 2 segundos si no están bloqueados
                if (!server.blocked && now - server.lastSeen > 2000) {
                    liveServers.delete(ip);
                    continue;
                }
                
                const freqs = ipToFrequencies(server.ip);
                
                if (server.blocked) {
                    // Kill-Switch activo: Explosión roja masiva
                    engine.add_wave(freqs.fx, freqs.fy, freqs.fz, 2.0, Math.PI);
                } else {
                    // Telemetría normal
                    const amplitude = Math.min(server.magnitude / 4096.0, 1.0);
                    const phase = server.entropy * Math.PI;
                    engine.add_wave(freqs.fx, freqs.fy, freqs.fz, amplitude, phase);
                }
            }
        }

        // EdTech mode dynamic updating
        if (config.mode === 'edtech' && isSimRunning) {
            edTechTime += deltaTime;
            
            // Stage 1: Probability Cloud (0s to 30s)
            if (edTechTime < 30.0) {
                if (edTechStage !== 1) {
                    edTechStage = 1;
                    if (infoTitle) infoTitle.innerText = "Fase 1: Nube de Probabilidad";
                    if (infoDesc) infoDesc.innerText = "Sin un observador consciente, la partícula existe en múltiples estados a la vez como una onda.";
                    config.capacity = 100;
                    config.resolution = 0.01;
                    config.frequency = 1.5;
                    config.phase2 = 0.0;
                    applyWaves();
                }
            }
            // Stage 2: Collapse (30s to 60s)
            else if (edTechTime < 60.0) {
                if (edTechStage !== 2) {
                    edTechStage = 2;
                    if (infoTitle) infoTitle.innerText = "Fase 2: Colapso por Medición";
                    if (infoDesc) infoDesc.innerText = "Al observar e interactuar, la onda colapsa y define una posición.";
                    config.capacity = 4500;
                    config.resolution = 0.15;
                }
            }
            // Stage 3: Uncertainty (60s to 90s)
            else if (edTechTime < 90.0) {
                if (edTechStage !== 3) {
                    edTechStage = 3;
                    if (infoTitle) infoTitle.innerText = "Fase 3: Incertidumbre (Heisenberg)";
                    if (infoDesc) infoDesc.innerText = "Medir exactamente el estado de la partícula altera su momento.";
                    config.frequency = 3.5;
                    config.phase2 = Math.PI;
                    applyWaves();
                }
            }
            // Reset at 90s
            else {
                isSimRunning = false;
                if (btnStartSim) btnStartSim.innerText = "↻ Reiniciar Simulación";
                if (btnStartSim) btnStartSim.classList.remove('running');
                if (infoTitle) infoTitle.innerText = "Simulación Completada";
                if (infoDesc) infoDesc.innerText = "Has presenciado el efecto observador en un sistema cuántico simulado.";
            }
            
            gui.controllersRecursive().forEach(c => c.updateDisplay());
        }

        // Update UI Metrics
        if (metricFreq) metricFreq.innerText = config.frequency.toFixed(2) + " Hz";
        if (metricRes) metricRes.innerText = config.resolution.toFixed(2);
        if (metricCap) metricCap.innerText = config.capacity.toString();

        // Sync observer state
        engine.set_observer_capacity(config.capacity);
        engine.set_observer_resolution(config.resolution);

        // 1. Get raw flat array of particles
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
        
        // 2. Get Graph Edges
        const edgeData = engine.get_graph_edges();
        const numEdges = edgeData.length / 7;
        const linePositions = new Float32Array(numEdges * 6);
        
        for (let i = 0; i < numEdges; i++) {
            linePositions[i * 6 + 0] = edgeData[i * 7 + 0];
            linePositions[i * 6 + 1] = edgeData[i * 7 + 1];
            linePositions[i * 6 + 2] = edgeData[i * 7 + 2];
            linePositions[i * 6 + 3] = edgeData[i * 7 + 3];
            linePositions[i * 6 + 4] = edgeData[i * 7 + 4];
            linePositions[i * 6 + 5] = edgeData[i * 7 + 5];
        }
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

        // Rotate scene
        universeGroup.rotation.y += config.rotationSpeed;
        universeGroup.rotation.x += config.rotationSpeed * 0.5;

        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    requestAnimationFrame(animate);
}

bootstrap().catch(console.error);
