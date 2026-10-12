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
    ws.onerror = () => {};
    ws.onclose = () => {
        setTimeout(connectQGuardWebSocket, 15000);
    };
}
connectQGuardWebSocket();

async function bootstrap() {
    await init();
    
    const engine = new QuantumEngineWasm(2000, 0.05);

    const scene = new THREE.Scene();
    // scene.background removed to allow CSS background to show through

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 6;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // Transparent to show CSS grid
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
    const isMobile = () => window.innerWidth <= 900;
    const gui = new GUI({ title: 'TZANIX AJUSTES' });
    const config = {
        capacity: 100,
        resolution: 0.01,
        phase1: 0.0,
        phase2: 0.0,
        frequency: 1.5,
        rotationSpeed: 0.005,
        mode: 'edtech', // Por defecto en modo educativo EdTech para mostrar partículas inmediatamente
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
            if (btnStartSim) {
                btnStartSim.innerText = "⏸ Pausar Simulación";
                btnStartSim.classList.add('running');
            }
            if (simProgressBar) simProgressBar.style.width = '0%';
            if (simTimerBadge) simTimerBadge.innerText = '⏱ 00:00 / 00:30 · Fase 1/3 (10s)';
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
    const simProgressBar = document.getElementById('sim-progress-bar');
    const simTimerBadge = document.getElementById('sim-timer-badge');

    // Botón para cerrar ajustes directamente desde el panel
    gui.add({
        cerrarAjustes: () => {
            guiEl.classList.remove('visible');
            btnToggleGui?.classList.remove('active');
            const label = btnToggleGui?.querySelector('.gui-btn-label');
            if (label) label.textContent = 'AJUSTES';
        }
    }, 'cerrarAjustes').name('✕ CERRAR AJUSTES');

    const simFolder = gui.addFolder('Filtro de Observador');
    simFolder.add(config, 'capacity', 100, 10000, 100).name('Capacidad (Hilbert)').listen();
    simFolder.add(config, 'resolution', 0.01, 0.2, 0.01).name('Resolución').listen();
    simFolder.open(); // Abrir por defecto para que los ajustes salgan completos
    
    const waveFolder = gui.addFolder('Campo de Información');
    waveFolder.add(config, 'frequency', 0.1, 5.0, 0.1).name('Frecuencia').listen().onChange(applyWaves);
    waveFolder.add(config, 'phase1', 0, Math.PI * 2, 0.1).name('Fase 1 (X/Y)').listen().onChange(applyWaves);
    waveFolder.add(config, 'phase2', 0, Math.PI * 2, 0.1).name('Fase 2 (Z)').listen().onChange(applyWaves);
    waveFolder.open(); // Abrir por defecto
    
    const presetFolder = gui.addFolder('Preajustes Cuánticos');
    presetFolder.add(config, 'presetEdTech').name('Efecto Observador (10s/fase)');
    presetFolder.add(config, 'presetStableParticle').name('Partícula Estable');
    presetFolder.add(config, 'presetVacuum').name('Vacío Cuántico');
    presetFolder.open(); // Abrir por defecto

    // Init state: activar ondas cuánticas de inmediato
    applyWaves();

    // ── Layout adaptativo, toggle de ajustes y plegado de panel ─────────────
    const guiEl = gui.domElement as HTMLElement;
    const btnToggleGui = document.getElementById('btn-toggle-gui');
    const infoPanelEl = document.getElementById('info-panel');
    const btnMinimizePanel = document.getElementById('btn-minimize-panel');
    const minimizeIcon = document.getElementById('minimize-icon');

    // Botón para abrir/cerrar ajustes en móvil y desktop
    btnToggleGui?.addEventListener('click', () => {
        const isOpen = guiEl.classList.toggle('visible');
        if (isOpen) {
            btnToggleGui.classList.add('active');
            const label = btnToggleGui.querySelector('.gui-btn-label');
            if (label) label.textContent = 'CERRAR ✕';
        } else {
            btnToggleGui.classList.remove('active');
            const label = btnToggleGui.querySelector('.gui-btn-label');
            if (label) label.textContent = 'AJUSTES';
        }
    });

    // Botón y cabecera para plegar/desplegar el panel de información en móvil
    const togglePanelCollapse = (e?: Event) => {
        if (e) e.stopPropagation();
        const isCollapsed = infoPanelEl?.classList.toggle('collapsed');
        if (minimizeIcon) {
            minimizeIcon.textContent = isCollapsed ? '▼' : '▲';
        }
    };
    btnMinimizePanel?.addEventListener('click', togglePanelCollapse);
    document.querySelector('.panel-title-group')?.addEventListener('click', togglePanelCollapse);

    function applyResponsiveLayout() {
        guiEl.style.display = ''; // Limpiar estilo inline para que mande la clase .visible
        if (isMobile()) {
            universeGroup.position.y = -0.4; // Holograma centrado armónicamente en el viewport móvil
            targetCameraY = 0.8;
            targetCameraZ = 6.6;
        } else {
            universeGroup.position.y = 0;
            targetCameraY = 2.0;
            targetCameraZ = 6.0;
        }
    }
    applyResponsiveLayout();
    window.addEventListener('resize', applyResponsiveLayout);

    // ══════════════════════════════════════════════════════════════════════════
    // CONTROLADOR DE INTERACCIÓN 3D (Táctil, Ratón, Giro 360°, Inercia y Zoom)
    // ══════════════════════════════════════════════════════════════════════════
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let velRotationX = 0;
    let velRotationY = 0;
    let targetCameraZ = isMobile() ? 7.0 : 6.0;
    let targetCameraX = 0;
    let targetCameraY = 2.0;
    let initialPinchDist = 0;
    let lastUserInteractionTime = 0;
    let touchStartX = 0;
    let touchStartY = 0;

    // Helper: comprobar si el toque o clic fue sobre un control interactivo de la UI
    const isUIElement = (target: EventTarget | null) => {
        if (!target || !(target instanceof HTMLElement)) return false;
        return !!target.closest('#info-panel, .top-bar, .lil-gui, button, a, input, select');
    };

    const touchHint = document.getElementById('touch-hint');
    function dismissHint() {
        if (touchHint && !touchHint.classList.contains('hidden')) {
            touchHint.classList.add('hidden');
            setTimeout(() => touchHint.remove(), 700);
        }
    }
    setTimeout(dismissHint, 6000);

    // 1. Ratón (Desktop)
    window.addEventListener('mousedown', (e) => {
        if (isUIElement(e.target)) return;
        isDragging = true;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
        velRotationX = 0;
        velRotationY = 0;
        lastUserInteractionTime = performance.now();
        dismissHint();
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - prevPointerX;
            const deltaY = e.clientY - prevPointerY;
            prevPointerX = e.clientX;
            prevPointerY = e.clientY;

            universeGroup.rotation.y += deltaX * 0.007;
            universeGroup.rotation.x += deltaY * 0.007;

            velRotationY = deltaX * 0.007;
            velRotationX = deltaY * 0.007;
            lastUserInteractionTime = performance.now();
        } else {
            // Parallax sutil cuando se mueve el ratón sin hacer clic
            const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
            targetCameraX = mouseX * 1.5;
            targetCameraY = 2.0 + mouseY * 1.0;
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // 2. Táctil (Móviles y Tablets)
    window.addEventListener('touchstart', (e: TouchEvent) => {
        if (isUIElement(e.target)) return;

        if (e.touches.length === 1) {
            isDragging = true;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            prevPointerX = touchStartX;
            prevPointerY = touchStartY;
            velRotationX = 0;
            velRotationY = 0;
            lastUserInteractionTime = performance.now();
            dismissHint();
        } else if (e.touches.length === 2) {
            // Preparar zoom con pellizco
            isDragging = false;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialPinchDist = Math.hypot(dx, dy);
            dismissHint();
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e: TouchEvent) => {
        if (isUIElement(e.target)) return;

        if (e.touches.length === 1 && isDragging) {
            if (e.cancelable) e.preventDefault(); // Evitar scroll o pull del navegador
            const curX = e.touches[0].clientX;
            const curY = e.touches[0].clientY;
            const deltaX = curX - prevPointerX;
            const deltaY = curY - prevPointerY;
            prevPointerX = curX;
            prevPointerY = curY;

            universeGroup.rotation.y += deltaX * 0.008;
            universeGroup.rotation.x += deltaY * 0.008;

            velRotationY = deltaX * 0.008;
            velRotationX = deltaY * 0.008;
            lastUserInteractionTime = performance.now();
        } else if (e.touches.length === 2) {
            if (e.cancelable) e.preventDefault(); // Zoom con 2 dedos
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);

            if (initialPinchDist > 0) {
                const diff = dist - initialPinchDist;
                targetCameraZ -= diff * 0.015;
                targetCameraZ = Math.max(2.5, Math.min(12.0, targetCameraZ));
            }
            initialPinchDist = dist;
            lastUserInteractionTime = performance.now();
        }
    }, { passive: false });

    window.addEventListener('touchend', (e: TouchEvent) => {
        if (isDragging && e.changedTouches.length > 0 && !isUIElement(e.target)) {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const moveDist = Math.hypot(endX - touchStartX, endY - touchStartY);

            // Toque rápido (tap sin arrastre) = Colapso de onda interactivo
            if (moveDist < 12) {
                const normX = (endX / window.innerWidth) * 2 - 1;
                engine.add_wave(config.frequency * 1.5, config.frequency * 1.2, config.frequency, 1.2, normX * Math.PI);
            }
        }
        isDragging = false;
        initialPinchDist = 0;
    });

    // 3. Zoom con rueda del ratón (Desktop)
    window.addEventListener('wheel', (e: WheelEvent) => {
        if (isUIElement(e.target)) return;
        targetCameraZ += e.deltaY * 0.005;
        targetCameraZ = Math.max(2.5, Math.min(12.0, targetCameraZ));
    }, { passive: true });

    // ── Bottom-bar toggle: properly show/hide the GUI panel ──────────────────
    const advancedBtn = document.getElementById('btn-advanced');
    if (advancedBtn) {
        advancedBtn.addEventListener('click', () => {
            if (isMobile()) return;
            const isOpen = guiEl.classList.contains('visible');
            if (isOpen) {
                guiEl.classList.remove('visible');
                advancedBtn.textContent = 'PARÁMETROS AVANZADOS';
            } else {
                guiEl.classList.add('visible');
                advancedBtn.textContent = 'CERRAR AJUSTES ✕';
            }
        });
    }


    let edTechTime = 0;
    let edTechStage = 0;
    let isSimRunning = true; // Simulación activa de inmediato al cargar

    if (btnStartSim) {
        btnStartSim.addEventListener('click', () => {
            if (!isSimRunning) {
                if (edTechTime >= 30.0) {
                    config.presetEdTech();
                } else {
                    isSimRunning = true;
                    btnStartSim.innerText = "⏸ Pausar Simulación";
                    btnStartSim.classList.add('running');
                }
            } else {
                isSimRunning = false;
                btnStartSim.innerText = "▶ Reanudar Simulación (30s)";
                btnStartSim.classList.remove('running');
                if (infoTitle) infoTitle.innerText = "Modo Libre (Pausa)";
                if (infoDesc) infoDesc.innerText = "Simulación pausada. Puedes ajustar los parámetros cuánticos libremente.";
            }
        });
    }

    // Iniciar de inmediato la simulación EdTech al cargar la página
    config.presetEdTech();




    // Load params from URL hash on startup (for shared links)
    const urlHash = new URLSearchParams(window.location.hash.replace('#', ''));
    if (urlHash.get('cap'))   config.capacity   = Number(urlHash.get('cap'));
    if (urlHash.get('res'))   config.resolution = Number(urlHash.get('res'));
    if (urlHash.get('freq'))  config.frequency  = Number(urlHash.get('freq'));
    if (urlHash.get('ph1'))   config.phase1     = Number(urlHash.get('ph1'));
    if (urlHash.get('ph2'))   config.phase2     = Number(urlHash.get('ph2'));
    gui.controllersRecursive().forEach(c => c.updateDisplay());
    applyWaves();

    // ════════════════════════════════════════════════════
    // ② CAPTURA + ENLACE COMPARTIBLE
    // ════════════════════════════════════════════════════
    const btnScreenshot = document.getElementById('btn-screenshot');
    const btnShare      = document.getElementById('btn-share');

    btnScreenshot?.addEventListener('click', () => {
        // Force one render at full pixel ratio before capturing
        renderer.render(scene, camera);
        const dataURL = renderer.domElement.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `tzanix-quantum-${Date.now()}.png`;
        a.click();
        // Flash feedback
        btnScreenshot.classList.add('flash');
        setTimeout(() => btnScreenshot.classList.remove('flash'), 600);
    });

    btnShare?.addEventListener('click', () => {
        const params = new URLSearchParams({
            cap:  config.capacity.toString(),
            res:  config.resolution.toString(),
            freq: config.frequency.toString(),
            ph1:  config.phase1.toString(),
            ph2:  config.phase2.toString(),
        });
        const shareUrl = `${window.location.origin}${window.location.pathname}#${params.toString()}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            // Flash feedback + change label briefly
            const label = btnShare.querySelector('.share-label');
            if (label) { const orig = label.textContent; label.textContent = '¡COPIADO!'; setTimeout(() => label.textContent = orig, 2000); }
            btnShare.classList.add('flash');
            setTimeout(() => btnShare.classList.remove('flash'), 600);
        });
    });

    // ════════════════════════════════════════════════════
    // ③ TOOLTIPS DIDÁCTICOS al mover parámetros
    // ════════════════════════════════════════════════════
    const tooltip = document.getElementById('param-tooltip');
    let tooltipTimer: ReturnType<typeof setTimeout>;

    const tooltipTexts: Record<string, { title: string; desc: string }> = {
        capacity: {
            title: 'Espacio de Hilbert',
            desc:  'Al subir la capacidad, el radio del espacio de Hilbert crece. La partícula puede existir en más estados simultáneos — la malla se expande y absorbe energía.'
        },
        resolution: {
            title: 'Resolución Cuántica',
            desc:  'Define el nivel de detalle del muestreo. Valores bajos revelan la estructura interna de la onda; valores altos muestran el campo completo de probabilidad.'
        },
        frequency: {
            title: 'Energía de Oscilación',
            desc:  'La frecuencia controla la energía de la onda estacionaria (E = hν). Al subirla, aceleras la vibración de los tensores en el plano 3D.'
        },
        phase1: {
            title: 'Desfase Angular (Eje X/Y)',
            desc:  'Modifica el ángulo del número complejo de la onda. Crea interferencia constructiva que "dobla" la geometría del holograma horizontalmente.'
        },
        phase2: {
            title: 'Profundidad de Onda (Eje Z)',
            desc:  'Controla la interferencia en profundidad. Combina con Phase 1 para desestabilizar la simetría del sistema y crear nodos de caos inercial en la malla.'
        },
    };

    function showTooltip(key: string) {
        const entry = tooltipTexts[key];
        if (!tooltip || !entry) return;
        tooltip.innerHTML = `<strong>${entry.title}</strong>${entry.desc}`;
        tooltip.classList.add('visible');
        clearTimeout(tooltipTimer);
        tooltipTimer = setTimeout(() => tooltip.classList.remove('visible'), 4000);
    }

    // Wire tooltips to each GUI controller onChange
    simFolder.controllers.forEach(c => {
        const prop = (c as any).property as string;
        c.onChange(() => showTooltip(prop));
    });
    waveFolder.controllers.forEach(c => {
        const prop = (c as any).property as string;
        c.onChange(() => showTooltip(prop));
    });

    let lastTime = performance.now();

    // Render loop
    function animate(time: number) {
        const deltaTime = (time - lastTime) / 1000;
        lastTime = time;

        requestAnimationFrame(animate);
        
        // Suavizado de zoom y posición de cámara
        camera.position.z += (targetCameraZ - camera.position.z) * 0.1;
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

        // EdTech mode dynamic updating (10 segundos por fase, 30s en total)
        if (config.mode === 'edtech' && isSimRunning) {
            edTechTime += deltaTime;

            // Actualización fluida de la barra de progreso (0% a 100%)
            const progress = Math.min(100, (edTechTime / 30.0) * 100);
            if (simProgressBar) {
                simProgressBar.style.width = `${progress}%`;
            }

            const currentSec = Math.floor(edTechTime);
            const remainingPhase = Math.max(0, 10 - Math.floor(edTechTime % 10));
            
            // Fase 1: Nube de Probabilidad (0s a 10s)
            if (edTechTime < 10.0) {
                if (edTechStage !== 1) {
                    edTechStage = 1;
                    if (infoTitle) infoTitle.innerText = "Fase 1: Nube de Probabilidad (1/3)";
                    if (infoDesc) infoDesc.innerText = "Sin un observador consciente, la partícula existe en múltiples estados a la vez como una onda continua.";
                    config.capacity = 100;
                    config.resolution = 0.01;
                    config.frequency = 1.5;
                    config.phase1 = 0.0;
                    config.phase2 = 0.0;
                    applyWaves();
                }
                if (simTimerBadge) {
                    simTimerBadge.innerText = `⏱ 00:${currentSec.toString().padStart(2, '0')} / 00:30 · Fase 1/3 (restan ${remainingPhase}s)`;
                }
            }
            // Fase 2: Colapso por Medición (10s a 20s)
            else if (edTechTime < 20.0) {
                if (edTechStage !== 2) {
                    edTechStage = 2;
                    if (infoTitle) infoTitle.innerText = "Fase 2: Colapso por Medición (2/3)";
                    if (infoDesc) infoDesc.innerText = "Al observar e interactuar, la función de onda colapsa y define una posición geométrica concentrada.";
                    config.capacity = 4500;
                    config.resolution = 0.15;
                    config.frequency = 0.8;
                    config.phase1 = 0.0;
                    config.phase2 = 0.0;
                    applyWaves();
                }
                if (simTimerBadge) {
                    simTimerBadge.innerText = `⏱ 00:${currentSec.toString().padStart(2, '0')} / 00:30 · Fase 2/3 (restan ${remainingPhase}s)`;
                }
            }
            // Fase 3: Incertidumbre de Heisenberg (20s a 30s)
            else if (edTechTime < 30.0) {
                if (edTechStage !== 3) {
                    edTechStage = 3;
                    if (infoTitle) infoTitle.innerText = "Fase 3: Incertidumbre de Heisenberg (3/3)";
                    if (infoDesc) infoDesc.innerText = "Medir exactamente el estado de la partícula altera su momento y energía con alta vibración cuántica.";
                    config.capacity = 2500;
                    config.resolution = 0.05;
                    config.frequency = 3.8;
                    config.phase2 = Math.PI;
                    applyWaves();
                }
                if (simTimerBadge) {
                    simTimerBadge.innerText = `⏱ 00:${currentSec.toString().padStart(2, '0')} / 00:30 · Fase 3/3 (restan ${remainingPhase}s)`;
                }
            }
            // Fin de la simulación a los 30s
            else {
                isSimRunning = false;
                if (simProgressBar) simProgressBar.style.width = '100%';
                if (simTimerBadge) simTimerBadge.innerText = '⏱ 00:30 / 00:30 · ¡Simulación Completada!';
                if (btnStartSim) {
                    btnStartSim.innerText = "↻ Reiniciar Simulación (30s)";
                    btnStartSim.classList.remove('running');
                }
                if (infoTitle) infoTitle.innerText = "Simulación Completada";
                if (infoDesc) infoDesc.innerText = "Has presenciado las 3 fases del efecto observador cuántico (10 segundos por fase).";
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

        // Inercia de rotación del holograma y rotación pasiva sutil
        if (!isDragging) {
            universeGroup.rotation.y += velRotationY;
            universeGroup.rotation.x += velRotationX;
            velRotationY *= 0.92; // Fricción suave
            velRotationX *= 0.92;

            // Retomar suave rotación cósmica si el usuario no ha tocado la pantalla en 1.5s
            if (performance.now() - lastUserInteractionTime > 1500) {
                universeGroup.rotation.y += config.rotationSpeed * 0.7;
                universeGroup.rotation.x += config.rotationSpeed * 0.3;
            }
        }

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
