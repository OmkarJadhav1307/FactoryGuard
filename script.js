// --- FactoryGuard AI Portal V2.0 (3D Digital Twin Engine) ---

document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    initCharts();
    initUI();
    startSimulation();
});

// --- 1. Global State & Config ---
const CONFIG = {
    threshold: 0.4261, // Our champion model's optimal threshold
    colors: {
        safe: '#10b981',
        warn: '#f59e0b',
        danger: '#ef4444'
    }
};

let scene, camera, renderer, controls;
let millingMachine = {}; // Parts collection
let sensorChart;
let dataStream = Array(30).fill(45);
let labels = Array(30).fill('');

// --- 2. 3D Digital Twin (Three.js) ---
function initThreeJS() {
    const container = document.getElementById('three-container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(6, 6, 8);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    buildMillingMachine();

    // OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = false;

    window.addEventListener('resize', onWindowResize);
    animate();
}

function buildMillingMachine() {
    // 3.1 Base Frame
    const baseGeo = new THREE.BoxGeometry(4, 0.5, 4);
    const baseMat = new THREE.MeshPhongMaterial({ color: 0x22262e });
    millingMachine.base = new THREE.Mesh(baseGeo, baseMat);
    scene.add(millingMachine.base);

    // 3.2 Main Column (Vertical)
    const colGeo = new THREE.BoxGeometry(1, 4, 1);
    const colMat = new THREE.MeshPhongMaterial({ color: 0x333842 });
    millingMachine.column = new THREE.Mesh(colGeo, colMat);
    millingMachine.column.position.set(-1.5, 2, -1.5);
    scene.add(millingMachine.column);

    // 3.3 Spindle Block (The Torque Source)
    const spindleGeo = new THREE.BoxGeometry(1.2, 1.5, 1.2);
    const spindleMat = new THREE.MeshPhongMaterial({ color: 0x444b59, emissive: 0x000000 });
    millingMachine.spindle = new THREE.Mesh(spindleGeo, spindleMat);
    millingMachine.spindle.position.set(0, 3, 0);
    scene.add(millingMachine.spindle);

    // 3.4 Cutting Tool (The Wear Point)
    const toolGeo = new THREE.CylinderGeometry(0.1, 0.05, 1, 12);
    const toolMat = new THREE.MeshPhongMaterial({ color: 0x888888, emissive: 0x000000 });
    millingMachine.tool = new THREE.Mesh(toolGeo, toolMat);
    millingMachine.tool.position.set(0, 1.8, 0);
    scene.add(millingMachine.tool);

    // 3.5 Spindle Connector (Arm)
    const armGeo = new THREE.BoxGeometry(1.5, 0.4, 0.4);
    const armMat = new THREE.MeshPhongMaterial({ color: 0x22262e });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(-0.75, 3.2, -0.75);
    scene.add(arm);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    // Slow Idle Rotation for Spindle
    if (millingMachine.tool) {
        millingMachine.tool.rotation.y += 0.05;
    }
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('three-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// --- 3. Charts & Simulation ---
function initCharts() {
    const ctx = document.getElementById('sensorChart').getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0)');

    sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: dataStream,
                borderColor: CONFIG.colors.safe,
                backgroundColor: grad,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { 
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#64748b', font: { size: 10 } }
                }
            },
            animation: { duration: 0 }
        }
    });
}

function startSimulation() {
    setInterval(() => {
        const last = dataStream[dataStream.length - 1];
        let noise = (Math.random() * 4 - 2);
        let newVal = Math.max(20, Math.min(80, last + noise));
        
        dataStream.push(newVal);
        dataStream.shift();
        sensorChart.update();
    }, 1000);
}

// --- 4. User Interaction & XAI Logic ---
function initUI() {
    const sliders = ['torque-in', 'speed-in', 'wear-in'];
    sliders.forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => {
            const val = e.target.value;
            const labelMap = { 'torque-in': 'Nm', 'speed-in': 'RPM', 'wear-in': 'Min' };
            const type = id.split('-')[0];
            document.getElementById(`${type}-val`).innerText = `${val} ${labelMap[id]}`;
            
            runEnsembleDiagnostics();
        });
    });

    // Side Drawer Logic
    const riskCard = document.getElementById('risk-card');
    const sidePanel = document.getElementById('side-panel');
    const closeBtn = document.getElementById('close-drawer');

    riskCard.addEventListener('click', () => sidePanel.classList.add('open'));
    closeBtn.addEventListener('click', () => sidePanel.classList.remove('open'));
}

function runEnsembleDiagnostics() {
    const torque = parseInt(document.getElementById('torque-in').value);
    const speed = parseInt(document.getElementById('speed-in').value);
    const wear = parseInt(document.getElementById('wear-in').value);

    // 4.1 Ensemble Risk Probability Logic (Mimicking Python Meta-learner)
    // Formula based on AI4I dataset correlations
    let riskProb = (torque / 80 * 0.35) + (wear / 250 * 0.45) + (speed / 3000 * 0.1);
    
    // Non-linear "Crisis" triggers
    if (torque > 68) riskProb += 0.15;
    if (wear > 210) riskProb += 0.20;
    
    riskProb = Math.min(0.99, riskProb);
    const scorePct = (riskProb * 100).toFixed(1);

    // 4.2 UI Updates
    const riskEl = document.getElementById('risk-score');
    riskEl.innerText = `${scorePct}%`;
    
    const riskCard = document.getElementById('risk-card');
    if (riskProb >= CONFIG.threshold) {
        riskEl.style.color = CONFIG.colors.danger;
        riskCard.classList.add('highlight-danger');
    } else {
        riskEl.style.color = CONFIG.colors.safe;
        riskCard.classList.remove('highlight-danger');
    }

    // 4.3 3D Highlighting (The Anomaly Heatmap)
    update3DHeatmap(torque, wear, riskProb);

    // 4.4 XAI Panel Sync (SHAP Simulation)
    updateXAIPanel(torque, wear, speed, riskProb);
}

function update3DHeatmap(torque, wear, risk) {
    // Torque affects the Spindle (The Motor driving the machine)
    if (torque > 60) {
        millingMachine.spindle.material.emissive.setHex(0xef4444);
        millingMachine.spindle.material.emissiveIntensity = (torque - 60) / 20;
    } else {
        millingMachine.spindle.material.emissive.setHex(0x000000);
    }

    // Tool Wear affects the Cutting Head
    if (wear > 180) {
        millingMachine.tool.material.emissive.setHex(0xef4444);
        millingMachine.tool.material.emissiveIntensity = (wear - 180) / 70;
    } else {
        millingMachine.tool.material.emissive.setHex(0x000000);
    }
}

function updateXAIPanel(torque, wear, speed, risk) {
    // Update SHAP Bars
    const torqueBar = document.getElementById('shap-torque');
    const tempBar = document.getElementById('shap-temp'); // Using as proxy for speed impact
    const wearBar = document.getElementById('shap-wear');

    torqueBar.style.width = `${(torque / 80 * 90)}%`;
    tempBar.style.width = `${(speed / 3000 * 60)}%`;
    wearBar.style.width = `${(wear / 250 * 95)}%`;

    // Dynamic Interpretation Logic
    const msgEl = document.getElementById('xai-text');
    if (risk > 0.75) {
        msgEl.innerHTML = `<strong>CRITICAL ALERT:</strong> Extreme ${torque > 65 ? 'Torque Overload' : 'Spindle Stress'} detected. Combined with ${wear > 200 ? 'Severe Tool Degradation' : 'High Friction'}, the system predicts an <strong>Immediate Mechanical Failure</strong>. Stop spindle rotation immediately.`;
    } else if (risk >= CONFIG.threshold) {
        msgEl.innerHTML = `<strong>WARNING:</strong> Elevated friction levels detected. Tool wear is approaching end-of-life status. Plan for a tool replacement within the next 8-12 operating hours.`;
    } else {
        msgEl.innerHTML = `<strong>OPTIMAL STATE:</strong> All sensors reporting within stabilized industrial deviations. Energy efficiency is currently at peak levels. No intervention required.`;
    }
}
