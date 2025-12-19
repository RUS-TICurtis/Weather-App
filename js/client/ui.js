// --- UI State Management Functions ---
import * as dom from './dom.js';

// State variables for modals
export let popupTimeout = null;

// --- Loading State Functions ---
export function showLoading(message = 'Loading...') {
    dom.errorDiv.classList.add('hidden');
    dom.weatherDiv.classList.remove('hidden'); // Show the weather block

    // Only show the forecast card if it's not currently hidden.
    // This respects the user's choice to toggle it off.
    if (!dom.forecastCard.classList.contains('hidden')) {
        dom.forecastCard.classList.add('loading');
    }

    dom.weatherDiv.classList.add('loading');   // Add loading class for skeleton effect
    dom.weatherDiv.dataset.loadingText = message; // Set the text for the CSS pseudo-element
    console.log(message); // Placeholder for a real loading indicator
}

export function showWeather() {
    dom.errorDiv.classList.add('hidden');
    dom.weatherDiv.classList.remove('hidden');  // Ensure main card is visible

    // Only remove loading from the forecast card if it's not hidden.
    if (!dom.forecastCard.classList.contains('hidden')) {
        dom.forecastCard.classList.remove('loading');
    }
    dom.weatherDiv.classList.remove('loading'); // Remove skeleton effect
}

export function showError(message) {
    dom.errorDiv.textContent = message;
    dom.errorDiv.classList.remove('hidden');
    dom.weatherDiv.classList.add('hidden');
    dom.forecastCard.classList.add('hidden'); // Hide cards on error
    if (dom.backgroundSunIcon) dom.backgroundSunIcon.classList.remove('visible');
    if (dom.backgroundMoonIcon) dom.backgroundMoonIcon.classList.remove('visible');
    dom.weatherDiv.classList.remove('loading');
}

export function hideAll() {
    dom.weatherDiv.classList.add('hidden');
    dom.forecastCard.classList.add('hidden');
    dom.errorDiv.classList.add('hidden');
    if (dom.backgroundSunIcon) dom.backgroundSunIcon.classList.remove('visible');
    if (dom.backgroundMoonIcon) dom.backgroundMoonIcon.classList.remove('visible');
    dom.weatherDiv.classList.remove('loading');
}

// --- Location Notice Functions ---
export function showLocationNotice(message) {
    if (dom.locationNotice) {
        dom.locationNotice.textContent = message;
        dom.locationNotice.classList.remove('hidden');
    }
}

export function hideLocationNotice() {
    if (dom.locationNotice) {
        dom.locationNotice.classList.add('hidden');
    }
}

// --- Geolocation Prompt Modal Functions ---
export function showGeoPrompt() {
    if (dom.geoPromptModal) dom.geoPromptModal.classList.remove('hidden');
}

export function hideGeoPrompt() {
    if (dom.geoPromptModal) dom.geoPromptModal.classList.add('hidden');
}

// --- Menu Functions ---
export function hideMenu() {
    if (dom.menuPopup) dom.menuPopup.classList.add('hidden');
}

// --- Popup Modal Functions ---
export function showPopup(message) {
    hideGeoPrompt(); // Ensure geo prompt is hidden if validation popup shows
    // Clear any existing timer to prevent premature closing
    clearTimeout(popupTimeout);

    dom.popupMessage.textContent = message;
    dom.popupModal.classList.remove('hidden');

    // Set a timer to automatically hide the popup after 3 seconds
    popupTimeout = setTimeout(hidePopup, 3000);
}

export function hidePopup() {
    clearTimeout(popupTimeout); // Clear the timer in case it's closed manually
    dom.popupModal.classList.add('hidden');
}

export function setPopupTimeout(timeout) {
    popupTimeout = timeout;
}
