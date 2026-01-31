# 🔍 Avatar Upload - Debug 401 Unauthorized

## ❌ Problema

```
POST http://localhost:8080/api/upload 401 (Unauthorized)
❌ Upload failed: Unauthorized
```

## 🔍 Logging Aggiunto

### 1. Upload Endpoint
```rust
pub async fn upload_media(req: HttpRequest, mut payload: Multipart) -> Result<HttpResponse, Error> {
    log::info!("📤 UPLOAD REQUEST received");
    log::debug!("Headers: {:?}", req.headers());
    
    let claims = extract_claims_from_request(&req)
        .map_err(|e| {
            log::error!("❌ Auth failed in upload: {:?}", e);
            actix_web::error::ErrorUnauthorized("Unauthorized")
        })?;
    
    log::info!("✅ Upload authenticated for user: {}", claims.sub);
    // ...
}
```

### 2. Auth Middleware
```rust
pub fn extract_claims_from_request(req: &actix_web::HttpRequest) -> AppResult<Claims> {
    log::debug!("🔐 Extracting claims from request");
    
    let auth_header = req.headers().get("Authorization")
        .ok_or_else(|| {
            log::error!("❌ Missing Authorization header");
            // ...
        })?;
    
    log::debug!("Auth header: {}", &auth_header[..20]);
    let token = extract_token_from_header(auth_header)?;
    log::debug!("Token extracted successfully");
    
    let claims = verify_token(&token, &config.jwt_secret)
        .map_err(|e| {
            log::error!("❌ Token verification failed: {:?}", e);
            e
        })?;
    
    log::debug!("✅ Claims extracted for user: {}", claims.sub);
    Ok(claims)
}
```

## 📊 Output Atteso

### Scenario 1: Token Mancante
```
[INFO] 📤 UPLOAD REQUEST received
[DEBUG] Headers: {"content-type": "multipart/form-data", ...}
[DEBUG] 🔐 Extracting claims from request
[ERROR] ❌ Missing Authorization header
[ERROR] ❌ Auth failed in upload: AuthenticationError("Missing authorization header")
```

**Fix**: Il frontend non sta passando l'header Authorization

### Scenario 2: Token Invalido
```
[INFO] 📤 UPLOAD REQUEST received
[DEBUG] Headers: {"authorization": "Bearer eyJ...", ...}
[DEBUG] 🔐 Extracting claims from request
[DEBUG] Auth header: Bearer eyJhbGciOiJIUzI1...
[DEBUG] Token extracted successfully
[ERROR] ❌ Token verification failed: InvalidToken
[ERROR] ❌ Auth failed in upload: InvalidToken
```

**Fix**: Token scaduto o formato errato

### Scenario 3: Successo
```
[INFO] 📤 UPLOAD REQUEST received
[DEBUG] Headers: {"authorization": "Bearer eyJ...", ...}
[DEBUG] 🔐 Extracting claims from request
[DEBUG] Auth header: Bearer eyJhbGciOiJIUzI1...
[DEBUG] Token extracted successfully
[DEBUG] ✅ Claims extracted for user: 1
[INFO] ✅ Upload authenticated for user: 1
[DEBUG] Processing file upload...
[INFO] ✅ File uploaded successfully
```

## 🧪 Test

### Step 1: Ricompila Backend
```bash
cd backend
cargo build --release
```

### Step 2: Riavvia Backend
```bash
./start_backend.bat
```

### Step 3: Test Upload Avatar
1. Hard refresh: `Ctrl + Shift + R`
2. Apri "Modifica Profilo"
3. Seleziona avatar
4. Click "Salva Modifiche"
5. **Guarda Backend Terminal**

### Step 4: Analizza Log

Il log ti dirà esattamente dove fallisce:
- Missing Authorization header → Frontend issue
- Token verification failed → Token scaduto/invalido
- Claims extracted → Dovrebbe funzionare!

## 🔧 Possibili Fix

### Fix 1: Frontend - Verifica Token

```javascript
// In console
const token = localStorage.getItem('token');
console.log('Token:', token ? 'Present' : 'Missing');
console.log('Length:', token?.length);

// Decode
if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('User ID:', payload.sub);
    console.log('Expires:', new Date(payload.exp * 1000));
    console.log('Expired:', Date.now() > payload.exp * 1000);
}
```

### Fix 2: Frontend - Verifica Header

Il codice attuale:
```javascript
const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});
```

Dovrebbe essere corretto, ma verifica in Network tab:
1. F12 → Network
2. Fai upload
3. Click su richiesta `/upload`
4. Tab "Headers"
5. Verifica "Request Headers" → "authorization: Bearer ..."

### Fix 3: CORS Issue

Se il problema è CORS, aggiungi in `main.rs`:

```rust
let cors = Cors::default()
    .allowed_origin("http://localhost:8080")
    .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
    .allowed_headers(vec![
        header::AUTHORIZATION,
        header::CONTENT_TYPE,
        header::ACCEPT,
    ])
    .expose_headers(vec![header::CONTENT_TYPE])
    .max_age(3600);
```

## 🎯 Next Steps

1. **Ricompila** backend
2. **Riavvia** backend
3. **Test** upload avatar
4. **Condividi** log backend terminal

Il logging ci dirà esattamente il problema! 🔍

## 📋 Checklist Debug

- [ ] Backend ricompilato
- [ ] Backend riavviato
- [ ] Token presente in localStorage
- [ ] Token non scaduto
- [ ] Test upload eseguito
- [ ] Log backend analizzato
- [ ] Problema identificato

Una volta identificato il problema specifico, applicheremo il fix corretto! 🚀
