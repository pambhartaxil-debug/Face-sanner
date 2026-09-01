// DOM Elements
const videoElement = document.getElementById('camera-video');
const startBtn = document.getElementById('start-btn');
const scanBtn = document.getElementById('scan-btn');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const scannerContainer = document.querySelector('.scanner-container');

// Result Elements
const resultName = document.getElementById('result-name');
const resultConfidence = document.getElementById('result-confidence');
const resultStatus = document.getElementById('result-status');
const resultTime = document.getElementById('result-time');

// State
let stream = null;
let isScanning = false;

// Initialize Camera
async function startCamera() {
    try {
        statusText.textContent = "Requesting permission...";
        
        // Setup camera constraints (prefer front-facing/webcam)
        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user"
            }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Attach stream to video element
        videoElement.srcObject = stream;
        videoElement.classList.add('active');
        
        // Update UI
        statusDot.classList.add('active');
        statusText.textContent = "Camera active";
        startBtn.textContent = "Stop Camera";
        scanBtn.disabled = false;
        
    } catch (err) {
        console.error("Error accessing the camera:", err);
        statusDot.classList.remove('active');
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            statusText.textContent = "Camera permission denied";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            statusText.textContent = "No camera found";
        } else {
            statusText.textContent = "Camera error: " + err.message;
        }
    }
}

// Stop Camera
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
        videoElement.classList.remove('active');
        stream = null;
        
        // Update UI
        statusDot.classList.remove('active');
        statusText.textContent = "Camera not started";
        startBtn.textContent = "Start Camera";
        scanBtn.disabled = true;
        
        if (isScanning) {
            stopScan();
        }
    }
}

// Format current time
function getCurrentTimeFormatted() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// Handle Face Scanning via Backend API
function startScan() {
    if (!stream) return;
    
    isScanning = true;
    scanBtn.disabled = true;
    
    // UI Updates for scanning phase
    scannerContainer.classList.add('scanning');
    resultName.textContent = "...";
    resultConfidence.textContent = "...";
    resultStatus.textContent = "Scanning...";
    resultStatus.style.color = "var(--primary-color)";
    resultTime.textContent = "--:--:--";
    
    // Capture frame from video
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    canvas.getContext('2d').drawImage(videoElement, 0, 0);
    const frameBase64 = canvas.toDataURL('image/jpeg');
    
    // Send to Flask backend
    fetch('/api/scan', {
        method: 'POST',
        body: JSON.stringify({ image: frameBase64 }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
        isScanning = false;
        scanBtn.disabled = false;
        scannerContainer.classList.remove('scanning');
        
        resultName.textContent = data.name || "Unknown";
        resultConfidence.textContent = data.confidence || "0%";
        resultStatus.textContent = data.status || "Error";
        resultTime.textContent = getCurrentTimeFormatted();
        
        if (data.status === "Access Granted") {
            resultStatus.style.color = "var(--primary-color)";
        } else {
            resultStatus.style.color = "var(--alert-color)";
        }
    })
    .catch(err => {
        console.error("Error during scan:", err);
        isScanning = false;
        scanBtn.disabled = false;
        scannerContainer.classList.remove('scanning');
        
        resultName.textContent = "Error";
        resultConfidence.textContent = "--";
        resultStatus.textContent = "Backend offline";
        resultStatus.style.color = "var(--alert-color)";
        resultTime.textContent = getCurrentTimeFormatted();
    });
}

function stopScan() {
    isScanning = false;
    scannerContainer.classList.remove('scanning');
    scanBtn.disabled = false;
    
    resultStatus.textContent = "Waiting";
    resultStatus.style.color = "var(--secondary-color)";
}

// Event Listeners
startBtn.addEventListener('click', () => {
    if (stream) {
        stopCamera();
    } else {
        startCamera();
    }
});

scanBtn.addEventListener('click', () => {
    if (!isScanning) {
        startScan();
    }
});
