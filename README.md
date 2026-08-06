# Tzanix Quantum Engine 🌌

![Tzanix Quantum Engine](https://img.shields.io/badge/Status-Open%20Beta-success) ![License](https://img.shields.io/badge/License-AGPLv3%20%2F%20Commercial-blue) ![Stack](https://img.shields.io/badge/Stack-Rust%20%7C%20WASM%20%7C%20Three.js-orange)

> **🚀 Open Beta / Acceso Gratuito:** El motor es gratuito para evaluación, educación y desarrollo personal durante la fase Beta. Para licencias empresariales o integraciones comerciales, contáctanos en **aureasystems.mx**.

Un motor de física de información y renderizado interactivo 3D construido en **Rust**, compilado a **WebAssembly (WASM)**, y renderizado volumétricamente en el navegador con **Three.js** (WebGL) y **GLSL**.

A diferencia de los motores de física tradicionales que tratan el espacio ($x,y,z$) y el tiempo como una matriz estática, **Tzanix Quantum Engine** postula que el espacio, la topología y la materia son propiedades emergentes de la **Interferencia Constructiva de Ondas de Información**.

---

## 🔬 Demostraciones Incluidas (Presets)

### 1. Física Teórica (Entidades Geométricas)
- **Partícula Estable:** Ondas en perfecta coherencia de fase que colapsan en estructuras cristalinas masivas.
- **Vacío Cuántico (Turbulencia):** Fluctuaciones de fase y alta entropía cuántica donde la materia no logra entrelazarse.
- **Red de Gravedad:** Interferencia fractal de ondas complejas, simulando la métrica curva del espacio-tiempo emergente.

### 2. Ciberseguridad (Visualización Topológica de Redes)
Visualización 3D en tiempo real del tráfico de servidores. 
- La latencia y el estado de la conexión mapean la fase de las ondas.
- Un ataque DDoS genera turbulencia de fase, rompiendo inmediatamente el *Grafo de Entrelazamiento* y disparando alertas volumétricas en rojo.

### 3. EdTech (Laboratorio Virtual Cuántico)
Una experiencia guiada y automatizada para enseñar mecánica cuántica a estudiantes:
1. **Nube de Probabilidad:** Baja resolución de medida que revela la naturaleza ondulatoria de la materia.
2. **Colapso de Función de Onda:** El Observador aumenta la precisión, colapsando la nube en nodos definidos.
3. **Principio de Incertidumbre de Heisenberg:** Intentar fijar el momento exacto inyecta turbulencia en el campo, disipando la materia.

---

## 🛠️ Tech Stack
- **Motor Core:** Rust, `wasm-bindgen`, matemáticas de campo escalar.
- **Frontend:** TypeScript, Vite, `lil-gui` (UI).
- **Renderizado Gráfico:** Three.js, Shaders personalizados (Vertex & Fragment) en GLSL para blending aditivo y efectos volumétricos a 60 FPS en el navegador.

---

## 🚀 Instalación y Ejecución (Local)

Ejecuta este motor directamente en tu navegador.

1. **Instalar dependencias del Frontend:**
   ```bash
   cd frontend
   npm install
   ```

2. **Iniciar el servidor local (Vite):**
   ```bash
   npm run dev
   ```
3. Abre tu navegador en `http://localhost:5173/`.

*(Opcional: Si deseas recompilar el motor de Rust a WASM, necesitas instalar Rust y ejecutar `wasm-pack build --target web` en la raíz del proyecto).*

---

## ⚖️ Licencias (Dual License Model)

Tzanix Quantum Engine opera bajo un modelo de licencia dual:

1. **Licencia Open Source (GNU AGPLv3)**
   Ideal para estudiantes, académicos y desarrolladores indie. Eres libre de descargar, usar y modificar el código para proyectos personales, investigación y uso no comercial, siempre y cuando compartas tus modificaciones bajo los mismos términos de código abierto.

2. **Licencias Comerciales y Enterprise**
   Para empresas de Ciberseguridad, Telecomunicaciones, o agencias que requieran:
   - Integración a puerta cerrada sin revelar su código fuente (B2B SaaS).
   - Conectores WebSockets personalizados para Big Data en tiempo real.
   - Licencias *White-Label* (Código fuente completo).
   
   🔗 **[Adquiere una Licencia Comercial (Contactar Ventas)](#)**

---

*Desarrollado con ❤️ para empujar los límites de la física computacional en la web.*
