const https = require('https');
const http = require('http');

const keepAlive = (url) => {
    if (!url) {
        console.warn('[Keep-Alive] No URL provided, skipping pinger');
        return;
    }
    
    const normalizedUrl = url.replace(/\/+$/, '');
    const pingUrl = normalizedUrl.endsWith('/health') ? normalizedUrl : `${normalizedUrl}/health`;

    console.log(`[Keep-Alive] Starting pinger for ${pingUrl}`);
    
    const client = pingUrl.startsWith('https') ? https : http;

    const ping = () => {
        const req = client.get(pingUrl, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                console.log(`[Keep-Alive] Ping successful (${res.statusCode}) at ${new Date().toLocaleTimeString()}`);
            } else {
                console.error(`[Keep-Alive] Ping failed (${res.statusCode}) at ${new Date().toLocaleTimeString()}`);
            }
        });

        req.on('error', (err) => {
            console.error(`[Keep-Alive] Ping failed: ${err.message}`);
        });

        req.setTimeout(15000, () => {
            console.error('[Keep-Alive] Ping failed: timeout after 15s');
            req.destroy();
        });
    };

    // Ping immediately
    ping();

    // Set interval to ping every 5 minutes (300,000 ms)
    setInterval(ping, 300000); 
};

module.exports = keepAlive;
