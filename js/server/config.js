// Server Configuration
module.exports = {
    PORT: 3015,
    API_KEY: process.env.WEATHER_API_KEY,
    WEATHER_API_BASE_URL: 'https://api.openweathermap.org/data/2.5/weather',
    FORECAST_API_BASE_URL: 'https://api.openweathermap.org/data/2.5/forecast'
};
