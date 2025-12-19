const axios = require('axios');
const config = require('./config');

// --- API Route to Fetch Weather Data by City Name ---
// Endpoint: /weather?city=<CITY_NAME>
async function weatherByCityRoute(req, res) {
    // 1. Check for API Key
    if (!config.API_KEY) {
        console.error("DEBUG: ERROR: WEATHER_API_KEY is missing.");
        return res.status(500).json({ error: "Server configuration error: API Key is missing. Check Render/Vercel Environment Variables." });
    }

    const city = req.query.city;
    if (!city) {
        return res.status(400).json({ error: "Missing city query parameter." });
    }

    console.log(`DEBUG: Server received request for city: ${city}`);

    try {
        // Construct the full API request URL
        const apiUrl = `${config.WEATHER_API_BASE_URL}?q=${city}&units=metric&appid=${config.API_KEY}`;
        const response = await axios.get(apiUrl);

        console.log("DEBUG: Successfully received data from OpenWeatherMap.");

        // Send the API response back to the client (browser)
        res.json(response.data);

    } catch (error) {
        // Handle API errors
        if (error.response) {
            console.error(`DEBUG: ERROR 4xx/5xx from API. Status: ${error.response.status}`);
            if (error.response.status === 401) {
                return res.status(401).json({ error: "Invalid API Key." });
            }
            if (error.response.status === 404) {
                return res.status(404).json({ error: "City not found." });
            }
        } else {
            console.error(`DEBUG: Network or unexpected error: ${error.message}`);
        }

        res.status(500).json({ error: "Failed to retrieve data from external weather service." });
    }
}

// --- API Route to Fetch Weather Data by Coordinates (Latitude/Longitude) ---
// Endpoint: /weather-coords?lat=<LAT>&lon=<LON>
async function weatherByCoordsRoute(req, res) {
    // 1. Check for API Key
    if (!config.API_KEY) {
        console.error("DEBUG: ERROR: WEATHER_API_KEY is missing.");
        return res.status(500).json({ error: "Server configuration error: API Key is missing. Check Render/Vercel Environment Variables." });
    }

    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: "Missing latitude or longitude query parameter." });
    }

    console.log(`DEBUG: Server received request for coordinates: Lat=${lat}, Lon=${lon}`);

    try {
        // Construct the full API request URL using lat and lon parameters
        const apiUrl = `${config.WEATHER_API_BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${config.API_KEY}`;
        const response = await axios.get(apiUrl);

        console.log("DEBUG: Successfully received data from OpenWeatherMap using coordinates.");

        // Send the API response back to the client (browser)
        res.json(response.data);

    } catch (error) {
        // Handle API errors
        if (error.response) {
            console.error(`DEBUG: ERROR 4xx/5xx from API. Status: ${error.response.status}`);
            if (error.response.status === 401) {
                return res.status(401).json({ error: "Invalid API Key." });
            }
            // The API doesn't return 404 for invalid coordinates, but we keep this for consistency
            if (error.response.status === 404) {
                return res.status(404).json({ error: "Location data not found for the given coordinates." });
            }
        } else {
            console.error(`DEBUG: Network or unexpected error: ${error.message}`);
        }

        res.status(500).json({ error: "Failed to retrieve coordinate data from external weather service." });
    }
}

// --- API Route to Fetch 5-Day Forecast by City Name ---
// Endpoint: /forecast?city=<CITY_NAME>
async function forecastByCityRoute(req, res) {
    if (!config.API_KEY) {
        return res.status(500).json({ error: "Server configuration error: API Key is missing." });
    }

    const city = req.query.city;
    if (!city) {
        return res.status(400).json({ error: "Missing city query parameter." });
    }

    console.log(`DEBUG: Server received forecast request for city: ${city}`);

    try {
        const apiUrl = `${config.FORECAST_API_BASE_URL}?q=${city}&units=metric&appid=${config.API_KEY}`;
        const response = await axios.get(apiUrl);

        console.log("DEBUG: Successfully received 5-day forecast data.");
        res.json(response.data);

    } catch (error) {
        if (error.response) {
            console.error(`DEBUG: ERROR in forecast API. Status: ${error.response.status}`);
            if (error.response.status === 404) {
                return res.status(404).json({ error: "City not found for forecast." });
            }
        } else {
            console.error(`DEBUG: Network or unexpected error in forecast: ${error.message}`);
        }
        res.status(500).json({ error: "Failed to retrieve forecast data." });
    }
}

// --- API Route to Fetch 5-Day Forecast by Coordinates ---
// Endpoint: /forecast-coords?lat=<LAT>&lon=<LON>
async function forecastByCoordsRoute(req, res) {
    if (!config.API_KEY) {
        return res.status(500).json({ error: "Server configuration error: API Key is missing." });
    }

    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: "Missing latitude or longitude for forecast." });
    }

    console.log(`DEBUG: Server received forecast request for coords: Lat=${lat}, Lon=${lon}`);

    try {
        const apiUrl = `${config.FORECAST_API_BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${config.API_KEY}`;
        const response = await axios.get(apiUrl);

        console.log("DEBUG: Successfully received 5-day forecast data by coords.");
        res.json(response.data);

    } catch (error) {
        if (error.response) {
            console.error(`DEBUG: ERROR in forecast API by coords. Status: ${error.response.status}`);
        } else {
            console.error(`DEBUG: Network or unexpected error in forecast by coords: ${error.message}`);
        }
        res.status(500).json({ error: "Failed to retrieve forecast data by coords." });
    }
}

module.exports = {
    weatherByCityRoute,
    weatherByCoordsRoute,
    forecastByCityRoute,
    forecastByCoordsRoute
};
