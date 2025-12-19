// --- Geolocation Handling Functions ---
import * as ui from './ui.js';
import { getWeather, getWeatherByCoordinates } from './weather.js';

// State variables for geolocation
export let geoPromptInterval = null; // Variable for the recurring prompt
export let permissionStatus = null; // Variable to hold the permission status object

// Function to handle the actual position request
export function requestPosition() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // Success handler
            (position) => {
                getWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
                // If position is successfully obtained, stop any recurring geo prompt
                // as permission has now been granted.
                if (geoPromptInterval) {
                    clearInterval(geoPromptInterval);
                    geoPromptInterval = null; // Clear the reference
                }
                ui.hideLocationNotice();
            },
            // Error handler
            (error) => {
                console.warn(`Geolocation error (${error.code}): ${error.message}`);
                ui.showLocationNotice('Using default location. You can search for a city or allow location access.');
                getWeather('Accra', geoPromptInterval);

                // If the geoPromptInterval was active (meaning permission wasn't granted initially),
                // ensure it continues to run after a denial of the browser's prompt.
                if (geoPromptInterval) {
                    clearInterval(geoPromptInterval); // Clear existing one to reset timer
                    geoPromptInterval = setInterval(ui.showGeoPrompt, 20000); // Restart with the correct interval
                }
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    } else {
        console.log("Geolocation is not supported by this browser.");
        ui.showLocationNotice('Geolocation not supported. Showing weather for default location.');
        getWeather('Accra', geoPromptInterval); // Fetch live data for Accra
    }
}

// Main Geolocation Initialization and Polling Setup
export function initGeolocation() {
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(status => {
            permissionStatus = status; // Store the status object for later use
            if (permissionStatus.state === 'granted') {
                // 1. Permission is already granted. Fetch immediately.
                clearInterval(geoPromptInterval); // Ensure no prompt is running if permission is granted
                geoPromptInterval = null;
                requestPosition();
            } else {
                // Permission is 'prompt' or 'denied'.
                // 1. Do a one-time request (which will show the default city).
                requestPosition();

                // 2. Set up a recurring prompt to ask for permission.
                // This will repeatedly ask the user to enable location.
                clearInterval(geoPromptInterval); // Clear any old interval
                geoPromptInterval = setInterval(() => {
                    ui.showGeoPrompt();
                }, 20000); // Ask every 20 seconds
            }

            // Listen for changes in permission status
            permissionStatus.onchange = () => {
                console.log('Geolocation permission state changed to:', permissionStatus.state);
                // If permission is granted, immediately fetch the position
                // instead of reloading the page. This provides a seamless experience.
                if (permissionStatus.state === 'granted') {
                    // Stop the recurring prompt since we now have permission.
                    clearInterval(geoPromptInterval);
                    requestPosition();
                }
            };
        });
    } else {
        // Fallback for older browsers that don't support the Permissions API.
        // This will just do a one-time request.
        requestPosition();
    }
}

export function setGeoPromptInterval(interval) {
    geoPromptInterval = interval;
}

export function setPermissionStatus(status) {
    permissionStatus = status;
}
