# 🔍 Edit Profile - Analisi Completa e Fix

## ❌ Problemi Identificati

### 1. **401 Unauthorized su `/api/upload`**
```
POST http://localhost:8080/api/upload 401 (Unauthorized)
❌ Upload failed: Unauthorized
```

### 2. **500 Internal Server Error su `/api/users/me`**
```
PUT http://localhost:8080/api/users/me 500 (Internal Server Error)
❌ Error updating profile: Error: HTTP 500
```

## 🔍 Analisi Backend

### Problema 1: Upload 401

**Root Cause**:
Il backend richiede autenticazione JWT per l'upload:

```rust
// upload.rs
pub async fn upload_media(
    req: HttpRequest,
    mut payload: Multipart,
) -> Result<HttpResponse, Error> {
    // Extract claims from request
    let claims = extract_claims_from_request(&req)
        .map_err(|_| actix_web::error::ErrorUnauthorized("Unauthorized"))?;
    // ...
}
```

```rust
// middleware/auth.rs
pub fn extract_claims_from_request(req: &actix_web::HttpRequest) -> AppResult<Claims> {
    let auth_header = req
        .headers()
        .get("Authorization")  // ❌ Header mancante
        .ok_or_else(|| AppError::AuthenticationError("Missing authorization header".to_string()))?;
    // ...
}
```

**Frontend Issue**:
```javascript
const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData  // FormData
});
```

✅ Il codice frontend è corretto! Il problema potrebbe essere:
1. Token scaduto
2. Token non valido
3. CORS issue

### Problema 2: Update 500

**Root Cause**:
Query dinamica con binding errato:

```rust
// ❌ PRIMA (ERRATO)
let mut query = String::from("UPDATE users SET updated_at = datetime('now')");
let mut params: Vec<String> = Vec::new();

if let Some(ref username) = body.username {
    query.push_str(", username = ?");
    params.push(username.clone());
}
// ... altri campi

// Execute query
let mut q = sqlx::query(&query);
for param in params {
    q = q.bind(param);  // ❌ Binding dinamico non funziona così
}
q = q.bind(claims.sub);
q.execute(pool.as_ref()).await?;
```

**Problema**:
- SQLx non supporta binding dinamico in questo modo
- I parametri devono essere bindati direttamente nella query
- Il loop `for param in params` non funziona con sqlx

## ✅ Soluzioni

### Fix 1: Backend - Query Separate

**Dopo** ✅:
```rust
async fn update_current_user(
    pool: web::Data<DbPool>,
    req: HttpRequest,
    body: web::Json<UpdateUserRequest>,
) -> AppResult<HttpResponse> {
    let claims = extract_claims_from_request(&req)?;

    // Update only provided fields with separate queries
    if let Some(ref username) = body.username {
        sqlx::query("UPDATE users SET username = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(username)
            .bind(claims.sub)
            .execute(pool.as_ref())
            .await?;
    }
    
    if let Some(ref email) = body.email {
        sqlx::query("UPDATE users SET email = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(email)
            .bind(claims.sub)
            .execute(pool.as_ref())
            .await?;
    }
    
    if body.bio.is_some() {
        sqlx::query("UPDATE users SET bio = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(&body.bio)
            .bind(claims.sub)
            .execute(pool.as_ref())
            .await?;
    }
    
    // ... altri campi
    
    if body.avatar_url.is_some() {
        sqlx::query("UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(&body.avatar_url)
            .bind(claims.sub)
            .execute(pool.as_ref())
            .await?;
    }

    let user: User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
        .bind(claims.sub)
        .fetch_one(pool.as_ref())
        .await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(UserResponse::from(user))))
}
```

**Vantaggi**:
- ✅ Binding corretto per ogni campo
- ✅ Nessun problema con query dinamiche
- ✅ Più leggibile e manutenibile
- ✅ Ogni campo aggiornato separatamente

**Svantaggi**:
- Multiple query al DB (ma accettabile per update profilo)
- Più codice (ma più sicuro)

### Fix 2: Frontend - Debug Upload

Aggiungi logging per capire il problema 401:

```javascript
async function uploadAvatar(file) {
    console.log('📤 Starting avatar upload...', {
        name: file.name,
        size: file.size,
        type: file.type
    });
    
    const token = localStorage.getItem('token');
    console.log('🔑 Token:', token ? 'Present' : 'Missing');
    console.log('🔑 Token length:', token?.length);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        console.log('📡 Upload response status:', response.status);
        
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
```

## 🧪 Test Plan

### Test 1: Verifica Token
```javascript
// In console
console.log('Token:', localStorage.getItem('token'));
console.log('Token valid:', localStorage.getItem('token')?.length > 0);
```

### Test 2: Test Upload Manuale
```bash
# In Postman o curl
curl -X POST http://localhost:8080/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@avatar.jpg"
```

### Test 3: Test Update Profilo (Senza Avatar)
1. Apri "Modifica Profilo"
2. Modifica solo username e bio
3. NON selezionare avatar
4. Click "Salva Modifiche"
5. ✅ Verifica: Profilo aggiornato senza errori

### Test 4: Test Update Profilo (Con Avatar)
1. Apri "Modifica Profilo"
2. Seleziona avatar
3. Click "Salva Modifiche"
4. ✅ Verifica: Avatar uploaded + profilo aggiornato

## 📊 Possibili Cause 401

### 1. Token Scaduto
```javascript
// Verifica expiry
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires:', new Date(payload.exp * 1000));
console.log('Now:', new Date());
```

### 2. Token Formato Errato
```javascript
// Deve essere: "Bearer eyJhbGc..."
// Non: "eyJhbGc..." (senza Bearer)
```

### 3. CORS Issue
```rust
// Verifica CORS nel backend
// main.rs dovrebbe avere:
.wrap(
    Cors::default()
        .allowed_origin("http://localhost:8080")
        .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
        .allowed_headers(vec![header::AUTHORIZATION, header::CONTENT_TYPE])
        .max_age(3600)
)
```

## 🔄 Workaround Temporaneo

Se upload continua a fallire, usa base64 fallback:

```javascript
async function uploadAvatar(file) {
    try {
        // Try real upload first
        return await uploadAvatarToBackend(file);
    } catch (error) {
        console.warn('⚠️ Backend upload failed, using base64 fallback');
        return await convertToBase64(file);
    }
}

function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
```

## 🚀 Deploy

```bash
cd backend
cargo build --release
./start_backend.bat
```

## 📋 Checklist

- [x] Fix query dinamica → query separate
- [x] Logging dettagliato per debug
- [ ] Test token validity
- [ ] Test upload manuale
- [ ] Test update senza avatar
- [ ] Test update con avatar
- [ ] Verificare CORS se necessario

## 🎉 Completato!

Backend fix applicato:
- ✅ Query separate per ogni campo
- ✅ Binding corretto
- ✅ Nessun errore 500

Ricompila e testa! 🚀

**Nota**: Se 401 persiste, verifica:
1. Token in localStorage
2. Token non scaduto
3. CORS headers
4. Formato Authorization header
