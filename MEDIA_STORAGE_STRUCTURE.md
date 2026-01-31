# 📂 Struttura Storage Media - Zone4Love

## 🎯 **Struttura Implementata**

### **📁 Directory Tree**
```
zone4love/
├── backend/
│   └── media/                          # Root media directory
│       └── {user_id}/                  # Cartella per utente
│           └── post_{post_id}/         # Cartella per post
│               ├── images/             # Immagini del post
│               │   ├── 1699123456_a1b2.jpg
│               │   ├── 1699123457_c3d4.png
│               │   └── ...
│               └── videos/             # Video del post
│                   ├── 1699123458_e5f6.mp4
│                   ├── 1699123459_g7h8.webm
│                   └── ...
```

### **📋 Esempio Pratico**
```
media/
├── 1/                                  # User ID 1
│   ├── post_abc123/
│   │   ├── images/
│   │   │   └── 1699123456_a1b2.jpg    # Timestamp + UUID + ext
│   │   └── videos/
│   │       └── 1699123458_e5f6.mp4
│   └── post_def456/
│       └── images/
│           ├── 1699123460_i9j0.jpg
│           └── 1699123461_k1l2.png
├── 2/                                  # User ID 2
│   └── post_ghi789/
│       └── images/
│           └── 1699123462_m3n4.jpg
└── ...
```

---

## 🔧 **Backend Implementation**

### **Upload Endpoint**
```rust
POST /api/upload
Content-Type: multipart/form-data

Headers:
  Authorization: Bearer {jwt_token}

Body (FormData):
  - image/video: File
  - user_id: Integer
  - media_type: "images" | "videos"
```

### **Response Format**
```json
{
  "success": true,
  "data": {
    "url": "http://127.0.0.1:8080/media/1/post_abc123/images/1699123456_a1b2.jpg",
    "path": "media/1/post_abc123/images/1699123456_a1b2.jpg",
    "filename": "1699123456_a1b2.jpg",
    "size": 1048576
  }
}
```

### **File Naming Convention**
```
Format: {timestamp}_{uuid_short}.{extension}

Esempi:
  1699123456_a1b2c3d4.jpg
  1699123457_e5f6g7h8.mp4
  1699123458_i9j0k1l2.png
```

### **Validazioni Backend**

#### **Formati Supportati**
```rust
// Immagini
valid_image_exts = ["jpg", "jpeg", "png", "gif", "webp"]

// Video
valid_video_exts = ["mp4", "webm", "mov", "avi"]
```

#### **Limiti Dimensioni**
```rust
// Immagini: 10MB max
if media_type == "images" && file_size > 10 * 1024 * 1024 {
    return Error("File too large. Max 10MB for images");
}

// Video: 50MB max
if media_type == "videos" && file_size > 50 * 1024 * 1024 {
    return Error("File too large. Max 50MB for videos");
}
```

---

## 🌐 **Frontend Integration**

### **Upload Function**
```javascript
async function uploadMedia(file) {
    const isVideo = file.type.startsWith('video/');
    const formData = new FormData();
    
    formData.append(isVideo ? 'video' : 'image', file);
    formData.append('user_id', currentUser.id);
    formData.append('media_type', isVideo ? 'videos' : 'images');
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    const result = await response.json();
    return result.data.url; // Full URL to media
}
```

### **Console Logging**
```javascript
📤 Tentativo upload immagine al backend...
📂 Struttura: media/1/post_[id]/images/
✅ Upload immagine completato:
   URL: http://127.0.0.1:8080/media/1/post_abc123/images/1699123456_a1b2.jpg
   Path: media/1/post_abc123/images/1699123456_a1b2.jpg
   Size: 1024.50KB
```

---

## 🔄 **Fallback Base64**

### **Quando Fallback Attivo**
- Backend non disponibile
- Errore di rete
- Endpoint upload non configurato
- Errore durante l'upload

### **Comportamento**
```javascript
⚠️ Backend upload non disponibile per immagine, uso base64 fallback
   Nota: In modalità offline i media non seguono la struttura cartelle
🔄 Conversione immagine in base64...
✅ immagine convertito in base64 (1536KB)
```

### **Limitazioni Fallback**
- ❌ **Nessuna struttura cartelle** (tutto inline nel JSON)
- ⚠️ **Dimensioni maggiori** (~33% overhead base64)
- ⚠️ **localStorage limitato** (dipende dal browser)
- ✅ **Funziona offline** senza backend

---

## 📊 **Gestione Storage**

### **Pulizia Media**
```javascript
// Backend: Elimina media quando post viene cancellato
DELETE /api/posts/{id}
→ Rimuove anche: media/{user_id}/post_{id}/

// Frontend: Non gestisce eliminazione (solo backend)
```

### **Ottimizzazione Spazio**
```javascript
// Compressione automatica immagini
if (image_size > 5MB) {
    compress_image(quality: 0.8);
}

// Limiti hard-coded
Max images: 10MB each
Max videos: 50MB each
Max files per post: 5
```

### **Migrazione Dati**
```javascript
// Da blob URLs a struttura cartelle
// Eseguire quando backend viene attivato

async function migrateOldPosts() {
    const oldPosts = JSON.parse(localStorage.getItem('zone4love_posts') || '[]');
    
    for (const post of oldPosts) {
        if (post.image_url && post.image_url.startsWith('blob:')) {
            // Skip - blob URLs non recuperabili
            console.warn(`Post ${post.id}: blob URL non migrabile`);
        } else if (post.image_url && post.image_url.startsWith('data:')) {
            // Converti base64 in file backend
            const file = await base64ToFile(post.image_url);
            const newUrl = await uploadMedia(file);
            post.image_url = newUrl;
        }
    }
    
    // Salva post migrati
    await Promise.all(
        oldPosts.map(post => fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            body: JSON.stringify(post)
        }))
    );
}
```

---

## 🔐 **Sicurezza**

### **Controlli Implementati**

#### **1. Autenticazione**
```rust
// Upload richiede JWT valido
#[post("/upload")]
async fn upload_media(claims: web::ReqData<Claims>, ...) { }
```

#### **2. Validazione Tipo File**
```rust
// Solo MIME types validi
if !valid_types.contains(&content_type) {
    return Error("Invalid file type");
}
```

#### **3. Limitazione Dimensioni**
```rust
// Controllo durante lo streaming
while let Some(chunk) = field.next().await {
    file_size += chunk.len();
    if file_size > max_size {
        fs::remove_file(&file_path); // Cleanup
        return Error("File too large");
    }
}
```

#### **4. Path Sanitization**
```rust
// Previene path traversal
let safe_filename = sanitize_filename(&filename);
let safe_path = base_dir.join(user_id).join(post_id).join(media_type).join(safe_filename);
```

### **Permessi File System**
```bash
# Cartella media con permessi appropriati
chmod 755 media/
chmod 755 media/*/
chmod 644 media/*/*/*.jpg
```

---

## 🧪 **Testing**

### **Test Backend Upload**
```bash
curl -X POST http://localhost:8080/api/upload \
  -H "Authorization: Bearer {token}" \
  -F "image=@test.jpg" \
  -F "user_id=1" \
  -F "media_type=images"

Expected Response:
{
  "success": true,
  "data": {
    "url": "http://127.0.0.1:8080/media/1/post_xxx/images/1699123456_abc.jpg",
    "path": "media/1/post_xxx/images/1699123456_abc.jpg",
    "filename": "1699123456_abc.jpg",
    "size": 1048576
  }
}
```

### **Test Accesso Media**
```bash
# URL diretta al file
curl http://localhost:8080/media/1/post_xxx/images/1699123456_abc.jpg

# Dovrebbe restituire l'immagine
Content-Type: image/jpeg
Content-Length: 1048576
```

---

## 📈 **Performance**

### **Ottimizzazioni**

#### **Streaming Upload**
```rust
// Upload streaming invece di caricare tutto in memoria
while let Some(chunk) = field.next().await {
    file.write_all(&chunk)?;
}
```

#### **CDN Ready**
```javascript
// URL già pronti per CDN
const cdn_url = post.media[0].url.replace(
    'http://127.0.0.1:8080',
    'https://cdn.zone4love.com'
);
```

#### **Lazy Loading**
```javascript
// Frontend carica immagini solo quando visibili
<img 
  data-src={media.url}
  loading="lazy"
  class="lazy"
/>
```

---

## 🎉 **Risultato Finale**

**🌟 Struttura professionale e scalabile per gestione media!**

### **✅ Benefici**
- **Organizzazione logica** per utente e post
- **Separazione** immagini/video
- **Nomi unici** senza conflitti
- **Facile backup** per utente
- **Scalabile** a milioni di file
- **CDN ready** con URL pubblici

### **✅ Compatibilità**
- **Backend attivo**: Usa struttura cartelle
- **Backend offline**: Fallback base64
- **Migrazione**: Possibile da vecchi sistemi
- **Multi-formato**: Immagini + video supportati

**🚀 Il sistema di storage è ora production-ready! 📂✨**
