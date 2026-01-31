# 🔧 Avatar Path Fix - media/{user_id}/avatar/

## ❌ Problema

L'avatar veniva salvato in:
```
media/{user_id}/{random_post_id}/avatar.jpg
```

Ma dovrebbe essere:
```
media/{user_id}/avatar/avatar.jpg
```

## ✅ Soluzione

### 1. Backend - Detect Avatar Upload

```rust
// upload.rs
pub async fn upload_media(req: HttpRequest, mut payload: Multipart) -> Result<HttpResponse, Error> {
    let user_id = claims.sub;
    
    // Check if this is an avatar upload
    let is_avatar_upload = req.headers()
        .get("X-Upload-Type")
        .and_then(|v| v.to_str().ok())
        .map(|s| s == "avatar")
        .unwrap_or(false);
    
    // Use "avatar" as folder name for avatar uploads
    let post_id = if is_avatar_upload {
        "avatar".to_string()
    } else {
        Uuid::new_v4().to_string()
    };
    
    // Result: media/{user_id}/avatar/filename.jpg
}
```

### 2. Frontend - Send Header

```javascript
// profile.js
async function uploadAvatar(file) {
    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-Upload-Type': 'avatar'  // ← Indica che è un avatar!
        },
        body: formData
    });
}
```

## 🎯 Risultato

### Avatar Upload
```
POST /api/upload
Headers: 
  - Authorization: Bearer ...
  - X-Upload-Type: avatar

File salvato in:
  media/1/avatar/gallery1_ma1721.jpg
  
URL ritornato:
  http://localhost:8080/media/1/avatar/gallery1_ma1721.jpg
```

### Post Media Upload
```
POST /api/upload
Headers:
  - Authorization: Bearer ...
  (no X-Upload-Type header)

File salvato in:
  media/1/abc-123-def/image1.jpg
  
URL ritornato:
  http://localhost:8080/media/1/abc-123-def/image1.jpg
```

## 📁 Struttura Directory

```
media/
├── 1/                      # user_id
│   ├── avatar/             # Avatar folder
│   │   └── avatar.jpg      # Avatar file
│   ├── abc-123-def/        # Post 1 media
│   │   ├── image1.jpg
│   │   └── image2.jpg
│   └── xyz-789-ghi/        # Post 2 media
│       └── video1.mp4
├── 2/                      # user_id
│   ├── avatar/
│   │   └── profile.png
│   └── post-media/
│       └── photo.jpg
```

## 🔄 Flusso Completo

### Upload Avatar
```
1. User seleziona avatar
   ↓
2. uploadAvatar() chiamato
   ↓
3. FormData creato con file
   ↓
4. POST /api/upload con header "X-Upload-Type: avatar"
   ↓
5. Backend rileva is_avatar_upload = true
   ↓
6. post_id = "avatar" (invece di UUID)
   ↓
7. File salvato in media/{user_id}/avatar/
   ↓
8. URL ritornato: http://localhost:8080/media/1/avatar/filename.jpg
   ↓
9. URL salvato in users.avatar_url
   ↓
10. Avatar mostrato nel profilo
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

### Step 3: Test Upload
1. Hard refresh: `Ctrl + Shift + R`
2. Apri "Modifica Profilo"
3. Seleziona avatar
4. Click "Salva Modifiche"

### Step 4: Verifica Path
```bash
# Controlla che il file sia salvato correttamente
ls backend/media/1/avatar/
# Dovrebbe mostrare: avatar.jpg (o nome file originale)
```

### Step 5: Verifica URL
```javascript
// In console
console.log(profileUser.avatar_url);
// Dovrebbe essere: http://localhost:8080/media/1/avatar/filename.jpg
```

## 📊 Log Backend Atteso

```
[INFO] 📤 UPLOAD REQUEST received
[DEBUG] Headers: {"authorization": "Bearer ...", "x-upload-type": "avatar"}
[INFO] ✅ Upload authenticated for user: 1
[DEBUG] is_avatar_upload: true
[DEBUG] post_id: "avatar"
[DEBUG] Saving to: media/1/avatar/gallery1_ma1721.jpg
[INFO] ✅ File uploaded successfully
```

## ✅ Vantaggi

1. **Path Organizzato**: Avatar sempre in `media/{user_id}/avatar/`
2. **Facile da Trovare**: Sai sempre dove cercare l'avatar
3. **Sovrascrivibile**: Nuovo avatar sostituisce il vecchio
4. **Separato dai Post**: Avatar non mescolato con media dei post
5. **Backward Compatible**: Post media continua a funzionare normalmente

## 🎉 Completato!

Ora l'avatar viene salvato nel path corretto:
- ✅ `media/{user_id}/avatar/filename.jpg`
- ✅ Header `X-Upload-Type: avatar` per identificare upload avatar
- ✅ Backend rileva e usa folder "avatar"
- ✅ URL corretto salvato nel database

Ricompila, riavvia e testa! 🚀
