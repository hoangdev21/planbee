import api from '../utils/api.js';

let isExpanded = false;
let isFullscreen = false;
// Migration: Ensure old roles like 'bot' are converted to 'assistant' for API compatibility
let chatHistory = JSON.parse(localStorage.getItem('bee_chat_history') || '[]').map(msg => ({
    ...msg,
    role: msg.role === 'bot' ? 'assistant' : msg.role
}));
localStorage.setItem('bee_chat_history', JSON.stringify(chatHistory));

export const initChatWidget = () => {
    if (document.getElementById('bee-chat-widget')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const widget = document.createElement('div');
    widget.id = 'bee-chat-widget';
    widget.className = 'chat-widget-closed';
    renderMinimized(widget);
    document.body.appendChild(widget);
    addStyles();
};

const parseActionLinks = (text) => {
    if (!text) return '';
    
    // 1. Clean up potential AI formatting debris
    let cleaned = text.trim();
    
    // Remove "orphan" dashes on their own lines or trailing dashes
    cleaned = cleaned.replace(/^[\s-]*\n/gm, '\n'); // Remove lines that are just dashes/spaces
    cleaned = cleaned.replace(/\n[\s-]*$/gm, '');   // Remove trailing dashes/spaces
    
    // If there is only exactly one line starting with a dash in the entire message, remove that dash
    const listMatches = cleaned.match(/^\s*- /gm);
    if (listMatches && listMatches.length === 1) {
        cleaned = cleaned.replace(/^\s*- /, '');
    }

    cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Limit excessive newlines
    
    // 2. Process standard formatting (Bold and newlines)
    let formatted = cleaned.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 3. Process action tags
    const regex = /\[(view_plan|delete_plan):(.*?)\]/g;
    return formatted.replace(regex, (match, action, p2) => {
        const isDelete = action === 'delete_plan';
        const label = isDelete ? 'Xác nhận xóa ngay 💥' : 'Xem lịch trình ngay ✨';
        const btnClass = isDelete ? 'chat-action-link delete-action' : 'chat-action-link';
        // Remove trailing <br> before the button if it exists to keep it tight
        return `<button class="${btnClass}" data-params="${p2}&isDelete=${isDelete}&tag=${action}">${label}</button>`;
    });
};

const attachActionListeners = (container, widget) => {
    container.querySelectorAll('.chat-action-link').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const rawParams = btn.dataset.params;
            const params = Object.fromEntries(new URLSearchParams(rawParams));
            
            // Cleanup and navigate
            const { renderPlanning } = await import('../pages/planning.js');
            const app = document.getElementById('page-content');
            if (app) {
                // EXPLICIT CLEANUP: Close chat completely and reset flags
                isExpanded = false;
                isFullscreen = false;
                widget.className = 'chat-widget-closed';
                widget.style.cssText = ""; 
                renderMinimized(widget);

                if (window.location.hash !== '#/planning') {
                    window.location.hash = '#/planning';
                    await new Promise(r => setTimeout(r, 100)); // Wait for router
                }
                
                if (params.isDelete === 'true') {
                    await renderPlanning(app, params); 
                    setTimeout(() => {
                        performDeleteEffect(params, () => renderPlanning(app, params));
                    }, 400);
                } else {
                    await renderPlanning(app, params);
                    setTimeout(() => showBeeGuide(params), 700);
                }
            }
        };
    });
};

const performDeleteEffect = async (params, onFinish) => {
    const planningPage = document.getElementById('page-content');
    if (!planningPage) return;

    // We must find the REAL element which is still there since we haven't deleted yet!
    let targetEl = Array.from(planningPage.querySelectorAll('.plan-event, .month-event-badge'))
        .find(el => el.innerText.toLowerCase().includes(params.title.toLowerCase()) && el.offsetParent !== null);
    
    if (!targetEl) {
        console.warn("Element not found for shatter effect.");
        if (onFinish) onFinish();
        return;
    }

    // Scroll smoothly to ensure we see the explosion
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
    setTimeout(async () => {
        const rect = targetEl.getBoundingClientRect();
        const color = window.getComputedStyle(targetEl).backgroundColor || '#FF9800';
        
        targetEl.style.animation = 'vibrate 0.4s linear infinite';
        
        setTimeout(async () => {
            targetEl.style.opacity = '0';
            targetEl.style.pointerEvents = 'none';
            
            // Particles
            const count = 30;
            for (let i = 0; i < count; i++) {
                const p = document.createElement('div');
                p.style.cssText = `position:fixed; left:${rect.left + rect.width/2}px; top:${rect.top + rect.height/2}px; width:${Math.random()*10+5}px; height:${Math.random()*10+5}px; background:${color}; z-index:25000; border-radius:2px; pointer-events:none; transition: all 0.8s cubic-bezier(0.1, 0.5, 0.1, 1);`;
                document.body.appendChild(p);
                const angle = Math.random() * Math.PI * 2;
                const velocity = Math.random() * 300 + 100;
                setTimeout(() => {
                    p.style.transform = `translate(${Math.cos(angle)*velocity}px, ${Math.sin(angle)*velocity}px) rotate(${Math.random()*720}deg) scale(0)`;
                    p.style.opacity = '0';
                }, 20);
                setTimeout(() => p.remove(), 1000);
            }
            
            // PERFORM REAL DELETE IN DB AFTER EFFECT
            try {
                const isPlan = params.tag.includes('delete_plan');
                const endpoint = isPlan ? `/plans/delete/${params.id}` : `/tasks/delete/${params.id}`;
                await api.delete(endpoint);
            } catch (err) { console.error("Hỏng xóa DB:", err); }

            setTimeout(() => {
                targetEl.remove();
                if (onFinish) onFinish(); // Final refresh
            }, 500);
        }, 600);
    }, 600);
};

const renderMinimized = (container) => {
    container.innerHTML = `
        <div class="chat-bubble-trigger bounce">
            <img src="/bot-bee.png" class="bee-bubble-icon">
            <span class="bubble-notif">1</span>
        </div>
    `;
    container.onclick = (e) => {
        e.stopPropagation();
        isExpanded = true;
        renderExpanded(container);
    };
};

const renderExpanded = (container) => {
    container.className = isFullscreen ? 'chat-widget-expanded fullscreen' : 'chat-widget-expanded';
    container.onclick = null;

    container.innerHTML = `
        <div class="chat-container-inner fade-in">
            <div class="chat-header">
                <div class="header-left">
                    <img src="/bot-bee.png" class="bot-avatar-mini">
                    <div class="bot-info">
                        <strong>Bee AI</strong>
                        <span class="online-status">Đang hoạt động</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button id="chat-fullscreen" title="Toàn màn hình"><i class="fas ${isFullscreen ? 'fa-compress' : 'fa-expand-arrows-alt'}"></i></button>
                    <button id="chat-clear" title="Xóa hội thoại"><i class="fas fa-trash-alt"></i></button>
                    <button id="chat-close" title="Đóng"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="chat-messages" id="chat-messages-box">
                <div class="msg-group msg-bot">
                    <img src="/bot-bee.png" class="chat-avatar">
                    <div class="msg-content">Chào bạn! Bee ở đây để giúp bạn lên kế hoạch, thống kê cũng như giải đáp mọi thắc mắc về PlanBee. Hôm nay bạn cần Bee giúp gì không? 🐝</div>
                </div>
                ${chatHistory.map(msg => `
                    <div class="msg-group msg-${msg.role === 'user' ? 'user' : 'bot'}">
                        <img src="${msg.role === 'user' ? '/user.png' : '/bot-bee.png'}" class="chat-avatar">
                        <div class="msg-content">${parseActionLinks(msg.content)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="chat-input-area">
                <input type="text" id="chat-input" placeholder="Hỏi Bee bất cứ điều gì..." autocomplete="off">
                <button id="chat-send"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;

    const msgBox = document.getElementById('chat-messages-box');
    msgBox.scrollTop = msgBox.scrollHeight;
    attachActionListeners(msgBox, container);

    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const closeBtn = document.getElementById('chat-close');
    const clearBtn = document.getElementById('chat-clear');
    const fsBtn = document.getElementById('chat-fullscreen');

    const sendMessage = async () => {
        const text = chatInput.value.trim();
        if (!text) return;
        msgBox.innerHTML += `<div class="msg-group msg-user"><img src="/user.png" class="chat-avatar"><div class="msg-content">${text}</div></div>`;
        chatInput.value = '';
        msgBox.scrollTop = msgBox.scrollHeight;
        chatHistory.push({ role: "user", content: text });
        
        const typingId = "typing-" + Date.now();
        msgBox.innerHTML += `<div class="msg-group msg-bot" id="${typingId}"><img src="/bot-bee.png" class="chat-avatar"><div class="msg-content typing-dots">Bee đang suy nghĩ...</div></div>`;
        msgBox.scrollTop = msgBox.scrollHeight;

        try {
            const res = await api.post('/ai/chat', { message: text, history: chatHistory.slice(-10) });
            const typingMsg = document.getElementById(typingId);
            if (typingMsg) typingMsg.remove();
            
            const parsedContent = parseActionLinks(res.result);
            msgBox.innerHTML += `<div class="msg-group msg-bot"><img src="/bot-bee.png" class="chat-avatar"><div class="msg-content">${parsedContent}</div></div>`;
            chatHistory.push({ role: "assistant", content: res.result });
            localStorage.setItem('bee_chat_history', JSON.stringify(chatHistory));
            msgBox.scrollTop = msgBox.scrollHeight;
            attachActionListeners(msgBox, container);
        } catch (err) {
            const tMsg = document.getElementById(typingId);
            if (tMsg) tMsg.remove();
            msgBox.innerHTML += `<div class="msg-group msg-bot error"><img src="/bot-bee.png" class="chat-avatar"><div class="msg-content">Bee lỗi rồi 🥰</div></div>`;
        }
    };

    chatInput.onkeydown = (e) => { if (e.key === 'Enter') sendMessage(); };
    sendBtn.onclick = (e) => { e.stopPropagation(); sendMessage(); };
    
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        isExpanded = false;
        isFullscreen = false;
        container.className = 'chat-widget-closed';
        container.style.cssText = '';
        renderMinimized(container);
    };

    clearBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('Xóa sạch lịch sử trò chuyện?')) {
            chatHistory = [];
            localStorage.removeItem('bee_chat_history');
            renderExpanded(container);
        }
    };

    fsBtn.onclick = (e) => {
        e.stopPropagation();
        isFullscreen = !isFullscreen;
        renderExpanded(container);
    };
};

const showBeeGuide = (params = {}) => {
    const existing = document.getElementById('bee-guide-overlay');
    if (existing) existing.remove();

    // 1. Try finding the specific plan event or month badge inside the planning content only
    const planningPage = document.getElementById('page-content');
    let targetEl = null;
    if (params.title && planningPage) {
        targetEl = Array.from(planningPage.querySelectorAll('.plan-event, .month-event-badge'))
            .find(el => el.innerText.toLowerCase().includes(params.title.toLowerCase()) && el.offsetParent !== null);
    }
    
    // 2. Fallback to the time row label (Day/Week only)
    if (!targetEl && params.time && params.view !== 'month' && planningPage) {
        const hour = parseInt(params.time);
        const timeLabels = planningPage.querySelectorAll('.calendar-grid-scroll > div:first-child > div');
        targetEl = Array.from(timeLabels).find(el => el.innerText.trim() === `${hour}:00`);
    }

    let top = '50%', left = '50%', isFlipped = false;
    let haloW = '100px', haloH = '60px', haloX = '50%', haloY = '50%';
    let originalZ = '', originalAnim = '', originalShadow = '', originalBorder = '';

    if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        originalZ = targetEl.style.zIndex;
        originalAnim = targetEl.style.animation;
        originalShadow = targetEl.style.boxShadow;
        originalBorder = targetEl.style.border;
        
        haloW = `${rect.width + 10}px`;
        haloH = `${rect.height + 10}px`;
        haloX = `${rect.left - 5}px`;
        haloY = `${rect.top - 5}px`;

        // Highlight the target element intensely
        targetEl.style.zIndex = '10003';
        targetEl.style.border = '4px solid white';
        targetEl.style.animation = 'eventFocus 1.5s ease-in-out infinite';
        targetEl.style.boxShadow = '0 0 30px rgba(255,255,255,0.8)';

        top = `${rect.top + (rect.height / 2) - 60}px`;
        if (rect.left > window.innerWidth / 2) {
            left = `${rect.left - 135}px`;
            isFlipped = true;
        } else {
            left = `${rect.right + 20}px`;
            isFlipped = false;
        }
        if (parseInt(left) < 10) left = '10px';
        if (parseInt(left) + 120 > window.innerWidth) left = `${window.innerWidth - 130}px`;
    }

    const guide = document.createElement('div');
    guide.id = 'bee-guide-overlay';
    guide.innerHTML = `
        <div class="bee-guide-container" style="top: ${top}; left: ${left};">
            <div class="bee-speech-bubble show-sparkles">Lịch bạn tạo nè!! ✨</div>
            <img src="/bee-chi-lich.png" class="bee-guide-img" style="${isFlipped ? 'transform: scaleX(-1)' : ''}">
        </div>
        <div class="bee-guide-backdrop-simple"></div>
    `;
    document.body.appendChild(guide);

    const dismiss = () => {
        if (targetEl) {
            targetEl.style.zIndex = originalZ;
            targetEl.style.animation = originalAnim;
            targetEl.style.boxShadow = originalShadow;
            targetEl.style.border = originalBorder;
        }
        guide.classList.add('fade-out');
        setTimeout(() => guide.remove(), 500);
        document.removeEventListener('click', dismiss);
    };
    setTimeout(() => document.addEventListener('click', dismiss), 100);
};

const addStyles = () => {
    if (document.getElementById('bee-chat-styles')) return;
    const style = document.createElement('style');
    style.id = 'bee-chat-styles';
    style.innerHTML = `
        #bee-chat-widget { position: fixed; bottom: 30px; right: 30px; z-index: 9999; font-family: 'Inter', sans-serif; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .chat-widget-closed { width: 70px; height: 70px; cursor: pointer; }
        .chat-bubble-trigger { width: 100%; height: 100%; background: white; border-radius: 50%; box-shadow: 0 10px 30px rgba(255,167,38,0.4); display: flex; align-items: center; justify-content: center; position: relative; border: 3px solid var(--primary-color); }
        .bee-bubble-icon { width: 45px; height: 45px; transition: 0.3s; }
        .chat-bubble-trigger:hover .bee-bubble-icon { transform: scale(1.1) rotate(10deg); }
        .bubble-notif { position: absolute; transform: translate(25px, -25px); background: #ef4444; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; border: 2px solid white; }

        .chat-widget-expanded { width: 400px; height: 600px; background: var(--card-bg); border-radius: 24px; box-shadow: var(--shadow-lg); overflow: hidden; display: flex; border: 1px solid var(--border-color); }
        .chat-widget-expanded.fullscreen { width: 100vw; height: 100vh; position: fixed; top: 0; left: 0; bottom: 0; right: 0; border-radius: 0; z-index: 10000; }
        
        .chat-container-inner { width: 100%; height: 100%; display: flex; flex-direction: column; }
        .chat-header { padding: 20px; background: var(--primary-color); color: white; display: flex; justify-content: space-between; align-items: center; }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .bot-avatar-mini { width: 40px; height: 40px; background: white; border-radius: 50%; object-fit: cover; }
        .bot-info { display: flex; flex-direction: column; }
        .bot-info strong { font-size: 1rem; }
        .online-status { font-size: 0.7rem; opacity: 0.9; }
        .header-actions { display: flex; gap: 10px; }
        .header-actions button { background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
        .header-actions button:hover { background: rgba(255,255,255,0.4); }

        .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; background: #fdfdfe; scroll-behavior: smooth; }
        .msg-group { display: flex; gap: 10px; max-width: 85%; align-items: flex-end; }
        .msg-bot { align-self: flex-start; }
        .msg-user { align-self: flex-end; flex-direction: row-reverse; }
        
        .chat-avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; background: white; border: 1px solid var(--border-color); flex-shrink: 0; }
        .msg-content { padding: 12px 16px; border-radius: 18px; font-size: 0.95rem; line-height: 1.5; box-shadow: 0 4px 12px rgba(0,0,0,0.03); position: relative; }
        
        .msg-bot .msg-content { background: white; color: var(--text-main); border-bottom-left-radius: 4px; border: 1px solid var(--border-color); }
        .msg-user .msg-content { background: var(--primary-color); color: white; border-bottom-right-radius: 4px; }
        
        .chat-action-link { display: block; margin-top: 10px; width: 100%; border: none; background: rgba(255,167,38,0.1); color: var(--primary-color); padding: 10px; border-radius: 12px; font-weight: 800; font-size: 0.8rem; cursor: pointer; transition: 0.2s; text-align: center; }
        .chat-action-link:hover { background: var(--primary-color); color: white; transform: translateY(-2px); }

        .chat-input-area { padding: 20px; background: white; border-top: 1px solid var(--border-color); display: flex; gap: 12px; }
        .chat-input-area input { flex: 1; border: 2px solid var(--border-color); border-radius: 12px; padding: 12px 16px; outline: none; transition: 0.2s; }
        .chat-input-area input:focus { border-color: var(--primary-color); }
        #chat-send { width: 48px; background: var(--primary-color); color: white; border: none; border-radius: 12px; cursor: pointer; transition: 0.2s; font-size: 1.1rem; }
        #chat-send:hover { transform: scale(1.05); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }

        .typing-dots span { animation: blink 1s infinite; margin: 0 1px; }
        @keyframes blink { 0% { opacity: 0.2; } 50% { opacity: 1; } 100% { opacity: 0.2; } }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        /* Guide Bee Styles */
        #bee-guide-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 10001; }
        .bee-guide-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.1); backdrop-filter: blur(1px); opacity: 0; animation: fadeInOverlay 0.6s forwards; pointer-events: all; }
        .bee-guide-container { position: absolute; display: flex; flex-direction: column; align-items: center; z-index: 10005; animation: beeIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); pointer-events: none; }
        .bee-guide-img { width: 120px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2)); animation: beeFloat 3s ease-in-out infinite; }
        .bee-guide-halo { position: fixed; border: 4px solid white; border-radius: 12px; box-shadow: 0 0 50px white, inset 0 0 20px white; z-index: 10002; pointer-events: none; animation: haloPulse 1.5s infinite; }
        .bee-guide-backdrop-simple { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 10001; pointer-events: none; animation: fadeInOverlay 0.3s forwards; }
        
        @keyframes haloPulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.02); opacity: 1; } }
        @keyframes beeIn { 0% { opacity: 0; transform: scale(0.5) translateY(100px) rotate(15deg); } 100% { opacity: 1; transform: scale(1) translateY(0) rotate(0); } }
        .bee-speech-bubble { background: #FF9800; color: white; padding: 12px 18px; border-radius: 16px; font-weight: 800; font-size: 0.95rem; box-shadow: 0 8px 18px rgba(255,152,0,0.3); position: relative; animation: beeFloat 2s ease-in-out infinite; white-space: nowrap; border: 2.5px solid white; }
        .bee-speech-bubble::after { content: ''; position: absolute; bottom: -10px; right: 30px; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 12px solid #FF9800; }
        
        #bee-guide-overlay.fade-out { opacity: 0; transition: 0.5s; pointer-events: none; }
        #bee-guide-overlay.fade-out .bee-guide-container { transform: scale(0.5) translateY(50px); filter: blur(5px); }

        @keyframes beeFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes fadeInOverlay { 100% { opacity: 1; } }
        @keyframes eventFocus { 0%, 100% { transform: scale(1); filter: brightness(1.1); } 50% { transform: scale(1.03); filter: brightness(1.2); } }
        @keyframes vibrate { 0% { transform: translate(1px, 1px) rotate(0deg); } 10% { transform: translate(-1px, -2px) rotate(-1deg); } 20% { transform: translate(-3px, 0px) rotate(1deg); } 30% { transform: translate(3px, 2px) rotate(0deg); } 40% { transform: translate(1px, -1px) rotate(1deg); } 50% { transform: translate(-1px, 2px) rotate(-1deg); } 60% { transform: translate(-3px, 1px) rotate(0deg); } 70% { transform: translate(3px, 1px) rotate(-1deg); } 80% { transform: translate(-1px, -1px) rotate(1deg); } 90% { transform: translate(1px, 2px) rotate(0deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); } }
        
        .delete-action { background: #f44336 !important; border-color: #d32f2f !important; color: white !important; }
        .delete-action:hover { background: #d32f2f !important; color: white !important; box-shadow: 0 4px 12px rgba(211,47,47,0.3) !important; }
        
        .show-sparkles::before { content: '✨'; position: absolute; left: -20px; top: -10px; animation: sparkleIn 1.5s infinite; }
        .show-sparkles::after { content: '✨'; position: absolute; right: -20px; bottom: -10px; animation: sparkleIn 1.5s infinite reverse; }
        @keyframes sparkleIn { 0%, 100% { opacity: 0; transform: scale(0.5); } 50% { opacity: 1; transform: scale(1.2) rotate(20deg); } }
    `;
    document.head.appendChild(style);
};
