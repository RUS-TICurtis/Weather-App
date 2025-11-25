async function getWeather() {
    // Get city input value
    const city = document.getElementById('cityInput').value;
    
    const weatherDiv = document.querySelector('.weather');
    const errorDiv = document.getElementById('error');
    const weatherIconEl = document.getElementById('weatherIcon');
    const cityEl = document.getElementById('cityName');
    const tempEl = document.getElementById('temp');
    const humidityEl = document.getElementById('humidity');
    const windEl = document.getElementById('wind');
    const weatherDescEl = document.getElementById('weatherDesc');
    const cityTimeEl = document.getElementById('cityTime'); // NEW: time element

    if (!city) {
        errorDiv.textContent = 'Please enter a city name.';
        errorDiv.classList.remove('hidden');
        weatherDiv.classList.add('hidden');
        return;
    }

    weatherDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');

    try {
        const response = await fetch(`/weather?city=${city}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            
            if (response.status === 404) {
                 throw new Error('City not found');
            }
            throw new Error(errorData.error || `Server responded with status: ${response.status}`);
        }
        const data = await response.json();

        // --- Data Extraction and Validation ---
        if (!data.main || !data.wind || !data.weather || data.weather.length === 0) {
             throw new Error('Incomplete weather data received.');
        }

        // 1. Update Weather Icon
        const iconCode = data.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
        weatherIconEl.src = iconUrl;
        weatherIconEl.alt = data.weather[0].description; 
        
        // 2. Update Weather Data
        cityEl.innerText = data.name;
        tempEl.innerText = Math.round(data.main.temp) + '°';
        humidityEl.innerText = data.main.humidity + '%';
        
        const windSpeed = data.wind.speed !== undefined ? data.wind.speed : 0;
        const windSpeedKmH = Math.round(windSpeed * 3.6);
        windEl.innerText = windSpeedKmH + ' Km/h'; 

        // 3. NEW: Calculate and show local time
        if (data.timezone !== undefined) {
            const timezoneOffset = data.timezone; // seconds offset from UTC
            const utcTime = new Date();
            const localTime = new Date(utcTime.getTime() + timezoneOffset * 1000);
            const formattedTime = localTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            cityTimeEl.innerText = formattedTime + " | ";
        } else {
            cityTimeEl.innerText = "";
        }

        // 4. Update description (after time)
        weatherDescEl.innerText = data.weather[0].description;

        // Show Result
        weatherDiv.classList.remove('hidden');

    } catch (err) {
        console.error("Weather fetching error (client-side):", err);
        errorDiv.textContent = err.message.includes('City not found') ? 
            'Invalid city name. Please check and try again.' : 
            'Could not retrieve weather data. Please ensure your API key is active.';
        errorDiv.classList.remove('hidden');
        weatherDiv.classList.add('hidden');
    }
}

// Event listener for "Enter" key press on input field
document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');

    if (cityInput) {
        cityInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                getWeather();
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', getWeather);
    }
});