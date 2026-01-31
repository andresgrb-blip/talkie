# 📸 Quick Avatar Change - Profile Page

## ✅ Implementato

Sistema completo per cambiare avatar direttamente dalla pagina profilo cliccando sull'avatar!

## 🎨 Features

### 1. **Click Avatar per Cambiare**
- Click sull'avatar → Apre file picker
- Click sul bottone camera → Apre file picker
- Hover effect con ring rosa

### 2. **Validazione File**
- Formati: JPG, PNG, GIF, WebP
- Max size: 10MB
- Errori user-friendly

### 3. **Loading State**
- Avatar opacity ridotta
- Spinner animato
- Pointer events disabilitati

### 4. **Auto Update**
- Upload automatico
- Update database
- Refresh UI immediato
- Nessun modal necessario

### 5. **Security**
- Solo per proprio profilo
- Validazione lato client e server
- Token authentication

## 🎯 HTML Changes

```html
<!-- Avatar con click handler -->
<div class="relative group">
    <div id="profile-avatar" 
         class="w-32 h-32 rounded-full ... cursor-pointer hover:ring-4 hover:ring-pink-500/50" 
         onclick="openAvatarUpload()">
        A
    </div>
    
    <!-- Hidden file input -->
    <input type="file" 
           id="avatar-file-input" 
           accept="image/*" 
           class="hidden" 
           onchange="handleAvatarChange(event)">
    
    <!-- Camera icon button -->
    <button onclick="openAvatarUpload()" 
            class="absolute bottom-2 right-2 w-10 h-10 bg-pink-600 rounded-full ...">
        <svg><!-- Camera icon --></svg>
    </button>
</div>
```

## 🔧 JavaScript Functions

### 1. openAvatarUpload()
```javascript
function openAvatarUpload() {
    // Check if viewing own profile
    if (!profileUser || !currentUser || profileUser.id !== currentUser.id) {
        showMessage('⚠️ Puoi cambiare solo il tuo avatar', 'warning');
        return;
    }
    
    // Trigger file input
    const fileInput = document.getElementById('avatar-file-input');
    fileInput.click();
}
```

### 2. handleAvatarChange()
```javascript
async function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showMessage('❌ Formato non valido', 'error');
        return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showMessage('❌ File troppo grande. Max 10MB', 'error');
        return;
    }
    
    // Show loading
    showAvatarUploadLoading();
    
    try {
        // Upload avatar
        const avatarUrl = await uploadAvatar(file);
        
        // Update profile
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ avatar_url: avatarUrl })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update local data
            profileUser = { ...profileUser, ...result.data };
            currentUser = { ...currentUser, ...result.data };
            
            // Update session
            updateSession(currentUser);
            
            // Refresh UI
            renderProfile();
            
            showMessage('✅ Avatar aggiornato!', 'success');
        }
    } catch (error) {
        showMessage(`❌ Errore: ${error.message}`, 'error');
    } finally {
        hideAvatarUploadLoading();
        event.target.value = ''; // Reset input
    }
}
```

### 3. Loading States
```javascript
function showAvatarUploadLoading() {
    const avatar = document.getElementById('profile-avatar');
    avatar.style.opacity = '0.5';
    avatar.style.pointerEvents = 'none';
    
    // Add spinner
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
    if (spinner) spinner.remove();
}
```

## 🔄 Flusso Completo

```
1. User click su avatar o camera button
   ↓
2. openAvatarUpload() → Verifica se è proprio profilo
   ↓
3. File input aperto
   ↓
4. User seleziona immagine
   ↓
5. handleAvatarChange() → Validazione
   ↓
6. showAvatarUploadLoading() → Spinner mostrato
   ↓
7. uploadAvatar() → POST /api/upload
   ↓
8. Backend salva in media/1/avatar/
   ↓
9. Backend ritorna URL
   ↓
10. PUT /api/users/me con avatar_url
   ↓
11. Backend UPDATE users SET avatar_url
   ↓
12. Backend ritorna dati aggiornati
   ↓
13. Frontend aggiorna profileUser, currentUser, session
   ↓
14. renderProfile() → Avatar aggiornato visivamente
   ↓
15. hideAvatarUploadLoading() → Spinner rimosso
   ↓
16. showMessage('✅ Avatar aggiornato!')
```

## 🎨 UI/UX Features

### Hover Effects
```css
/* Avatar hover */
.cursor-pointer:hover {
    ring: 4px solid rgba(236, 72, 153, 0.5);
}

/* Camera button hover */
.hover\:scale-110:hover {
    transform: scale(1.1);
}
```

### Loading State
```
Avatar:
- Opacity: 0.5
- Pointer events: none
- Spinner overlay: Animated border spinner
```

### Messages
```javascript
// Success
showMessage('✅ Avatar aggiornato con successo!', 'success');

// Error - Invalid format
showMessage('❌ Formato non valido. Usa JPG, PNG, GIF o WebP', 'error');

// Error - File too large
showMessage('❌ File troppo grande. Max 10MB', 'error');

// Warning - Not own profile
showMessage('⚠️ Puoi cambiare solo il tuo avatar', 'warning');
```

## 🧪 Test

### Test 1: Quick Avatar Change
1. Vai al tuo profilo
2. Click sull'avatar (o camera button)
3. Seleziona immagine
4. ✅ Verifica:
   - Spinner mostrato
   - Avatar aggiornato
   - Success message
   - Avatar persiste dopo refresh

### Test 2: Validation
1. Click avatar
2. Seleziona file PDF
3. ✅ Verifica: Errore "Formato non valido"
4. Seleziona file > 10MB
5. ✅ Verifica: Errore "File troppo grande"

### Test 3: Other User Profile
1. Vai al profilo di altro utente
2. Click sull'avatar
3. ✅ Verifica: Warning "Puoi cambiare solo il tuo avatar"
4. Camera button non cliccabile

### Test 4: Loading State
1. Click avatar
2. Seleziona immagine grande
3. ✅ Verifica:
   - Avatar opacity 0.5
   - Spinner animato
   - Click disabilitato durante upload

### Test 5: Error Handling
1. Spegni backend
2. Click avatar e seleziona immagine
3. ✅ Verifica: Errore mostrato
4. Avatar torna normale (no spinner)

## 📊 Vantaggi

### User Experience
- ✅ **1 Click**: Cambio avatar immediato
- ✅ **No Modal**: Nessun form da compilare
- ✅ **Visual Feedback**: Spinner e messages
- ✅ **Instant Update**: UI aggiornata immediatamente

### Developer Experience
- ✅ **Riusa Codice**: Usa `uploadAvatar()` esistente
- ✅ **Validazione**: Client + Server side
- ✅ **Error Handling**: Completo e user-friendly
- ✅ **Maintainable**: Funzioni separate e chiare

### Security
- ✅ **Auth Check**: Solo proprio profilo
- ✅ **Token**: Bearer authentication
- ✅ **Validation**: File type e size
- ✅ **Server Validation**: Backend verifica tutto

## 🎉 Completato!

Sistema quick avatar change:
- ✅ Click avatar per cambiare
- ✅ Validazione completa
- ✅ Loading states
- ✅ Error handling
- ✅ Auto update UI
- ✅ Session persistence
- ✅ Security checks

Hard refresh e prova! 📸✨
