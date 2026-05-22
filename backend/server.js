const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors()); // Allow Next.js frontend to access

// Store the latest sensor reading in memory
let latestData = null;

// Endpoint ESP32 POST ke sini
app.post('/api/data', (req, res) => {
    const sensorData = req.body;
    
    // Simpan data terbaru + timestamp
    latestData = {
        ...sensorData,
        timestamp: new Date().toISOString()
    };

    console.log("--- New Sensor Reading ---");
    console.log(`Temperature: ${sensorData.temperature_c}°C`);
    console.log(`Humidity: ${sensorData.humidity}%`);
    console.log(`Heat Index: ${sensorData.heat_index_c}°C`);

    res.status(200).send("Data logged successfully");
});

// Endpoint untuk Next.js frontend GET data terbaru
app.get('/api/latest', (req, res) => {
    if (!latestData) {
        return res.status(404).json({ error: 'No data yet' });
    }
    res.json(latestData);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Waiting for ESP32 data...`);
});