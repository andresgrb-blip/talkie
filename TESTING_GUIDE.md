# 🧪 Guida Test Completa - Zone4Love

## 🎯 **Sistema Completo da Testare**

### **✅ Funzionalità Implementate**

1. **👤 Username Reale** - Mostra il vero username dell'utente loggato
2. **📂 Media Storage Organizzato** - File salvati in `media/{user_id}/post_{id}/{type}/`
3. **🎥 Upload Video** - Video fino a 50MB con backend attivo
4. **📷 Upload Immagini** - Immagini fino a 10MB
5. **🔐 Autenticazione JWT** - Token sicuro per tutte le API
6. **💾 Database Media** - Post con array media serializzato

---

## 🚀 **Step-by-Step Testing**

### **1. Preparazione**

```bash
# Terminal 1: Backend
cd zone4love/backend
cargo run

# Attendi output:
# ✅ Server running on 127.0.0.1:8080
# ✅ Database initialized
# ✅ Media directory created
```

### **2. Login**

```
1. Apri: http://localhost/zone4love/login.html
2. Login con:
   - Username: zion
   - Password: password123
3. ✅ Redirect automatico a dashboard
```

**Console Output Atteso:**
```javascript
POST http://127.0.0.1:8080/api/auth/login
200 OK
✅ Login successful
Response: {
    success: true,
    data: {
        access_token: "eyJ...",
        user: {
            id: 1,
            username: "zion",
            email: "zion@example.com"
        }
    }
}
```

### **3. Verifica Dashboard Load**

**Console Output Atteso:**
```javascript
GET http://127.0.0.1:8080/api/users/me
200 OK
✅ User data loaded: {
    id: 1,
    username: "zion",
    email: "zion@example.com"
}
✅ User profile updated
✅ Welcome message updated

GET http://127.0.0.1:8080/api/posts
200 OK
✅ Posts loaded: X posts
```

**UI da Verificare:**
```
✅ Sidebar mostra: "👤 zion"
✅ Welcome message: "Bentornato, zion! 🚀"
✅ Post esistenti mostrano username corretto
```

### **4. Test Upload Immagine**

```
1. Click "✏️ Nuovo Post"
2. Scrivi: "Test immagine"
3. Click "📎 Scegli File"
4. Seleziona immagine JPG < 10MB
5. Verifica preview
6. Click "Pubblica"
```

**Console Output Atteso:**
```javascript
✅ File validato: photo.jpg (2.50MB, image/jpeg)
📤 Tentativo upload immagine al backend...
📂 Struttura: media/1/post_[id]/images/
🔗 URL: http://127.0.0.1:8080/api/upload
📊 Response status: 200 OK
✅ Upload immagine completato:
   URL: http://127.0.0.1:8080/media/1/post_abc/images/123456_xyz.jpg
   Size: 2560.00KB

POST http://127.0.0.1:8080/api/posts
201 Created
Post pubblicato con successo! 🚀
```

**File System da Verificare:**
```
zone4love/backend/media/
└── 1/                              ← User ID
    └── post_abc123-def4-5678/     ← Post UUID
        └── images/
            └── 1736510400000_a1b2.jpg  ← File uploaded
```

**UI da Verificare:**
```
✅ Post appare nel feed
✅ Immagine visibile
✅ Autore: "zion" (username reale)
✅ Click immagine → Modal ingrandimento
```

### **5. Test Upload Video**

```
1. Click "✏️ Nuovo Post"
2. Scrivi: "Test video"
3. Seleziona video MP4 < 50MB
4. Verifica preview con icona play
5. Click "Pubblica"
```

**Console Output Atteso:**
```javascript
✅ File validato: video.mp4 (8.00MB, video/mp4)
📤 Tentativo upload video al backend...
📂 Struttura: media/1/post_[id]/videos/
📊 Response status: 200 OK
✅ Upload video completato:
   URL: http://127.0.0.1:8080/media/1/post_abc/videos/123456_xyz.mp4
   Size: 8192.00KB

POST http://127.0.0.1:8080/api/posts
201 Created
```

**UI da Verificare:**
```
✅ Post con video nel feed
✅ Thumbnail video con play button
✅ Autore: "zion"
✅ Click video → Modal player con controls
```

### **6. Test Multiple Media**

```
1. Nuovo post
2. Seleziona 3 immagini + 1 video
3. Verifica preview grid 2x2
4. Pubblica
```

**Console Output:**
```javascript
✅ 4 file validati
📤 Upload 1/4: image1.jpg → ✅
📤 Upload 2/4: image2.jpg → ✅
📤 Upload 3/4: image3.jpg → ✅
📤 Upload 4/4: video.mp4 → ✅

POST /api/posts
Body: {
    content: "...",
    media: [
        { url: "http://.../images/1.jpg", type: "image", name: "..." },
        { url: "http://.../images/2.jpg", type: "image", name: "..." },
        { url: "http://.../images/3.jpg", type: "image", name: "..." },
        { url: "http://.../videos/4.mp4", type: "video", name: "..." }
    ]
}

201 Created
```

**UI da Verificare:**
```
✅ Gallery con 4 media
✅ Layout grid 2x2
✅ Click media singolo → Modal
✅ Click "+1" → Carousel completo
✅ Frecce ←/→ per navigare
```

### **7. Test Backend Offline**

```
1. Stop backend (Ctrl+C)
2. Tenta upload video
```

**Console Output Atteso:**
```javascript
📤 Tentativo upload video al backend...
⚠️ Backend upload error: TypeError: Failed to fetch
🔌 Backend non raggiungibile (offline)
❌ Upload video richiede backend attivo!

Error: Backend necessario per upload video. Avvia il backend con ./start_backend.bat
🎥 Video richiedono backend attivo! Avvia con ./start_backend.bat
```

**Per Immagini Piccole (<5MB):**
```javascript
📤 Tentativo upload immagine al backend...
⚠️ Backend upload error: TypeError: Failed to fetch
🔌 Backend non raggiungibile (offline)
   Uso base64 fallback solo per immagini
🔄 Conversione immagine in base64...
✅ immagine convertito in base64 (3072KB)
Post pubblicato con successo! 🚀
⚠️ Backend offline - Post salvato localmente
```

---

## ✅ **Checklist Completa**

### **Backend**
- [ ] Server in esecuzione su porta 8080
- [ ] `/health` risponde OK
- [ ] `/api/auth/login` funziona
- [ ] `/api/users/me` restituisce user corretto
- [ ] `/api/upload` accetta immagini
- [ ] `/api/upload` accetta video
- [ ] `/api/posts` crea post con media
- [ ] `/api/posts` GET restituisce post con media
- [ ] File salvati in `media/{user_id}/post_{id}/`
- [ ] Static files accessibili da `/media/`

### **Frontend - Login**
- [ ] Form login funziona
- [ ] Token salvato in localStorage
- [ ] User data salvato in session
- [ ] Redirect a dashboard

### **Frontend - Dashboard**
- [ ] Check autenticazione funziona
- [ ] User data caricato da `/api/users/me`
- [ ] Username REALE mostrato (non TestUser)
- [ ] Sidebar aggiornata con dati reali
- [ ] Welcome message personalizzato
- [ ] Post caricati da backend

### **Frontend - Upload**
- [ ] Validazione formati funziona
- [ ] Validazione dimensioni funziona
- [ ] Max 5 file enforced
- [ ] Preview grid funziona
- [ ] Rimozione singolo file funziona
- [ ] Upload backend funziona
- [ ] Fallback base64 per immagini offline
- [ ] Errore video offline chiaro

### **Frontend - Post Display**
- [ ] Post con 1 immagine → Layout singolo
- [ ] Post con 2 media → Grid 2 colonne
- [ ] Post con 3 media → Layout asimmetrico
- [ ] Post con 4+ media → Grid + overlay "+X"
- [ ] Click immagine → Modal fullscreen
- [ ] Click video → Player modal
- [ ] Gallery carousel funziona
- [ ] Frecce ←/→ navigano
- [ ] Escape chiude modal

### **Database**
- [ ] Tabella `posts` ha colonna `media`
- [ ] Media serializzato come JSON
- [ ] Query SELECT deserializza correttamente
- [ ] Username nel post è quello reale

---

## 🐛 **Problemi Comuni**

### **1. Backend Non Parte**
```
Error: Address already in use
```
**Soluzione:** Porta 8080 già occupata
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Poi riavvia
cargo run
```

### **2. 401 Unauthorized**
```
GET /api/users/me → 401
GET /api/posts → 401
POST /api/upload → 401
```
**Soluzione:** Token scaduto o non valido
```javascript
// Logout e login again
localStorage.removeItem('zone4love_session');
// Vai a login.html e rifai login
```

### **3. Username = null o TestUser**
```
Post creato da: null
```
**Soluzione:** 
```javascript
// Console browser:
console.log('Current user:', currentUser);

// Se null:
// 1. Verifica backend running
// 2. Ricarica pagina (F5)
// 3. Se persiste, logout e login again
```

### **4. Video Non Upload**
```
❌ Upload video richiede backend attivo!
```
**Soluzione:** Backend DEVE essere attivo per video
```bash
cd backend
cargo run
# Poi riprova upload
```

### **5. Immagini Non Visibili**
```
Failed to load resource: net::ERR_FILE_NOT_FOUND
http://127.0.0.1:8080/media/1/post_abc/images/123.jpg
```
**Soluzione:** File non esiste su disco
```bash
# Verifica file esiste
ls backend/media/1/post_abc/images/

# Se non esiste, riprova upload
# Se esiste, verifica URL in console
```

---

## 📊 **Database Verification**

### **Verifica Media JSON**
```bash
# Apri database
cd backend
sqlite3 zone4love.db

# Query posts con media
SELECT id, user_id, content, media FROM posts WHERE media IS NOT NULL;

# Output atteso:
# id | user_id | content      | media
# 1  | 1       | "Test post"  | [{"url":"http://...","type":"image","name":"..."}]
```

### **Verifica User**
```sql
SELECT * FROM users WHERE id = 1;

-- Output atteso:
-- id | username | email
-- 1  | zion     | zion@example.com
```

---

## 🎉 **Test Completo Passato!**

Quando TUTTI i test sopra passano:

```
✅ Backend funzionante
✅ Upload immagini OK
✅ Upload video OK
✅ Multiple media OK
✅ Username reale mostrato
✅ Media salvati su disco
✅ Database aggiornato
✅ UI responsive e animata
✅ Fallback offline per immagini
✅ Errori chiari per utente
```

**🌟 Zone4Love è completamente funzionante e production-ready! 🚀✨**
