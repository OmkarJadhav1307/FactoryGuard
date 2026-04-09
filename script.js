// --- FactoryGuard AI Portal Logic ---

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    initSandbox();
    startLiveSimulation();
});

// --- 1. Real-time Sensor Chart ---
let sensorChart;
const maxDataPoints = 30;
let chartData = Array(maxDataPoints).fill(40);
let labels = Array(maxDataPoints).fill('');

function initCharts() {
    const ctx = document.getElementById('sensorChart').getContext('2d');
    
    // Create Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Torque [Nm]',
                data: chartData,
                borderColor: '#10b981',
                borderWidth: 3,
                pointRadius: 0,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af' }
                },
                x: {
                    grid: { display: false },
                    ticks: { display: false }
                }
            },
            animation: {
                duration: 0
            }
        }
    });

    // Handle sensor select change
    document.getElementById('sensor-select').addEventListener('change', (e) => {
        const val = e.target.value;
        const labelsMap = { 'torque': 'Torque [Nm]', 'speed': 'Rotational Speed [RPM]', 'temp': 'Process Temp [K]' };
        sensorChart.data.datasets[0].label = labelsMap[val];
        sensorChart.update();
    });
}

// --- 2. Live Simulation Logic ---
function startLiveSimulation() {
    setInterval(() => {
        // Generate minor fluctuation
        const lastVal = chartData[chartData.length - 1];
        let newVal = lastVal + (Math.random() * 6 - 3);
        
        // Occasional Spike (Mirroring failure scenarios)
        if (Math.random() > 0.95) newVal += 15;
        
        // Boundaries
        newVal = Math.max(20, Math.min(80, newVal));

        chartData.push(newVal);
        chartData.shift();
        sensorChart.update();

        // If spike detected, update global risk count occasionally
        if (newVal > 65) {
            triggerVisualAlert();
        }
    }, 1000);
}

function triggerVisualAlert() {
    const riskCount = document.getElementById('risk-count');
    const current = parseInt(riskCount.innerText);
    riskCount.innerText = current + 1;
    riskCount.parentElement.parentElement.classList.add('highlight-danger');
    
    setTimeout(() => {
        riskCount.innerText = current;
    }, 5000);
}

// --- 3. Sandbox Diagnostic Logic ---
function initSandbox() {
    const torqueIn = document.getElementById('torque-in');
    const speedIn = document.getElementById('speed-in');
    const wearIn = document.getElementById('wear-in');
    
    const torqueVal = document.getElementById('torque-val');
    const speedVal = document.getElementById('speed-val');
    const wearVal = document.getElementById('wear-val');
    
    const predictBtn = document.getElementById('predict-btn');

    // Update displays
    torqueIn.addEventListener('input', (e) => torqueVal.innerText = `${e.target.value} Nm`);
    speedIn.addEventListener('input', (e) => speedVal.innerText = `${e.target.value} RPM`);
    wearIn.addEventListener('input', (e) => wearVal.innerText = `${e.target.value} Min`);

    predictBtn.addEventListener('click', runDiagnostic);
}

function runDiagnostic() {
    const torque = parseInt(document.getElementById('torque-in').value);
    const speed = parseInt(document.getElementById('speed-in').value);
    const wear = parseInt(document.getElementById('wear-in').value);
    
    const statusEl = document.getElementById('res-status');
    const msgEl = document.getElementById('res-msg');
    const gaugeBar = document.getElementById('gauge-bar');
    
    // Simulate our Ensemble Engine Logic (Simplified for JS)
    // Formula: Probability increases with Torque and Wear
    let prob = (torque / 80 * 0.4) + (wear / 250 * 0.4);
    
    // Extreme spikes have higher weight (Non-linear)
    if (torque > 65) prob += 0.2;
    if (wear > 200) prob += 0.15;
    
    prob = Math.min(0.99, prob);
    
    // Update UI
    const score = (prob * 100).toFixed(1);
    gaugeBar.style.width = `${score}%`;
    
    if (prob > 0.75) {
        statusEl.innerText = "CRITICAL RISK";
        statusEl.style.color = "#ef4444";
        gaugeBar.style.backgroundColor = "#ef4444";
        msgEl.innerText = `High probability (${score}%) of Component Failure within 24 hours. Emergency inspection required.`;
    } else if (prob > 0.45) {
        statusEl.innerText = "WARNING";
        statusEl.style.color = "#f59e0b";
        gaugeBar.style.backgroundColor = "#f59e0b";
        msgEl.innerText = `Moderate stress levels detected (${score}%). Monitor unit performance closely.`;
    } else {
        statusEl.innerText = "OPTIMAL";
        statusEl.style.color = "#10b981";
        gaugeBar.style.backgroundColor = "#10b981";
        msgEl.innerText = `Maintenance check not required. Systems functioning in safe zone (${score}% probability).`;
    }
}
