// --- Event Listeners and App Initialization ---
import * as dom from './dom.js';
import * as ui from './ui.js';
import { getWeather } from './weather.js';
import { initGeolocation, requestPosition, permissionStatus, geoPromptInterval } from './geolocation.js';

// Main initialization function
export function initializeApp() {
    // Run geolocation logic immediately on page load
    initGeolocation();

    // Handle Enter key press
    if (dom.cityInput) {
        dom.cityInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                getWeather(null, geoPromptInterval);
            }
        });
    }

    // Handle button click
    if (dom.searchBtn) {
        // Wrap getWeather in an anonymous function to prevent the event object
        // from being passed as the 'cityOverride' argument.
        dom.searchBtn.addEventListener('click', () => getWeather(null, geoPromptInterval));
    }

    // Handle refresh button click
    if (dom.refreshBtn) {
        dom.refreshBtn.addEventListener('click', initGeolocation);
    }

    // Handle clicking away from the popup to close it
    if (dom.popupModal) {
        dom.popupModal.addEventListener('click', (e) => {
            if (e.target === dom.popupModal) { // Only close if the overlay itself is clicked
                ui.hidePopup();
            }
        });
    }

    // --- Menu Button Handlers ---
    if (dom.menuBtn) {
        dom.menuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the global click listener from firing
            dom.menuPopup.classList.toggle('hidden');
        });
    }
    if (dom.toggleForecastBtn) {
        dom.toggleForecastBtn.addEventListener('click', () => {
            dom.forecastCard.classList.toggle('hidden');
            ui.hideMenu(); // Hide menu after selection
        });
    }

    // --- Global Click Listener to Hide All Popups ---
    document.addEventListener('click', (e) => {
        // Hide menu if click is outside
        if (!dom.menuPopup.classList.contains('hidden') && !dom.menuPopup.contains(e.target) && e.target !== dom.menuBtn) {
            ui.hideMenu();
        }
        // The other popups already have overlay-click-to-hide logic, which is more specific and user-friendly.
        // This global listener is primarily for the new menu which doesn't have an overlay.
    });

    // --- Geolocation Prompt Button Handlers ---
    if (dom.closeGeoBtn) {
        dom.closeGeoBtn.addEventListener('click', ui.hideGeoPrompt);
    }
    if (dom.enableGeoBtn) {
        dom.enableGeoBtn.addEventListener('click', () => {
            if (permissionStatus && permissionStatus.state === 'denied') {
                // If permission is denied, we cannot re-prompt.
                // Instead, we instruct the user how to unblock it manually.
                ui.hideGeoPrompt();
                // Use the validation popup to show instructions. Don't auto-hide it.
                clearTimeout(ui.popupTimeout);
                ui.showPopup('To enable, click the lock icon in the address bar and set Location to "Allow".');
            } else {
                // If permission is 'prompt', re-triggering the request will show
                // the browser's permission dialog again.
                ui.hideGeoPrompt();
                requestPosition();
            }
        });
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
