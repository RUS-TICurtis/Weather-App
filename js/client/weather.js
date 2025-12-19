// --- Weather Data Fetching and Display Functions ---
import { BACKEND_URL } from './config.js';
import * as dom from './dom.js';
import * as ui from './ui.js';
import { getWeatherIconPath, formatCityTime, calculateWindSpeed, isDaytime } from './utils.js';

// This function updates the DOM with weather data
export function updateWeatherDisplay(data) {
    // 1. Update City and Temp
    dom.cityEl.innerText = data.name;
    dom.tempEl.innerText = Math.round(data.main.temp) + '°';

    // 2. Update Description
    const description = data.weather[0].description;
    dom.weatherDescEl.innerText = description;

    // 3. Update Weather Icon
    const iconCode = data.weather[0].icon;
    dom.weatherIconEl.src = getWeatherIconPath(iconCode);
    dom.weatherIconEl.alt = description;

    // 4. Update Details
    dom.humidityEl.innerText = data.main.humidity + '%';

    // Wind speed conversion for display
    const windSpeedKmH = calculateWindSpeed(data.wind.speed);
    dom.windEl.innerText = windSpeedKmH + ' Km/h';

    // 5. Update City's Local Time
    const timezoneOffset = data.timezone; // Shift in seconds from UTC
    const { formattedTime, cityTime } = formatCityTime(timezoneOffset);
    dom.cityTimeEl.innerText = `${formattedTime} | `;

    // 6. Update Dynamic Background Icon Visibility
    if (isDaytime(cityTime)) {
        dom.backgroundSunIcon.classList.add('visible');
        dom.backgroundMoonIcon.classList.remove('visible');
    } else {
        dom.backgroundSunIcon.classList.remove('visible');
        dom.backgroundMoonIcon.classList.add('visible');
    }

    ui.showWeather();
}

// This function updates the DOM with 5-day forecast data
export function updateForecastDisplay(data) {
    dom.forecastContainer.innerHTML = ''; // Clear previous forecast

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

    // Create and display forecast elements for the next 7 days
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
        dom.forecastContainer.appendChild(dayElement);
    });
}

// Function to update the DOM with today's hourly forecast
export function updateTodayForecastDisplay(data) {
    const todayForecastContainer = document.getElementById('todayForecastContainer');
    todayForecastContainer.innerHTML = ''; // Clear previous forecast

    // Get the next 8 entries from the forecast list (8 entries * 3 hours = 24 hours)
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

// Function to fetch weather using city name (called when user searches)
export async function getWeather(cityOverride, geoPromptInterval) {
    // Stop prompting for location if the user decides to search manually
    if (geoPromptInterval) {
        clearInterval(geoPromptInterval);
    }

    // Only hide the location notice if this is a user-initiated search (no cityOverride) or on first load
    if (!cityOverride) {
        ui.hideLocationNotice();
    }

    const city = cityOverride || dom.cityInput.value.trim();

    // If it's a manual search (no override) and the input is empty, show popup.
    if (!city && !cityOverride) {
        ui.showPopup('Please enter a city name.'); // Only show popup for manual empty search
        return;
    }
    ui.showLoading('Fetching weather...');

    // --- UI Update: Start Loading ---
    dom.searchBtn.classList.add('loading');
    dom.searchBtn.disabled = true;
    dom.cityInput.disabled = true;

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
        ui.showError(finalMessage);
    } finally {
        // --- UI Update: End Loading ---
        dom.searchBtn.classList.remove('loading');
        dom.searchBtn.disabled = false;
        dom.cityInput.disabled = false;
    }
}

// Function to fetch weather using coordinates (called on load)
export async function getWeatherByCoordinates(lat, lon) {
    // Hide the default location notice if we get coordinates successfully.
    ui.hideLocationNotice();

    console.log(`Fetching weather for coordinates: Lat=${lat}, Lon=${lon}`);
    ui.showLoading('Fetching weather for your location...');

    // --- UI Update: Start Loading ---
    dom.refreshBtn.classList.add('loading');
    dom.refreshBtn.disabled = true;

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
        ui.showError(err.message || `Could not get weather for your location. Please use the search bar.`);
    } finally {
        // --- UI Update: End Loading ---
        dom.refreshBtn.classList.remove('loading');
        dom.refreshBtn.disabled = false;
    }
}
