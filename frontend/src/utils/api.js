const PROD_BACKEND_FALLBACK = 'https://planbee-ocvi.onrender.com';
const LOCAL_BACKEND_FALLBACK = 'http://localhost:5000';

const isLocalHost = () =>
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const normalizeBaseUrl = (value = '') => String(value).trim().replace(/\/+$/, '');

const toApiBaseUrl = (baseUrl) =>
    baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

const shouldTrySameOriginApi = () => {
    const flag = String(import.meta.env.VITE_API_SAME_ORIGIN || '').trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(flag);
};

const buildApiBaseCandidates = () => {
    const configuredBase = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || '');
    const local = isLocalHost();
    const candidates = [];

    if (configuredBase) {
        candidates.push(configuredBase);
    }

    if (!local && shouldTrySameOriginApi()) {
        // Optional: Only try same-origin when hosting provides /api rewrites.
        candidates.push(normalizeBaseUrl(window.location.origin));
    }

    candidates.push(local ? LOCAL_BACKEND_FALLBACK : PROD_BACKEND_FALLBACK);

    return [...new Set(candidates.filter(Boolean).map(toApiBaseUrl))];
};

const API_BASE_URL_CANDIDATES = buildApiBaseCandidates();

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
        const token = localStorage.getItem('token');
        
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };

        let lastError = null;

        for (let i = 0; i < API_BASE_URL_CANDIDATES.length; i++) {
            const baseUrl = API_BASE_URL_CANDIDATES[i];
            const isLastCandidate = i === API_BASE_URL_CANDIDATES.length - 1;

            try {
                const response = await fetch(`${baseUrl}${endpoint}`, defaultOptions);
                const rawText = await response.text();
                let data = {};

                if (rawText) {
                    try {
                        data = JSON.parse(rawText);
                    } catch {
                        const isHtmlResponse = rawText.trim().startsWith('<');
                        if (isHtmlResponse && !isLastCandidate) {
                            console.warn(`API candidate ${baseUrl} returned HTML, trying fallback...`);
                            continue;
                        }

                        if (isHtmlResponse) {
                            throw new Error(`API trả về HTML thay vì JSON. Hãy kiểm tra endpoint API (${baseUrl}).`);
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

                    const retryableStatus = [502, 503, 504, 521, 522, 523, 524];
                    if (retryableStatus.includes(response.status) && !isLastCandidate) {
                        console.warn(`API failed with ${response.status} at ${baseUrl}, trying fallback...`);
                        continue;
                    }

                    throw new Error(data.message || `Yêu cầu thất bại (HTTP ${response.status}).`);
                }

                return data;
            } catch (error) {
                lastError = error;

                const message = String(error && error.message ? error.message : '');
                const isNetworkError = error instanceof TypeError || /Failed to fetch|NetworkError/i.test(message);

                if (isNetworkError && !isLastCandidate) {
                    console.warn(`API unreachable at ${baseUrl}, trying fallback...`);
                    continue;
                }

                console.error('API Error:', error.message);
                throw error;
            }
        }

        throw lastError || new Error('Không thể kết nối máy chủ.');
    },

    get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
    post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); },
    put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); },
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
};

export default api;
