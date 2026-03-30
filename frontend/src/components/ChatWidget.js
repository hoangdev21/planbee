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
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {

        const existing = document.getElementById('bee-chat-widget');
        if (existing) existing.remove();
        return;
    }
    if (document.getElementById('bee-chat-widget')) return;
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
    const regex = /\[(view_plan|delete_plan|view_habit):(.*?)\]/g;
    return formatted.replace(regex, (match, action, p2) => {
        const isDelete = action === 'delete_plan';
        const isHabit = action === 'view_habit';
        
        let label = 'Xem lịch trình ngay ✨';
        if (isDelete) label = 'Xác nhận xóa ngay 💥';
        if (isHabit) label = 'Xem thói quen ngay 🌿';

        const btnClass = isDelete ? 'chat-action-link delete-action' : 'chat-action-link';
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

                if (params.tag === 'view_habit') {
                    if (window.location.hash !== '#/habits') {
                        window.location.hash = '#/habits';
                        await new Promise(r => setTimeout(r, 100));
                    }
                    const { renderHabits } = await import('../pages/habits.js');
                    await renderHabits(app);
                    return;
                }

                const targetHash = `#/planning?${rawParams}`;
                if (window.location.hash !== targetHash) {
                    window.location.hash = targetHash;
                    await new Promise(r => setTimeout(r, 600)); // Wait for router and initial render
                }
                
                if (params.isDelete === 'true') {
                    // Re-render explicitly with params to ensure Ghost item logic triggers reliably
                    await renderPlanning(app, { ...params, noScroll: true }); 
                    
                    // Small delay to ensure renderPlanningUI finished its work
                    setTimeout(() => {
                        performDeleteEffect(params, () => {
                            // After explosion, clean up URL and refresh
                            window.location.hash = '#/planning';
                            renderPlanning(app, { noScroll: true });
                        });
                    }, 400); 
                } else {
                    await renderPlanning(app, params);
                    setTimeout(() => showBeeGuide(params), 750);
                }
            }
        };
    });
};

const performDeleteEffect = async (params, onFinish) => {
    const planningPage = document.getElementById('page-content');
    if (!planningPage) return;

    // 1. Robust Lookup: ID -> Title -> or try to scroll to the slot based on time
    let targetEl = null;
    
    // Attempt lookup by ID
    if (params.id) {
        targetEl = planningPage.querySelector(`[data-id="${params.id}"]`);
    }
    
    // Fallback to Title
    if (!targetEl && params.title) {
        targetEl = Array.from(planningPage.querySelectorAll('.plan-event, .task-event, .month-event-badge'))
                        .find(el => el.innerText.toLowerCase().includes(params.title.toLowerCase()) && el.offsetParent !== null);
    }
    
    if (!targetEl) {
        console.warn('PlanBee: Target element not found for deletion!', params);
        if (onFinish) onFinish();
        return;
    }

    console.log('PlanBee: Starting deletion sequence for', targetEl);
    // 2. Immediate scroll with clear focus
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add temporary highlight circle during scroll
    const highlight = document.createElement('div');
    highlight.style.cssText = `position:fixed; inset:0; z-index:999998; border:10px solid rgba(255, 50, 50, 0.4); pointer-events:none; opacity:0; transition: opacity 0.3s;`;
    document.body.appendChild(highlight);
    setTimeout(() => highlight.style.opacity = '1', 50);
        
    setTimeout(async () => {
        highlight.remove();
        
        // 1. PHASE 1: CHARGING & VIBRATION (Build tension)
        targetEl.style.zIndex = '2000000';
        targetEl.style.position = 'relative'; 
        targetEl.style.animation = 'superVibrate 0.8s cubic-bezier(.36,.07,.19,.97) both';
        targetEl.style.boxShadow = '0 0 80px rgba(255, 50, 50, 0.9), 0 0 120px rgba(255, 50, 50, 0.4)';
        targetEl.style.border = '4px solid white';
        targetEl.style.transformOrigin = 'center';
        
        setTimeout(async () => {
            const rect = targetEl.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const baseColor = '#FF5252';

            // 2. PHASE 2: THE BIG BANG (Hide element and show flash/shockwave)
            targetEl.style.opacity = '0';
            targetEl.style.pointerEvents = 'none';

            // Shockwave Effect
            const shockwave = document.createElement('div');
            shockwave.className = 'shatter-shockwave';
            shockwave.style.cssText = `position:fixed; left:${centerX}px; top:${centerY}px;`;
            document.body.appendChild(shockwave);
            setTimeout(() => shockwave.remove(), 800);

            // Center Flash
            const flash = document.createElement('div');
            flash.className = 'shatter-flash';
            flash.style.cssText = `position:fixed; left:${centerX}px; top:${centerY}px;`;
            document.body.appendChild(flash);
            setTimeout(() => flash.remove(), 400);
            
            // 3. PHASE 3: HONEYCOMB PARTICLES (Beautiful shatter)
            const count = 80; 
            for (let i = 0; i < count; i++) {
                const p = document.createElement('div');
                const size = Math.random() * 20 + 10;
                const angle = Math.random() * Math.PI * 2;
                const velocity = Math.random() * 800 + 400; // Fast spread
                const duration = Math.random() * 0.8 + 0.6;
                const delay = Math.random() * 0.05;

                p.className = 'honeycomb-particle';
                p.style.cssText = `
                    position:fixed; 
                    left:${centerX}px; 
                    top:${centerY}px; 
                    width:${size}px; 
                    height:${size}px; 
                    background: ${i % 3 === 0 ? '#FFF' : baseColor};
                    z-index:999999; 
                    opacity: 1;
                    transition: all ${duration}s cubic-bezier(0.1, 0.8, 0.2, 1) ${delay}s;
                    box-shadow: 0 0 15px ${baseColor};
                `;
                document.body.appendChild(p);
                
                // Trigger animation
                requestAnimationFrame(() => {
                    const tx = Math.cos(angle) * velocity;
                    const ty = Math.sin(angle) * velocity;
                    const rot = Math.random() * 1080;
                    p.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(0)`;
                    p.style.opacity = '0';
                });

                setTimeout(() => p.remove(), (duration + delay) * 1000 + 100);
            }
            
            setTimeout(() => {
                targetEl.remove();
                if (onFinish) onFinish();
            }, 600);
        }, 800); // Wait for charging animation
    }, 700); 
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
            const typingMsg = document.getElementById(typingId);
            if (typingMsg) typingMsg.remove();
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

    const planningPage = document.getElementById('page-content');
    if (!planningPage) return;

    let targetEl = null;
    let originalStyles = {};

    const findTarget = () => {
        if (params.title) {
            targetEl = Array.from(planningPage.querySelectorAll('.plan-event, .month-event-badge'))
                .find(el => el.innerText.toLowerCase().includes(params.title.toLowerCase()) && el.offsetParent !== null);
        }
        if (!targetEl && params.time && params.view !== 'month') {
            const hour = parseInt(params.time);
            const timeLabels = planningPage.querySelectorAll('.calendar-grid-scroll > div:first-child > div');
            targetEl = Array.from(timeLabels).find(el => el.innerText.trim() === `${hour}:00`);
        }
        return targetEl;
    };

    const highlightTarget = (el) => {
        originalStyles = {
            zIndex: el.style.zIndex,
            animation: el.style.animation,
            boxShadow: el.style.boxShadow,
            border: el.style.border,
            overflow: el.style.overflow,
            transition: el.style.transition
        };
        
        // Ensure element is positioned for z-index
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.position === 'static') {
            el.style.position = 'relative';
            originalStyles.position = 'static';
        }

        // Use 'true' to scroll and 'nearest' to avoid excessive blank space at bottom
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        
        // IMPORTANT: Remove overflow hidden to allow the glow to show!
        el.style.overflow = 'visible';
        el.style.zIndex = '10003';
        el.style.border = '4px solid white';
        el.style.animation = 'eventFocus 1.0s ease-in-out infinite';
        el.style.boxShadow = '0 0 60px rgba(255,255,255,1), 0 0 100px rgba(255,152,0,0.4)';
        el.style.transition = 'all 0.3s ease';
    };

    const renderBee = (el) => {
        // Double check positions after scroll might have finished
        const rect = el.getBoundingClientRect();
        
        // If rect is totally off or hidden, don't show bee
        if (rect.top === 0 && rect.left === 0) return;

        let isFlipped = rect.left > window.innerWidth / 2;
        let top = `${rect.top + (rect.height / 2) - 80}px`;
        let left = isFlipped ? `${rect.left - 135}px` : `${rect.right + 20}px`;

        // Safety bounds
        const leftVal = parseInt(left);
        if (leftVal < 20) left = '20px';
        if (leftVal + 140 > window.innerWidth) left = `${window.innerWidth - 150}px`;

        const guide = document.createElement('div');
        guide.id = 'bee-guide-overlay';
        guide.innerHTML = `
            <div class="bee-guide-container" style="top: ${top}; left: ${left}; opacity: 0; transform: translateY(20px); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                <div class="bee-speech-bubble show-sparkles">Lịch bạn tạo nè!! ✨</div>
                <img src="/bee-chi-lich.png" class="bee-guide-img" style="${isFlipped ? 'transform: scaleX(-1)' : ''}">
            </div>
            <div class="bee-guide-backdrop-simple"></div>
        `;
        document.body.appendChild(guide);

        // Animation entrance
        setTimeout(() => {
            const container = guide.querySelector('.bee-guide-container');
            if (container) {
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }
        }, 50);

        const dismiss = () => {
            Object.assign(el.style, originalStyles);
            if (originalStyles.position === 'static') el.style.position = 'static';
            guide.classList.add('fade-out');
            setTimeout(() => guide.remove(), 400);
            document.removeEventListener('click', dismiss);
        };
        setTimeout(() => document.addEventListener('click', dismiss), 100);
    };

    // SEARCH & SHOW LOOP
    let attempts = 0;
    let found = false;
    const checkAndShow = () => {
        if (found) return; 
        const el = findTarget();
        if (el) {
            found = true;
            highlightTarget(el);
            // Wait LONGER for smooth scroll to finish (800ms) before rendering Bee
            setTimeout(() => renderBee(el), 800);
        } else if (attempts < 15) {
            attempts++;
            setTimeout(checkAndShow, 150);
        }
    };

    checkAndShow();
};

const addStyles = () => {
    const existingStyle = document.getElementById('bee-chat-styles');
    if (existingStyle) existingStyle.remove(); // Force update on re-init
    
    const style = document.createElement('style');
    style.id = 'bee-chat-styles';
    style.innerHTML = `
        /* Chat Widget Styles - Global & Layout */
        #bee-chat-widget { position: fixed; bottom: 30px; right: 30px; z-index: 10005; font-family: 'Inter', sans-serif; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .chat-widget-closed { width: 60px; height: 60px; cursor: pointer; }
        .chat-bubble-trigger { width: 100%; height: 100%; background: linear-gradient(135deg, #FFB74D, #FFA726); border-radius: 50%; box-shadow: 0 8px 20px rgba(255,167,38,0.25); display: flex; align-items: center; justify-content: center; position: relative; border: 2.5px solid white; transition: all 0.3s ease; }
        .bee-bubble-icon { width: 38px; height: 38px; transition: 0.3s; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
        .chat-bubble-trigger:hover { transform: translateY(-5px) scale(1.05); box-shadow: 0 12px 28px rgba(255,167,38,0.35); }
        .bubble-notif { position: absolute; top: -3px; right: -3px; background: #ef4444; color: white; min-width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 900; border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.15); }

        .chat-widget-expanded { 
            width: 420px; 
            height: 650px; 
            background: var(--card-bg); 
            border-radius: 28px; 
            box-shadow: 0 20px 50px rgba(0,0,0,0.2); 
            overflow: hidden; 
            display: flex; 
            border: 1px solid var(--border-color);
            flex-direction: column;
        }
        .chat-widget-expanded.fullscreen { width: 100vw; height: 100vh; position: fixed; top: 0; left: 0; bottom: 0; right: 0; border-radius: 0; z-index: 10000; }
        
        .chat-container-inner { width: 100%; height: 100%; display: flex; flex-direction: column; }
        
        /* Premium Header Redesign */
        .chat-header { 
            height: 72px;
            min-height: 72px;
            padding: 0 20px; 
            background: var(--primary-color); 
            color: white; 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            position: relative;
            z-index: 10;
        }
        .header-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .bot-avatar-mini { 
            width: 42px; 
            height: 42px; 
            background: white; 
            border-radius: 14px; 
            object-fit: cover;
            border: 2px solid rgba(255,255,255,0.3);
        }
        .bot-info { display: flex; flex-direction: column; min-width: 0; }
        .bot-info strong { 
            font-size: 1.05rem; 
            font-weight: 800; 
            white-space: nowrap; 
            overflow: hidden; 
            text-overflow: ellipsis; 
            letter-spacing: -0.2px;
        }
        .online-status { 
            font-size: 0.75rem; 
            font-weight: 500;
            opacity: 0.9; 
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .online-status::before {
            content: '';
            width: 7px;
            height: 7px;
            background: #4ADE80;
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 8px #4ADE80;
        }
        
        .header-actions { 
            display: flex; 
            gap: 6px; 
            flex-shrink: 0; 
            align-items: center;
        }
        .header-actions button { 
            background: rgba(255,255,255,0.12); 
            border: none; 
            color: white; 
            width: 34px; 
            height: 34px; 
            border-radius: 10px; 
            cursor: pointer; 
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
        }
        .header-actions button:hover { 
            background: rgba(255,255,255,0.25); 
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .header-actions button#chat-close { background: rgba(0,0,0,0.1); }
        .header-actions button#chat-close:hover { background: rgba(214, 48, 49, 0.25); color: #FFCDD2; }

        /* Messages & Input Area */
        .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 18px; background: var(--bg-color); scroll-behavior: smooth; }
        .msg-group { display: flex; gap: 10px; max-width: 88%; align-items: flex-end; }
        .msg-bot { align-self: flex-start; }
        .msg-user { align-self: flex-end; flex-direction: row-reverse; }
        
        .chat-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background: var(--card-bg); border: 1px solid var(--border-color); flex-shrink: 0; }
        .msg-content { padding: 12px 16px; border-radius: 18px; font-size: 0.95rem; line-height: 1.5; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        
        .msg-bot .msg-content { background: var(--card-bg); color: var(--text-main); border-bottom-left-radius: 4px; border: 1.5px solid var(--border-color); }
        .msg-user .msg-content { background: var(--primary-color); color: white; border-bottom-right-radius: 4px; }
        
        .chat-action-link { display: block; margin-top: 10px; width: 100%; border: none; background: var(--primary-light); color: var(--primary-color); padding: 12px; border-radius: 14px; font-weight: 850; font-size: 0.8rem; cursor: pointer; transition: 0.2s; text-align: center; }
        .chat-action-link:hover { background: var(--primary-color); color: white; transform: translateY(-2px); }

        .chat-input-area { padding: 16px 20px; background: var(--card-bg); border-top: 1px solid var(--border-color); display: flex; gap: 10px; }
        .chat-input-area input { flex: 1; border: 1.5px solid var(--border-color); border-radius: 14px; padding: 12px 16px; outline: none; transition: 0.2s; background: var(--bg-color); color: var(--text-main); font-size: 0.95rem; }
        .chat-input-area input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 3px var(--primary-light)15; }
        #chat-send { width: 48px; background: var(--primary-color); color: white; border: none; border-radius: 14px; cursor: pointer; transition: 0.2s; font-size: 1.1rem; flex-shrink: 0; }
        #chat-send:hover { transform: scale(1.05); }

        /* Responsive Fixes */
        @media (max-width: 600px) {
            #bee-chat-widget { bottom: 20px !important; right: 20px !important; }
            #bee-chat-widget.chat-widget-expanded { 
                position: fixed !important;
                inset: 0 !important;
                width: 100% !important; 
                height: 100% !important;
                max-width: 100% !important;
                max-height: 100% !important;
                border-radius: 0 !important; 
                border: none !important;
                z-index: 20000 !important;
                margin: 0 !important;
                display: flex !important;
                flex-direction: column !important;
            }
            .chat-header { height: 64px !important; min-height: 64px !important; padding: 0 16px !important; border-radius: 0 !important; }
            .bot-avatar-mini { width: 36px !important; height: 36px !important; border-radius: 11px !important; }
            .header-actions button { width: 32px !important; height: 32px !important; }
            .chat-messages { padding: 16px !important; }
            .msg-group { max-width: 100% !important; }
            .chat-input-area { 
                padding: 14px 16px !important; 
                padding-bottom: calc(14px + env(safe-area-inset-bottom)) !important; 
                border-radius: 0 !important;
            }
        }
    `;
    document.head.appendChild(style);
};
