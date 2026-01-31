# Test Stats Widget - Guida Completa

## Situazione Attuale
- **Database**: 39 posts per user "zion" (ID: 1)
- **Widget mostra**: 21 posts ❌
- **Problema**: Sta calcolando dal array locale invece del database

## Fix Applicato
✅ Rimossi TUTTI i fallback che calcolavano dal array `posts` locale
✅ Ora usa SOLO l'API backend `/api/users/{id}/stats`

## Test Passo-Passo

### 1. Verifica Backend Attivo
```bash
# Nella cartella backend
cargo run --bin zone4love-backend
```

Dovresti vedere:
```
🚀 Server running on http://localhost:8080
```

### 2. Apri Browser Console (F12)

### 3. Ricarica la Pagina (Ctrl+R)

Nella console dovresti vedere:
```
📡 Loading user stats from backend...
📊 Stats response: 200 OK
✅ Stats loaded from backend (DB COUNT): {posts_count: 39, ...}
   📝 Posts in DB: 39
```

**Il widget DEVE mostrare: 39** ✅

### 4. Crea un Nuovo Post

Scrivi qualcosa e pubblica.

Nella console dovresti vedere:
```
✅ Post pubblicato con successo! 🚀
🔄 Updating stats after post creation...
📡 Fetching fresh stats from backend...
   URL: /api/users/1/stats
📊 Stats response status: 200 OK
📦 Stats response data: {success: true, data: {posts_count: 40, ...}}
✅ Stats loaded from backend (REAL COUNT FROM DB): {posts_count: 40, ...}
   📝 Posts count from DB: 40
   ❤️ Total likes: 0
   💬 Total comments: 0
✅ Stats updated successfully from backend
```

**Il widget DEVE mostrare: 40** (con animazione pulse) ✅

## Se Vedi Ancora 21

### Possibile Causa 1: Cache Browser
**Soluzione**: Hard refresh
- **Windows**: Ctrl + Shift + R
- **Mac**: Cmd + Shift + R

### Possibile Causa 2: File Non Aggiornato
**Soluzione**: Verifica che il file sia salvato
```bash
# Controlla ultima modifica
ls -la js/dashboard.js
```

### Possibile Causa 3: Backend Non Risponde
**Soluzione**: Controlla nella console se vedi:
```
❌ Stats fetch failed: 404 - Not Found
```

Se vedi questo, il backend non ha l'endpoint. Ricompila:
```bash
cd backend
cargo build
cargo run --bin zone4love-backend
```

### Possibile Causa 4: Errore di Autenticazione
**Soluzione**: Controlla nella console se vedi:
```
❌ Stats fetch failed: 401 - Unauthorized
```

Se vedi questo, fai logout e login di nuovo.

## Verifica Manuale API

Puoi testare l'endpoint direttamente:

### Opzione 1: Browser
Apri: `http://localhost:8080/api/users/1/stats`

(Dovrai essere loggato)

### Opzione 2: Console Browser
```javascript
// Copia e incolla nella console
const session = JSON.parse(localStorage.getItem('zone4love_session'));
fetch('http://localhost:8080/api/users/1/stats', {
    headers: {
        'Authorization': `Bearer ${session.access_token}`
    }
})
.then(r => r.json())
.then(data => console.log('Stats:', data));
```

Dovresti vedere:
```json
{
  "success": true,
  "data": {
    "followers_count": 0,
    "following_count": 0,
    "posts_count": 39,
    "total_likes": 0,
    "total_comments": 0
  },
  "message": null
}
```

## Debug Completo

Se ancora non funziona, esegui questo nella console:

```javascript
// 1. Verifica currentUser
console.log('Current User:', currentUser);

// 2. Verifica session
const session = JSON.parse(localStorage.getItem('zone4love_session'));
console.log('Session:', session);

// 3. Test manuale stats
async function testStats() {
    try {
        const response = await fetch('/api/users/1/stats', {
            headers: {
                'Authorization': `Bearer ${session.access_token}`
            }
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Stats data:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}
testStats();

// 4. Verifica posts array
console.log('Posts in memory:', posts.length);
console.log('User posts in memory:', posts.filter(p => p.user_id === 1).length);
```

## Checklist Finale

- [ ] Backend in esecuzione su porta 8080
- [ ] Console mostra "Stats loaded from backend (DB COUNT)"
- [ ] Widget mostra 39 (non 21)
- [ ] Dopo nuovo post, widget mostra 40
- [ ] Animazione pulse sul widget
- [ ] Nessun errore nella console

## Se Tutto Fallisce

1. **Pulisci tutto**:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Ricarica pagina** (Ctrl+Shift+R)

3. **Fai login di nuovo**

4. **Controlla console** per i log dettagliati

## Contatto

Se vedi ancora 21, copia e incolla nella chat:
1. Output completo della console (dopo aver creato un post)
2. Output di `cargo run --bin check_db`
3. Screenshot del widget
