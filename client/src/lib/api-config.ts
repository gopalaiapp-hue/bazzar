// API Configuration for different environments
export const API_CONFIG = {
    // Base API URL - change this based on where your backend is deployed
    baseURL: import.meta.env.VITE_API_URL || getDefaultAPIUrl(),
};

function getDefaultAPIUrl(): string {
    // Check if we're running in Capacitor (mobile app)
    if ((window as any).Capacitor) {
        // IMPORTANT: Replace this with your actual backend URL
        // Options:
        // 1. Deployed backend (Replit, Vercel, etc.): 'https://your-app.repl.co'
        // 2. ngrok tunnel: 'https://abc123.ngrok.io'
        // 3. Your computer's local IP: 'http://192.168.1.100:5001'

        // For now, using Replit URL - UPDATE THIS!
        return 'https://hightech-lame-data--nitesh44.replit.app';
    }

    // In browser, use relative paths (proxied by Vite)
    return '';
}

// Helper function to build API URLs
export function apiUrl(path: string): string {
    const base = API_CONFIG.baseURL;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base}${cleanPath}` : cleanPath;
}
