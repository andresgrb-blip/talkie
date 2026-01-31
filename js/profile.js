// Profile Page JavaScript

// API_BASE_URL is already defined in auth.js (loaded before this script)
// No need to redeclare it here

// Global state
let currentUser = null;
let profileUser = null;
let userPosts = [];
let isLoading = false;
let currentPage = 1;
let hasMorePosts = true;
let postsPerPage = 10;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();
    
    // Get user ID from URL or use current user
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
    // Initialize components
    initTabs();
    
    // Load profile data (animations will be triggered after content loads)
    loadProfile(userId);
    
    console.log('👤 Profile page initialized');
});

// ============================================
// AUTHENTICATION & USER DATA
// ============================================
function checkAuth() {
    const session = getSession();
    if (!session) {
        console.error('❌ No session found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    currentUser = session.user;
    console.log('✅ Auth check passed, currentUser:', currentUser);
    
    if (!currentUser) {
        console.error('❌ Session exists but no user data');
        window.location.href = 'login.html';
        return;
    }
}

function getSession() {
    const sessionData = localStorage.getItem('zone4love_session') || sessionStorage.getItem('zone4love_session');
    return sessionData ? JSON.parse(sessionData) : null;
}

function getAccessToken() {
    return sessionStorage.getItem('zone4love_access_token') ||
           localStorage.getItem('zone4love_access_token') || 
           sessionStorage.getItem('token') ||
           localStorage.getItem('token');
}

function getAuthHeaders() {
    const token = getAccessToken();
    return token ? {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    } : {
        'Content-Type': 'application/json'
    };
}

// ============================================
// QUICK AVATAR UPLOAD (from profile page)
// ============================================
function openAvatarUpload() {
    // Only allow if viewing own profile
    if (!profileUser || !currentUser || profileUser.id !== currentUser.id) {
        showMessage('⚠️ Puoi cambiare solo il tuo avatar', 'warning');
        return;
    }
    
    const fileInput = document.getElementById('avatar-file-input');
    fileInput.click();
}

async function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('📸 Quick avatar change:', file.name);
    
    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showMessage('❌ Formato non valido. Usa JPG, PNG, GIF o WebP', 'error');
        return;
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showMessage('❌ File troppo grande. Max 10MB', 'error');
        return;
    }
    
    // Show loading overlay
    showAvatarUploadLoading();
    
    try {
        // Upload avatar
        console.log('📤 Uploading new avatar...');
        const avatarUrl = await uploadAvatar(file);
        console.log('✅ Avatar uploaded:', avatarUrl);
        
        // Update profile with new avatar
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                avatar_url: avatarUrl
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Avatar updated successfully');
            
            // Update local data
            profileUser = { ...profileUser, ...result.data };
            currentUser = { ...currentUser, ...result.data };
            
            // Update session
            const session = getSession();
            if (session) {
                session.user = currentUser;
                const storage = sessionStorage.getItem('zone4love_session') ? sessionStorage : localStorage;
                storage.setItem('zone4love_session', JSON.stringify(session));
            }
            
            // Update UI
            renderProfile();
            
            // Show success
            showMessage('✅ Avatar aggiornato con successo!', 'success');
        } else {
            throw new Error(result.message || 'Failed to update avatar');
        }
        
    } catch (error) {
        console.error('❌ Error updating avatar:', error);
        showMessage(`❌ Errore: ${error.message}`, 'error');
    } finally {
        hideAvatarUploadLoading();
        // Reset file input
        event.target.value = '';
    }
}

function showAvatarUploadLoading() {
    const avatar = document.getElementById('profile-avatar');
    avatar.style.opacity = '0.5';
    avatar.style.pointerEvents = 'none';
    
    // Add loading spinner
    const spinner = document.createElement('div');
    spinner.id = 'avatar-loading-spinner';
    spinner.className = 'absolute inset-0 flex items-center justify-center';
    spinner.innerHTML = `
        <div class="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"></div>
    `;
    avatar.parentElement.appendChild(spinner);
}

function hideAvatarUploadLoading() {
    const avatar = document.getElementById('profile-avatar');
    avatar.style.opacity = '1';
    avatar.style.pointerEvents = 'auto';
    
    const spinner = document.getElementById('avatar-loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

// ============================================
// PROFILE LOADING
// ============================================
async function loadProfile(userId) {
    try {
        // If no userId provided, use current user's ID
        if (!userId) {
            console.log('👤 Loading own profile...');
            
            if (!currentUser) {
                console.error('❌ currentUser is null/undefined');
                showError('Errore: utente non trovato');
                return;
            }
            
            // Use current user's ID to fetch fresh data from API
            userId = currentUser.id;
        }
        
        console.log(`👤 Loading profile for user ${userId}...`);
        
        // Load specific user profile
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            profileUser = result.data;
            console.log('✅ Profile loaded:', profileUser);
            
            // Load stats for this user
            await loadUserStats(userId);
            
            renderProfile();
            loadUserPosts();
        } else {
            throw new Error(result.message || 'Failed to load profile');
        }
        
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        showError('Errore nel caricamento del profilo');
    }
}

// ============================================
// LOAD USER STATS FROM BACKEND
// ============================================
async function loadUserStats(userId) {
    try {
        console.log(`📊 Loading stats for user ${userId}...`);
        
        const response = await fetch(`${API_BASE_URL}/users/${userId}/stats`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            console.warn('⚠️ Could not load stats, using defaults');
            return;
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            console.log('✅ Stats loaded:', result.data);
            
            // Update profileUser with stats
            profileUser.posts_count = result.data.posts_count || 0;
            profileUser.followers_count = result.data.followers_count || 0;
            profileUser.following_count = result.data.following_count || 0;
            profileUser.total_likes = result.data.total_likes || 0;
            profileUser.total_comments = result.data.total_comments || 0;
        }
        
    } catch (error) {
        console.error('⚠️ Error loading stats:', error);
        // Non bloccare il caricamento del profilo se le stats falliscono
    }
}

function renderProfile() {
    if (!profileUser) return;
    
    console.log('🎨 Rendering profile:', profileUser);
    
    // Update avatar
    const avatar = document.getElementById('profile-avatar');
    if (profileUser.avatar_url) {
        avatar.innerHTML = `<img src="${profileUser.avatar_url}" alt="${profileUser.username}" class="w-full h-full object-cover rounded-full" />`;
    } else {
        avatar.textContent = profileUser.username.charAt(0).toUpperCase();
    }
    
    // Update username
    const username = document.getElementById('profile-username');
    username.textContent = `@${profileUser.username}`;
    
    // Update bio
    const bio = document.getElementById('profile-bio');
    bio.textContent = profileUser.bio || 'Esploratore della galassia 🌌';
    
    // Update join date
    const joinDate = document.getElementById('join-date');
    if (profileUser.created_at) {
        const date = new Date(profileUser.created_at);
        joinDate.textContent = `Iscritto da ${date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}`;
    }
    
    // Update stats with real data from backend
    document.getElementById('posts-count').textContent = formatNumber(profileUser.posts_count || 0);
    document.getElementById('followers-count').textContent = formatNumber(profileUser.followers_count || 0);
    document.getElementById('following-count').textContent = formatNumber(profileUser.following_count || 0);
    
    console.log(`📊 Stats displayed: ${profileUser.posts_count} posts, ${profileUser.followers_count} followers, ${profileUser.following_count} following`);
    
    // Render action buttons (hide follow button if own profile)
    renderActionButtons();
    
    // Hide edit profile button in nav if not own profile
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const isOwnProfile = currentUser && currentUser.id === profileUser.id;
    if (editProfileBtn) {
        editProfileBtn.style.display = isOwnProfile ? 'block' : 'none';
    }
    
    // Update page title
    document.title = `${profileUser.username} - Zone4Love`;
    
    // ✅ Trigger animations AFTER content is loaded
    initAnimations();
}

function renderActionButtons() {
    const actionsContainer = document.getElementById('profile-actions');
    const isOwnProfile = currentUser && currentUser.id === profileUser.id;
    
    console.log(`🔘 Rendering action buttons (isOwnProfile: ${isOwnProfile})`);
    
    if (isOwnProfile) {
        // ✅ Own profile - show edit button ONLY
        actionsContainer.innerHTML = `
            <button onclick="openEditProfileModal()" class="px-6 py-2 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all font-semibold">
                ✏️ Modifica Profilo
            </button>
            <button onclick="openSettingsModal()" class="px-6 py-2 rounded-full border border-purple-500/30 hover:border-pink-500/50 transition-all">
                ⚙️ Impostazioni
            </button>
        `;
    } else {
        // ✅ Other user's profile - show follow/message buttons (NO edit button)
        const isFollowing = profileUser.is_following || false;
        
        actionsContainer.innerHTML = `
            <button onclick="handleFollow(this)" 
                    data-user-id="${profileUser.id}" 
                    data-username="${profileUser.username}"
                    class="px-6 py-2 rounded-full ${isFollowing ? 'bg-gray-600 opacity-60' : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500'} transition-all font-semibold">
                ${isFollowing ? '✅ Seguito' : '➕ Segui'}
            </button>
            <button onclick="openMessageModal('${profileUser.id}')" class="px-6 py-2 rounded-full border border-purple-500/30 hover:border-pink-500/50 transition-all">
                💬 Messaggio
            </button>
            <button onclick="shareProfile()" class="px-4 py-2 rounded-full border border-purple-500/30 hover:border-pink-500/50 transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
            </button>
        `;
    }
}

// ============================================
// POSTS LOADING WITH LAZY LOADING
// ============================================
async function loadUserPosts(page = 1) {
    if (isLoading || (!hasMorePosts && page > 1)) {
        console.log(`⏸️ Skip loading: isLoading=${isLoading}, hasMorePosts=${hasMorePosts}, page=${page}`);
        return;
    }
    
    isLoading = true;
    
    if (page === 1) {
        showPostsLoading();
    } else {
        showLoadingMore();
    }
    
    try {
        console.log(`📡 Loading posts page ${page} for user ${profileUser.id}...`);
        
        const endpoint = profileUser.id === currentUser.id ? 
            `${API_BASE_URL}/posts?user_id=${profileUser.id}&page=${page}&per_page=${postsPerPage}` : 
            `${API_BASE_URL}/users/${profileUser.id}/posts?page=${page}&per_page=${postsPerPage}`;
            
        const response = await fetch(endpoint, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const newPosts = result.data;
            console.log(`✅ Loaded ${newPosts.length} posts (page ${page})`);
            
            // ⚠️ FALLBACK: Se backend non supporta paginazione, gestisci client-side
            if (page === 1 && newPosts.length > postsPerPage) {
                console.log(`⚠️ Backend returned all ${newPosts.length} posts (no pagination support)`);
                console.log(`🔧 Implementing client-side pagination...`);
                
                // Store all posts
                const allPosts = newPosts;
                
                // Show only first page
                userPosts = allPosts.slice(0, postsPerPage);
                
                // Store remaining posts for client-side pagination
                window._allUserPosts = allPosts;
                window._clientSidePagination = true;
                
                hasMorePosts = allPosts.length > postsPerPage;
                currentPage = 1;
                
                console.log(`📊 Showing ${userPosts.length} of ${allPosts.length} posts, hasMorePosts: ${hasMorePosts}`);
            } else if (window._clientSidePagination) {
                // Client-side pagination
                const allPosts = window._allUserPosts;
                const startIndex = (page - 1) * postsPerPage;
                const endIndex = startIndex + postsPerPage;
                
                const pageData = allPosts.slice(startIndex, endIndex);
                console.log(`📄 Client-side page ${page}: showing posts ${startIndex + 1}-${Math.min(endIndex, allPosts.length)} of ${allPosts.length}`);
                
                userPosts = [...userPosts, ...pageData];
                hasMorePosts = endIndex < allPosts.length;
                currentPage = page;
                
                console.log(`📊 Total displayed: ${userPosts.length}, hasMorePosts: ${hasMorePosts}`);
            } else {
                // Normal server-side pagination
                if (page === 1) {
                    userPosts = newPosts;
                } else {
                    userPosts = [...userPosts, ...newPosts];
                }
                
                // ✅ FIX: hasMorePosts should be true if we got a full page
                // Only set to false if we got LESS than requested
                hasMorePosts = newPosts.length >= postsPerPage;
                currentPage = page;
                
                console.log(`📊 Total posts: ${userPosts.length}, newPosts: ${newPosts.length}, hasMorePosts: ${hasMorePosts}`);
                console.log(`   Logic: ${newPosts.length} >= ${postsPerPage} = ${hasMorePosts}`);
            }
            
            renderUserPosts();
            
            // ✅ FIX: Re-setup observer after each render (sentinel is recreated)
            if (hasMorePosts) {
                setupInfiniteScroll();
            }
        } else {
            throw new Error(result.message || 'Failed to load posts');
        }
        
    } catch (error) {
        console.error('❌ Error loading user posts:', error);
        if (page === 1) {
            showPostsError('Errore nel caricamento dei post');
        } else {
            showMessage('Errore nel caricamento di altri post', 'error');
        }
    } finally {
        isLoading = false;
        hideLoadingMore();
    }
}

function renderUserPosts() {
    const postsContainer = document.getElementById('user-posts');
    
    if (userPosts.length === 0) {
        postsContainer.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📝</div>
                <h3 class="text-xl font-semibold mb-2">Nessun post ancora</h3>
                <p class="text-purple-300">${profileUser.id === currentUser.id ? 'Inizia a condividere i tuoi pensieri!' : `${profileUser.username} non ha ancora pubblicato nulla.`}</p>
            </div>
        `;
        return;
    }
    
    postsContainer.innerHTML = '';
    
    userPosts.forEach(post => {
        const postElement = createPostElement(post);
        postsContainer.appendChild(postElement);
    });
    
    // Add load more button or sentinel for infinite scroll
    if (hasMorePosts) {
        const loadMoreSentinel = document.createElement('div');
        loadMoreSentinel.id = 'load-more-sentinel';
        loadMoreSentinel.className = 'h-20 flex items-center justify-center';
        loadMoreSentinel.innerHTML = `
            <div id="loading-more" class="hidden">
                <div class="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        `;
        postsContainer.appendChild(loadMoreSentinel);
    }
    
    console.log(`📋 Rendered ${userPosts.length} posts, hasMorePosts: ${hasMorePosts}`);
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-card bg-purple-900/20 rounded-xl p-6 border border-purple-500/20 mb-4';
    postDiv.dataset.postId = post.id;
    
    const createdAt = new Date(post.created_at).toLocaleString('it-IT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Check if user can delete (support both user_id and user.id)
    const postUserId = post.user_id || (post.user && post.user.id);
    const canDelete = postUserId === currentUser.id;
    
    console.log(`🔍 Post ${post.id}: postUserId=${postUserId}, currentUser.id=${currentUser.id}, canDelete=${canDelete}`);
    
    // Avatar HTML
    const avatarHTML = profileUser.avatar_url 
        ? `<img src="${profileUser.avatar_url}" alt="${profileUser.username}" class="w-full h-full object-cover rounded-full" />`
        : profileUser.username.charAt(0).toUpperCase();
    
    postDiv.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold overflow-hidden">
                    ${avatarHTML}
                </div>
                <div>
                    <div class="font-semibold">@${profileUser.username}</div>
                    <div class="text-sm text-purple-300">${createdAt}</div>
                </div>
            </div>
            ${canDelete ? `
                <button onclick="deletePost(${post.id})" class="p-2 text-purple-300 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Elimina post">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            ` : ''}
        </div>
        
        <p class="text-purple-100 mb-4">${post.content}</p>
        
        ${post.media && post.media.length > 0 ? `
            <div class="mb-4">
                ${post.media.length === 1 ? `
                    ${post.media[0].type === 'image' ? `
                        <img src="${post.media[0].url}" alt="Post media" class="w-full rounded-xl max-h-96 object-cover cursor-pointer" onclick="openMediaModal(${post.id})" />
                    ` : post.media[0].type === 'video' ? `
                        <video src="${post.media[0].url}" class="w-full rounded-xl max-h-96 object-cover" controls></video>
                    ` : post.media[0].type === 'audio' ? `
                        <div class="bg-purple-900/30 rounded-xl p-4 flex items-center gap-3">
                            <div class="text-3xl">🎵</div>
                            <audio src="${post.media[0].url}" class="flex-1" controls></audio>
                        </div>
                    ` : ''}
                ` : `
                    <div class="grid grid-cols-2 gap-2">
                        ${post.media.slice(0, 4).map((media, idx) => `
                            <div class="relative ${idx === 3 && post.media.length > 4 ? 'cursor-pointer' : ''}" onclick="openMediaModal(${post.id})">
                                ${media.type === 'image' ? `
                                    <img src="${media.url}" alt="Media ${idx + 1}" class="w-full h-48 object-cover rounded-lg" />
                                ` : media.type === 'video' ? `
                                    <video src="${media.url}" class="w-full h-48 object-cover rounded-lg" muted></video>
                                    <div class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                                        <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z"/>
                                        </svg>
                                    </div>
                                ` : ''}
                                ${idx === 3 && post.media.length > 4 ? `
                                    <div class="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                                        <span class="text-white text-2xl font-bold">+${post.media.length - 4}</span>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        ` : post.image_url ? `
            <div class="mb-4">
                <img src="${post.image_url}" alt="Post image" class="w-full rounded-xl max-h-96 object-cover cursor-pointer" onclick="openMediaModal(${post.id})" />
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

// ============================================
// TABS FUNCTIONALITY
// ============================================
function initTabs() {
    const tabButtons = document.querySelectorAll('.profile-tab');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    
    // Load tab-specific content
    switch(tabName) {
        case 'posts':
            // Already loaded
            break;
        case 'media':
            loadUserMedia();
            break;
        case 'likes':
            loadUserLikes();
            break;
    }
}

async function loadUserMedia() {
    const mediaContainer = document.getElementById('user-media');
    
    // Filter posts with media (image_url OR media array)
    const mediaPosts = userPosts.filter(post => {
        return post.image_url || (post.media && post.media.length > 0);
    });
    
    if (mediaPosts.length === 0) {
        mediaContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-6xl mb-4">🖼️</div>
                <h3 class="text-xl font-semibold mb-2">Nessun media</h3>
                <p class="text-purple-300">Non ci sono ancora immagini o video condivisi.</p>
            </div>
        `;
        return;
    }
    
    mediaContainer.innerHTML = '';
    
    mediaPosts.forEach(post => {
        // Get first media item (legacy image_url or first item in media array)
        let mediaUrl, mediaType;
        if (post.media && post.media.length > 0) {
            mediaUrl = post.media[0].url;
            mediaType = post.media[0].type;
        } else if (post.image_url) {
            mediaUrl = post.image_url;
            mediaType = 'image';
        }
        
        const mediaElement = document.createElement('div');
        mediaElement.className = 'relative group cursor-pointer rounded-xl overflow-hidden aspect-square';
        mediaElement.onclick = () => openMediaModal(post);
        
        // Show image or video thumbnail
        if (mediaType === 'video') {
            mediaElement.innerHTML = `
                <video src="${mediaUrl}" class="w-full h-full object-cover" muted></video>
                <div class="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">🎥</div>
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div class="text-white text-center">
                        <div class="flex items-center gap-4 text-sm">
                            <span class="flex items-center gap-1">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                </svg>
                                ${post.likes_count}
                            </span>
                            <span class="flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                                </svg>
                                ${post.comments_count}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            mediaElement.innerHTML = `
                <img src="${mediaUrl}" alt="Media" class="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ${post.media && post.media.length > 1 ? `<div class="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">+${post.media.length - 1}</div>` : ''}
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div class="text-white text-center">
                        <div class="flex items-center gap-4 text-sm">
                            <span class="flex items-center gap-1">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                </svg>
                                ${post.likes_count}
                            </span>
                            <span class="flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                                </svg>
                                ${post.comments_count}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        mediaContainer.appendChild(mediaElement);
    });
}

async function loadUserLikes() {
    const likesContainer = document.getElementById('user-likes');
    
    // TODO: Implement API endpoint for user's liked posts
    likesContainer.innerHTML = `
        <div class="text-center py-12">
            <div class="text-6xl mb-4">❤️</div>
            <h3 class="text-xl font-semibold mb-2">Post piaciuti</h3>
            <p class="text-purple-300">Funzionalità in arrivo! 🚀</p>
        </div>
    `;
}

// ============================================
// INTERACTIONS
// ============================================
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

function openMessageModal(userId) {
    showMessage('Sistema messaggi in arrivo! 💬', 'info');
}

function shareProfile() {
    const shareUrl = `${window.location.origin}/profile.html?id=${profileUser.id}`;
    
    if (navigator.share) {
        navigator.share({
            title: `Profilo di ${profileUser.username} su Zone4Love`,
            text: `Guarda il profilo di ${profileUser.username}`,
            url: shareUrl
        });
    } else {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showMessage('Link profilo copiato! 📋', 'success');
        }).catch(() => {
            showMessage('Errore nella condivisione', 'error');
        });
    }
}

function openEditProfileModal() {
    showMessage('Modifica profilo in arrivo! ✏️', 'info');
}

function openSettingsModal() {
    window.location.href = 'settings.html';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// ============================================
// INFINITE SCROLL SETUP
// ============================================
let scrollObserver = null;

function setupInfiniteScroll() {
    console.log('🔄 Setting up infinite scroll...');
    
    // Disconnect previous observer if exists
    if (scrollObserver) {
        scrollObserver.disconnect();
        console.log('🔌 Disconnected previous observer');
    }
    
    // Create new observer
    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && hasMorePosts && !isLoading) {
                console.log('👀 Sentinel visible, loading more posts...');
                loadUserPosts(currentPage + 1);
            }
        });
    }, {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    });
    
    // Observe the sentinel
    const observeSentinel = () => {
        const sentinel = document.getElementById('load-more-sentinel');
        if (sentinel) {
            scrollObserver.observe(sentinel);
            console.log(`✅ Infinite scroll observer attached to sentinel (page ${currentPage})`);
        } else {
            console.log('⚠️ Sentinel not found, will retry...');
            setTimeout(observeSentinel, 100);
        }
    };
    
    observeSentinel();
}

function showLoadingMore() {
    const loadingMore = document.getElementById('loading-more');
    if (loadingMore) {
        loadingMore.classList.remove('hidden');
    }
}

function hideLoadingMore() {
    const loadingMore = document.getElementById('loading-more');
    if (loadingMore) {
        loadingMore.classList.add('hidden');
    }
}

function showPostsLoading() {
    const postsContainer = document.getElementById('user-posts');
    postsContainer.innerHTML = `
        <div class="text-center py-12">
            <div class="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p class="text-purple-300">Caricamento post...</p>
        </div>
    `;
}

function showPostsError(message) {
    const postsContainer = document.getElementById('user-posts');
    postsContainer.innerHTML = `
        <div class="text-center py-12">
            <div class="text-6xl mb-4">⚠️</div>
            <h3 class="text-xl font-semibold mb-2">Oops!</h3>
            <p class="text-purple-300 mb-6">${message}</p>
            <button onclick="loadUserPosts()" class="px-6 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all font-semibold">
                Riprova
            </button>
        </div>
    `;
}

function showError(message) {
    document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center">
            <div class="text-center">
                <div class="text-6xl mb-4">😵</div>
                <h1 class="text-2xl font-bold mb-4">Errore</h1>
                <p class="text-purple-300 mb-6">${message}</p>
                <a href="dashboard.html" class="px-6 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transition-all font-semibold">
                    Torna alla Dashboard
                </a>
            </div>
        </div>
    `;
}

// Utility function to show messages (reuse from dashboard.js)
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
    console.log('🎨 Initializing animations...');
    
    // ✅ FIX: Ensure all elements are visible first (reset any stuck animations)
    gsap.set('body', { opacity: 1 });
    gsap.set('main', { opacity: 1 });
    gsap.set('.bg-black\\/40', { opacity: 1 });
    gsap.set('[class*="bg-black/"]', { opacity: 1 });
    
    // Animate profile header cards
    const profileCards = document.querySelectorAll('.bg-black\\/40, [class*="bg-black/"]');
    console.log(`📦 Found ${profileCards.length} profile cards to animate`);
    
    if (profileCards.length > 0) {
        gsap.from(profileCards, {
            opacity: 0,
            y: 30,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power3.out',
            onComplete: () => {
                console.log('✅ Profile cards animation complete');
                // Ensure final state
                gsap.set(profileCards, { opacity: 1, y: 0 });
            }
        });
    }
    
    // Animate tabs
    const tabs = document.querySelectorAll('.profile-tab');
    console.log(`📑 Found ${tabs.length} tabs to animate`);
    
    if (tabs.length > 0) {
        gsap.from(tabs, {
            opacity: 0,
            y: 20,
            duration: 0.6,
            stagger: 0.1,
            delay: 0.4,
            ease: 'power2.out',
            onComplete: () => {
                console.log('✅ Tabs animation complete');
                gsap.set(tabs, { opacity: 1, y: 0 });
            }
        });
    }
}

// ============================================
// POST INTERACTIONS
// ============================================
async function toggleLike(postId) {
    try {
        const post = userPosts.find(p => p.id == postId);
        if (!post) return;
        
        const endpoint = post.is_liked ? 'unlike' : 'like';
        const method = post.is_liked ? 'DELETE' : 'POST';
        
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
        
    } catch (error) {
        console.error('Error toggling like:', error);
        showMessage('Errore nel like del post', 'error');
    }
}

// ============================================
// COMMENTS SYSTEM
// ============================================
let currentPostId = null;
let comments = [];

async function showComments(postId) {
    currentPostId = postId;
    console.log(`💬 Opening comments for post ${postId}...`);
    
    // Open modal
    const modal = document.getElementById('comments-modal');
    modal.classList.remove('hidden');
    
    // Animate modal
    gsap.fromTo(modal.querySelector('.bg-gradient-to-br'),
        { opacity: 0, scale: 0.9, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power2.out' }
    );
    
    // Load comments
    await loadComments(postId);
    
    // Setup form
    const form = document.getElementById('add-comment-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        handleAddComment();
    };
    
    // Setup emoji picker
    initCommentEmojiPicker();
}

// ============================================
// COMMENT EMOJI PICKER
// ============================================
function initCommentEmojiPicker() {
    const emojiBtn = document.getElementById('comment-emoji-btn');
    const emojiPicker = document.getElementById('comment-emoji-picker');
    const emojiGrid = emojiPicker.querySelector('.grid');
    
    // Emoji categories
    const emojis = [
        // Smileys
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
        '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
        '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
        '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
        // Hearts & Love
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
        '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘',
        '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️',
        // Gestures
        '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️',
        '🤟', '🤘', '👌', '🤏', '👈', '👉', '👆', '👇',
        '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌',
        // Celebrations
        '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉',
        '⭐', '🌟', '✨', '💫', '🔥', '💥', '💯', '✅',
        // Nature
        '🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '💐', '🌿',
        '🍀', '🌈', '☀️', '🌙', '⭐', '💧', '❄️', '⚡',
        // Food
        '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚',
        '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯',
        // Objects
        '💻', '📱', '⌨️', '🖥️', '🖨️', '🖱️', '💾', '💿',
        '📀', '🎮', '🕹️', '🎧', '🎤', '🎬', '📷', '📸'
    ];
    
    // Populate emoji grid
    emojiGrid.innerHTML = '';
    emojis.forEach(emoji => {
        const emojiBtn = document.createElement('button');
        emojiBtn.type = 'button';
        emojiBtn.className = 'text-2xl hover:scale-125 transition-transform cursor-pointer p-2 hover:bg-purple-500/20 rounded';
        emojiBtn.textContent = emoji;
        emojiBtn.onclick = () => insertCommentEmoji(emoji);
        emojiGrid.appendChild(emojiBtn);
    });
    
    // Toggle emoji picker
    emojiBtn.onclick = (e) => {
        e.stopPropagation();
        emojiPicker.classList.toggle('hidden');
        
        if (!emojiPicker.classList.contains('hidden')) {
            gsap.fromTo(emojiPicker,
                { opacity: 0, y: -10 },
                { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
            );
        }
    };
    
    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
            if (!emojiPicker.classList.contains('hidden')) {
                closeCommentEmojiPicker();
            }
        }
    });
}

function insertCommentEmoji(emoji) {
    const input = document.getElementById('comment-input');
    const cursorPos = input.selectionStart;
    const textBefore = input.value.substring(0, cursorPos);
    const textAfter = input.value.substring(cursorPos);
    
    input.value = textBefore + emoji + textAfter;
    
    // Set cursor after emoji
    const newCursorPos = cursorPos + emoji.length;
    input.setSelectionRange(newCursorPos, newCursorPos);
    input.focus();
    
    // Animate emoji button
    const emojiBtn = document.getElementById('comment-emoji-btn');
    gsap.fromTo(emojiBtn,
        { scale: 1 },
        { scale: 1.2, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.out' }
    );
}

function closeCommentEmojiPicker() {
    const emojiPicker = document.getElementById('comment-emoji-picker');
    gsap.to(emojiPicker, {
        opacity: 0,
        y: -10,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: () => {
            emojiPicker.classList.add('hidden');
        }
    });
}

function closeCommentsModal() {
    const modal = document.getElementById('comments-modal');
    const modalContent = modal.querySelector('.bg-gradient-to-br');
    
    gsap.to(modalContent, {
        opacity: 0,
        scale: 0.9,
        y: 20,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
            modal.classList.add('hidden');
            currentPostId = null;
            comments = [];
        }
    });
}

async function loadComments(postId) {
    const commentsList = document.getElementById('comments-list');
    
    // Show loading
    commentsList.innerHTML = `
        <div class="text-center py-8">
            <div class="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p class="text-purple-300">Caricamento commenti...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            comments = result.data;
            console.log(`✅ Loaded ${comments.length} comments`);
            renderComments();
        } else {
            throw new Error(result.message || 'Failed to load comments');
        }
        
    } catch (error) {
        console.error('❌ Error loading comments:', error);
        commentsList.innerHTML = `
            <div class="text-center py-8">
                <div class="text-4xl mb-4">💬</div>
                <p class="text-purple-300">Nessun commento ancora</p>
                <p class="text-sm text-purple-400 mt-2">Sii il primo a commentare!</p>
            </div>
        `;
    }
}

function renderComments() {
    const commentsList = document.getElementById('comments-list');
    
    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div class="text-center py-8">
                <div class="text-4xl mb-4">💬</div>
                <p class="text-purple-300">Nessun commento ancora</p>
                <p class="text-sm text-purple-400 mt-2">Sii il primo a commentare!</p>
            </div>
        `;
        return;
    }
    
    commentsList.innerHTML = '';
    
    comments.forEach(comment => {
        const commentEl = createCommentElement(comment);
        commentsList.appendChild(commentEl);
    });
    
    // ✅ Auto-scroll to bottom to show new comments
    setTimeout(() => {
        commentsList.scrollTop = commentsList.scrollHeight;
    }, 100);
}

function createCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'bg-purple-900/20 rounded-xl p-4 border border-purple-500/20';
    commentDiv.dataset.commentId = comment.id;
    
    const createdAt = new Date(comment.created_at).toLocaleString('it-IT', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const username = comment.user?.username || comment.username || 'Utente';
    const isOwnComment = comment.user_id === currentUser.id || comment.user?.id === currentUser.id;
    
    commentDiv.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold flex-shrink-0">
                ${username.charAt(0).toUpperCase()}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                    <span class="font-semibold">@${username}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-purple-400">${createdAt}</span>
                        ${isOwnComment ? `
                            <button onclick="deleteComment(${comment.id})" class="text-purple-400 hover:text-red-400 transition-colors" title="Elimina commento">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <p class="text-purple-100">${comment.content}</p>
            </div>
        </div>
    `;
    
    return commentDiv;
}

async function handleAddComment() {
    const input = document.getElementById('comment-input');
    const content = input.value.trim();
    
    if (!content) return;
    
    try {
        console.log(`📝 Adding comment to post ${currentPostId}...`);
        
        const response = await fetch(`${API_BASE_URL}/posts/${currentPostId}/comments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Comment added');
            
            // Add to local state
            comments.push(result.data);
            
            // Update UI
            renderComments();
            
            // Clear input
            input.value = '';
            
            // Update comment count in post
            const post = userPosts.find(p => p.id === currentPostId);
            if (post) {
                post.comments_count = (post.comments_count || 0) + 1;
                const postElement = document.querySelector(`[data-post-id="${currentPostId}"]`);
                const commentButton = postElement.querySelector('button[onclick*="showComments"]');
                const commentCount = commentButton.querySelector('span');
                commentCount.textContent = post.comments_count;
                
                // Animate
                gsap.fromTo(commentCount,
                    { scale: 1 },
                    { scale: 1.3, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' }
                );
            }
            
            showMessage('💬 Commento aggiunto!', 'success');
            
        } else {
            throw new Error(result.message || 'Failed to add comment');
        }
        
    } catch (error) {
        console.error('❌ Error adding comment:', error);
        showMessage('Errore nell\'aggiunta del commento', 'error');
    }
}

async function deleteComment(commentId) {
    if (!confirm('Sei sicuro di voler eliminare questo commento?')) return;
    
    try {
        console.log(`🗑️ Deleting comment ${commentId}...`);
        
        // ✅ FIX: Correct endpoint format (post_id/comments/comment_id)
        const response = await fetch(`${API_BASE_URL}/posts/${currentPostId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log('✅ Comment deleted from backend');
        
        // Remove from local state
        comments = comments.filter(c => c.id !== commentId);
        
        // Animate removal
        const commentEl = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentEl) {
            gsap.to(commentEl, {
                opacity: 0,
                height: 0,
                marginBottom: 0,
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    commentEl.remove();
                    
                    // Re-render if no comments left
                    if (comments.length === 0) {
                        renderComments();
                    }
                }
            });
        }
        
        // Update comment count in post
        const post = userPosts.find(p => p.id === currentPostId);
        if (post) {
            post.comments_count = Math.max(0, (post.comments_count || 0) - 1);
            const postElement = document.querySelector(`[data-post-id="${currentPostId}"]`);
            if (postElement) {
                const commentButton = postElement.querySelector('button[onclick*="showComments"]');
                if (commentButton) {
                    const commentCount = commentButton.querySelector('span');
                    if (commentCount) {
                        commentCount.textContent = post.comments_count;
                    }
                }
            }
        }
        
        showMessage('🗑️ Commento eliminato', 'success');
        
    } catch (error) {
        console.error('❌ Error deleting comment:', error);
        showMessage('Errore nell\'eliminazione del commento', 'error');
    }
}

function sharePost(postId) {
    const post = userPosts.find(p => p.id == postId);
    if (!post) return;
    
    const shareUrl = `${window.location.origin}/profile.html?id=${profileUser.id}`;
    const shareText = `Guarda questo post di ${profileUser.username} su Zone4Love!`;
    
    if (navigator.share) {
        navigator.share({
            title: `Post di ${profileUser.username}`,
            text: shareText,
            url: shareUrl
        }).then(() => {
            showMessage('📤 Condiviso!', 'success');
        }).catch((error) => {
            if (error.name !== 'AbortError') {
                console.error('Error sharing:', error);
            }
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            showMessage('🔗 Link copiato negli appunti!', 'success');
        }).catch(() => {
            showMessage('Errore nella condivisione', 'error');
        });
    }
}

async function deletePost(postId) {
    if (!confirm('Sei sicuro di voler eliminare questo post?')) return;
    
    try {
        console.log(`🗑️ Deleting post ${postId}...`);
        
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log('✅ Post deleted from backend');
        
        // Remove from local state
        userPosts = userPosts.filter(p => p.id !== postId);
        
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
        
        // Update stats if viewing own profile
        if (profileUser.id === currentUser.id) {
            console.log('🔄 Updating stats after post deletion...');
            await loadUserStats(currentUser.id);
            
            // Update stats display
            document.getElementById('posts-count').textContent = formatNumber(profileUser.posts_count || 0);
            
            // Animate the posts counter
            const postsCountEl = document.getElementById('posts-count');
            if (postsCountEl) {
                gsap.fromTo(postsCountEl,
                    { scale: 1 },
                    { scale: 0.95, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' }
                );
            }
        }
        
    } catch (error) {
        console.error('❌ Error deleting post:', error);
        showMessage('Errore nell\'eliminazione del post', 'error');
    }
}

function openMediaModal(post) {
    // TODO: Implement media modal
    showMessage('Visualizzazione media in arrivo! 🖼️', 'info');
}

// ============================================
// EDIT PROFILE
// ============================================
let selectedAvatarFile = null;

function initEditProfileButton() {
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
        editBtn.onclick = openEditProfileModal;
    }
}

function openEditProfileModal() {
    console.log('✏️ Opening edit profile modal...');
    
    const modal = document.getElementById('edit-profile-modal');
    modal.classList.remove('hidden');
    
    // Animate modal
    gsap.fromTo(modal.querySelector('.bg-gradient-to-br'),
        { opacity: 0, scale: 0.9, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power2.out' }
    );
    
    // Populate form with current data
    populateEditForm();
    
    // Setup form submission
    const form = document.getElementById('edit-profile-form');
    form.onsubmit = handleEditProfileSubmit;
    
    // Setup avatar input
    const avatarInput = document.getElementById('avatar-input');
    avatarInput.onchange = handleAvatarSelect;
    
    // Setup bio counter
    const bioTextarea = document.getElementById('edit-bio');
    bioTextarea.oninput = updateBioCounter;
}

function populateEditForm() {
    // Avatar preview
    const avatarPreview = document.getElementById('avatar-preview');
    if (profileUser.avatar_url) {
        avatarPreview.innerHTML = `<img src="${profileUser.avatar_url}" alt="Avatar" class="w-full h-full object-cover rounded-full" />`;
    } else {
        avatarPreview.innerHTML = profileUser.username.charAt(0).toUpperCase();
    }
    
    // Form fields
    document.getElementById('edit-username').value = profileUser.username || '';
    document.getElementById('edit-email').value = profileUser.email || '';
    document.getElementById('edit-bio').value = profileUser.bio || '';
    document.getElementById('edit-birthdate').value = profileUser.birthdate || '';
    document.getElementById('edit-location').value = profileUser.location || '';
    document.getElementById('edit-website').value = profileUser.website || '';
    
    // Update bio counter
    updateBioCounter();
}

function handleAvatarSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
        showMessage('❌ Seleziona un\'immagine valida', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showMessage('❌ L\'immagine deve essere massimo 5MB', 'error');
        return;
    }
    
    selectedAvatarFile = file;
    
    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const avatarPreview = document.getElementById('avatar-preview');
        avatarPreview.innerHTML = `<img src="${e.target.result}" alt="Avatar" class="w-full h-full object-cover" />`;
        
        // Animate
        gsap.fromTo(avatarPreview,
            { scale: 0.9, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
    };
    reader.readAsDataURL(file);
    
    console.log('📸 Avatar selected:', file.name);
}

function updateBioCounter() {
    const bioTextarea = document.getElementById('edit-bio');
    const counter = document.getElementById('bio-counter');
    const length = bioTextarea.value.length;
    counter.textContent = `${length}/500`;
    
    if (length > 450) {
        counter.classList.add('text-pink-500');
    } else {
        counter.classList.remove('text-pink-500');
    }
}

async function handleEditProfileSubmit(e) {
    e.preventDefault();
    
    console.log('💾 Saving profile changes...');
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto"></div>';
    submitBtn.disabled = true;
    
    try {
        // Collect form data
        const formData = {
            username: document.getElementById('edit-username').value.trim(),
            email: document.getElementById('edit-email').value.trim(),
            bio: document.getElementById('edit-bio').value.trim() || null,
            birthdate: document.getElementById('edit-birthdate').value || null,
            location: document.getElementById('edit-location').value.trim() || null,
            website: document.getElementById('edit-website').value.trim() || null
        };
        
        // Upload avatar if selected
        if (selectedAvatarFile) {
            try {
                console.log('📤 Uploading avatar...');
                const avatarUrl = await uploadAvatar(selectedAvatarFile);
                formData.avatar_url = avatarUrl;
                console.log('✅ Avatar uploaded:', avatarUrl);
            } catch (uploadError) {
                console.error('❌ Avatar upload failed:', uploadError);
                showMessage('⚠️ Errore upload avatar, salvo altri dati...', 'warning');
                // Continue without avatar update
            }
        }
        
        // Update profile (use /users/me endpoint)
        console.log('📡 Updating profile with data:', formData);
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Profile updated successfully');
            console.log('📦 Updated user data from API:', result.data);
            
            // Update local data with response from API (includes avatar_url)
            profileUser = { ...profileUser, ...result.data };
            currentUser = { ...currentUser, ...result.data };
            
            console.log('✅ profileUser updated:', profileUser);
            console.log('✅ Avatar URL in profileUser:', profileUser.avatar_url);
            
            // Update session storage
            const session = getSession();
            if (session) {
                session.user = currentUser;
                const storage = sessionStorage.getItem('zone4love_session') ? sessionStorage : localStorage;
                storage.setItem('zone4love_session', JSON.stringify(session));
            }
            
            // Update UI
            renderProfile();
            
            // Close modal
            closeEditProfileModal();
            
            // Show success message
            showMessage('✅ Profilo aggiornato con successo!', 'success');
            
            // Reset avatar selection
            selectedAvatarFile = null;
        } else {
            throw new Error(result.message || 'Failed to update profile');
        }
        
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        showMessage(`Errore: ${error.message}`, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function uploadAvatar(file) {
    const token = getAccessToken();
    
    console.log('📤 Starting avatar upload...', {
        name: file.name,
        size: file.size,
        type: file.type,
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPreview: token?.substring(0, 20) + '...'
    });
    
    if (!token) {
        throw new Error('No authentication token found. Please login again.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        console.log('🔑 Authorization header:', `Bearer ${token.substring(0, 20)}...`);
        
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Upload-Type': 'avatar'
            },
            body: formData
        });
        
        console.log('📡 Upload response status:', response.status);
        console.log('📡 Upload response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Upload failed:', errorText);
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📦 Upload result:', result);
        
        if (result.success && result.data && result.data.url) {
            return result.data.url;
        }
        
        throw new Error('Invalid upload response format');
        
    } catch (error) {
        console.error('❌ Upload error:', error);
        throw error;
    }
}

function closeEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    const modalContent = modal.querySelector('.bg-gradient-to-br');
    
    gsap.to(modalContent, {
        opacity: 0,
        scale: 0.9,
        y: 20,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
            modal.classList.add('hidden');
            selectedAvatarFile = null;
        }
    });
}

// Initialize edit profile button on page load
document.addEventListener('DOMContentLoaded', () => {
    initEditProfileButton();
});
