// --- Configuration ---
const RENDER_BACKEND_URL = 'https://weather-app-qquf.onrender.com';
const LOCAL_BACKEND_URL = 'http://localhost:3015';

// Automatically determine the backend URL based on the hostname.
// This allows the app to work both locally and when deployed.
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BACKEND_URL = isLocal ? LOCAL_BACKEND_URL : RENDER_BACKEND_URL;
console.log(`Backend URL set to: ${BACKEND_URL}`);

// --- DOM Element References ---
const weatherDiv = document.querySelector('.weather');
const errorDiv = document.getElementById('error');
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const weatherIconEl = document.getElementById('weatherIcon');
const cityEl = document.getElementById('cityName');
const tempEl = document.getElementById('temp');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const weatherDescEl = document.getElementById('weatherDesc');

const popupModal = document.getElementById('popupModal');
const popupMessage = document.getElementById('popupMessage');
const closePopupBtn = document.getElementById('closePopupBtn');
// This function updates the DOM with weather data
function updateWeatherDisplay(data) {
    // 1. Update City and Temp
    cityEl.innerText = data.name;
    tempEl.innerText = Math.round(data.main.temp) + '°';

    // 2. Update Description
    const description = data.weather[0].description;
    weatherDescEl.innerText = description; 
    
    // 3. Update Weather Icon
    const iconCode = data.weather[0].icon;
    weatherIconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIconEl.alt = description;

    // 4. Update Details
    humidityEl.innerText = data.main.humidity + '%';
    
    // Wind speed conversion for display
    const windSpeed = data.wind.speed !== undefined ? data.wind.speed : 0;
    const windSpeedKmH = Math.round(windSpeed * 3.6);
    windEl.innerText = windSpeedKmH + ' Km/h'; 

    showWeather();
}

// --- UI State Management Functions ---
function showLoading(message = 'Loading...') {
    errorDiv.classList.add('hidden');
    weatherDiv.classList.remove('hidden'); // Show the weather block
    weatherDiv.classList.add('loading');   // Add loading class for skeleton effect
    console.log(message); // Placeholder for a real loading indicator
}

function showWeather() {
    errorDiv.classList.add('hidden');
    weatherDiv.classList.remove('loading'); // Remove skeleton effect
    weatherDiv.classList.remove('hidden');  // Ensure it's visible
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    weatherDiv.classList.add('hidden');
    weatherDiv.classList.remove('loading');
}

function hideAll() {
    weatherDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    weatherDiv.classList.remove('loading');
}

// --- NEW: Popup Modal Functions ---
let popupTimeout; // Variable to hold the timeout

function showPopup(message) {
    // Clear any existing timer to prevent premature closing
    clearTimeout(popupTimeout);

    popupMessage.textContent = message;
    popupModal.classList.remove('hidden');

    // Set a timer to automatically hide the popup after 3 seconds
    popupTimeout = setTimeout(hidePopup, 3000);
}

function hidePopup() {
    clearTimeout(popupTimeout); // Clear the timer in case it's closed manually
    popupModal.classList.add('hidden');
}


// Function to fetch weather using city name (called when user searches)
async function getWeather() {
    const city = cityInput.value.trim();
    
    // Check for empty city *before* showing the main loader
    if (!city) {
        showPopup('Please enter a city name.');
        return;
    }
    showLoading('Fetching weather...');

    // --- UI Update: Start Loading ---
    searchBtn.classList.add('loading');
    searchBtn.disabled = true;
    cityInput.disabled = true;

    try {
        const response = await fetch(`${BACKEND_URL}/weather?city=${city}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            // Throw an error with the message from the server
            throw new Error(errorData.error || 'An unknown error occurred.');
        }

        const data = await response.json();
        updateWeatherDisplay(data);

    } catch (err) {
        console.error("Weather fetching error (client-side):", err.message);
        const finalMessage = err.message.includes('City not found')
            ? 'City not found. Please check the spelling.'
            : err.message;
        showError(finalMessage);
    } finally {
        // --- UI Update: End Loading ---
        searchBtn.classList.remove('loading');
        searchBtn.disabled = false;
        cityInput.disabled = false;
    }
}

// NEW: Function to fetch weather using coordinates (called on load)
async function getWeatherByCoordinates(lat, lon) {
    console.log(`Fetching weather for coordinates: Lat=${lat}, Lon=${lon}`);
    showLoading('Fetching weather for your location...');

    // --- UI Update: Start Loading ---
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;

    try {
        // The script fetches data from YOUR Node server's new '/weather-coords' endpoint
        const response = await fetch(`${BACKEND_URL}/weather-coords?lat=${lat}&lon=${lon}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch weather for your location.');
        }

        const data = await response.json();
        updateWeatherDisplay(data);
        
        // By commenting out the line below, the search bar will remain empty
        // after the initial automatic location fetch.
        // cityInput.value = data.name;

    } catch (err) {
        console.error("Coordinate weather fetching error (client-side):", err);
        // Display the actual error from the server or a fallback message.
        showError(err.message || `Could not get weather for your location. Please use the search bar.`);
    } finally {
        // --- UI Update: End Loading ---
        refreshBtn.classList.remove('loading');
        refreshBtn.disabled = false;
    }
}

// NEW: Main Geolocation Initialization
function initGeolocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // Success handler
            (position) => {
                // If successful, fetch weather using the coordinates
                getWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
            },
            // Error handler
            (error) => {
                console.warn(`Geolocation error (${error.code}): ${error.message}`);
                // If user denies or it fails, hide all sections and show an informative message.
                // We don't show a loader here, just an error.
                hideAll();
                showError('Location access denied. Please search for a city to begin.');
            },
            // Options (optional)
            { timeout: 10000, enableHighAccuracy: true }
        );
    } else {
        // Geolocation not supported by browser
        // We don't show a loader here either.
        hideAll();
        console.log("Geolocation is not supported by this browser.");
        showError('Geolocation is not supported. Please search for a city.');
    }
}


// Event listeners for search
document.addEventListener('DOMContentLoaded', () => {
    // Run geolocation logic immediately on page load
    initGeolocation();

    // Handle Enter key press
    if (cityInput) {
        cityInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                getWeather();
            }
        });
    }
    
    // Handle button click
    if (searchBtn) {
        searchBtn.addEventListener('click', getWeather);
    }

    // Handle refresh button click
    if (refreshBtn) {
        refreshBtn.addEventListener('click', initGeolocation);
    }

    // Handle clicking away from the popup to close it
    if (popupModal) {
        popupModal.addEventListener('click', (e) => {
            if (e.target === popupModal) { // Only close if the overlay itself is clicked
                hidePopup();
            }
        });
    }
});