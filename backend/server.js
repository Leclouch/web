const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies sent by the ESP32
app.use(express.json());

// This is the endpoint the ESP32 will target
app.post('/api/data', (req, res) => {
    const sensorData = req.body;
    
    // Print the received data to the terminal
    console.log("--- New Sensor Reading ---");
    console.log(`Temperature: ${sensorData.temperature_c}°C`);
    console.log(`Humidity: ${sensorData.humidity}%`);
    console.log(`Heat Index: ${sensorData.heat_index_c}°C`);
    
    // Send a success response back to the ESP32
    res.status(200).send("Data logged successfully");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Waiting for ESP32 data...`);
});