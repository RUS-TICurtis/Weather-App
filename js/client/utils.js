// --- Utility Functions ---

// Maps OpenWeatherMap icon codes to local image files when available
export function getWeatherIconPath(iconCode) {
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

// Format city time based on timezone offset
export function formatCityTime(timezoneOffset) {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const cityTime = new Date(utcTime + (timezoneOffset * 1000));

    const formattedTime = cityTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return { formattedTime, cityTime };
}

// Convert wind speed from m/s to km/h
export function calculateWindSpeed(speed) {
    const windSpeed = speed !== undefined ? speed : 0;
    return Math.round(windSpeed * 3.6);
}

// Check if current time is daytime (5:30 AM to 5:30 PM)
export function isDaytime(cityTime) {
    const currentMinutes = cityTime.getHours() * 60 + cityTime.getMinutes();
    const sunriseMinutes = 5 * 60 + 30; // 5:30 AM
    const sunsetMinutes = 17 * 60 + 30; // 5:30 PM
    return currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes;
}
