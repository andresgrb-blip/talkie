// Authentication JavaScript

// API Configuration - relative path since frontend is served by same server
const API_BASE_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize GSAP animations
    initAnimations();
    
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        handleLoginForm(loginForm);
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        handleRegisterForm(registerForm);
    }
    
    // Password toggle
    initPasswordToggle();
});

// ============================================
// ANIMATIONS
// ============================================
function initAnimations() {
    // Set initial state to visible
    gsap.set('.auth-container', { opacity: 1 });
    gsap.set('.form-group', { opacity: 1 });
    
    // Animate auth container
    gsap.from('.auth-container', {
        scale: 0.95,
        y: 30,
        duration: 0.6,
        ease: 'power3.out'
    });
    
    // Animate form elements
    gsap.from('.form-group', {
        y: 20,
        duration: 0.4,
        stagger: 0.1,
        delay: 0.3,
        ease: 'power2.out'
    });
}

// ============================================
// LOGIN FORM
// ============================================
function handleLoginForm(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = form.email.value;
        const password = form.password.value;
        const remember = form.remember.checked;
        
        // Clear previous messages
        hideMessage('error-message');
        hideMessage('success-message');
        
        // Validation
        if (!email || !password) {
            showMessage('error-message', 'Compila tutti i campi');
            return;
        }
        
        // Show loading state
        setButtonLoading(true);
        
        // Call backend API
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            // Store tokens
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem('zone4love_access_token', data.data.access_token);
            storage.setItem('zone4love_refresh_token', data.data.refresh_token);
            storage.setItem('zone4love_user', JSON.stringify(data.data.user));
            
            // Backward compatibility
            storage.setItem('zone4love_session', data.data.access_token);
            
            // Show success and redirect
            showMessage('success-message', 'Login effettuato! Reindirizzamento...');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            showMessage('error-message', error.message || 'Credenziali non valide. Riprova.');
            setButtonLoading(false);
        }
    });
}

// ============================================
// REGISTER FORM
// ============================================
function handleRegisterForm(form) {
    const passwordInput = form.querySelector('#password');
    const confirmPasswordInput = form.querySelector('#confirm-password');
    
    // Password strength indicator
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            checkPasswordStrength(e.target.value);
        });
    }
    
    // Confirm password validation
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', (e) => {
            validatePasswordMatch(passwordInput.value, e.target.value);
        });
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = form.username.value;
        const email = form.email.value;
        const password = form.password.value;
        const confirmPassword = form['confirm-password'].value;
        const birthdate = form.birthdate.value;
        const terms = form.terms.checked;
        
        // Clear previous messages
        hideMessage('error-message');
        hideMessage('success-message');
        
        // Validation
        if (!username || !email || !password || !confirmPassword || !birthdate) {
            showMessage('error-message', 'Compila tutti i campi obbligatori');
            return;
        }
        
        if (username.length < 3) {
            showMessage('error-message', 'Username deve essere almeno 3 caratteri');
            return;
        }
        
        if (password.length < 8) {
            showMessage('error-message', 'Password deve essere almeno 8 caratteri');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('error-message', 'Le password non coincidono');
            return;
        }
        
        if (!terms) {
            showMessage('error-message', 'Devi accettare i termini di servizio');
            return;
        }
        
        // Age validation
        const age = calculateAge(birthdate);
        if (age < 13) {
            showMessage('error-message', 'Devi avere almeno 13 anni per registrarti');
            return;
        }
        
        // Show loading state
        setButtonLoading(true);
        
        // Call backend API
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password,
                    birthdate: birthdate
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }
            
            // Show success and redirect
            showMessage('success-message', 'Account creato! Reindirizzamento al login...');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('error-message', error.message || 'Errore durante la registrazione. Riprova.');
            setButtonLoading(false);
        }
    });
}

// ============================================
// PASSWORD UTILITIES
// ============================================
function initPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-password, #toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.closest('.input-wrapper').querySelector('input');
            
            if (input.type === 'password') {
                input.type = 'text';
                button.innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                `;
            } else {
                input.type = 'password';
                button.innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                `;
            }
            
            // Animate the transition
            gsap.from(input, {
                scale: 1.02,
                duration: 0.2,
                ease: 'power2.out'
            });
        });
    });
}

function checkPasswordStrength(password) {
    const strengthBars = [
        document.getElementById('strength-1'),
        document.getElementById('strength-2'),
        document.getElementById('strength-3'),
        document.getElementById('strength-4')
    ];
    
    const strengthText = document.getElementById('strength-text');
    
    if (!strengthBars[0] || !strengthText) return;
    
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    // Reset all bars
    strengthBars.forEach(bar => {
        bar.className = 'flex-1 bg-purple-900/30 rounded transition-all';
    });
    
    // Update bars based on strength
    for (let i = 0; i < strength; i++) {
        if (strength === 1) {
            strengthBars[i].classList.add('strength-weak');
        } else if (strength === 2 || strength === 3) {
            strengthBars[i].classList.add('strength-medium');
        } else {
            strengthBars[i].classList.add('strength-strong');
        }
    }
    
    // Update text
    const strengthLabels = ['Molto debole', 'Debole', 'Media', 'Forte'];
    const strengthColors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400'];
    
    if (strength > 0) {
        strengthText.textContent = strengthLabels[strength - 1];
        strengthText.className = `text-xs mt-1 ${strengthColors[strength - 1]}`;
    } else {
        strengthText.textContent = 'Minimo 8 caratteri';
        strengthText.className = 'text-xs text-purple-300 mt-1';
    }
}

function validatePasswordMatch(password, confirmPassword) {
    const confirmInput = document.getElementById('confirm-password');
    if (!confirmInput) return;
    
    if (confirmPassword.length > 0) {
        if (password === confirmPassword) {
            confirmInput.classList.remove('invalid');
            confirmInput.classList.add('valid');
        } else {
            confirmInput.classList.remove('valid');
            confirmInput.classList.add('invalid');
        }
    } else {
        confirmInput.classList.remove('valid', 'invalid');
    }
}

// ============================================
// UI UTILITIES
// ============================================
function showMessage(elementId, message) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.querySelector('p').textContent = message;
    element.classList.remove('hidden');
    
    // Animate
    gsap.from(element, {
        opacity: 0,
        y: -10,
        duration: 0.3,
        ease: 'power2.out'
    });
}

function hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.classList.add('hidden');
}

function setButtonLoading(isLoading) {
    const buttonText = document.getElementById('button-text');
    const buttonLoader = document.getElementById('button-loader');
    const submitButton = document.querySelector('button[type="submit"]');
    
    if (isLoading) {
        buttonText.classList.add('hidden');
        buttonLoader.classList.remove('hidden');
        submitButton.disabled = true;
    } else {
        buttonText.classList.remove('hidden');
        buttonLoader.classList.add('hidden');
        submitButton.disabled = false;
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function calculateAge(birthdate) {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

// Check if user is already logged in
function checkAuth() {
    const session = localStorage.getItem('zone4love_session') || sessionStorage.getItem('zone4love_session');
    return !!session;
}

// Get access token
function getAccessToken() {
    return localStorage.getItem('zone4love_access_token') || sessionStorage.getItem('zone4love_access_token');
}

// Get user data
function getCurrentUser() {
    const userStr = localStorage.getItem('zone4love_user') || sessionStorage.getItem('zone4love_user');
    return userStr ? JSON.parse(userStr) : null;
}

// Logout function
function logout() {
    localStorage.removeItem('zone4love_session');
    localStorage.removeItem('zone4love_access_token');
    localStorage.removeItem('zone4love_refresh_token');
    localStorage.removeItem('zone4love_user');
    sessionStorage.removeItem('zone4love_session');
    sessionStorage.removeItem('zone4love_access_token');
    sessionStorage.removeItem('zone4love_refresh_token');
    sessionStorage.removeItem('zone4love_user');
    window.location.href = 'index.html';
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.zone4love = {
        checkAuth,
        getAccessToken,
        getCurrentUser,
        logout,
        API_BASE_URL
    };
}

console.log('🔐 Auth system initialized');
