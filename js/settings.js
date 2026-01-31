// Settings Page JavaScript

// API_BASE_URL is already defined in auth.js (loaded before this script)
// No need to redeclare it here

// Global state
let currentUser = null;
let hasUnsavedChanges = false;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();
    
    // Load user data
    loadUserSettings();
    
    // Initialize components
    initNavigation();
    initForms();
    initAnimations();
    
    console.log('⚙️ Settings page initialized');
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
// USER SETTINGS LOADING
// ============================================
async function loadUserSettings() {
    try {
        // For now, use current user data
        // TODO: Load extended user settings from API
        populateUserData(currentUser);
        
    } catch (error) {
        console.error('Error loading user settings:', error);
        showMessage('Errore nel caricamento delle impostazioni', 'error');
    }
}

function populateUserData(user) {
    // Update avatar
    const avatar = document.getElementById('current-avatar');
    avatar.textContent = user.username.charAt(0).toUpperCase();
    
    // Populate form fields
    document.getElementById('username').value = user.username || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('bio').value = user.bio || '';
    document.getElementById('birthdate').value = user.birthdate || '';
    document.getElementById('website').value = user.website || '';
}

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    const navItems = document.querySelectorAll('.settings-nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            switchSection(section);
        });
    });
}

function switchSection(sectionName) {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
        if (!confirm('Hai modifiche non salvate. Vuoi continuare senza salvare?')) {
            return;
        }
        hasUnsavedChanges = false;
    }
    
    // Update navigation
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Show/hide sections
    document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(`${sectionName}-section`).classList.remove('hidden');
    
    // Animate section change
    gsap.fromTo(`#${sectionName}-section`, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );
}

// ============================================
// FORMS HANDLING
// ============================================
function initForms() {
    // Account form
    const accountForm = document.getElementById('account-form');
    if (accountForm) {
        accountForm.addEventListener('submit', handleAccountUpdate);
        
        // Track changes
        const inputs = accountForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                hasUnsavedChanges = true;
                showUnsavedIndicator();
            });
        });
    }
    
    // Privacy toggles
    initPrivacyToggles();
}

async function handleAccountUpdate(event) {
    event.preventDefault();
    
    const formData = {
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        bio: document.getElementById('bio').value.trim(),
        birthdate: document.getElementById('birthdate').value,
        website: document.getElementById('website').value.trim()
    };
    
    // Validation
    if (!formData.username || !formData.email) {
        showMessage('Username e email sono obbligatori', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Salvando...';
    submitBtn.disabled = true;
    
    try {
        // TODO: Implement actual API call
        // const response = await fetch(`${API_BASE_URL}/users/me`, {
        //     method: 'PUT',
        //     headers: getAuthHeaders(),
        //     body: JSON.stringify(formData)
        // });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update local user data
        Object.assign(currentUser, formData);
        
        // Update session storage
        const session = getSession();
        session.user = currentUser;
        localStorage.setItem('zone4love_session', JSON.stringify(session));
        
        hasUnsavedChanges = false;
        hideUnsavedIndicator();
        showMessage('Impostazioni salvate con successo! ✅', 'success');
        
    } catch (error) {
        console.error('Error updating account:', error);
        showMessage('Errore nel salvataggio delle impostazioni', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function initPrivacyToggles() {
    const toggles = document.querySelectorAll('input[type="checkbox"]');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('change', async () => {
            await handlePrivacySetting(toggle.id, toggle.checked);
        });
    });
}

async function handlePrivacySetting(settingName, value) {
    try {
        // TODO: Implement actual API call
        // const response = await fetch(`${API_BASE_URL}/users/me/privacy`, {
        //     method: 'PUT',
        //     headers: getAuthHeaders(),
        //     body: JSON.stringify({ [settingName]: value })
        // });
        
        console.log(`Privacy setting ${settingName} set to ${value}`);
        showMessage(`Impostazione ${settingName} aggiornata`, 'success');
        
    } catch (error) {
        console.error('Error updating privacy setting:', error);
        showMessage('Errore nell\'aggiornamento dell\'impostazione', 'error');
    }
}

// ============================================
// UI HELPERS
// ============================================
function showUnsavedIndicator() {
    // Add indicator to save button
    const saveBtn = document.querySelector('#account-form button[type="submit"]');
    if (saveBtn && !saveBtn.textContent.includes('*')) {
        saveBtn.textContent = saveBtn.textContent + ' *';
        saveBtn.classList.add('animate-pulse');
    }
}

function hideUnsavedIndicator() {
    const saveBtn = document.querySelector('#account-form button[type="submit"]');
    if (saveBtn) {
        saveBtn.textContent = 'Salva Modifiche';
        saveBtn.classList.remove('animate-pulse');
    }
}

// ============================================
// ANIMATIONS
// ============================================
function initAnimations() {
    // Animate settings navigation
    gsap.from('.settings-nav-item', {
        opacity: 0,
        x: -30,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out'
    });
    
    // Animate main content
    gsap.from('.settings-section:not(.hidden)', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.3,
        ease: 'power3.out'
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
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

// Warn before leaving with unsaved changes
window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});
