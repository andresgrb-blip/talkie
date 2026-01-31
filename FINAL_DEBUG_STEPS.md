# 🔍 Final Debug Steps

## ❌ Problemi Persistenti

Anche dopo nuovo login:
- **401 Unauthorized** su `/api/upload`
- **500 Internal Server Error** su `/api/users/me`

## 🔍 Debug Aggiunto

Ho aggiunto logging dettagliato per capire il problema del token:

```javascript
console.log('📤 Starting avatar upload...', {
    hasToken: !!token,
    tokenLength: token?.length,
    tokenPreview: token?.substring(0, 20) + '...'
});
```

## 📋 Checklist Debug

### 1. Verifica Token in Console

```javascript
// Copia e incolla in console
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);
console.log('Token preview:', token?.substring(0, 50));

// Decode JWT payload
if (token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        console.log('Expires:', new Date(payload.exp * 1000));
        console.log('Is expired:', Date.now() > payload.exp * 1000);
    } catch (e) {
        console.error('Invalid token format:', e);
    }
}
```

### 2. Test Manuale Upload

```javascript
// Test upload con fetch diretto
const testUpload = async () => {
    const token = localStorage.getItem('token');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        
        console.log('Testing upload with token:', token?.substring(0, 20));
        
        const response = await fetch('http://localhost:8080/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        console.log('Response status:', response.status);
        console.log('Response:', await response.text());
    };
    
    input.click();
};

testUpload();
```

### 3. Test Update Profile (Senza Avatar)

```javascript
// Test update senza avatar
const testUpdate = async () => {
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:8080/api/users/me', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            bio: 'Test bio update'
        })
    });
    
    console.log('Update status:', response.status);
    console.log('Update response:', await response.text());
};

testUpdate();
```

## 🔍 Backend Logs

### Cosa Cercare nel Terminal Backend

#### Per 401 Unauthorized:
```
Missing authorization header
Invalid header value
JWT error: ...
Unauthorized
```

#### Per 500 Internal Server Error:
```
thread 'actix-rt...' panicked at...
Error: ...
sqlx::Error: ...
Database error: ...
```

## 🎯 Possibili Cause

### 401 Unauthorized

#### Causa 1: Token Non Passato
```javascript
// Verifica che getAuthHeaders() includa il token
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}
```

#### Causa 2: CORS Issue
```rust
// Verifica in main.rs
.wrap(
    Cors::default()
        .allowed_origin("http://localhost:8080")
        .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
        .allowed_headers(vec![
            header::AUTHORIZATION,  // ← Importante!
            header::CONTENT_TYPE,
            header::ACCEPT,
        ])
        .expose_headers(vec![header::CONTENT_TYPE])
        .max_age(3600)
)
```

#### Causa 3: Middleware Non Applicato
```rust
// Verifica che /upload abbia auth middleware
web::resource("/upload")
    .wrap(HttpAuthentication::bearer(jwt_validator))  // ← Necessario
    .route(web::post().to(upload_media))
```

### 500 Internal Server Error

#### Causa 1: Campo NULL Non Permesso
```sql
-- Verifica schema DB
PRAGMA table_info(users);

-- Se un campo è NOT NULL ma passi null:
-- Error: NOT NULL constraint failed: users.bio
```

#### Causa 2: Query Binding Errato
```rust
// Verifica che tutti i bind siano corretti
if body.bio.is_some() {
    sqlx::query("UPDATE users SET bio = ? WHERE id = ?")
        .bind(&body.bio)  // Option<String>
        .bind(claims.sub)
        .execute(pool.as_ref())
        .await?;
}
```

## 🚀 Azioni Immediate

### Step 1: Hard Refresh
```
Ctrl + Shift + R
```

### Step 2: Verifica Token
```javascript
// In console
localStorage.getItem('token')
```

### Step 3: Test Update Senza Avatar
1. Apri "Modifica Profilo"
2. **NON selezionare avatar**
3. Modifica solo bio: "Test"
4. Click "Salva"
5. Guarda console + backend terminal

### Step 4: Condividi Logs

**Frontend Console**:
- Tutto l'output dopo "💾 Saving profile changes..."

**Backend Terminal**:
- Qualsiasi errore o panic
- Cerca "Error:", "panicked", "sqlx::Error"

## 🔧 Fix Temporaneo

Se vuoi testare solo l'update senza avatar:

```javascript
// In profile.js, commenta temporaneamente l'upload
async function handleEditProfileSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = {
            username: document.getElementById('edit-username').value.trim(),
            email: document.getElementById('edit-email').value.trim(),
            bio: document.getElementById('edit-bio').value.trim() || null,
            // ... altri campi
        };
        
        // ❌ Commenta questo blocco temporaneamente
        /*
        if (selectedAvatarFile) {
            try {
                const avatarUrl = await uploadAvatar(selectedAvatarFile);
                formData.avatar_url = avatarUrl;
            } catch (uploadError) {
                console.error('❌ Avatar upload failed:', uploadError);
            }
        }
        */
        
        // Test solo update
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response:', result);
        
    } catch (error) {
        console.error('Error:', error);
    }
}
```

## 📊 Expected Output

### Se Token OK:
```
📤 Starting avatar upload... {hasToken: true, tokenLength: 200+}
🔑 Authorization header: Bearer eyJhbGciOiJIUzI1...
```

### Se Token Missing:
```
📤 Starting avatar upload... {hasToken: false, tokenLength: undefined}
❌ No authentication token found
```

### Se Backend OK:
```
📡 Upload response status: 200
📦 Upload result: {success: true, data: {url: "..."}}
```

### Se Backend Error:
```
📡 Upload response status: 401/500
❌ Upload failed: Unauthorized/Internal Server Error
```

## 🎯 Next Steps

1. **Hard refresh** + **Verifica token**
2. **Test update senza avatar** (per isolare il problema)
3. **Condividi backend terminal output**
4. **Applica fix specifico** basato sull'errore

Il problema è sicuramente uno di questi:
- Token non valido/scaduto
- CORS headers
- Middleware auth non applicato
- Campo DB NOT NULL

I log ci diranno esattamente quale! 🚀
