const https = require('https');
const http = require('http');

const keepAlive = (url) => {
    if (!url) {
        console.warn('[Keep-Alive] No URL provided, skipping pinger');
        return;
    }
    
    console.log(`[Keep-Alive] Starting pinger for ${url}`);
    
    const client = url.startsWith('https') ? https : http;

    const ping = () => {
        client.get(url, (res) => {
            console.log(`[Keep-Alive] Ping successful (${res.statusCode}) at ${new Date().toLocaleTimeString()}`);
        }).on('error', (err) => {
            console.error(`[Keep-Alive] Ping failed: ${err.message}`);
        });
    };

    // Ping immediately
    ping();

    // Set interval to ping every 5 minutes (300,000 ms)
    setInterval(ping, 300000); 
};

module.exports = keepAlive;
