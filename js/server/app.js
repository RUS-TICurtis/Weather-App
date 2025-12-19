const express = require('express');
const middleware = require('./middleware');
const routes = require('./routes');

function createApp() {
    const app = express();

    // Setup middleware
    middleware.setupStaticFiles(app);

    // Register API routes
    app.get('/weather', routes.weatherByCityRoute);
    app.get('/weather-coords', routes.weatherByCoordsRoute);
    app.get('/forecast', routes.forecastByCityRoute);
    app.get('/forecast-coords', routes.forecastByCoordsRoute);

    return app;
}

module.exports = createApp;
