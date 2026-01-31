# 🔍 Debug Avatar Upload - Analisi Completa

## ❌ Problema

`avatar_url` è `null` nel database dopo l'upload.

## 🔍 Analisi Completa

### 1. Verifica Upload Avatar

Apri console e cerca questi log:

```javascript
// Step 1: Upload inizia
📤 Uploading avatar...
📤 Starting avatar upload... {hasToken: true, tokenLength: 171}

// Step 2: Request inviata
🔑 Authorization header: Bearer eyJ...

// Step 3: Response ricevuta
📡 Upload response status: ???
📦 Upload result: ???

// Step 4: Avatar URL ricevuto
✅ Avatar uploaded: ???
```

### 2. Verifica Update Profile

```javascript
// Step 5: Update profile
📡 Updating profile with data: {
    username: "zion",
    email: "...",
    bio: "Ciao",
    avatar_url: "???"  // ← QUESTO DEVE ESSERE PRESENTE!
}

// Step 6: Response API
📦 Updated user data from API: {
    avatar_url: "???"  // ← QUESTO DEVE ESSERE PRESENTE!
}

// Step 7: profileUser aggiornato
✅ Avatar URL in profileUser: ???
```

## 🎯 Possibili Cause

### Causa 1: Upload Fallisce
```javascript
// Console mostra:
❌ Avatar upload failed: Error: ...
⚠️ Errore upload avatar, salvo altri dati...

// Risultato:
formData.avatar_url = undefined  // ← Non viene aggiunto!
```

**Fix**: Controlla errore upload nel backend log

### Causa 2: URL Non Ritornato
```javascript
// Upload successo ma:
📦 Upload result: {success: true, data: {}}  // ← Nessun URL!

// Risultato:
formData.avatar_url = undefined
```

**Fix**: Controlla backend response format

### Causa 3: URL Non Inviato
```javascript
// formData non include avatar_url:
📡 Updating profile with data: {
    username: "zion",
    // avatar_url mancante!
}
```

**Fix**: Verifica che `formData.avatar_url = avatarUrl` venga eseguito

### Causa 4: Backend Non Salva
```javascript
// Frontend OK ma backend log:
[DEBUG] Request body: {..., avatar_url: Some("http://...")}
[DEBUG] Updating avatar_url to: Some("http://...")
[ERROR] ❌ Failed to update avatar_url: ...
```

**Fix**: Controlla backend error log

### Causa 5: Campo DB Mancante
```sql
-- Tabella users non ha colonna avatar_url
SELECT * FROM users;
-- Error: no such column: avatar_url
```

**Fix**: Aggiungi colonna al database

## 🧪 Test Completo

### Step 1: Apri Console (F12)

### Step 2: Upload Avatar
1. Apri "Modifica Profilo"
2. Seleziona avatar
3. Click "Salva Modifiche"

### Step 3: Copia TUTTI i Log

Cerca e copia:
```
📤 Starting avatar upload...
📡 Upload response status: 
📦 Upload result:
✅ Avatar uploaded:
📡 Updating profile with data:
📦 Updated user data from API:
✅ Avatar URL in profileUser:
```

### Step 4: Backend Terminal

Cerca:
```
[INFO] 📤 UPLOAD REQUEST received
[INFO] ✅ Upload authenticated for user: 1
[DEBUG] is_avatar_upload: ???
[DEBUG] Saving to: ???
[INFO] 🔄 UPDATE USER REQUEST - User ID: 1
[DEBUG] Request body: {..., avatar_url: ???}
[DEBUG] Updating avatar_url to: ???
[DEBUG] ✅ Avatar URL updated successfully
```

### Step 5: Verifica Database

```sql
SELECT id, username, avatar_url FROM users WHERE id = 1;
```

Risultato atteso:
```
1|zion|http://127.0.0.1:8080/media/1/avatar/1731420123456_abc.jpg
```

Risultato attuale:
```
1|zion|null  ← PROBLEMA!
```

### Step 6: Verifica File System

```bash
ls backend/media/1/avatar/
```

Se il file esiste → Upload OK, problema nel salvataggio DB
Se il file non esiste → Upload fallito

## 🔧 Debug Script

Copia e incolla in console PRIMA di fare upload:

```javascript
// Override uploadAvatar per debug
const originalUploadAvatar = uploadAvatar;
window.uploadAvatar = async function(file) {
    console.log('🔍 DEBUG: uploadAvatar called with:', file);
    try {
        const result = await originalUploadAvatar(file);
        console.log('🔍 DEBUG: uploadAvatar returned:', result);
        return result;
    } catch (error) {
        console.error('🔍 DEBUG: uploadAvatar error:', error);
        throw error;
    }
};

// Override handleEditProfileSubmit per debug
console.log('🔍 DEBUG: Monitoring form submit...');
```

Poi fai upload e condividi TUTTI i log!

## 📊 Checklist Debug

- [ ] Console aperta (F12)
- [ ] Backend terminal visibile
- [ ] Test upload eseguito
- [ ] Log frontend copiati
- [ ] Log backend copiati
- [ ] Database verificato
- [ ] File system verificato

## 🎯 Cosa Condividere

1. **Frontend Console Log** (completo)
2. **Backend Terminal Log** (completo)
3. **Database Query Result**:
   ```sql
   SELECT id, username, avatar_url FROM users WHERE id = 1;
   ```
4. **File System Check**:
   ```bash
   ls backend/media/1/avatar/
   ```

Con questi dati posso identificare esattamente dove fallisce! 🔍
