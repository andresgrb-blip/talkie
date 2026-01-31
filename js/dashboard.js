// Dashboard JavaScript

// Get API base URL from auth.js
// API base URL - relative path since frontend is served by same server
const API_BASE_URL = '/api';

// Global state
let currentUser = null;
let posts = [];
let isLoading = false;
let isFirstStatsLoad = true; // Track first stats load for animation

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkDashboardAuth();
    
    // Initialize session properly
    initializeSession();
    
    // Backend integration - no more mocks needed
    
    // Load user data
    loadUserData();
    
    // Initialize components
    initSidebar();
    initAnimations();
    initInteractions();
    
    // Load posts
    loadPosts();
    
    console.log('📊 Dashboard initialized');
    
    // Force visibility of all elements
    forceElementsVisibility();
    
    // Debug: Show current posts in console
    debugShowCurrentPosts();
});

// Force visibility of all dashboard elements
function forceElementsVisibility() {
    setTimeout(() => {
        // Force visibility of stat cards
        document.querySelectorAll('.stat-card').forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0px)';
        });
        
        // Force visibility of post cards
        document.querySelectorAll('.post-card').forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0px)';
        });
        
        // Force visibility of widget cards
        document.querySelectorAll('.widget-card').forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateX(0px)';
        });
        
        console.log('✅ Forced visibility of all dashboard elements');
    }, 1000); // Wait 1 second after page load
}

// Debug function to show current posts
function debugShowCurrentPosts() {
    const allPosts = JSON.parse(localStorage.getItem('zone4love_posts') || '[]');
    const following = JSON.parse(localStorage.getItem('zone4love_following') || '[]');
    
    console.log('🔍 ============ DEBUG INFO ============');
    console.log(`📝 Total posts in localStorage: ${allPosts.length}`);
    console.log(`👥 Following users: ${following.join(', ')}`);
    console.log(`👤 Current user ID: ${currentUser?.id}`);
    
    // Filter user posts (handle both string and number IDs)
    const userId = parseInt(currentUser?.id);
    const userPosts = allPosts.filter(p => {
        const postUserId = parseInt(p.user_id || p.user?.id);
        return postUserId === userId;
    });
    
    console.log(`📝 YOUR POSTS: ${userPosts.length}`);
    console.log('📊 Post breakdown by user:');
    
    // Group posts by user
    const postsByUser = {};
    allPosts.forEach(post => {
        const postUserId = post.user_id || post.user?.id;
        const username = post.user?.username || `User ${postUserId}`;
        postsByUser[username] = (postsByUser[username] || 0) + 1;
    });
    
    Object.entries(postsByUser).forEach(([username, count]) => {
        console.log(`   - ${username}: ${count} posts`);
    });
    
    console.log('📋 Your posts list:');
    userPosts.forEach((post, i) => {
        console.log(`  ${i+1}. "${post.content.substring(0, 50)}..." (ID: ${post.id}, Likes: ${post.likes_count || 0})`);
    });
    
    console.log('🔍 ====================================');
    
    // Add debug buttons to header
    addDebugButtons();
}

function addDebugButtons() {
    const header = document.querySelector('header .flex.items-center.gap-4');
    if (header && !document.getElementById('debug-buttons')) {
        const debugContainer = document.createElement('div');
        debugContainer.id = 'debug-buttons';
        debugContainer.className = 'flex gap-2';
        debugContainer.innerHTML = `
            <button onclick="showAllPosts()" class="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 transition-all">
                Mostra Tutti i Post
            </button>
            <button onclick="clearAllData()" class="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-500 transition-all">
                Reset Dati
            </button>
            <button onclick="showBackendInstructions()" class="px-3 py-1 text-xs rounded bg-green-600 hover:bg-green-500 transition-all">
                🚀 Avvia Backend
            </button>
        `;
        header.insertBefore(debugContainer, header.firstChild);
    }
}

// Debug: Show all posts regardless of following
function showAllPosts() {
    const allPosts = JSON.parse(localStorage.getItem('zone4love_posts') || '[]');
    posts = allPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    console.log('🔍 DEBUG: Showing all posts without filters');
    console.log('📝 All posts:', allPosts.map(p => ({
        id: p.id,
        content: p.content.substring(0, 30) + '...',
        user_id: p.user_id,
        username: p.user.username
    })));
    
    renderPosts();
    showMessage(`📊 Showing all ${posts.length} posts`, 'info');
}

// Debug: Clear all data and restart
function clearAllData() {
    if (confirm('Sei sicuro di voler cancellare tutti i dati? Questa azione non può essere annullata.')) {
        localStorage.removeItem('zone4love_posts');
        localStorage.removeItem('zone4love_following');
        localStorage.removeItem('zone4love_demo_users');
        showMessage('🗑️ Tutti i dati cancellati. Ricarica la pagina.', 'info');
        setTimeout(() => location.reload(), 2000);
    }
}

// Show backend startup instructions
function showBackendInstructions() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-8 max-w-2xl mx-4 border border-purple-500/30">
            <div class="flex items-center gap-3 mb-6">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                </div>
                <h2 class="text-2xl font-bold text-white">Avvia Backend Rust</h2>
            </div>
            
            <div class="space-y-4 text-purple-100">
                <p class="text-lg">Per utilizzare tutte le funzionalità, avvia il server backend:</p>
                
                <div class="bg-black/30 rounded-lg p-4 font-mono text-sm">
                    <div class="text-green-400 mb-2"># Opzione 1: Script automatico</div>
                    <div class="text-white">./start_backend.bat</div>
                    
                    <div class="text-green-400 mb-2 mt-4"># Opzione 2: Manuale</div>
                    <div class="text-white">cd backend</div>
                    <div class="text-white">cargo run</div>
                </div>
                
                <div class="bg-blue-900/30 rounded-lg p-4">
                    <h3 class="font-semibold text-blue-300 mb-2">🌟 Con Backend Attivo:</h3>
                    <ul class="space-y-1 text-sm">
                        <li>✅ Post salvati nel database</li>
                        <li>✅ Upload immagini reali</li>
                        <li>✅ Multi-utente supportato</li>
                        <li>✅ Real-time updates</li>
                    </ul>
                </div>
                
                <div class="bg-yellow-900/30 rounded-lg p-4">
                    <h3 class="font-semibold text-yellow-300 mb-2">⚠️ Senza Backend:</h3>
                    <ul class="space-y-1 text-sm">
                        <li>📱 Modalità offline attiva</li>
                        <li>💾 Dati salvati in localStorage</li>
                        <li>🖼️ Immagini in base64</li>
                        <li>👤 Utente singolo</li>
                    </ul>
                </div>
            </div>
            
            <div class="flex gap-3 mt-6">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        class="flex-1 px-4 py-3 rounded-xl border border-purple-500/30 hover:border-pink-500/50 transition-all text-white">
                    Ho Capito
                </button>
                <button onclick="checkBackendStatus(); this.parentElement.parentElement.parentElement.remove()" 
                        class="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 transition-all text-white font-semibold">
                    🔄 Verifica Backend
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate in
    gsap.fromTo(modal, 
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
    
    gsap.fromTo(modal.querySelector('div'), 
        { scale: 0.9, y: 20 },
        { scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)', delay: 0.1 }
    );
}

// Check if backend is running
async function checkBackendStatus() {
    try {
        showMessage('🔄 Verificando backend...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            timeout: 5000
        });
        
        if (response.ok) {
            showMessage('✅ Backend attivo! Ricarico i post...', 'success');
            setTimeout(() => {
                loadPosts();
            }, 1000);
        } else {
            showMessage('❌ Backend non risponde', 'error');
        }
    } catch (error) {
        showMessage('❌ Backend offline - Usa ./start_backend.bat', 'error');
    }
}

function initializeSession() {
    const sessionData = localStorage.getItem('zone4love_session') || sessionStorage.getItem('zone4love_session');
    
    if (sessionData && !sessionData.startsWith('{')) {
        // È solo un token, creiamo una sessione base (user data verrà caricato da API)
        const mockSession = {
            access_token: sessionData,
            user: null // Will be loaded from API
        };
        
        localStorage.setItem('zone4love_session', JSON.stringify(mockSession));
        currentUser = null; // Will be loaded by loadUserData()
    }
}

// ============================================
// AUTHENTICATION CHECK
// ============================================
function checkDashboardAuth() {
    const session = localStorage.getItem('zone4love_session') || sessionStorage.getItem('zone4love_session');
    
    // In production, validate token with backend
    if (!session) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
    }
}

// ============================================
// LOAD USER DATA
// ============================================
async function loadUserData() {
    try {
        const session = getSession();
        if (!session) return;
        
        // Try to load user from backend
        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    currentUser = result.data;
                    
                    // Update session with real user data
                    const updatedSession = {
                        ...session,
                        user: currentUser
                    };
                    localStorage.setItem('zone4love_session', JSON.stringify(updatedSession));
                    
                    console.log('✅ User data loaded:', currentUser);
                }
            } else {
                console.warn('⚠️ Could not load user from backend, using session data');
                currentUser = session.user;
            }
        } catch (backendError) {
            console.warn('⚠️ Backend not available, using session data:', backendError);
            currentUser = session.user;
        }
        
        // Update user profile in sidebar
        updateUserProfile(currentUser);
        
        // Update welcome message
        updateWelcomeMessage(currentUser);
        
        // Load stats
        loadUserStats();
        
        // Load sidebar widgets
        loadSuggestions();
        loadTrendingUsers();
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function getSession() {
    const sessionData = localStorage.getItem('zone4love_session') || sessionStorage.getItem('zone4love_session');
    if (!sessionData) return null;
    
    try {
        // Se è già un oggetto JSON, restituiscilo
        const parsed = JSON.parse(sessionData);
        return parsed;
    } catch (error) {
        // Se non è JSON valido, potrebbe essere solo il token
        // Creiamo un oggetto session con il token
        return {
            access_token: sessionData,
            user: currentUser // Will be loaded from API
        };
    }
}

function getAuthHeaders() {
    const session = getSession();
    return session ? {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
    } : {};
}

// ============================================
// LOAD USER STATS
// ============================================
async function loadUserStats() {
    if (!currentUser) {
        console.warn('⚠️ No user loaded, cannot load stats');
        return;
    }
    
    try {
        const session = getSession();
        if (!session) {
            console.error('❌ No session for stats');
            return;
        }
        
        console.log('📡 Loading user stats from backend...');
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Stats response: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Stats fetch failed: ${response.status} - ${errorText}`);
            throw new Error(`Stats fetch failed: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            console.log('✅ Stats loaded from backend (DB COUNT):', result.data);
            console.log(`   📝 Posts in DB: ${result.data.posts_count}`);
            updateStatsDisplay(result.data);
        } else {
            console.error('❌ Invalid stats response:', result);
            throw new Error('Invalid stats response');
        }
        
    } catch (error) {
        console.error('❌ CRITICAL: Cannot load stats from backend:', error);
        console.error('   Widget will show 0 or incorrect count!');
        console.error('   Make sure backend is running!');
        
        // Show error to user
        showMessage('⚠️ Impossibile caricare statistiche. Verifica che il backend sia attivo.', 'error');
    }
}

function calculateStatsFromPosts() {
    if (!currentUser) {
        console.warn('⚠️ No currentUser for stats calculation');
        return;
    }
    
    console.warn('⚠️ Calculating stats from loaded posts (may be inaccurate due to pagination)');
    console.log('📊 Calculating stats for user:', currentUser.id, currentUser.username);
    console.log('📊 Total posts loaded in memory:', posts.length);
    
    // Calculate stats from current posts data
    // Compare both as numbers to handle string/number mismatch
    const userId = parseInt(currentUser.id);
    const userPosts = posts.filter(p => {
        const postUserId = parseInt(p.user_id || p.user?.id);
        return postUserId === userId;
    });
    
    console.log('📊 User posts found in memory:', userPosts.length);
    console.warn('⚠️ Note: This count may not match database if you have more posts than loaded');
    
    // ✅ FIX: Calculate likes/comments only from USER's posts, not all posts
    const totalLikes = userPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
    const totalComments = userPosts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
    
    const stats = {
        followers_count: currentUser?.followers_count || 0,
        following_count: currentUser?.following_count || 0,
        posts_count: userPosts.length,
        total_likes: totalLikes,
        total_comments: totalComments
    };
    
    console.log('📊 Stats breakdown:');
    console.log(`   - User posts in memory: ${userPosts.length}`);
    console.log(`   - Total likes on user posts: ${totalLikes}`);
    console.log(`   - Total comments on user posts: ${totalComments}`);
    
    console.log('📊 Calculated stats:', stats);
    updateStatsDisplay(stats);
}

// ============================================
// VERIFY POST COUNT IN DATABASE
// ============================================
async function verifyPostCountInDatabase() {
    try {
        console.log('🔍 Verifying post count in database...');
        
        // Fetch all posts from backend to compare
        const response = await fetch(`${API_BASE_URL}/posts`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            console.log('⚠️ Backend not available for verification');
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const dbPosts = result.data;
            const userId = parseInt(currentUser.id);
            const dbUserPosts = dbPosts.filter(p => {
                const postUserId = parseInt(p.user_id || p.user?.id);
                return postUserId === userId;
            });
            
            console.log('🔍 DATABASE VERIFICATION:');
            console.log(`   - Total posts in DB: ${dbPosts.length}`);
            console.log(`   - Your posts in DB: ${dbUserPosts.length}`);
            console.log(`   - Posts in memory: ${posts.length}`);
            
            const memoryUserPosts = posts.filter(p => {
                const postUserId = parseInt(p.user_id || p.user?.id);
                return postUserId === userId;
            });
            console.log(`   - Your posts in memory: ${memoryUserPosts.length}`);
            
            if (dbUserPosts.length !== memoryUserPosts.length) {
                console.warn(`⚠️ MISMATCH: DB has ${dbUserPosts.length} but memory has ${memoryUserPosts.length}`);
            } else {
                console.log('✅ Post count matches between DB and memory');
            }
        }
    } catch (error) {
        console.log('⚠️ Could not verify database post count (backend offline)');
    }
}

function updateStatsDisplay(stats) {
    // Format number helper
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };
    
    // Update followers
    const followersEl = document.getElementById('stat-followers');
    const followersChangeEl = document.getElementById('stat-followers-change');
    if (followersEl) {
        followersEl.textContent = formatNumber(stats.followers_count || 0);
        if (followersChangeEl) {
            followersChangeEl.textContent = stats.followers_count > 0 ? 'Grazie per il supporto! 💜' : 'Inizia a seguire altri utenti';
        }
    }
    
    // Update posts
    const postsEl = document.getElementById('stat-posts');
    const postsChangeEl = document.getElementById('stat-posts-change');
    if (postsEl) {
        postsEl.textContent = formatNumber(stats.posts_count || 0);
        if (postsChangeEl) {
            postsChangeEl.textContent = stats.posts_count > 0 ? `${stats.posts_count} ${stats.posts_count === 1 ? 'post pubblicato' : 'post pubblicati'}` : 'Crea il tuo primo post!';
        }
    }
    
    // Update interactions (likes + comments)
    const interactionsEl = document.getElementById('stat-interactions');
    const interactionsChangeEl = document.getElementById('stat-interactions-change');
    if (interactionsEl) {
        const totalInteractions = (stats.total_likes || 0) + (stats.total_comments || 0);
        interactionsEl.textContent = formatNumber(totalInteractions);
        if (interactionsChangeEl) {
            interactionsChangeEl.textContent = `${formatNumber(stats.total_likes || 0)} ❤️ • ${formatNumber(stats.total_comments || 0)} 💬`;
        }
    }
    
    // Update following
    const followingEl = document.getElementById('stat-following');
    const followingChangeEl = document.getElementById('stat-following-change');
    if (followingEl) {
        followingEl.textContent = formatNumber(stats.following_count || 0);
        if (followingChangeEl) {
            followingChangeEl.textContent = stats.following_count > 0 ? `Segui ${stats.following_count} ${stats.following_count === 1 ? 'persona' : 'persone'}` : 'Esplora nuovi utenti';
        }
    }
    
    // ✅ FIX: Animate only on first load, then just ensure visibility
    if (isFirstStatsLoad) {
        // First load: animate cards in
        gsap.from('.stat-card', {
            scale: 0.95,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'back.out(1.7)',
            onComplete: () => {
                // Ensure all cards are fully visible after animation
                gsap.set('.stat-card', { opacity: 1, scale: 1 });
            }
        });
        isFirstStatsLoad = false;
    } else {
        // Subsequent updates: just ensure all cards are visible (no animation)
        gsap.set('.stat-card', { opacity: 1, scale: 1 });
    }
    
    console.log('📊 Stats display updated:', stats);
}

// ============================================
// UPDATE INTERACTIONS WIDGET ONLY
// ============================================
async function updateInteractionsWidget() {
    if (!currentUser) {
        console.warn('⚠️ No user for interactions update');
        return;
    }
    
    try {
        const session = getSession();
        if (!session) return;
        
        console.log('📡 Fetching fresh stats for interactions widget...');
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Stats fetch failed: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            console.log('✅ Interactions updated from DB:', {
                likes: result.data.total_likes,
                comments: result.data.total_comments,
                total: result.data.total_likes + result.data.total_comments
            });
            
            // Format number helper
            const formatNumber = (num) => {
                if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
                return num.toString();
            };
            
            // Update only interactions widget
            const interactionsEl = document.getElementById('stat-interactions');
            const interactionsChangeEl = document.getElementById('stat-interactions-change');
            
            if (interactionsEl) {
                const totalInteractions = (result.data.total_likes || 0) + (result.data.total_comments || 0);
                interactionsEl.textContent = formatNumber(totalInteractions);
                
                if (interactionsChangeEl) {
                    interactionsChangeEl.textContent = `${formatNumber(result.data.total_likes || 0)} ❤️ • ${formatNumber(result.data.total_comments || 0)} 💬`;
                }
                
                // Animate the interactions card with pulse
                const interactionsCard = document.querySelector('.stat-card:nth-child(3)');
                if (interactionsCard) {
                    gsap.fromTo(interactionsCard,
                        { scale: 1 },
                        { 
                            scale: 1.05,
                            duration: 0.15,
                            ease: 'power2.out',
                            yoyo: true,
                            repeat: 1
                        }
                    );
                }
            }
        }
        
    } catch (error) {
        console.error('⚠️ Could not update interactions widget:', error);
        // Non mostrare errore all'utente, è un aggiornamento secondario
    }
}

// ============================================
// UPDATE STATS AFTER POST CREATION
// ============================================
async function updateStatsAfterPostCreation() {
    console.log('🔄 Updating stats after post creation...');
    
    if (!currentUser) {
        console.error('❌ No currentUser available');
        return;
    }
    
    // ✅ ALWAYS fetch from backend - DO NOT use fallback for stats
    try {
        const session = getSession();
        if (!session) {
            console.error('❌ No session available for stats fetch');
            return;
        }
        
        console.log('📡 Fetching fresh stats from backend...');
        console.log(`   URL: ${API_BASE_URL}/users/${currentUser.id}/stats`);
        
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Stats response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Stats fetch failed: ${response.status} - ${errorText}`);
            throw new Error(`Stats fetch failed: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📦 Stats response data:', result);
        
        if (result.success && result.data) {
            console.log('✅ Stats loaded from backend (REAL COUNT FROM DB):', result.data);
            console.log(`   📝 Posts count from DB: ${result.data.posts_count}`);
            console.log(`   ❤️ Total likes: ${result.data.total_likes}`);
            console.log(`   💬 Total comments: ${result.data.total_comments}`);
            
            updateStatsDisplay(result.data);
            
            // Animate the posts counter specifically with pulse
            const postsCard = document.querySelector('.stat-card:nth-child(2)');
            if (postsCard) {
                gsap.fromTo(postsCard,
                    { scale: 1 },
                    { 
                        scale: 1.08,
                        duration: 0.2,
                        ease: 'power2.out',
                        yoyo: true,
                        repeat: 1
                    }
                );
            }
            
            console.log('✅ Stats updated successfully from backend');
        } else {
            console.error('❌ Invalid stats response format:', result);
            throw new Error('Invalid stats response');
        }
        
    } catch (backendError) {
        console.error('❌ CRITICAL: Backend stats fetch failed:', backendError);
        console.error('   This means the widget will show incorrect count!');
        console.error('   Make sure backend is running: cargo run --bin zone4love-backend');
        
        // Show error to user
        showMessage('⚠️ Impossibile aggiornare le statistiche. Ricarica la pagina.', 'warning');
    }
}

function updateUserProfile(user) {
    // Update avatar (first letter of username)
    const avatarElements = document.querySelectorAll('.w-10.h-10.rounded-full');
    avatarElements.forEach(el => {
        if (el.classList.contains('bg-gradient-to-br')) {
            el.textContent = user.username.charAt(0).toUpperCase();
        }
    });
    
    // Update username in sidebar
    const usernameElement = document.querySelector('.text-sm.font-semibold.truncate');
    if (usernameElement) {
        usernameElement.textContent = user.username;
    }
    
    // Update email in sidebar
    const emailElement = document.querySelector('.text-xs.text-purple-300.truncate');
    if (emailElement) {
        emailElement.textContent = user.email;
    }
}

function updateWelcomeMessage(user) {
    const welcomeElement = document.querySelector('header h2');
    if (welcomeElement) {
        welcomeElement.textContent = `Benvenuto, ${user.username}! 🚀`;
    }
}

// ============================================
// POSTS MANAGEMENT
// ============================================
async function loadPosts() {
    if (isLoading) return;
    
    isLoading = true;
    showLoadingState();
    
    try {
        console.log('📡 Loading posts from backend API...');
        
        // Request more posts to avoid pagination issues (100 posts)
        const response = await fetch(`${API_BASE_URL}/posts?per_page=100`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            posts = result.data;
            console.log(`📊 Loaded ${posts.length} posts from backend`);
            renderPosts();
            
            // ✅ Load stats from backend API instead of calculating from posts array
            // This ensures accurate count even with pagination
            loadUserStats();
            
            // Set up real-time updates
            setupRealTimeUpdates();
        } else {
            throw new Error(result.message || 'Failed to load posts');
        }
        
    } catch (error) {
        console.error('Error loading posts:', error);
        console.log('🔧 Backend not available, loading from localStorage');
        
        // Fallback: Load from localStorage
        const savedPosts = JSON.parse(localStorage.getItem('zone4love_posts') || '[]');
        if (savedPosts.length > 0) {
            posts = savedPosts;
            renderPosts();
            calculateStatsFromPosts();
            showMessage('⚠️ Backend offline - Caricati post locali', 'warning');
        } else {
            // Create some demo posts if nothing exists
            const demoPosts = createDemoPosts();
            posts = demoPosts;
            localStorage.setItem('zone4love_posts', JSON.stringify(demoPosts));
            renderPosts();
            calculateStatsFromPosts();
            showMessage('⚠️ Backend offline - Post demo caricati', 'info');
        }
    } finally {
        isLoading = false;
        hideLoadingState();
    }
}

function createDemoPosts() {
    // Only create demo posts if we have a real user
    if (!currentUser) {
        console.log('⚠️ No user loaded yet, skipping demo posts');
        return [];
    }
    
    const demoUser = currentUser;
    
    return [
        {
            id: 999,
            content: "Benvenuto su Zone4Love! 🌌 Il social network della galassia dove ogni stella ha una storia da raccontare. Condividi i tuoi pensieri cosmici e connettiti con altri esploratori spaziali! ✨🚀",
            media: null,
            image_url: null,
            user: { id: 999, username: 'Zone4Love', email: 'admin@zone4love.com' },
            user_id: 999,
            created_at: new Date().toISOString(),
            likes_count: 0,
            comments_count: 0,
            is_liked: false
        },
        {
            id: 998,
            content: "Che vista incredibile dalla stazione spaziale! Le stelle non sono mai state così vicine 🚀⭐",
            media: [
                {
                    url: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=600&fit=crop",
                    type: "image",
                    name: "space-station.jpg"
                }
            ],
            image_url: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=600&fit=crop", // Legacy compatibility
            user: { id: 2, username: 'SpaceExplorer', email: 'explorer@space.com' },
            user_id: 2,
            created_at: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
            likes_count: 12,
            comments_count: 3,
            is_liked: false
        }
    ];
}

// Real-time updates every 10 seconds
function setupRealTimeUpdates() {
    setInterval(async () => {
        try {
            console.log('🔄 Checking for new posts...');
            
            const response = await fetch(`${API_BASE_URL}/posts`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) return; // Silently fail if backend is down
            
            const result = await response.json();
            
            if (result.success && result.data.length > posts.length) {
                const newPostsCount = result.data.length - posts.length;
                posts = result.data;
                renderPosts();
                
                showMessage(`🚀 ${newPostsCount} nuovi post nel feed!`, 'success');
                
                // Animate new posts
                setTimeout(() => {
                    const newPostElements = document.querySelectorAll('.post-card');
                    for (let i = 0; i < newPostsCount; i++) {
                        if (newPostElements[i]) {
                            gsap.fromTo(newPostElements[i],
                                { scale: 0.95, opacity: 0, y: -20 },
                                { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
                            );
                        }
                    }
                }, 100);
            }
        } catch (error) {
            // Silently fail - backend might be down
            console.log('Real-time update failed (backend down?)');
        }
    }, 10000); // Check every 10 seconds
}

// Simulate activity from other users
function startActivitySimulation() {
    const demoUsers = JSON.parse(localStorage.getItem('zone4love_demo_users') || '[]');
    const following = JSON.parse(localStorage.getItem('zone4love_following') || '[]');
    
    if (demoUsers.length === 0) return;
    
    // Simulate new posts every 30-60 seconds
    const postInterval = setInterval(() => {
        // Only create posts from users we follow
        const followedUsers = demoUsers.filter(user => following.includes(user.id));
        if (followedUsers.length === 0) return;
        
        // Random chance to create a post (30% chance every interval)
        if (Math.random() < 0.3) {
            const randomUser = followedUsers[Math.floor(Math.random() * followedUsers.length)];
            createRandomPost(randomUser);
        }
    }, Math.random() * 30000 + 30000); // 30-60 seconds
    
    // Simulate likes on existing posts every 10-20 seconds
    const likeInterval = setInterval(() => {
        const allPosts = JSON.parse(localStorage.getItem('zone4love_posts') || '[]');
        const userPosts = allPosts.filter(post => post.user_id === currentUser.id);
        
        if (userPosts.length > 0 && Math.random() < 0.4) {
            const randomPost = userPosts[Math.floor(Math.random() * userPosts.length)];
            simulateLikeOnPost(randomPost.id);
        }
    }, Math.random() * 10000 + 10000); // 10-20 seconds
}

function createRandomPost(user) {
    const randomContents = [
        "Appena avvistata una supernova! Che spettacolo incredibile 🌟💫",
        "La Via Lattea stasera è particolarmente brillante ✨🌌",
        "Sto studiando i buchi neri... la fisica è affascinante! 🕳️⚫",
        "Nuove foto dal telescopio Hubble, semplicemente mozzafiato 📸🔭",
        "Chi altro ama osservare le stelle di notte? 🌙⭐",
        "La scienza spaziale mi emoziona sempre! 🚀👨‍🚀",
        "Oggi ho imparato qualcosa di nuovo sui pianeti extrasolari 🪐🌍",
        "L'universo è così vasto e misterioso... 🌌🤔"
    ];
    
    const randomImages = [
        "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=600&fit=crop",
        null, null, null // More chance for text-only posts
    ];
    
    const newPost = {
        id: Date.now() + Math.random() * 1000,
        content: randomContents[Math.floor(Math.random() * randomContents.length)],
        image_url: randomImages[Math.floor(Math.random() * randomImages.length)],
        user: user,
        user_id: user.id,
        created_at: new Date().toISOString(),
        likes_count: Math.floor(Math.random() * 5), // 0-4 initial likes
        comments_count: Math.floor(Math.random() * 3), // 0-2 initial comments
        is_liked: false
    };
    
    // Add to localStorage
    const allPosts = JSON.parse(localStorage.getItem('zone4love_posts') || '[]');
    allPosts.unshift(newPost);
    localStorage.setItem('zone4love_posts', JSON.stringify(allPosts));
    
    console.log(`📝 ${user.username} created a new post!`);
}

function simulateLikeOnPost(postId) {
    const allPosts = JSON.parse(localStorage.getItem('zone4love_posts') || '[]');
    const postIndex = allPosts.findIndex(p => p.id == postId);
    
    if (postIndex !== -1) {
        allPosts[postIndex].likes_count++;
        localStorage.setItem('zone4love_posts', JSON.stringify(allPosts));
        
        // Show notification
        showMessage(`❤️ Qualcuno ha messo like al tuo post!`, 'success');
        console.log(`❤️ Someone liked post ${postId}`);
    }
}

function initializeWelcomePost() {
    const allPosts = JSON.parse(localStorage.getItem('zone4love_posts') || '[]');
    
    // Check if welcome post already exists
    const hasWelcomePost = allPosts.some(post => post.user_id === 999);
    
    if (!hasWelcomePost) {
        const welcomePost = {
            id: 999,
            content: "Benvenuto su Zone4Love! 🌌 Il social network della galassia dove ogni stella ha una storia da raccontare. Condividi i tuoi pensieri cosmici e connettiti con altri esploratori spaziali! ✨🚀",
            image_url: null,
            user: { id: 999, username: 'Zone4Love', email: 'admin@zone4love.com' },
            user_id: 999,
            created_at: new Date().toISOString(),
            likes_count: 0,
            comments_count: 0,
            is_liked: false
        };
        
        allPosts.unshift(welcomePost);
        localStorage.setItem('zone4love_posts', JSON.stringify(allPosts));
        console.log('🌟 Welcome post initialized');
    }
    
    // Initialize demo users for testing
    initializeDemoUsers();
}

function initializeDemoUsers() {
    const demoUsers = [
        { id: 2, username: 'SpaceExplorer', email: 'explorer@space.com' },
        { id: 3, username: 'CosmicWanderer', email: 'cosmic@universe.com' },
        { id: 4, username: 'GalaxyDreamer', email: 'dreamer@galaxy.com' },
        { id: 5, username: 'StarNavigator', email: 'navigator@stars.com' }
    ];
    
    // Save demo users
    localStorage.setItem('zone4love_demo_users', JSON.stringify(demoUsers));
    
    // Auto-follow some demo users for testing
    const following = JSON.parse(localStorage.getItem('zone4love_following') || '[]');
    if (following.length === 0) {
        // Follow first two demo users
        const autoFollow = [2, 3];
        localStorage.setItem('zone4love_following', JSON.stringify(autoFollow));
        console.log('👥 Auto-followed demo users for testing');
    }
}

// Function to simulate posts from other users (for testing)
function simulateOtherUserPosts() {
    const demoUsers = JSON.parse(localStorage.getItem('zone4love_demo_users') || '[]');
    const allPosts = JSON.parse(localStorage.getItem('zone4love_posts') || '[]');
    
    // Check if we already have demo posts
    const hasDemoPosts = allPosts.some(post => [2, 3, 4, 5].includes(post.user_id));
    
    if (!hasDemoPosts && demoUsers.length > 0) {
        const demoPosts = [
            {
                id: Date.now() + 1,
                content: "Che vista incredibile dalla stazione spaziale! Le stelle non sono mai state così vicine 🚀⭐",
                image_url: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=600&fit=crop",
                user: demoUsers[0],
                user_id: 2,
                created_at: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
                likes_count: 12,
                comments_count: 3,
                is_liked: false
            },
            {
                id: Date.now() + 2,
                content: "Oggi ho scoperto una nuova galassia nel mio telescopio! La scienza è magica 🔭✨ #astronomy #space",
                image_url: null,
                user: demoUsers[1],
                user_id: 3,
                created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                likes_count: 8,
                comments_count: 2,
                is_liked: false
            }
        ];
        
        // Add demo posts
        demoPosts.forEach(post => allPosts.push(post));
        localStorage.setItem('zone4love_posts', JSON.stringify(allPosts));
        console.log('🎭 Demo posts from other users created');
    }
}

function renderPosts() {
    // Try multiple selectors to find the feed container
    let feedContainer = document.querySelector('.lg\\:col-span-2 .space-y-6');
    
    if (!feedContainer) {
        feedContainer = document.querySelector('.space-y-6');
        console.log('📍 Using fallback selector: .space-y-6');
    }
    
    if (!feedContainer) {
        // Create a temporary container for debugging
        const mainContent = document.querySelector('main');
        if (mainContent) {
            feedContainer = document.createElement('div');
            feedContainer.className = 'space-y-6 p-6';
            feedContainer.innerHTML = '<h3 class="text-xl font-semibold mb-6">Feed Post</h3>';
            mainContent.appendChild(feedContainer);
            console.log('📍 Created temporary feed container');
        }
    }
    
    if (!feedContainer) {
        console.error('❌ Feed container not found! Available containers:');
        document.querySelectorAll('div').forEach((div, i) => {
            if (div.className.includes('space') || div.className.includes('col-span')) {
                console.log(`  ${i}: ${div.className}`);
            }
        });
        return;
    }
    
    console.log(`🎨 Rendering ${posts.length} posts`);
    
    // Clear existing posts (keep the title)
    const title = feedContainer.querySelector('h3');
    feedContainer.innerHTML = '';
    if (title) feedContainer.appendChild(title);
    
    if (posts.length === 0) {
        feedContainer.innerHTML += `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">🌌</div>
                <h3 class="text-xl font-semibold mb-2">Nessun post ancora</h3>
                <p class="text-purple-300 mb-6">Inizia a seguire qualcuno o crea il tuo primo post!</p>
                <button onclick="openNewPostModal()" class="px-6 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all font-semibold">
                    Crea il tuo primo post
                </button>
            </div>
        `;
        return;
    }
    
    posts.forEach((post, index) => {
        console.log(`📝 Rendering post ${index + 1}: "${post.content.substring(0, 30)}..." by ${post.user.username} (ID: ${post.id})`);
        if (post.image_url) {
            console.log(`🖼️ Post has image: ${post.image_url.substring(0, 50)}...`);
        }
        const postElement = createPostElement(post);
        feedContainer.appendChild(postElement);
    });
    
    // Add load more button
    const loadMoreButton = document.createElement('div');
    loadMoreButton.className = 'text-center py-8';
    loadMoreButton.innerHTML = `
        <button onclick="loadMorePosts()" class="px-8 py-3 rounded-full border border-purple-500/30 hover:border-pink-500/50 transition-all">
            Carica altri post
        </button>
    `;
    feedContainer.appendChild(loadMoreButton);
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-card';
    postDiv.dataset.postId = post.id;
    
    const createdAt = new Date(post.created_at).toLocaleString('it-IT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    postDiv.innerHTML = `
        <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                ${post.user.username.charAt(0).toUpperCase()}
            </div>
            <div class="flex-1">
                <h4 class="font-semibold">${post.user.username}</h4>
                <p class="text-sm text-purple-300">${createdAt}</p>
            </div>
            <button class="text-purple-300 hover:text-pink-400" onclick="showPostOptions(${post.id})">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                </svg>
            </button>
        </div>
        <p class="text-purple-100 mb-4">${post.content}</p>
        ${(post.media && post.media.length > 0) || post.image_url ? `
            <div class="mb-4">
                ${createMediaGallery(post)}
            </div>
        ` : ''}
        <div class="flex items-center gap-6 text-sm">
            <button class="flex items-center gap-2 text-purple-300 hover:text-pink-400 transition-colors ${post.is_liked ? 'text-pink-500' : ''}" 
                    onclick="toggleLike(${post.id})" data-liked="${post.is_liked}">
                <svg class="w-5 h-5" fill="${post.is_liked ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
                <span>${post.likes_count}</span>
            </button>
            <button class="flex items-center gap-2 text-purple-300 hover:text-pink-400 transition-colors" onclick="showComments(${post.id})">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <span>${post.comments_count}</span>
            </button>
            <button class="flex items-center gap-2 text-purple-300 hover:text-pink-400 transition-colors" onclick="sharePost(${post.id})">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
            </button>
        </div>
    `;
    
    return postDiv;
}

function createMediaGallery(post) {
    // Handle legacy single image
    if (post.image_url && (!post.media || post.media.length === 0)) {
        return `
            <div class="h-64 bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity" onclick="openImageModal('${post.image_url}')">
                <img src="${post.image_url}" 
                     alt="Post image" 
                     class="max-h-full max-w-full rounded-xl object-cover" 
                     onerror="this.parentElement.innerHTML='<div class=\\'text-purple-300 text-center\\'>📷<br>Immagine non disponibile</div>'"
                />
                <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                    <div class="bg-white/20 backdrop-blur-sm rounded-full p-3">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                        </svg>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Handle multiple media
    if (!post.media || post.media.length === 0) return '';
    
    const mediaCount = post.media.length;
    
    if (mediaCount === 1) {
        const media = post.media[0];
        return createSingleMediaElement(media, 0, post.id);
    } else if (mediaCount === 2) {
        return `
            <div class="grid grid-cols-2 gap-2 h-64">
                ${post.media.map((media, index) => createSingleMediaElement(media, index, post.id)).join('')}
            </div>
        `;
    } else if (mediaCount === 3) {
        return `
            <div class="grid grid-cols-2 gap-2 h-64">
                <div class="row-span-2">
                    ${createSingleMediaElement(post.media[0], 0, post.id)}
                </div>
                <div class="grid grid-rows-2 gap-2">
                    ${createSingleMediaElement(post.media[1], 1, post.id)}
                    ${createSingleMediaElement(post.media[2], 2, post.id)}
                </div>
            </div>
        `;
    } else {
        return `
            <div class="grid grid-cols-2 gap-2 h-64">
                ${post.media.slice(0, 3).map((media, index) => createSingleMediaElement(media, index, post.id)).join('')}
                <div class="relative bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity" onclick="openMediaGallery(${post.id})">
                    ${createSingleMediaElement(post.media[3], 3, post.id, true)}
                    <div class="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                        <span class="text-white text-xl font-bold">+${mediaCount - 3}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

function createSingleMediaElement(media, index, postId, isOverlay = false) {
    const baseClass = "w-full h-full object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity";
    
    if (media.type === 'image') {
        return `
            <div class="relative bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl overflow-hidden" onclick="openImageModal('${media.url}')">
                <img src="${media.url}" 
                     alt="Post image ${index + 1}" 
                     class="${baseClass}" 
                     onerror="this.parentElement.innerHTML='<div class=\\'text-purple-300 text-center h-full flex items-center justify-center\\'>📷<br>Immagine non disponibile</div>'"
                />
                ${!isOverlay ? `
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                        <div class="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                            </svg>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    } else if (media.type === 'video') {
        return `
            <div class="relative bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl overflow-hidden" onclick="openVideoModal('${media.url}')">
                <video src="${media.url}" 
                       class="${baseClass}" 
                       muted
                       preload="metadata"
                       onerror="this.parentElement.innerHTML='<div class=\\'text-purple-300 text-center h-full flex items-center justify-center\\'>🎥<br>Video non disponibile</div>'"
                ></video>
                ${!isOverlay ? `
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                        <div class="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </div>
                    </div>
                ` : ''}
                <div class="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">🎥</div>
            </div>
        `;
    }
    
    return '';
}

async function toggleLike(postId) {
    try {
        const post = posts.find(p => p.id == postId);
        if (!post) return;
        
        const endpoint = post.is_liked ? 'unlike' : 'like';
        const method = post.is_liked ? 'DELETE' : 'POST';
        const wasLiked = post.is_liked;
        
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/${endpoint}`, {
            method: method,
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Update local state
        post.is_liked = !post.is_liked;
        post.likes_count += post.is_liked ? 1 : -1;
        
        // Update UI
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        const likeButton = postElement.querySelector('button[onclick*="toggleLike"]');
        const likeCount = likeButton.querySelector('span');
        const likeSvg = likeButton.querySelector('svg');
        
        likeCount.textContent = post.likes_count;
        likeButton.dataset.liked = post.is_liked;
        
        if (post.is_liked) {
            likeButton.classList.add('text-pink-500');
            likeButton.classList.remove('text-purple-300');
            likeSvg.setAttribute('fill', 'currentColor');
            showMessage('❤️ Ti piace!', 'success');
            
            // Animate
            gsap.fromTo(likeSvg, 
                { scale: 1 },
                { scale: 1.3, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' }
            );
        } else {
            likeButton.classList.remove('text-pink-500');
            likeButton.classList.add('text-purple-300');
            likeSvg.setAttribute('fill', 'none');
        }
        
        // ✅ Update interactions widget in real-time (only if it's user's own post)
        if (post.user_id === currentUser?.id || post.user?.id === currentUser?.id) {
            console.log('🔄 Updating stats after like interaction on own post...');
            await updateInteractionsWidget();
        }
        
    } catch (error) {
        console.error('Error toggling like:', error);
        showMessage('Errore nel like del post', 'error');
    }
}

function showLoadingState() {
    const feedContainer = document.querySelector('.lg\\:col-span-2 .space-y-6');
    if (!feedContainer) return;
    
    feedContainer.innerHTML = `
        <h3 class="text-xl font-bold mb-4">Feed Galattico</h3>
        <div class="text-center py-12">
            <div class="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p class="text-purple-300">Caricamento post...</p>
        </div>
    `;
}

function hideLoadingState() {
    // Loading state is replaced by renderPosts()
}

function showErrorState(message) {
    const feedContainer = document.querySelector('.lg\\:col-span-2 .space-y-6');
    if (!feedContainer) return;
    
    feedContainer.innerHTML = `
        <h3 class="text-xl font-bold mb-4">Feed Galattico</h3>
        <div class="text-center py-12">
            <div class="text-6xl mb-4">⚠️</div>
            <h3 class="text-xl font-semibold mb-2">Oops!</h3>
            <p class="text-purple-300 mb-6">${message}</p>
            <button onclick="loadPosts()" class="px-6 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all font-semibold">
                Riprova
            </button>
        </div>
    `;
}

// ============================================
// SIDEBAR
// ============================================
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            
            // Animate toggle button
            gsap.to(menuToggle, {
                rotation: sidebar.classList.contains('open') ? 90 : 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 1024) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
                if (menuToggle) {
                    gsap.to(menuToggle, {
                        rotation: 0,
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
            }
        }
    });
    
    // Logout button
    const logoutButton = sidebar.querySelector('button[title="Logout"]');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

function handleLogout() {
    // Animate logout
    gsap.to('body', {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
            localStorage.removeItem('zone4love_session');
            sessionStorage.removeItem('zone4love_session');
            window.location.href = 'index.html';
        }
    });
}

// ============================================
// ANIMATIONS
// ============================================
function initAnimations() {
    // Ensure all elements are visible first
    gsap.set('.stat-card, .post-card, .widget-card', { opacity: 1 });
    
    // Animate stat cards
    gsap.fromTo('.stat-card', 
        { opacity: 0, y: 30 },
        { 
            opacity: 1, 
            y: 0, 
            duration: 0.6, 
            stagger: 0.1, 
            ease: 'power3.out',
            onComplete: () => {
                // Ensure they stay visible
                gsap.set('.stat-card', { opacity: 1, y: 0 });
            }
        }
    );
    
    // Animate posts
    gsap.fromTo('.post-card', 
        { opacity: 0, y: 40 },
        { 
            opacity: 1, 
            y: 0, 
            duration: 0.8, 
            delay: 0.4, 
            ease: 'power3.out',
            onComplete: () => {
                gsap.set('.post-card', { opacity: 1, y: 0 });
            }
        }
    );
    
    // Animate widgets
    gsap.fromTo('.widget-card', 
        { opacity: 0, x: 30 },
        { 
            opacity: 1, 
            x: 0, 
            duration: 0.6, 
            stagger: 0.1, 
            delay: 0.6, 
            ease: 'power2.out',
            onComplete: () => {
                gsap.set('.widget-card', { opacity: 1, x: 0 });
            }
        }
    );
    
    // Hover animations for stat cards
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                y: -8,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                y: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });
}

// ============================================
// INTERACTIONS
// ============================================
function initInteractions() {
    // Like button interactions
    document.querySelectorAll('.post-card button').forEach(button => {
        button.addEventListener('click', function(e) {
            // Check if it's a like button
            const isLikeButton = this.querySelector('path[d*="M4.318 6.318"]');
            
            if (isLikeButton) {
                e.preventDefault();
                handleLike(this);
            }
        });
    });
    
    // Follow button interactions
    document.querySelectorAll('.widget-card button').forEach(button => {
        if (button.textContent.trim() === 'Segui') {
            button.addEventListener('click', function() {
                handleFollow(this);
            });
        }
    });
    
    // New post button
    const newPostButton = document.querySelector('header button');
    if (newPostButton && newPostButton.textContent.includes('Nuovo Post')) {
        newPostButton.addEventListener('click', openNewPostModal);
    }
    
    // Search functionality
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                handleSearch(e.target.value);
            }, 500);
        });
    }
}

function handleLike(button) {
    const countElement = button.querySelector('span');
    const currentCount = parseInt(countElement.textContent);
    const svg = button.querySelector('svg');
    
    // Toggle like state
    const isLiked = button.dataset.liked === 'true';
    
    if (!isLiked) {
        // Like
        countElement.textContent = currentCount + 1;
        button.dataset.liked = 'true';
        button.classList.add('text-pink-500');
        button.classList.remove('text-purple-300');
        
        // Animate
        gsap.fromTo(svg, 
            { scale: 1 },
            { scale: 1.3, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' }
        );
    } else {
        // Unlike
        countElement.textContent = currentCount - 1;
        button.dataset.liked = 'false';
        button.classList.remove('text-pink-500');
        button.classList.add('text-purple-300');
        
        // Animate
        gsap.to(svg, {
            scale: 1,
            duration: 0.2,
            ease: 'power2.out'
        });
    }
}

async function handleFollow(button) {
    const isFollowing = button.textContent.trim() === 'Segui';
    const userId = button.dataset.userId;
    
    if (!userId) {
        showMessage('Errore: ID utente non trovato', 'error');
        return;
    }
    
    // Show loading state
    const originalText = button.textContent;
    button.textContent = isFollowing ? 'Seguendo...' : 'Rimuovendo...';
    button.disabled = true;
    
    try {
        const endpoint = isFollowing ? 'follow' : 'unfollow';
        const method = isFollowing ? 'POST' : 'DELETE';
        
        const response = await fetch(`${API_BASE_URL}/users/${userId}/${endpoint}`, {
            method: method,
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            if (isFollowing) {
                button.textContent = 'Seguito';
                button.classList.add('opacity-60', 'bg-gray-600');
                button.classList.remove('bg-gradient-to-r', 'from-pink-600', 'to-purple-600');
                showMessage(`Ora segui ${button.dataset.username}! 👥`, 'success');
            } else {
                button.textContent = 'Segui';
                button.classList.remove('opacity-60', 'bg-gray-600');
                button.classList.add('bg-gradient-to-r', 'from-pink-600', 'to-purple-600');
                showMessage(`Non segui più ${button.dataset.username}`, 'info');
            }
            
            // Animate
            gsap.fromTo(button,
                { scale: 1 },
                { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' }
            );
            
        } else {
            throw new Error(result.message || 'Failed to follow/unfollow user');
        }
        
    } catch (error) {
        console.error('Error following/unfollowing user:', error);
        showMessage('Errore nell\'operazione', 'error');
        button.textContent = originalText;
    } finally {
        button.disabled = false;
    }
}

function openNewPostModal() {
    // Create modal HTML
    const modalHTML = `
        <div id="post-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="fixed inset-0 bg-black/70 backdrop-blur-sm" onclick="closeNewPostModal()"></div>
            <div class="relative bg-black/90 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 w-full max-w-lg">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold">Crea un nuovo post</h3>
                    <button onclick="closeNewPostModal()" class="text-purple-300 hover:text-pink-400 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <form id="new-post-form" onsubmit="handleCreatePost(event)">
                    <div class="mb-4">
                        <div class="relative">
                            <textarea 
                                id="post-content"
                                placeholder="Cosa stai pensando? Condividi con la galassia... 🌌"
                                class="w-full h-32 p-4 pr-12 bg-purple-900/20 border border-purple-500/30 rounded-xl text-white placeholder-purple-300 resize-none focus:border-pink-500/50 outline-none transition-all"
                                maxlength="500"
                            ></textarea>
                            <!-- Emoji Button -->
                            <button 
                                type="button"
                                onclick="toggleEmojiPicker()"
                                class="absolute top-3 right-3 text-2xl hover:scale-110 transition-transform"
                                title="Aggiungi emoji"
                            >
                                😊
                            </button>
                        </div>
                        <div class="text-right text-sm text-purple-300 mt-2">
                            <span id="char-count">0</span>/500
                        </div>
                        
                        <!-- Emoji Picker -->
                        <div id="emoji-picker" class="hidden mt-2 p-3 bg-purple-900/40 border border-purple-500/30 rounded-xl">
                            <div class="text-xs text-purple-300 mb-2">Clicca per aggiungere:</div>
                            <div class="grid grid-cols-8 gap-2">
                                <button type="button" onclick="insertEmoji('😊')" class="text-2xl hover:scale-125 transition-transform">😊</button>
                                <button type="button" onclick="insertEmoji('😂')" class="text-2xl hover:scale-125 transition-transform">😂</button>
                                <button type="button" onclick="insertEmoji('❤️')" class="text-2xl hover:scale-125 transition-transform">❤️</button>
                                <button type="button" onclick="insertEmoji('🔥')" class="text-2xl hover:scale-125 transition-transform">🔥</button>
                                <button type="button" onclick="insertEmoji('✨')" class="text-2xl hover:scale-125 transition-transform">✨</button>
                                <button type="button" onclick="insertEmoji('🚀')" class="text-2xl hover:scale-125 transition-transform">🚀</button>
                                <button type="button" onclick="insertEmoji('🌟')" class="text-2xl hover:scale-125 transition-transform">🌟</button>
                                <button type="button" onclick="insertEmoji('💜')" class="text-2xl hover:scale-125 transition-transform">💜</button>
                                <button type="button" onclick="insertEmoji('👍')" class="text-2xl hover:scale-125 transition-transform">👍</button>
                                <button type="button" onclick="insertEmoji('🎉')" class="text-2xl hover:scale-125 transition-transform">🎉</button>
                                <button type="button" onclick="insertEmoji('💯')" class="text-2xl hover:scale-125 transition-transform">💯</button>
                                <button type="button" onclick="insertEmoji('🎵')" class="text-2xl hover:scale-125 transition-transform">🎵</button>
                                <button type="button" onclick="insertEmoji('🎶')" class="text-2xl hover:scale-125 transition-transform">🎶</button>
                                <button type="button" onclick="insertEmoji('🌈')" class="text-2xl hover:scale-125 transition-transform">🌈</button>
                                <button type="button" onclick="insertEmoji('⭐')" class="text-2xl hover:scale-125 transition-transform">⭐</button>
                                <button type="button" onclick="insertEmoji('💫')" class="text-2xl hover:scale-125 transition-transform">💫</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-purple-300 mb-2">
                            Media (immagini/video/audio)
                        </label>
                        <div class="space-y-3">
                            <input 
                                type="file"
                                id="post-media-files"
                                accept="image/*,video/*,audio/*"
                                multiple
                                class="w-full p-3 bg-purple-900/20 border border-purple-500/30 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-600 file:text-white hover:file:bg-pink-500 focus:border-pink-500/50 outline-none transition-all"
                            />
                            <div class="text-xs text-purple-400">
                                📷 Immagini: JPG, PNG, GIF (Max 10MB) | 🎥 Video: MP4, WebM (Max 50MB) | 🎵 Audio: MP3, WAV, OGG (Max 20MB) | Max 5 file totali
                            </div>
                            <div class="text-xs text-yellow-400 mt-1">
                                ⚠️ Video/Audio richiedono backend attivo! Senza backend: solo immagini < 5MB
                            </div>
                            <div id="media-preview" class="hidden">
                                <div id="media-grid" class="grid grid-cols-2 gap-3"></div>
                                <button type="button" onclick="clearAllMedia()" class="mt-3 text-sm text-red-400 hover:text-red-300">
                                    Rimuovi tutti i media
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <button 
                            type="button"
                            onclick="closeNewPostModal()"
                            class="flex-1 px-4 py-3 rounded-xl border border-purple-500/30 hover:border-pink-500/50 transition-all"
                        >
                            Annulla
                        </button>
                        <button 
                            type="submit"
                            id="create-post-btn"
                            class="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all font-semibold"
                        >
                            Pubblica 🚀
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize character counter
    const textarea = document.getElementById('post-content');
    const charCount = document.getElementById('char-count');
    
    textarea.addEventListener('input', () => {
        charCount.textContent = textarea.value.length;
    });
    
    // Initialize media upload
    const mediaInput = document.getElementById('post-media-files');
    mediaInput.addEventListener('change', handleMediaPreview);
    
    // Animate modal in
    const modal = document.getElementById('post-modal');
    gsap.fromTo(modal, 
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
    
    gsap.fromTo(modal.querySelector('.relative'), 
        { scale: 0.9, y: 20 },
        { scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
    );
    
    // Focus textarea
    setTimeout(() => textarea.focus(), 100);
}

function closeNewPostModal() {
    const modal = document.getElementById('post-modal');
    if (!modal) return;
    
    gsap.to(modal, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => modal.remove()
    });
}

// ============================================
// EMOJI PICKER FUNCTIONS
// ============================================
function toggleEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    if (!picker) return;
    
    if (picker.classList.contains('hidden')) {
        picker.classList.remove('hidden');
        gsap.from(picker, {
            opacity: 0,
            y: -10,
            duration: 0.2,
            ease: 'power2.out'
        });
    } else {
        picker.classList.add('hidden');
    }
}

function insertEmoji(emoji) {
    const textarea = document.getElementById('post-content');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    // Insert emoji at cursor position
    textarea.value = text.substring(0, start) + emoji + text.substring(end);
    
    // Update cursor position
    textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    
    // Update character count
    const charCount = document.getElementById('char-count');
    if (charCount) {
        charCount.textContent = textarea.value.length;
    }
    
    // Focus back on textarea
    textarea.focus();
    
    // Animate emoji button
    const emojiBtn = document.querySelector('button[onclick="toggleEmojiPicker()"]');
    if (emojiBtn) {
        gsap.fromTo(emojiBtn,
            { scale: 1 },
            { scale: 1.2, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.out' }
        );
    }
}

let selectedMediaFiles = [];

function handleMediaPreview(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    // Validate total number of files
    if (selectedMediaFiles.length + files.length > 5) {
        showMessage('Massimo 5 file consentiti!', 'error');
        return;
    }
    
    // Validate each file
    const validFiles = [];
    for (const file of files) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        
        // Validate file type first
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const isAudio = file.type.startsWith('audio/');
        
        if (!isImage && !isVideo && !isAudio) {
            showMessage(`❌ ${file.name}: Formato non supportato! Solo immagini, video, audio`, 'error');
            continue;
        }
        
        // Different size limits for different media types
        let maxSize, maxSizeMB, mediaType;
        if (isVideo) {
            maxSize = 50 * 1024 * 1024; // 50MB
            maxSizeMB = 50;
            mediaType = 'video';
        } else if (isAudio) {
            maxSize = 20 * 1024 * 1024; // 20MB
            maxSizeMB = 20;
            mediaType = 'audio';
        } else {
            maxSize = 10 * 1024 * 1024; // 10MB
            maxSizeMB = 10;
            mediaType = 'immagine';
        }
        
        if (file.size > maxSize) {
            showMessage(`❌ ${file.name}: Troppo grande! (${fileSizeMB}MB) - Max ${maxSizeMB}MB per ${isVideo ? 'video' : 'immagini'}`, 'error');
            continue;
        }
        
        console.log(`✅ File validato: ${file.name} (${fileSizeMB}MB, ${file.type})`);
        validFiles.push(file);
    }
    
    if (validFiles.length === 0) return;
    
    // Add to selected files
    selectedMediaFiles.push(...validFiles);
    
    // Update preview
    updateMediaPreview();
    
    // Clear input to allow re-selecting same files
    event.target.value = '';
}

function updateMediaPreview() {
    const preview = document.getElementById('media-preview');
    const grid = document.getElementById('media-grid');
    
    if (selectedMediaFiles.length === 0) {
        preview.classList.add('hidden');
        return;
    }
    
    preview.classList.remove('hidden');
    grid.innerHTML = '';
    
    selectedMediaFiles.forEach((file, index) => {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'relative bg-purple-900/20 rounded-lg overflow-hidden';
        
        const reader = new FileReader();
        reader.onload = (e) => {
            if (file.type.startsWith('image/')) {
                mediaItem.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-24 object-cover" />
                    <button onclick="removeMediaFile(${index})" class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1 transition-all">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                    <div class="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">📷</div>
                `;
            } else if (file.type.startsWith('video/')) {
                mediaItem.innerHTML = `
                    <video src="${e.target.result}" class="w-full h-24 object-cover" muted></video>
                    <button onclick="removeMediaFile(${index})" class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1 transition-all">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                    <div class="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">🎥</div>
                `;
            } else if (file.type.startsWith('audio/')) {
                mediaItem.innerHTML = `
                    <div class="w-full h-24 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/40 to-pink-900/40">
                        <div class="text-4xl mb-1">🎵</div>
                        <div class="text-xs text-purple-200 text-center px-2 truncate w-full">${file.name}</div>
                        <div class="text-xs text-purple-400">${(file.size / (1024 * 1024)).toFixed(2)}MB</div>
                    </div>
                    <button onclick="removeMediaFile(${index})" class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1 transition-all">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                `;
            }
            
            // Animate in
            gsap.fromTo(mediaItem, 
                { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.7)' }
            );
        };
        
        // For audio, we don't need to read as data URL for preview
        if (file.type.startsWith('audio/')) {
            reader.onload({ target: { result: null } }); // Trigger the preview without data URL
        } else {
            reader.readAsDataURL(file);
        }
        
        grid.appendChild(mediaItem);
    });
}

function removeMediaFile(index) {
    selectedMediaFiles.splice(index, 1);
    updateMediaPreview();
}

function clearAllMedia() {
    selectedMediaFiles = [];
    updateMediaPreview();
}

async function uploadMedia(file) {
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const isImage = file.type.startsWith('image/');
    
    let mediaType, formFieldName;
    if (isVideo) {
        mediaType = 'video';
        formFieldName = 'video';
    } else if (isAudio) {
        mediaType = 'audio';
        formFieldName = 'audio';
    } else {
        mediaType = 'immagine';
        formFieldName = 'image';
    }
    
    try {
        // Try to upload to backend if available
        const formData = new FormData();
        formData.append(formFieldName, file);
        
        try {
            console.log(`📤 Tentativo upload ${mediaType} al backend...`);
            console.log(`📂 Struttura: media/${currentUser?.id || 1}/post_[id]/${isVideo ? 'videos' : 'images'}/`);
            console.log(`🔗 URL: ${API_BASE_URL}/upload`);
            
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getSession().access_token}`
                },
                body: formData
            });
            
            console.log(`📊 Response status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log(`📦 Response data:`, result);
                
                if (result.success && result.data && result.data.url) {
                    console.log(`✅ Upload ${mediaType} completato:`);
                    console.log(`   URL: ${result.data.url}`);
                    console.log(`   Path: ${result.data.path || 'N/A'}`);
                    console.log(`   Size: ${(result.data.size / 1024).toFixed(2)}KB`);
                    return result.data.url;
                }
            } else {
                // Log response error
                const errorText = await response.text();
                console.error(`❌ Backend error response:`, errorText);
                throw new Error(`Backend error: ${response.status} - ${errorText}`);
            }
            
            throw new Error('Backend upload failed - no valid response');
            
        } catch (backendError) {
            console.error(`⚠️ Backend upload error:`, backendError);
            
            // Se è un errore di rete (backend veramente offline)
            if (backendError instanceof TypeError && backendError.message.includes('fetch')) {
                console.log(`🔌 Backend non raggiungibile (offline)`);
                
                // Per video e audio, NON usare fallback base64 (troppo grande per localStorage)
                if (isVideo) {
                    console.error(`❌ Upload video richiede backend attivo!`);
                    throw new Error('Backend necessario per upload video. Avvia il backend con ./start_backend.bat');
                }
                if (isAudio) {
                    console.error(`❌ Upload audio richiede backend attivo!`);
                    throw new Error('Backend necessario per upload audio. Avvia il backend con ./start_backend.bat');
                }
            } else {
                // Errore dal backend (autenticazione, validazione, etc.)
                console.error(`❌ Backend ha rifiutato l'upload: ${backendError.message}`);
                throw backendError; // Propaga l'errore originale
            }
            
            console.log(`   Uso base64 fallback solo per immagini`);
            console.log(`   Nota: In modalità offline i media non seguono la struttura cartelle`);
        }
        
        // Fallback: Convert to base64 for persistence (SOLO PER IMMAGINI)
        console.log(`🔄 Conversione ${mediaType} in base64...`);
        
        // Check file size before converting (max 5MB for base64)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error(`Immagine troppo grande per modalità offline (${(file.size / (1024 * 1024)).toFixed(2)}MB). Max 5MB. Avvia il backend!`);
        }
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const base64Size = e.target.result.length;
                console.log(`✅ ${mediaType} convertito in base64 (${(base64Size / 1024).toFixed(0)}KB)`);
                
                // Check if result would fit in localStorage (typical limit ~5MB)
                if (base64Size > 4 * 1024 * 1024) {
                    reject(new Error(`Immagine base64 troppo grande (${(base64Size / (1024 * 1024)).toFixed(2)}MB). Avvia il backend!`));
                    return;
                }
                
                resolve(e.target.result);
            };
            
            reader.onerror = () => {
                console.error(`❌ Errore lettura ${mediaType}`);
                reject(new Error(`Impossibile leggere ${mediaType}`));
            };
            
            reader.readAsDataURL(file);
        });
        
    } catch (error) {
        console.error(`Error uploading ${mediaType}:`, error);
        throw new Error(`Errore nell'upload ${mediaType}`);
    }
}

async function handleCreatePost(event) {
    event.preventDefault();
    
    const content = document.getElementById('post-content').value.trim();
    const submitBtn = document.getElementById('create-post-btn');
    
    // ✅ FIX: Validate that there's either content OR media
    if (!content && selectedMediaFiles.length === 0) {
        showMessage('⚠️ Aggiungi del testo o almeno un media per pubblicare!', 'warning');
        return;
    }
    
    // If no content but has media, that's ok (media-only post)
    // If no media but has content, that's ok (text-only post)
    
    // Show loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Pubblicando...';
    submitBtn.disabled = true;
    
    try {
        let mediaUrls = [];
        
        // Upload media files if present
        if (selectedMediaFiles.length > 0) {
            submitBtn.textContent = `Caricando ${selectedMediaFiles.length} media...`;
            
            for (let i = 0; i < selectedMediaFiles.length; i++) {
                const file = selectedMediaFiles[i];
                submitBtn.textContent = `Caricando media ${i + 1}/${selectedMediaFiles.length}...`;
                
                const mediaUrl = await uploadMedia(file);
                let mediaType = 'image';
                if (file.type.startsWith('video/')) mediaType = 'video';
                if (file.type.startsWith('audio/')) mediaType = 'audio';
                
                mediaUrls.push({
                    url: mediaUrl,
                    type: mediaType,
                    name: file.name
                });
            }
        }
        
        submitBtn.textContent = 'Pubblicando...';
        
        let createdPost = null;
        
        try {
            // Try to create post via backend API
            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    content: content,
                    media: mediaUrls
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Add new post to the beginning of the feed
                createdPost = result.data;
                posts.unshift(createdPost);
                renderPosts();
            } else {
                throw new Error(result.message || 'Failed to create post');
            }
            
        } catch (backendError) {
            console.log('🔧 Backend not available, creating post locally');
            
            // Fallback: Create post locally
            createdPost = {
                id: Date.now(),
                content: content,
                media: mediaUrls.length > 0 ? mediaUrls : null,
                image_url: mediaUrls.length === 1 && mediaUrls[0].type === 'image' ? mediaUrls[0].url : null, // Legacy compatibility
                user: currentUser,
                user_id: currentUser?.id || 1,
                created_at: new Date().toISOString(),
                likes_count: 0,
                comments_count: 0,
                is_liked: false
            };
            
            // Save to localStorage for persistence
            const savedPosts = JSON.parse(localStorage.getItem('zone4love_posts') || '[]');
            savedPosts.unshift(createdPost);
            localStorage.setItem('zone4love_posts', JSON.stringify(savedPosts));
            
            // Add to current posts array
            posts.unshift(createdPost);
            renderPosts();
            
            showMessage('⚠️ Backend offline - Post salvato localmente', 'warning');
        }
        
        // Reset media files
        selectedMediaFiles = [];
        
        // Close modal
        closeNewPostModal();
        
        // Show success message
        showMessage('Post pubblicato con successo! 🚀', 'success');
        
        // ✅ UPDATE STATS after creating post
        await updateStatsAfterPostCreation();
        
        // Animate new post
        if (createdPost) {
            setTimeout(() => {
                const newPostElement = document.querySelector('[data-post-id="' + createdPost.id + '"]');
                if (newPostElement) {
                    gsap.fromTo(newPostElement,
                        { scale: 0.95, opacity: 0 },
                        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
                    );
                }
            }, 100);
        }
        
    } catch (error) {
        console.error('Error creating post:', error);
        
        // Messaggio specifico basato sull'errore
        let errorMessage = 'Errore nella pubblicazione del post';
        
        if (error.message.includes('Backend necessario')) {
            errorMessage = '🎥 Video richiedono backend attivo! Avvia con ./start_backend.bat';
        } else if (error.message.includes('troppo grande')) {
            errorMessage = `📦 ${error.message}`;
        } else if (error.message.includes('QuotaExceeded')) {
            errorMessage = '💾 Storage pieno! Avvia il backend per salvare i media sul server invece di localStorage';
        }
        
        showMessage(errorMessage, 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
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

function handleSearch(query) {
    if (query.length < 2) return;
    
    console.log('Searching for:', query);
    
    // TODO: Implement actual search functionality with backend
    // For now, just log the search query
}

// ============================================
// COMMENTS AND INTERACTIONS
// ============================================
async function showComments(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            openCommentsModal(postId, result.data);
        } else {
            throw new Error(result.message || 'Failed to load comments');
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        showMessage('Errore nel caricamento dei commenti', 'error');
    }
}

function openCommentsModal(postId, comments) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const modalHTML = `
        <div id="comments-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="fixed inset-0 bg-black/70 backdrop-blur-sm" onclick="closeCommentsModal()"></div>
            <div class="relative bg-black/90 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold">Commenti (${comments.length})</h3>
                    <button onclick="closeCommentsModal()" class="text-purple-300 hover:text-pink-400 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Post Preview -->
                <div class="bg-purple-900/20 rounded-xl p-4 mb-6">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm">
                            ${post.user.username.charAt(0).toUpperCase()}
                        </div>
                        <span class="font-semibold">${post.user.username}</span>
                    </div>
                    <p class="text-purple-100 text-sm">${post.content}</p>
                </div>
                
                <!-- Comments List -->
                <div class="flex-1 overflow-y-auto mb-4" id="comments-list">
                    ${comments.length === 0 ? `
                        <div class="text-center py-8">
                            <div class="text-4xl mb-2">💬</div>
                            <p class="text-purple-300">Nessun commento ancora</p>
                            <p class="text-sm text-purple-400">Sii il primo a commentare!</p>
                        </div>
                    ` : comments.map(comment => `
                        <div class="flex gap-3 mb-4">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-sm">
                                ${comment.user.username.charAt(0).toUpperCase()}
                            </div>
                            <div class="flex-1">
                                <div class="bg-purple-900/30 rounded-lg p-3">
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="font-semibold text-sm">${comment.user.username}</span>
                                        <span class="text-xs text-purple-400">${new Date(comment.created_at).toLocaleString('it-IT')}</span>
                                    </div>
                                    <p class="text-sm">${comment.content}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Add Comment Form -->
                <form onsubmit="handleAddComment(event, ${postId})" class="flex gap-3">
                    <input 
                        type="text"
                        id="comment-input"
                        placeholder="Scrivi un commento..."
                        class="flex-1 p-3 bg-purple-900/20 border border-purple-500/30 rounded-xl text-white placeholder-purple-300 focus:border-pink-500/50 outline-none transition-all"
                        required
                    />
                    <button 
                        type="submit"
                        class="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all font-semibold"
                    >
                        Invia
                    </button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Animate modal in
    const modal = document.getElementById('comments-modal');
    gsap.fromTo(modal, 
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
    
    gsap.fromTo(modal.querySelector('.relative'), 
        { scale: 0.9, y: 20 },
        { scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
    );
    
    // Focus comment input
    setTimeout(() => document.getElementById('comment-input').focus(), 100);
}

function closeCommentsModal() {
    const modal = document.getElementById('comments-modal');
    if (!modal) return;
    
    gsap.to(modal, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => modal.remove()
    });
}

async function handleAddComment(event, postId) {
    event.preventDefault();
    
    const input = document.getElementById('comment-input');
    const content = input.value.trim();
    
    if (!content) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Update post comments count
            const post = posts.find(p => p.id === postId);
            if (post) {
                post.comments_count++;
                
                // Update UI
                const postElement = document.querySelector(`[data-post-id="${postId}"]`);
                const commentButton = postElement.querySelector('button[onclick*="showComments"]');
                const commentCount = commentButton.querySelector('span');
                commentCount.textContent = post.comments_count;
            }
            
            // Add comment to modal
            const commentsList = document.getElementById('comments-list');
            const newCommentHTML = `
                <div class="flex gap-3 mb-4">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-sm">
                        ${result.data.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-1">
                        <div class="bg-purple-900/30 rounded-lg p-3">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="font-semibold text-sm">${result.data.user.username}</span>
                                <span class="text-xs text-purple-400">Ora</span>
                            </div>
                            <p class="text-sm">${result.data.content}</p>
                        </div>
                    </div>
                </div>
            `;
            
            commentsList.insertAdjacentHTML('beforeend', newCommentHTML);
            
            // Clear input
            input.value = '';
            
            // Scroll to new comment
            commentsList.scrollTop = commentsList.scrollHeight;
            
            showMessage('Commento aggiunto! 💬', 'success');
            
            // ✅ Update interactions widget in real-time (only if it's user's own post)
            if (post && (post.user_id === currentUser?.id || post.user?.id === currentUser?.id)) {
                console.log('🔄 Updating stats after comment interaction on own post...');
                await updateInteractionsWidget();
            }
            
        } else {
            throw new Error(result.message || 'Failed to add comment');
        }
        
    } catch (error) {
        console.error('Error adding comment:', error);
        showMessage('Errore nell\'aggiunta del commento', 'error');
    }
}

function sharePost(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const shareUrl = `${window.location.origin}/post/${postId}`;
    
    if (navigator.share) {
        navigator.share({
            title: `Post di ${post.user.username} su Zone4Love`,
            text: post.content,
            url: shareUrl
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            showMessage('Link copiato negli appunti! 📋', 'success');
        }).catch(() => {
            showMessage('Errore nella condivisione', 'error');
        });
    }
}

function showPostOptions(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    // Simple alert for now - could be expanded to a proper dropdown menu
    const isOwner = currentUser && currentUser.id === post.user.id;
    
    if (isOwner) {
        const action = confirm('Vuoi eliminare questo post?');
        if (action) {
            deletePost(postId);
        }
    } else {
        showMessage('Opzioni post in arrivo! ⚙️', 'info');
    }
}

async function deletePost(postId) {
    try {
        console.log(`🗑️ Deleting post ${postId}...`);
        
        // Get post data before deletion (to check if it's user's post)
        const post = posts.find(p => p.id === postId);
        const isUserPost = post && (post.user_id === currentUser?.id || post.user?.id === currentUser?.id);
        
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log('✅ Post deleted from backend');
        
        // Remove from local state
        posts = posts.filter(p => p.id !== postId);
        
        // Remove from localStorage if exists
        const savedPosts = JSON.parse(localStorage.getItem('zone4love_posts') || '[]');
        const updatedSavedPosts = savedPosts.filter(p => p.id !== postId);
        localStorage.setItem('zone4love_posts', JSON.stringify(updatedSavedPosts));
        
        // Remove from UI with animation
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            gsap.to(postElement, {
                opacity: 0,
                scale: 0.95,
                height: 0,
                marginBottom: 0,
                duration: 0.4,
                ease: 'power2.out',
                onComplete: () => {
                    postElement.remove();
                    showMessage('🗑️ Post eliminato con successo!', 'success');
                }
            });
        }
        
        // ✅ Update stats widget if it was user's own post
        if (isUserPost) {
            console.log('🔄 Updating stats after post deletion...');
            await updateStatsAfterPostDeletion();
        }
        
    } catch (error) {
        console.error('❌ Error deleting post:', error);
        showMessage('Errore nell\'eliminazione del post', 'error');
    }
}

// ============================================
// UPDATE STATS AFTER POST DELETION
// ============================================
async function updateStatsAfterPostDeletion() {
    if (!currentUser) {
        console.warn('⚠️ No currentUser for stats update');
        return;
    }
    
    try {
        const session = getSession();
        if (!session) return;
        
        console.log('📡 Fetching fresh stats after post deletion...');
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Stats fetch failed: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            console.log('✅ Stats updated after deletion (DB COUNT):', result.data);
            console.log(`   📝 Posts in DB: ${result.data.posts_count}`);
            
            updateStatsDisplay(result.data);
            
            // Animate the posts counter with a different animation (shrink)
            const postsCard = document.querySelector('.stat-card:nth-child(2)');
            if (postsCard) {
                gsap.fromTo(postsCard,
                    { scale: 1 },
                    { 
                        scale: 0.95,
                        duration: 0.2,
                        ease: 'power2.out',
                        yoyo: true,
                        repeat: 1
                    }
                );
            }
            
            console.log('✅ Stats widget updated after post deletion');
        }
        
    } catch (error) {
        console.error('⚠️ Could not update stats after deletion:', error);
        // Non bloccare l'operazione se le stats non si aggiornano
    }
}

async function loadMorePosts() {
    // TODO: Implement pagination
    showMessage('Funzionalità in arrivo! 🚀', 'info');
}

// ============================================
// DATA REFRESH
// ============================================
function refreshDashboardData() {
    // This would fetch fresh data from the backend
    console.log('Refreshing dashboard data...');
    
    // TODO: Implement WebSocket connection for real-time updates
}

// Auto-refresh every 30 seconds (for demo purposes)
// In production, use WebSocket for real-time updates
setInterval(refreshDashboardData, 30000);

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Ctrl/Cmd + N for new post
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openNewPostModal();
    }
    
    // Escape to close sidebar on mobile
    if (e.key === 'Escape') {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    }
});

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================
// Lazy load images (if we add them later)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}

// ============================================
// IMAGE MODAL
// ============================================
function openImageModal(imageUrl) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('image-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'image-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm hidden';
        modal.innerHTML = `
            <div class="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
                <button onclick="closeImageModal()" class="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
                <img id="modal-image" src="" alt="Enlarged image" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeImageModal();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeImageModal();
            }
        });
    }
    
    // Set image and show modal
    const modalImage = document.getElementById('modal-image');
    modalImage.src = imageUrl;
    modal.classList.remove('hidden');
    
    // Animate in
    gsap.fromTo(modal, 
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
    
    gsap.fromTo(modalImage, 
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)', delay: 0.1 }
    );
}

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    if (modal) {
        gsap.to(modal, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => {
                modal.classList.add('hidden');
            }
        });
    }
}

// ============================================
// VIDEO MODAL
// ============================================
function openVideoModal(videoUrl) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('video-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'video-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm hidden';
        modal.innerHTML = `
            <div class="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
                <button onclick="closeVideoModal()" class="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
                <video id="modal-video" src="" controls class="max-w-full max-h-full rounded-lg shadow-2xl" />
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeVideoModal();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeVideoModal();
            }
        });
    }
    
    // Set video and show modal
    const modalVideo = document.getElementById('modal-video');
    modalVideo.src = videoUrl;
    modal.classList.remove('hidden');
    
    // Animate in
    gsap.fromTo(modal, 
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
    
    gsap.fromTo(modalVideo, 
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)', delay: 0.1 }
    );
}

function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('modal-video');
    
    if (modal) {
        // Pause video
        if (video) {
            video.pause();
            video.currentTime = 0;
        }
        
        gsap.to(modal, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => {
                modal.classList.add('hidden');
            }
        });
    }
}

// ============================================
// MEDIA GALLERY MODAL
// ============================================
function openMediaGallery(postId) {
    const post = posts.find(p => p.id == postId);
    if (!post || !post.media) return;
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('gallery-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'gallery-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm hidden';
        modal.innerHTML = `
            <div class="relative w-full h-full flex items-center justify-center p-4">
                <button onclick="closeGalleryModal()" class="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
                
                <!-- Navigation buttons -->
                <button id="gallery-prev" onclick="galleryPrev()" class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-3 transition-all">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                </button>
                
                <button id="gallery-next" onclick="galleryNext()" class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-3 transition-all">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </button>
                
                <!-- Media container -->
                <div id="gallery-media" class="max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center">
                    <!-- Media will be inserted here -->
                </div>
                
                <!-- Counter -->
                <div id="gallery-counter" class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    1 / 1
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeGalleryModal();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeGalleryModal();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('hidden')) {
                if (e.key === 'ArrowLeft') galleryPrev();
                if (e.key === 'ArrowRight') galleryNext();
            }
        });
    }
    
    // Set gallery data
    window.galleryData = {
        media: post.media,
        currentIndex: 0
    };
    
    // Show modal and first media
    modal.classList.remove('hidden');
    showGalleryMedia(0);
    
    // Animate in
    gsap.fromTo(modal, 
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
}

function showGalleryMedia(index) {
    if (!window.galleryData) return;
    
    const { media } = window.galleryData;
    const mediaContainer = document.getElementById('gallery-media');
    const counter = document.getElementById('gallery-counter');
    const prevBtn = document.getElementById('gallery-prev');
    const nextBtn = document.getElementById('gallery-next');
    
    if (index < 0 || index >= media.length) return;
    
    window.galleryData.currentIndex = index;
    const currentMedia = media[index];
    
    // Update counter
    counter.textContent = `${index + 1} / ${media.length}`;
    
    // Show/hide navigation buttons
    prevBtn.style.display = index === 0 ? 'none' : 'block';
    nextBtn.style.display = index === media.length - 1 ? 'none' : 'block';
    
    // Create media element
    let mediaElement = '';
    if (currentMedia.type === 'image') {
        mediaElement = `<img src="${currentMedia.url}" alt="Gallery image" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />`;
    } else if (currentMedia.type === 'video') {
        mediaElement = `<video src="${currentMedia.url}" controls class="max-w-full max-h-full rounded-lg shadow-2xl" />`;
    }
    
    mediaContainer.innerHTML = mediaElement;
    
    // Animate media
    const mediaEl = mediaContainer.firstElementChild;
    if (mediaEl) {
        gsap.fromTo(mediaEl, 
            { scale: 0.9, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
    }
}

function galleryPrev() {
    if (!window.galleryData) return;
    const newIndex = window.galleryData.currentIndex - 1;
    if (newIndex >= 0) {
        showGalleryMedia(newIndex);
    }
}

function galleryNext() {
    if (!window.galleryData) return;
    const newIndex = window.galleryData.currentIndex + 1;
    if (newIndex < window.galleryData.media.length) {
        showGalleryMedia(newIndex);
    }
}

function closeGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    if (modal) {
        // Pause any playing video
        const video = modal.querySelector('video');
        if (video) {
            video.pause();
            video.currentTime = 0;
        }
        
        gsap.to(modal, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => {
                modal.classList.add('hidden');
                window.galleryData = null;
            }
        });
    }
}

// ============================================
// SIDEBAR WIDGETS
// ============================================

async function loadSuggestions() {
    const container = document.getElementById('suggestions-container');
    if (!container) return;
    
    try {
        const session = getSession();
        if (!session) return;
        
        // Try to load from backend
        try {
            const response = await fetch(`${API_BASE_URL}/users/suggestions`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    renderSuggestions(result.data);
                    return;
                }
            }
        } catch (backendError) {
            console.warn('⚠️ Backend suggestions not available');
        }
        
        // Fallback: Show users from posts
        const uniqueUsers = [];
        const seenIds = new Set();
        
        posts.forEach(post => {
            if (post.user && post.user.id !== currentUser?.id && !seenIds.has(post.user.id)) {
                seenIds.add(post.user.id);
                uniqueUsers.push(post.user);
            }
        });
        
        renderSuggestions(uniqueUsers.slice(0, 5));
        
    } catch (error) {
        console.error('Error loading suggestions:', error);
        container.innerHTML = '<div class="text-center text-purple-300 text-sm py-4">Nessun suggerimento disponibile</div>';
    }
}

function renderSuggestions(users) {
    const container = document.getElementById('suggestions-container');
    if (!container || !users || users.length === 0) {
        container.innerHTML = '<div class="text-center text-purple-300 text-sm py-4">Nessun suggerimento disponibile</div>';
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold">
                ${user.username.charAt(0).toUpperCase()}
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold truncate">${user.username}</p>
                <p class="text-xs text-purple-300 truncate">${user.bio || 'Esploratore della galassia'}</p>
            </div>
            <button onclick="followUser(${user.id})" class="px-3 py-1 text-sm rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all">
                Segui
            </button>
        </div>
    `).join('');
    
    // Animate
    gsap.from('#suggestions-container > div', {
        opacity: 0,
        y: 10,
        duration: 0.3,
        stagger: 0.1,
        ease: 'power2.out'
    });
}

async function loadTrendingUsers() {
    const container = document.getElementById('trending-users-container');
    if (!container) return;
    
    try {
        const session = getSession();
        if (!session) return;
        
        // Calculate trending users from posts (most active)
        const userActivity = {};
        
        posts.forEach(post => {
            if (post.user && post.user.id !== currentUser?.id) {
                const userId = post.user.id;
                if (!userActivity[userId]) {
                    userActivity[userId] = {
                        user: post.user,
                        posts: 0,
                        interactions: 0
                    };
                }
                userActivity[userId].posts++;
                userActivity[userId].interactions += (post.likes_count || 0) + (post.comments_count || 0);
            }
        });
        
        // Sort by activity
        const trendingUsers = Object.values(userActivity)
            .sort((a, b) => b.interactions - a.interactions)
            .slice(0, 5);
        
        renderTrendingUsers(trendingUsers);
        
    } catch (error) {
        console.error('Error loading trending users:', error);
        container.innerHTML = '<div class="text-center text-purple-300 text-sm py-4">Nessun utente disponibile</div>';
    }
}

function renderTrendingUsers(usersData) {
    const container = document.getElementById('trending-users-container');
    if (!container || !usersData || usersData.length === 0) {
        container.innerHTML = '<div class="text-center text-purple-300 text-sm py-4">Nessun utente disponibile</div>';
        return;
    }
    
    container.innerHTML = usersData.map((data, index) => {
        const formatNumber = (num) => {
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        };
        
        return `
        <div class="cursor-pointer hover:bg-purple-900/20 p-2 rounded-lg transition-all" onclick="viewUserProfile(${data.user.id})">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center font-bold text-sm">
                    ${data.user.username.charAt(0).toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold truncate">${data.user.username}</p>
                    <p class="text-xs text-purple-300">
                        ${data.posts} post • ${formatNumber(data.interactions)} interazioni
                    </p>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    // Animate
    gsap.from('#trending-users-container > div', {
        opacity: 0,
        x: -10,
        duration: 0.3,
        stagger: 0.08,
        ease: 'power2.out'
    });
}

async function followUser(userId) {
    try {
        const session = getSession();
        if (!session) {
            showMessage('⚠️ Devi essere loggato per seguire un utente', 'warning');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showMessage('✅ Hai iniziato a seguire questo utente!', 'success');
            loadSuggestions(); // Refresh suggestions
            loadUserStats(); // Update stats
        } else {
            throw new Error('Failed to follow user');
        }
    } catch (error) {
        console.error('Error following user:', error);
        showMessage('⚠️ Backend offline - Follow non disponibile', 'warning');
    }
}

function viewUserProfile(userId) {
    // TODO: Implement user profile view
    showMessage(`📝 Profilo utente ${userId} (coming soon!)`, 'info');
}
