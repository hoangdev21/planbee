const PROD_BACKEND_FALLBACK = 'https://planbee-i8ua.onrender.com';

const normalizeApiBaseUrl = () => {
    const configuredBase = import.meta.env.VITE_API_BASE_URL;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const fallbackBase = isLocal ? 'http://localhost:5000' : PROD_BACKEND_FALLBACK;

    let baseUrl = (configuredBase || fallbackBase).trim().replace(/\/+$/, '');

    // Auto-fix a common deployment mistake: API base points to frontend domain.
    try {
        const parsed = new URL(baseUrl);
        if (!isLocal && parsed.hostname === window.location.hostname) {
            baseUrl = PROD_BACKEND_FALLBACK;
        }
    } catch {
        baseUrl = fallbackBase;
    }

    // Prevent duplicated /api when env var already includes /api.
    if (!baseUrl.endsWith('/api')) {
        baseUrl = `${baseUrl}/api`;
    }

    return baseUrl;
};

const API_BASE_URL = normalizeApiBaseUrl();

const api = {
    showBeeAlert(message) {
        const existing = document.getElementById('bee-alert-overlay');
        if (existing) existing.remove();

        const alertOverlay = document.createElement('div');
        alertOverlay.id = 'bee-alert-overlay';
        alertOverlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); animation: beeFadeIn 0.3s forwards;';
        alertOverlay.innerHTML = `
            <div style="background: white; padding: 35px; border-radius: 28px; box-shadow: 0 25px 60px rgba(0,0,0,0.25); max-width: 420px; width: 90%; text-align: center; transform: scale(0.8); animation: beePopIn 0.3s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid rgba(255,167,38,0.2);">
                <div style="font-size: 3.5rem; margin-bottom: 20px; filter: drop-shadow(0 5px 15px rgba(255,167,38,0.3));">🐝</div>
                <h3 style="margin-bottom: 12px; color: #2D3436; font-size: 1.4rem; font-weight: 800;">Bee nhắc nhỏ!</h3>
                <p style="color: #636E72; font-size: 1rem; line-height: 1.6; margin-bottom: 30px; font-weight: 500;">${message}</p>
                <button id="close-bee-alert" style="background: linear-gradient(135deg, #FFA726 0%, #FB8C00 100%); color: white; border: none; padding: 14px 45px; border-radius: 15px; font-weight: 800; cursor: pointer; transition: all 0.3s; font-size: 0.95rem; box-shadow: 0 8px 20px rgba(251,140,0,0.3);">Đã hiểu ngay! ✨</button>
            </div>
            <style>
                @keyframes beeFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes beePopIn { from { opacity: 0; transform: scale(0.7) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                #close-bee-alert:hover { transform: translateY(-3px); box-shadow: 0 12px 25px rgba(251,140,0,0.4); }
                #close-bee-alert:active { transform: translateY(0); }
            </style>
        `;
        document.body.appendChild(alertOverlay);
        document.getElementById('close-bee-alert').onclick = () => {
            alertOverlay.style.opacity = '0';
            alertOverlay.style.transition = '0.3s';
            setTimeout(() => alertOverlay.remove(), 300);
        };
    },

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = localStorage.getItem('token');
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);
            const rawText = await response.text();
            let data = {};

            if (rawText) {
                try {
                    data = JSON.parse(rawText);
                } catch {
                    const isHtmlResponse = rawText.trim().startsWith('<');
                    if (isHtmlResponse) {
                        throw new Error(`API trả về HTML thay vì JSON. Hãy kiểm tra VITE_API_BASE_URL (${API_BASE_URL}).`);
                    }

                    throw new Error(`Server trả về dữ liệu không hợp lệ (HTTP ${response.status}).`);
                }
            }
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    if (window.location.hash !== '#/login' && window.location.hash !== '#/register' && window.location.hash !== '#/') {
                        window.location.hash = '#/login';
                    }
                }
                
                // Show visual alert for validation/conflict errors (400)
                if (response.status === 400 && data.message) {
                    this.showBeeAlert(data.message);
                }
                
                throw new Error(data.message || 'Something went wrong');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error.message);
            throw error;
        }
    },

    get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
    post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); },
    put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); },
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
};

export default api;
