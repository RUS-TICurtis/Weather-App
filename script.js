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
const forecastCard = document.querySelector('.forecast-card');
const forecastContainer = document.getElementById('forecast');
const locationNotice = document.getElementById('locationNotice');
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const menuBtn = document.getElementById('menuBtn');
const menuPopup = document.getElementById('menuPopup');
const toggleForecastBtn = document.getElementById('toggleForecastBtn');
const weatherIconEl = document.getElementById('weatherIcon');
const cityEl = document.getElementById('cityName');
const tempEl = document.getElementById('temp');
const cityTimeEl = document.getElementById('cityTime');
const humidityEl = document.getElementById('humidity');
const backgroundSunIcon = document.getElementById('background-sun-icon');
const backgroundMoonIcon = document.getElementById('background-moon-icon');
const windEl = document.getElementById('wind');
const weatherDescEl = document.getElementById('weatherDesc');

const popupModal = document.getElementById('popupModal');
const popupMessage = document.getElementById('popupMessage');
const closePopupBtn = document.getElementById('closePopupBtn');

const geoPromptModal = document.getElementById('geoPromptModal');
const enableGeoBtn = document.getElementById('enableGeoBtn');
const closeGeoBtn = document.getElementById('closeGeoBtn');

// --- Weather Icon Mapping ---
// Maps OpenWeatherMap icon codes to local image files when available
function getWeatherIconPath(iconCode) {
    // Mapping of OpenWeatherMap icon codes to local files
    const iconMap = {
        // Clear sky
        '01d': './images/sunny.svg',
        '01n': './images/clear_night.svg',

        // Few clouds
        '02d': './images/mostly_sunny.png',
        '02n': './images/mostly_clear_night.png',

        // Scattered clouds
        '03d': './images/partly_cloudy.png',
        '03n': './images/partly_cloudy_night.png',

        // Broken clouds
        '04d': './images/mostly_cloudy_day.png',
        '04n': './images/mostly_cloudy_night.png',

        // Shower rain
        '09d': './images/scattered_showers_day.png',
        '09n': './images/scattered_showers_night.png',

        // Rain
        '10d': './images/showers_rain.png',
        '10n': './images/showers_rain.png',

        // Thunderstorm
        '11d': './images/isolated_scattered_tstorms_day.png',
        '11n': './images/isolated_scattered_tstorms_night.png',
    };

    // Return local icon if available, otherwise use API icon
    return iconMap[iconCode] || `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

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
    weatherIconEl.src = getWeatherIconPath(iconCode);
    weatherIconEl.alt = description;

    // 4. Update Details
    humidityEl.innerText = data.main.humidity + '%';

    // Wind speed conversion for display
    const windSpeed = data.wind.speed !== undefined ? data.wind.speed : 0;
    const windSpeedKmH = Math.round(windSpeed * 3.6);
    windEl.innerText = windSpeedKmH + ' Km/h';

    // 5. Update City's Local Time
    const timezoneOffset = data.timezone; // Shift in seconds from UTC
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const cityTime = new Date(utcTime + (timezoneOffset * 1000));

    const formattedTime = cityTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    cityTimeEl.innerText = `${formattedTime} | `;

    // 6. Update Dynamic Background Icon Visibility
    // Check time from 5:30 AM to 5:30 PM (17:30)
    const currentMinutes = cityTime.getHours() * 60 + cityTime.getMinutes();
    const sunriseMinutes = 5 * 60 + 30; // 5:30 AM
    const sunsetMinutes = 17 * 60 + 30; // 5:30 PM

    if (currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes) {
        backgroundSunIcon.classList.add('visible');
        backgroundMoonIcon.classList.remove('visible');
    } else {
        backgroundSunIcon.classList.remove('visible');
        backgroundMoonIcon.classList.add('visible');
    }

    showWeather();
}

// This function updates the DOM with 5-day forecast data
function updateForecastDisplay(data) {
    forecastContainer.innerHTML = ''; // Clear previous forecast

    // Process the 3-hour forecast data into daily summaries
    const dailyData = {};
    for (const forecast of data.list) {
        const date = new Date(forecast.dt * 1000);
        const day = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'

        if (!dailyData[day]) {
            dailyData[day] = {
                temps: [],
                humidities: [],
                dayIcon: null,
                nightIcon: null,
                date: date
            };
        }
        dailyData[day].temps.push(forecast.main.temp);
        dailyData[day].humidities.push(forecast.main.humidity);

        // Use 'pod' (part of day) to find day 'd' and night 'n' icons
        if (forecast.sys.pod === 'd' && !dailyData[day].dayIcon) {
            dailyData[day].dayIcon = forecast.weather[0].icon;
        }
        if (forecast.sys.pod === 'n' && !dailyData[day].nightIcon) {
            dailyData[day].nightIcon = forecast.weather[0].icon;
        }
    }

    // Create and display forecast elements for the next 5 days
    const next7Days = Object.values(dailyData).slice(0, 7);

    next7Days.forEach(dayData => {
        const date = dayData.date;
        const today = new Date();
        let dayName;

        if (date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()) {
            dayName = 'Today';
        } else {
            dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        }

        // Use day icon, fallback to night icon if day is not available, and vice-versa
        const dayIcon = dayData.dayIcon || dayData.nightIcon;
        const nightIcon = dayData.nightIcon || dayData.dayIcon;

        const maxTemp = Math.round(Math.max(...dayData.temps));
        const avgHumidity = Math.round(dayData.humidities.reduce((a, b) => a + b, 0) / dayData.humidities.length);

        const dayElement = document.createElement('div');
        dayElement.className = 'forecast-day';
        dayElement.innerHTML = `
            <p class="forecast-day-name">${dayName}</p>
            <div class="forecast-icons"><img src="${getWeatherIconPath(dayIcon)}" alt="day icon" class="forecast-icon" /><img src="${getWeatherIconPath(nightIcon)}" alt="night icon" class="forecast-icon" /></div>
            <p class="forecast-humidity"><i class="fas fa-tint"></i>${avgHumidity}%</p>
            <p class="forecast-temp">${maxTemp}°</p>
        `;
        forecastContainer.appendChild(dayElement);
    });
}

// --- NEW: Function to update the DOM with today's hourly forecast ---
function updateTodayForecastDisplay(data) {
    const todayForecastContainer = document.getElementById('todayForecastContainer');
    todayForecastContainer.innerHTML = ''; // Clear previous forecast

    // Get the next 8 entries from the forecast list (8 entries * 3 hours = 24 hours)
    // This shows the forecast from the next available 3-hour slot onwards.
    const next24HoursEntries = data.list.slice(0, 8);


    if (next24HoursEntries.length === 0) {
        todayForecastContainer.innerHTML = '<p>No hourly data available for today.</p>';
        return;
    }
    next24HoursEntries.forEach(entry => {
        const time = new Date(entry.dt * 1000).toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true
        });
        const icon = entry.weather[0].icon;
        const temp = Math.round(entry.main.temp);
        const humidity = entry.main.humidity;

        const itemElement = document.createElement('div');
        itemElement.className = 'today-forecast-item';
        itemElement.innerHTML = `
            <p class="today-forecast-time">${time}</p>
            <img src="${getWeatherIconPath(icon)}" alt="weather icon" class="today-forecast-icon" />
            <p class="today-forecast-temp">${temp}°</p>
            <p class="today-forecast-humidity"><i class="fas fa-tint"></i>${humidity}%</p>
        `;
        todayForecastContainer.appendChild(itemElement);
    });
}
// --- UI State Management Functions ---
function showLoading(message = 'Loading...') {
    errorDiv.classList.add('hidden');
    weatherDiv.classList.remove('hidden'); // Show the weather block

    // Only show the forecast card if it's not currently hidden.
    // This respects the user's choice to toggle it off.
    if (!forecastCard.classList.contains('hidden')) {
        forecastCard.classList.add('loading');
    }

    weatherDiv.classList.add('loading');   // Add loading class for skeleton effect
    weatherDiv.dataset.loadingText = message; // Set the text for the CSS pseudo-element
    console.log(message); // Placeholder for a real loading indicator
}

function showWeather() {
    errorDiv.classList.add('hidden');
    weatherDiv.classList.remove('hidden');  // Ensure main card is visible

    // Only remove loading from the forecast card if it's not hidden.
    if (!forecastCard.classList.contains('hidden')) {
        forecastCard.classList.remove('loading');
    }
    weatherDiv.classList.remove('loading'); // Remove skeleton effect
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    weatherDiv.classList.add('hidden');
    forecastCard.classList.add('hidden'); // Hide cards on error
    if (backgroundSunIcon) backgroundSunIcon.classList.remove('visible');
    if (backgroundMoonIcon) backgroundMoonIcon.classList.remove('visible');
    weatherDiv.classList.remove('loading');
}

function hideAll() {
    weatherDiv.classList.add('hidden');
    forecastCard.classList.add('hidden');
    errorDiv.classList.add('hidden');
    if (backgroundSunIcon) backgroundSunIcon.classList.remove('visible');
    if (backgroundMoonIcon) backgroundMoonIcon.classList.remove('visible');
    weatherDiv.classList.remove('loading');
}

function showLocationNotice(message) {
    if (locationNotice) {
        locationNotice.textContent = message;
        locationNotice.classList.remove('hidden');
    }
}

function hideLocationNotice() {
    if (locationNotice) {
        locationNotice.classList.add('hidden');
    }
}

// --- Geolocation Prompt Modal Functions ---
let geoPromptInterval; // Variable for the recurring prompt
let permissionStatus = null; // Variable to hold the permission status object

function showGeoPrompt() {
    if (geoPromptModal) geoPromptModal.classList.remove('hidden');
}

function hideGeoPrompt() {
    if (geoPromptModal) geoPromptModal.classList.add('hidden');
}

function hideMenu() {
    if (menuPopup) menuPopup.classList.add('hidden');
}

// --- NEW: Popup Modal Functions ---
let popupTimeout; // Variable to hold the timeout

function showPopup(message) {
    hideGeoPrompt(); // Ensure geo prompt is hidden if validation popup shows
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
async function getWeather(cityOverride) {
    // Stop prompting for location if the user decides to search manually
    clearInterval(geoPromptInterval);

    // Only hide the location notice if this is a user-initiated search (no cityOverride) or on first load
    if (!cityOverride) {
        hideLocationNotice();
    }

    const city = cityOverride || cityInput.value.trim();

    // If it's a manual search (no override) and the input is empty, show popup.
    if (!city && !cityOverride) {
        showPopup('Please enter a city name.'); // Only show popup for manual empty search
        return;
    }
    showLoading('Fetching weather...');

    // --- UI Update: Start Loading ---
    searchBtn.classList.add('loading');
    searchBtn.disabled = true;
    cityInput.disabled = true;

    try {
        // Fetch current weather and forecast data concurrently
        const [weatherResponse, forecastResponse] = await Promise.all([
            fetch(`${BACKEND_URL}/weather?city=${city}`),
            fetch(`${BACKEND_URL}/forecast?city=${city}`)
        ]);

        if (!weatherResponse.ok) {
            // Check content type before parsing as JSON
            const contentType = weatherResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await weatherResponse.json();
                throw new Error(errorData.error || 'Failed to fetch current weather.');
            } else {
                throw new Error(`Server error: ${weatherResponse.status} ${weatherResponse.statusText}`);
            }
        }
        if (!forecastResponse.ok) {
            // Don't throw, just log it. The app can still show current weather.
            console.error('Failed to fetch forecast data.');
        }

        const weatherData = await weatherResponse.json();
        updateWeatherDisplay(weatherData);

        // Only parse and display the forecast if the request was successful
        if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json();
            updateForecastDisplay(forecastData);
            updateTodayForecastDisplay(forecastData);
        }
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
    // Hide the default location notice if we get coordinates successfully.
    hideLocationNotice();

    console.log(`Fetching weather for coordinates: Lat=${lat}, Lon=${lon}`);
    showLoading('Fetching weather for your location...');

    // --- UI Update: Start Loading ---
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;

    try {
        // The script fetches data from YOUR Node server's new '/weather-coords' endpoint
        const [weatherResponse, forecastResponse] = await Promise.all([
            fetch(`${BACKEND_URL}/weather-coords?lat=${lat}&lon=${lon}`),
            fetch(`${BACKEND_URL}/forecast-coords?lat=${lat}&lon=${lon}`)
        ]);

        if (!weatherResponse.ok) {
            // Check content type before parsing as JSON
            const contentType = weatherResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await weatherResponse.json();
                throw new Error(errorData.error || 'Failed to fetch weather for your location.');
            } else {
                throw new Error(`Server error: ${weatherResponse.status} ${weatherResponse.statusText}`);
            }
        }
        if (!forecastResponse.ok) {
            console.error('Failed to fetch forecast data for your location.');
        }

        const weatherData = await weatherResponse.json();
        updateWeatherDisplay(weatherData);

        // Only parse and display the forecast if the request was successful
        if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json();
            updateForecastDisplay(forecastData);
            updateTodayForecastDisplay(forecastData);
        }

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

// Function to handle the actual position request
function requestPosition() {
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
                hideLocationNotice();
            },
            // Error handler
            (error) => {
                console.warn(`Geolocation error (${error.code}): ${error.message}`);
                showLocationNotice('Using default location. You can search for a city or allow location access.');
                getWeather('Accra');

                // If the geoPromptInterval was active (meaning permission wasn't granted initially),
                // ensure it continues to run after a denial of the browser's prompt.
                if (geoPromptInterval) {
                    clearInterval(geoPromptInterval); // Clear existing one to reset timer
                    geoPromptInterval = setInterval(showGeoPrompt, 20000); // Restart with the correct interval
                }

            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    } else {
        console.log("Geolocation is not supported by this browser.");
        showLocationNotice('Geolocation not supported. Showing weather for default location.');
        getWeather('Accra'); // Fetch live data for Accra
    }
}

// NEW: Main Geolocation Initialization and Polling Setup
function initGeolocation() {
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(status => {
            permissionStatus = status; // Store the status object for later use
            if (permissionStatus.state === 'granted') {
                // 1. Permission is already granted. Fetch immediately.
                clearInterval(geoPromptInterval); // Ensure no prompt is running if permission is granted
                geoPromptInterval = null;
                requestPosition();
                // 2. Polling to refresh weather is now disabled as per user request.
                // setInterval(requestPosition, 30000);
                // The notice can be distracting, so we can keep it minimal or remove it
                // showLocationNotice('Live location is active. Weather will auto-refresh.');
            } else {
                // Permission is 'prompt' or 'denied'.
                // 1. Do a one-time request (which will show the default city).
                requestPosition();

                // 2. Set up a recurring prompt to ask for permission.
                // This will repeatedly ask the user to enable location.
                clearInterval(geoPromptInterval); // Clear any old interval
                geoPromptInterval = setInterval(() => {
                    showGeoPrompt();
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
        // Wrap getWeather in an anonymous function to prevent the event object
        // from being passed as the 'cityOverride' argument.
        searchBtn.addEventListener('click', () => getWeather());
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

    // --- Menu Button Handlers ---
    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the global click listener from firing
            menuPopup.classList.toggle('hidden');
        });
    }
    if (toggleForecastBtn) {
        toggleForecastBtn.addEventListener('click', () => {
            forecastCard.classList.toggle('hidden');
            hideMenu(); // Hide menu after selection
        });
    }

    // --- Global Click Listener to Hide All Popups ---
    document.addEventListener('click', (e) => {
        // Hide menu if click is outside
        if (!menuPopup.classList.contains('hidden') && !menuPopup.contains(e.target) && e.target !== menuBtn) {
            hideMenu();
        }
        // The other popups already have overlay-click-to-hide logic, which is more specific and user-friendly.
        // This global listener is primarily for the new menu which doesn't have an overlay.
    });

    // --- Geolocation Prompt Button Handlers ---
    if (closeGeoBtn) {
        closeGeoBtn.addEventListener('click', hideGeoPrompt);
    }
    if (enableGeoBtn) {
        enableGeoBtn.addEventListener('click', () => {
            if (permissionStatus && permissionStatus.state === 'denied') {
                // If permission is denied, we cannot re-prompt.
                // Instead, we instruct the user how to unblock it manually.
                hideGeoPrompt();
                // Use the validation popup to show instructions. Don't auto-hide it.
                clearTimeout(popupTimeout); // Prevent auto-hiding
                showPopup('To enable, click the lock icon in the address bar and set Location to "Allow".');
            } else {
                // If permission is 'prompt', re-triggering the request will show
                // the browser's permission dialog again.
                hideGeoPrompt();
                requestPosition();
            }
        });
    }
});