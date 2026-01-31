// Messages Page JavaScript

// API_BASE_URL is already defined in auth.js (loaded before this script)
// No need to redeclare it here

// Global state
let currentUser = null;
let conversations = [];
let currentConversation = null;
let messages = [];
let websocket = null;
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();
    
    // Initialize components
    initWebSocket();
    loadConversations();
    initMessageForm();
    initSearch();
    
    // Initialize animations
    initAnimations();
    
    console.log('💬 Messages page initialized');
});

// ============================================
// AUTHENTICATION
// ============================================
function checkAuth() {
    const session = getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = session.user;
}

function getSession() {
    const sessionData = localStorage.getItem('zone4love_session') || sessionStorage.getItem('zone4love_session');
    return sessionData ? JSON.parse(sessionData) : null;
}

function getAuthHeaders() {
    const session = getSession();
    return session ? {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
    } : {};
}

// ============================================
// WEBSOCKET CONNECTION
// ============================================
function initWebSocket() {
    try {
        const wsUrl = API_BASE_URL.replace('http', 'ws') + '/ws';
        websocket = new WebSocket(wsUrl);
        
        websocket.onopen = () => {
            console.log('WebSocket connected');
            showMessage('Connesso in tempo reale! 🔗', 'success');
        };
        
        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };
        
        websocket.onclose = () => {
            console.log('WebSocket disconnected');
            // Attempt to reconnect after 3 seconds
            setTimeout(initWebSocket, 3000);
        };
        
        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
    } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
    }
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'new_message':
            handleNewMessage(data.message);
            break;
        case 'message_read':
            handleMessageRead(data.message_id);
            break;
        case 'user_typing':
            handleUserTyping(data.user_id);
            break;
        case 'user_online':
            handleUserOnline(data.user_id);
            break;
        case 'user_offline':
            handleUserOffline(data.user_id);
            break;
    }
}

// ============================================
// CONVERSATIONS LOADING
// ============================================
async function loadConversations() {
    if (isLoading) return;
    
    isLoading = true;
    showConversationsLoading();
    
    try {
        // For now, create mock conversations since we don't have the backend endpoint yet
        conversations = createMockConversations();
        renderConversations();
        
        // TODO: Replace with actual API call
        // const response = await fetch(`${API_BASE_URL}/conversations`, {
        //     headers: getAuthHeaders()
        // });
        
        // if (!response.ok) {
        //     throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        // }
        
        // const result = await response.json();
        // if (result.success) {
        //     conversations = result.data;
        //     renderConversations();
        // }
        
    } catch (error) {
        console.error('Error loading conversations:', error);
        showConversationsError('Errore nel caricamento delle conversazioni');
    } finally {
        isLoading = false;
    }
}

function createMockConversations() {
    return [
        {
            id: 1,
            user: {
                id: 2,
                username: 'SpaceExplorer',
                avatar_url: null,
                online: true
            },
            last_message: {
                content: 'Ciao! Come va l\'esplorazione della galassia? 🚀',
                created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
                sender_id: 2
            },
            unread_count: 2
        },
        {
            id: 2,
            user: {
                id: 3,
                username: 'CosmicWanderer',
                avatar_url: null,
                online: false
            },
            last_message: {
                content: 'Hai visto l\'eclissi lunare ieri sera?',
                created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                sender_id: 3
            },
            unread_count: 0
        },
        {
            id: 3,
            user: {
                id: 4,
                username: 'GalaxyDreamer',
                avatar_url: null,
                online: true
            },
            last_message: {
                content: 'Grazie per aver condiviso quella foto! ✨',
                created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
                sender_id: 1
            },
            unread_count: 0
        }
    ];
}

function renderConversations() {
    const container = document.getElementById('conversations-list');
    
    if (conversations.length === 0) {
        container.innerHTML = `
            <div class="p-4">
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">💬</div>
                    <h3 class="text-xl font-semibold mb-2">Nessuna conversazione</h3>
                    <p class="text-purple-300 mb-6">Inizia a chattare con qualcuno!</p>
                    <button onclick="openNewMessageModal()" class="px-6 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all font-semibold">
                        Nuovo Messaggio
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="p-2"></div>';
    const conversationsContainer = container.querySelector('div');
    
    conversations.forEach(conversation => {
        const conversationElement = createConversationElement(conversation);
        conversationsContainer.appendChild(conversationElement);
    });
}

function createConversationElement(conversation) {
    const div = document.createElement('div');
    div.className = `conversation-item p-4 hover:bg-purple-900/20 cursor-pointer transition-colors border-b border-purple-500/10 ${conversation.unread_count > 0 ? 'bg-purple-900/10' : ''}`;
    div.dataset.conversationId = conversation.id;
    div.onclick = () => openConversation(conversation);
    
    const timeAgo = getTimeAgo(new Date(conversation.last_message.created_at));
    
    div.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="relative">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                    ${conversation.user.username.charAt(0).toUpperCase()}
                </div>
                ${conversation.user.online ? `
                    <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                ` : ''}
            </div>
            
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                    <h3 class="font-semibold truncate">${conversation.user.username}</h3>
                    <span class="text-xs text-purple-300">${timeAgo}</span>
                </div>
                <div class="flex items-center justify-between">
                    <p class="text-sm text-purple-300 truncate">${conversation.last_message.content}</p>
                    ${conversation.unread_count > 0 ? `
                        <span class="ml-2 px-2 py-1 bg-pink-600 text-xs rounded-full">${conversation.unread_count}</span>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    return div;
}

// ============================================
// CHAT FUNCTIONALITY
// ============================================
async function openConversation(conversation) {
    currentConversation = conversation;
    
    // Update UI
    document.getElementById('no-chat-selected').classList.add('hidden');
    document.getElementById('chat-header').classList.remove('hidden');
    document.getElementById('message-input-area').classList.remove('hidden');
    document.getElementById('messages-container').classList.remove('hidden');
    
    // Update chat header
    document.getElementById('chat-avatar').textContent = conversation.user.username.charAt(0).toUpperCase();
    document.getElementById('chat-username').textContent = conversation.user.username;
    document.getElementById('chat-status').textContent = conversation.user.online ? 'Online' : 'Offline';
    
    // Mark conversation as active
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('bg-purple-900/30');
    });
    document.querySelector(`[data-conversation-id="${conversation.id}"]`).classList.add('bg-purple-900/30');
    
    // Load messages
    await loadMessages(conversation.id);
    
    // Mark as read
    markConversationAsRead(conversation.id);
}

async function loadMessages(conversationId) {
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.innerHTML = `
        <div class="text-center py-8">
            <div class="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p class="text-purple-300">Caricamento messaggi...</p>
        </div>
    `;
    
    try {
        // Create mock messages for now
        messages = createMockMessages(conversationId);
        renderMessages();
        
        // TODO: Replace with actual API call
        // const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
        //     headers: getAuthHeaders()
        // });
        
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesContainer.innerHTML = `
            <div class="text-center py-8">
                <div class="text-4xl mb-4">⚠️</div>
                <p class="text-purple-300">Errore nel caricamento dei messaggi</p>
            </div>
        `;
    }
}

function createMockMessages(conversationId) {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return [];
    
    return [
        {
            id: 1,
            content: 'Ciao! Come stai?',
            sender_id: conversation.user.id,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            read: true
        },
        {
            id: 2,
            content: 'Tutto bene, grazie! E tu come va?',
            sender_id: currentUser.id,
            created_at: new Date(Date.now() - 3300000).toISOString(),
            read: true
        },
        {
            id: 3,
            content: 'Benissimo! Ho appena visto delle stelle incredibili 🌟',
            sender_id: conversation.user.id,
            created_at: new Date(Date.now() - 3000000).toISOString(),
            read: true
        },
        {
            id: 4,
            content: 'Wow! Devi assolutamente condividere le foto!',
            sender_id: currentUser.id,
            created_at: new Date(Date.now() - 2700000).toISOString(),
            read: true
        },
        {
            id: 5,
            content: conversation.last_message.content,
            sender_id: conversation.last_message.sender_id,
            created_at: conversation.last_message.created_at,
            read: false
        }
    ];
}

function renderMessages() {
    const container = document.getElementById('messages-container');
    container.innerHTML = '';
    
    messages.forEach((message, index) => {
        const messageElement = createMessageElement(message, index);
        container.appendChild(messageElement);
    });
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function createMessageElement(message, index) {
    const isOwn = message.sender_id === currentUser.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;
    
    const div = document.createElement('div');
    div.className = `flex ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-1'}`;
    
    const time = new Date(message.created_at).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    div.innerHTML = `
        <div class="flex items-end gap-2 max-w-xs lg:max-w-md">
            ${!isOwn && showAvatar ? `
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                    ${currentConversation.user.username.charAt(0).toUpperCase()}
                </div>
            ` : !isOwn ? '<div class="w-8"></div>' : ''}
            
            <div class="flex flex-col ${isOwn ? 'items-end' : 'items-start'}">
                <div class="px-4 py-2 rounded-2xl ${isOwn ? 
                    'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 
                    'bg-purple-900/30 text-purple-100'
                } ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'}">
                    <p class="text-sm">${message.content}</p>
                </div>
                <span class="text-xs text-purple-400 mt-1 px-2">${time}</span>
            </div>
        </div>
    `;
    
    return div;
}

// ============================================
// MESSAGE SENDING
// ============================================
function initMessageForm() {
    const form = document.getElementById('message-form');
    const input = document.getElementById('message-input');
    
    form.addEventListener('submit', handleSendMessage);
    
    // Auto-resize textarea
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 128) + 'px';
    });
    
    // Send on Enter (but not Shift+Enter)
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    });
}

async function handleSendMessage(event) {
    event.preventDefault();
    
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    
    if (!content || !currentConversation) return;
    
    // Clear input immediately
    input.value = '';
    input.style.height = 'auto';
    
    // Create optimistic message
    const newMessage = {
        id: Date.now(), // Temporary ID
        content: content,
        sender_id: currentUser.id,
        created_at: new Date().toISOString(),
        read: false,
        sending: true
    };
    
    // Add to messages and render
    messages.push(newMessage);
    renderMessages();
    
    try {
        // Send via WebSocket if available
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({
                type: 'send_message',
                conversation_id: currentConversation.id,
                content: content
            }));
        }
        
        // TODO: Also send via HTTP API as fallback
        // const response = await fetch(`${API_BASE_URL}/conversations/${currentConversation.id}/messages`, {
        //     method: 'POST',
        //     headers: getAuthHeaders(),
        //     body: JSON.stringify({ content })
        // });
        
        // Mark as sent
        newMessage.sending = false;
        
        // Update conversation last message
        currentConversation.last_message = {
            content: content,
            created_at: new Date().toISOString(),
            sender_id: currentUser.id
        };
        
        // Re-render conversations to update last message
        renderConversations();
        
    } catch (error) {
        console.error('Error sending message:', error);
        showMessage('Errore nell\'invio del messaggio', 'error');
        
        // Mark as failed
        newMessage.failed = true;
        renderMessages();
    }
}

function handleNewMessage(message) {
    if (currentConversation && message.conversation_id === currentConversation.id) {
        messages.push(message);
        renderMessages();
    }
    
    // Update conversations list
    const conversation = conversations.find(c => c.id === message.conversation_id);
    if (conversation) {
        conversation.last_message = message;
        if (message.sender_id !== currentUser.id) {
            conversation.unread_count = (conversation.unread_count || 0) + 1;
        }
        renderConversations();
    }
    
    // Show notification if not in current conversation
    if (!currentConversation || message.conversation_id !== currentConversation.id) {
        showMessage(`Nuovo messaggio da ${message.sender_username}`, 'info');
    }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
function initSearch() {
    const searchInput = document.getElementById('search-conversations');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterConversations(e.target.value);
        }, 300);
    });
}

function filterConversations(query) {
    if (!query.trim()) {
        renderConversations();
        return;
    }
    
    const filtered = conversations.filter(conversation =>
        conversation.user.username.toLowerCase().includes(query.toLowerCase()) ||
        conversation.last_message.content.toLowerCase().includes(query.toLowerCase())
    );
    
    const container = document.getElementById('conversations-list');
    container.innerHTML = '<div class="p-2"></div>';
    const conversationsContainer = container.querySelector('div');
    
    if (filtered.length === 0) {
        conversationsContainer.innerHTML = `
            <div class="text-center py-8">
                <div class="text-4xl mb-4">🔍</div>
                <p class="text-purple-300">Nessun risultato per "${query}"</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(conversation => {
        const conversationElement = createConversationElement(conversation);
        conversationsContainer.appendChild(conversationElement);
    });
}

// ============================================
// NEW MESSAGE MODAL
// ============================================
function openNewMessageModal() {
    const modalHTML = `
        <div id="new-message-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="fixed inset-0 bg-black/70 backdrop-blur-sm" onclick="closeNewMessageModal()"></div>
            <div class="relative bg-black/90 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 w-full max-w-md">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold">Nuovo Messaggio</h3>
                    <button onclick="closeNewMessageModal()" class="text-purple-300 hover:text-pink-400 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <form onsubmit="handleNewMessage(event)">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-purple-300 mb-2">
                            Cerca utente
                        </label>
                        <input 
                            type="text"
                            id="user-search"
                            placeholder="Inserisci username..."
                            class="w-full p-3 bg-purple-900/20 border border-purple-500/30 rounded-xl text-white placeholder-purple-300 focus:border-pink-500/50 outline-none transition-all"
                            required
                        />
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-purple-300 mb-2">
                            Messaggio
                        </label>
                        <textarea 
                            id="new-message-content"
                            placeholder="Scrivi il tuo messaggio..."
                            class="w-full h-24 p-3 bg-purple-900/20 border border-purple-500/30 rounded-xl text-white placeholder-purple-300 resize-none focus:border-pink-500/50 outline-none transition-all"
                            required
                        ></textarea>
                    </div>
                    
                    <div class="flex gap-3">
                        <button 
                            type="button"
                            onclick="closeNewMessageModal()"
                            class="flex-1 px-4 py-3 rounded-xl border border-purple-500/30 hover:border-pink-500/50 transition-all"
                        >
                            Annulla
                        </button>
                        <button 
                            type="submit"
                            class="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all font-semibold"
                        >
                            Invia
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Animate modal in
    const modal = document.getElementById('new-message-modal');
    gsap.fromTo(modal, 
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
    
    gsap.fromTo(modal.querySelector('.relative'), 
        { scale: 0.9, y: 20 },
        { scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
    );
    
    // Focus input
    setTimeout(() => document.getElementById('user-search').focus(), 100);
}

function closeNewMessageModal() {
    const modal = document.getElementById('new-message-modal');
    if (!modal) return;
    
    gsap.to(modal, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => modal.remove()
    });
}

function handleNewMessage(event) {
    event.preventDefault();
    
    const username = document.getElementById('user-search').value.trim();
    const content = document.getElementById('new-message-content').value.trim();
    
    if (!username || !content) return;
    
    // TODO: Implement actual new message creation
    showMessage('Funzionalità in sviluppo! 🚧', 'info');
    closeNewMessageModal();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function markConversationAsRead(conversationId) {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
        conversation.unread_count = 0;
        renderConversations();
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Ora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}g`;
    
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

function showConversationsLoading() {
    const container = document.getElementById('conversations-list');
    container.innerHTML = `
        <div class="p-4">
            <div class="text-center py-12">
                <div class="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p class="text-purple-300">Caricamento conversazioni...</p>
            </div>
        </div>
    `;
}

function showConversationsError(message) {
    const container = document.getElementById('conversations-list');
    container.innerHTML = `
        <div class="p-4">
            <div class="text-center py-12">
                <div class="text-4xl mb-4">⚠️</div>
                <h3 class="text-lg font-semibold mb-2">Errore</h3>
                <p class="text-purple-300 mb-6">${message}</p>
                <button onclick="loadConversations()" class="px-6 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all font-semibold">
                    Riprova
                </button>
            </div>
        </div>
    `;
}

// Utility function to show messages
function showMessage(text, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-6 right-6 z-50 px-6 py-3 rounded-xl backdrop-blur-sm border ${
        type === 'success' ? 'bg-green-900/80 border-green-500/50 text-green-100' :
        type === 'error' ? 'bg-red-900/80 border-red-500/50 text-red-100' :
        'bg-purple-900/80 border-purple-500/50 text-purple-100'
    }`;
    messageDiv.textContent = text;
    
    document.body.appendChild(messageDiv);
    
    // Animate in
    gsap.fromTo(messageDiv,
        { opacity: 0, x: 100 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
    );
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        gsap.to(messageDiv, {
            opacity: 0,
            x: 100,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => messageDiv.remove()
        });
    }, 3000);
}

// ============================================
// ANIMATIONS
// ============================================
function initAnimations() {
    // Animate main layout
    gsap.from('.w-1\\/3', {
        x: -100,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out'
    });
    
    gsap.from('.flex-1', {
        x: 100,
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: 'power3.out'
    });
}

// Initialize new message button
document.getElementById('new-message-btn').addEventListener('click', openNewMessageModal);
