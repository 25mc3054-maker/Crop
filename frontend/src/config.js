// Configuration for API endpoints
// Automatically detect backend URL based on current window location.

const hostname = window.location.hostname
// If running on localhost, use localhost:4000. If on LAN IP, use IP:4000.
const host = (hostname === 'localhost' ? 'localhost' : hostname);

export const API_BASE_URL = `http://${host}:4000`;

// WebSocket URL for real-time features (from Terraform output)
export const WS_BASE_URL = 'wss://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod'

console.log(`[Config] Backend URL: ${API_BASE_URL}`);