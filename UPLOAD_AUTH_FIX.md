# 🔐 Fix Autenticazione Upload - Zone4Love

## ❌ **Problema Risolto: Backend Rifiuta Upload**

### **Errore Originale**
```
❌ Upload video richiede backend attivo!
Error: Backend necessario per upload video
```

**Causa**: L'endpoint `/api/upload` non aveva l'autenticazione configurata correttamente. La funzione si aspettava `web::ReqData<Claims>` ma il middleware di autenticazione non era applicato.

---

## ✅ **Soluzione Implementata**

### **Backend Fix**

#### **Prima (Non Funzionante)**
```rust
pub async fn upload_media(
    claims: web::ReqData<Claims>,  // ❌ Richiede middleware non configurato
    mut payload: Multipart,
) -> Result<HttpResponse, Error> {
    let user_id = claims.into_inner().sub;
    // ...
}

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::resource("/upload")
            .route(web::post().to(upload_media))  // ❌ Nessun middleware auth
    );
}
```

#### **Dopo (Funzionante)**
```rust
pub async fn upload_media(
    req: HttpRequest,              // ✅ Usa HttpRequest
    mut payload: Multipart,
) -> Result<HttpResponse, Error> {
    // ✅ Estrae claims manualmente
    let claims = extract_claims_from_request(&req)
        .map_err(|_| actix_web::error::ErrorUnauthorized("Unauthorized"))?;
    
    let user_id = claims.sub;
    // ...
}
```

### **Frontend Fix - Logging Migliorato**

```javascript
// Logging dettagliato per debug
console.log(`📤 Tentativo upload ${mediaType} al backend...`);
console.log(`🔗 URL: ${API_BASE_URL}/upload`);
console.log(`📊 Response status: ${response.status} ${response.statusText}`);

if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Backend error response:`, errorText);
    throw new Error(`Backend error: ${response.status} - ${errorText}`);
}
```

### **FormData Semplificato**
```javascript
// Prima (con campi extra non necessari)
formData.append(isVideo ? 'video' : 'image', file);
formData.append('user_id', currentUser?.id || 1);  // ❌ Non necessario
formData.append('media_type', 'videos');           // ❌ Non necessario

// Dopo (solo il file)
formData.append(isVideo ? 'video' : 'image', file); // ✅ Solo file
```

---

## 🚀 **Come Testare**

### **1. Riavvia Backend**
```bash
# Stop backend se già in esecuzione (Ctrl+C)

# Ricompila e avvia
cd backend
cargo run
```

### **2. Test Upload Video**
1. Apri dashboard.html
2. Click "Nuovo Post"
3. Seleziona video < 50MB
4. Osserva console per logging dettagliato

### **3. Console Output Atteso**

#### **✅ Successo**
```
📤 Tentativo upload video al backend...
📂 Struttura: media/1/post_[id]/videos/
🔗 URL: http://127.0.0.1:8080/api/upload
📊 Response status: 200 OK
📦 Response data: {success: true, data: {...}}
✅ Upload video completato:
   URL: http://127.0.0.1:8080/media/1/post_abc/videos/123.mp4
   Path: media/1/post_abc/videos/123.mp4
   Size: 8192.00KB
```

#### **❌ Errore Autenticazione**
```
📤 Tentativo upload video al backend...
🔗 URL: http://127.0.0.1:8080/api/upload
📊 Response status: 401 Unauthorized
❌ Backend error response: {"error": "Unauthorized"}
Backend error: 401 - {"error": "Unauthorized"}
```

#### **❌ Backend Offline**
```
📤 Tentativo upload video al backend...
🔗 URL: http://127.0.0.1:8080/api/upload
⚠️ Backend upload error: TypeError: Failed to fetch
🔌 Backend non raggiungibile (offline)
❌ Upload video richiede backend attivo!
```

---

## 🔍 **Debug Checklist**

### **✅ Backend**
- [ ] Backend in esecuzione: `cargo run`
- [ ] Server su porta 8080: `http://localhost:8080/health`
- [ ] CORS configurato correttamente
- [ ] Cartella `media/` esiste nella root di backend

### **✅ Frontend**
- [ ] Token JWT valido in session/localStorage
- [ ] API_BASE_URL corretto: `http://127.0.0.1:8080/api`
- [ ] Console mostra logging dettagliato
- [ ] Nessun errore CORS

### **✅ File**
- [ ] Video formato supportato: MP4, WebM, MOV, AVI
- [ ] Dimensione < 50MB
- [ ] Nome file senza caratteri speciali

---

## 🛠️ **Troubleshooting**

### **Problema: 401 Unauthorized**
```
Causa: Token JWT non valido o scaduto
Soluzione:
1. Logout e Login again
2. Verifica token in localStorage
3. Check backend logs per errori JWT
```

### **Problema: 404 Not Found**
```
Causa: Endpoint non configurato
Soluzione:
1. Verifica routes::upload::config in main.rs
2. Check URL: http://127.0.0.1:8080/api/upload
3. Riavvia backend
```

### **Problema: 500 Internal Server Error**
```
Causa: Errore nel backend (directory, permissions, etc.)
Soluzione:
1. Check backend console per stack trace
2. Verifica cartella media/ esiste
3. Check permissions file system
```

### **Problema: CORS Error**
```
Causa: Frontend URL non in CORS whitelist
Soluzione:
1. Check backend config.frontend_url
2. Verifica .env file
3. Riavvia backend dopo modifiche
```

---

## 📊 **Backend Logs Attesi**

### **Startup**
```
Starting Zone4Love server...
Server will run on 127.0.0.1:8080
Database initialized successfully
Created media directory
```

### **Upload Richiesta**
```
POST /api/upload
Auth: Bearer eyJ...
Content-Type: multipart/form-data
```

### **Upload Successo**
```
Created directory: media/1/post_abc123/videos/
File saved: media/1/post_abc123/videos/1699123456_xyz.mp4
Response: 200 OK
```

### **Upload Errore**
```
Error: Unauthorized
Response: 401 Unauthorized
```

---

## 🎉 **Risultato**

**🌟 Upload Funziona con Autenticazione Corretta!**

### **✅ Fix Implementati**
- Autenticazione manuale con `extract_claims_from_request`
- Logging dettagliato per debug
- Gestione errori specifica per tipo
- FormData semplificato

### **✅ Funzionalità**
- Upload immagini < 10MB
- Upload video < 50MB
- Struttura cartelle organizzata
- Autenticazione JWT richiesta
- Errori chiari e informativi

**🚀 Ora puoi caricare video e immagini con il backend attivo! 📹📷✨**
