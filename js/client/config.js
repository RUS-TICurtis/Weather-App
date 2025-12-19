// --- Configuration ---
export const RENDER_BACKEND_URL = 'https://weather-app-qquf.onrender.com';
export const LOCAL_BACKEND_URL = 'http://localhost:3015';

// Automatically determine the backend URL based on the hostname.
// This allows the app to work both locally and when deployed.
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const BACKEND_URL = isLocal ? LOCAL_BACKEND_URL : RENDER_BACKEND_URL;

console.log(`Backend URL set to: ${BACKEND_URL}`);
