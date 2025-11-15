// Import necessary modules
const express = require('express');
const axios = require('axios');
require('dotenv').config(); // Loads environment variables from .env file
const path = require('path');

const app = express();
const PORT = 3000;

// --- CONFIGURATION ---
const API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Middleware to serve static files from the 'public' directory
app.use(express.static(path.join(__dirname)));

// --- API Route to Fetch Weather Data ---
app.get('/weather', async (req, res) => {
    // 1. Check for API Key
    if (!API_KEY) {
        console.error("DEBUG: ERROR: WEATHER_API_KEY is missing in the .env file.");
        return res.status(500).json({ error: "Server configuration error: API Key is missing." });
    }

    const city = req.query.city;
    if (!city) {
        return res.status(400).json({ error: "Missing city query parameter." });
    }

    console.log(`DEBUG: 1. Server received request for city: ${city}`);
    
    try {
        // Construct the full API request URL
        const apiUrl = `${WEATHER_API_BASE_URL}?q=${city}&units=metric&appid=${API_KEY}`;
        console.log(`DEBUG: 2. Attempting to call external API: ${apiUrl}`);

        // 3. Make the secure request to the external API
        const response = await axios.get(apiUrl);
        
        console.log("DEBUG: 3. Successfully received data from OpenWeatherMap.");

        // 4. Send the API response back to the client (browser)
        res.json(response.data);

    } catch (error) {
        // Handle API errors
        if (error.response) {
            console.error(`DEBUG: ERROR 4xx/5xx from API. Status: ${error.response.status}`);
            if (error.response.status === 401) {
                console.error("DEBUG: 401 Unauthorized. Check your WEATHER_API_KEY in .env.");
                return res.status(401).json({ error: "Invalid API Key." });
            }
            if (error.response.status === 404) {
                console.error("DEBUG: 404 Not Found. City name is likely invalid.");
                return res.status(404).json({ error: "City not found." });
            }
        } else {
            console.error(`DEBUG: Network or unexpected error: ${error.message}`);
        }
        
        res.status(500).json({ error: "Failed to retrieve data from external weather service." });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`\n--- SERVER STARTUP ---`);
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API Key Status: ${API_KEY ? 'Loaded Successfully' : 'ERROR: Missing!'}`);
    console.log(`----------------------\n`);
});