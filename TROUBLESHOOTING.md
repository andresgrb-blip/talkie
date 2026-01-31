# 🔧 Troubleshooting Guide

Soluzioni ai problemi comuni di Zone4Love.

---

## 🦀 Errori Backend (Rust)

### ❌ Error: "failed to resolve: use of undeclared crate"

**Problema**: Dipendenze mancanti nel Cargo.toml

**Soluzione**:
```bash
cd backend
cargo clean
cargo build
```

Se l'errore persiste, verifica che `Cargo.toml` contenga:
```toml
actix = "0.13"
actix-web-httpauth = "0.8"
```

### ❌ Error: "JWT_SECRET must be set"

**Problema**: File `.env` mancante o non configurato

**Soluzione**:
```bash
cd backend
copy .env.example .env
```

Poi apri `.env` e modifica:
```env
JWT_SECRET=your-super-secret-key-here
```

### ❌ Error: "database is locked"

**Problema**: Altra istanza del server è in esecuzione

**Soluzione**:
```bash
# Chiudi tutte le istanze del backend
# Poi riavvia
cargo run
```

### ⏱️ Compilazione Lentissima

**È Normale!** La prima compilazione richiede 5-10 minuti.

**Perché?**
- Scarica ~15 crates Rust
- Compila tutte le dipendenze
- Crea il database

**Le compilazioni successive saranno veloci (< 30 secondi)!**

### ❌ Error: "could not compile `zone4love-backend`"

**Soluzione**:
```bash
cd backend
cargo clean
cargo build --verbose
```

Questo mostrerà l'errore esatto. Se riguarda dipendenze:
```bash
cargo update
cargo build
```

---

## 🌐 Errori Frontend

### ❌ CORS Error nel Browser

**Problema**: Backend non configurato correttamente o frontend su file://

**Soluzione**:
1. Verifica che backend sia avviato su porta 8080
2. Usa un server HTTP per il frontend:
```bash
python -m http.server 5500
```
3. NON aprire `index.html` direttamente (evita file://)

### ❌ Network Error / Failed to fetch

**Problema**: Backend non raggiungibile

**Soluzione**:
1. Verifica backend running:
```bash
curl http://127.0.0.1:8080/health
```

2. Se non risponde, avvia backend:
```bash
cd backend
cargo run
```

3. Verifica in `.env`:
```env
FRONTEND_URL=http://127.0.0.1:5500
```

### ❌ Login/Register Non Funziona

**Debug**:
1. Apri DevTools (F12) → Console
2. Verifica errori JavaScript
3. Vai in Network tab → cerca chiamate API
4. Status 404? Backend non avviato
5. Status 500? Controlla log backend
6. Status 0? Problema CORS

**Soluzione**:
- Assicurati backend sia running
- Usa http-server per frontend (non file://)
- Controlla console per errori specifici

### ❌ Dashboard Vuota o Errori

**Problema**: Token non salvato o non valido

**Soluzione**:
1. DevTools (F12) → Application → Storage
2. Verifica presenza di:
   - `zone4love_access_token`
   - `zone4love_user`
3. Se mancanti, rifai login
4. Se presenti ma errori, fai logout e re-login

---

## 🚫 Errori Porte

### ❌ Port 8080 already in use

**Soluzione**:
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID [PID_NUMBER] /F

# Oppure cambia porta in .env
SERVER_PORT=8081
```

### ❌ Port 5500 already in use

**Soluzione**:
```bash
# Usa un'altra porta
python -m http.server 5501

# Poi aggiorna .env backend
FRONTEND_URL=http://127.0.0.1:5501
```

---

## 💾 Errori Database

### ❌ Database Not Found

**Soluzione**: Il database viene creato automaticamente al primo avvio.
```bash
cd backend
cargo run
```

Aspetta che appaia: "Database initialized successfully"

### ❌ Reset Database

Se vuoi ricominciare da zero:
```bash
cd backend
del zone4love.db
cargo run
```

Il database verrà ricreato vuoto.

---

## 🔐 Errori Autenticazione

### ❌ "Invalid token"

**Soluzione**:
1. Fai logout
2. Cancella cache browser
3. Rifai login

### ❌ "User already exists"

**Soluzione**: Email o username già registrati.
- Usa email diversa
- Oppure fai login con quella esistente

### ❌ "Age verification failed"

**Soluzione**: Devi avere almeno 13 anni.
Verifica data di nascita inserita.

---

## 🖥️ Errori Sistema

### ❌ Rust Non Installato

**Soluzione**:
1. Vai su https://rustup.rs/
2. Scarica e installa
3. Riavvia terminale
4. Verifica: `cargo --version`

### ❌ Python Non Installato

**Soluzione Alternativa** (senza Python):
- Usa Node.js: `npx http-server -p 5500`
- Oppure apri `index.html` direttamente (limiti CORS)

---

## 🧪 Test Rapidi

### Verifica Backend Funzionante

```bash
# Test 1: Health check
curl http://127.0.0.1:8080/health

# Test 2: Registrazione
curl -X POST http://127.0.0.1:8080/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"test\",\"email\":\"test@test.com\",\"password\":\"test1234\",\"birthdate\":\"2000-01-15\"}"

# Test 3: Login
curl -X POST http://127.0.0.1:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@test.com\",\"password\":\"test1234\"}"
```

Oppure usa: `backend/test-api.bat`

### Verifica Frontend Funzionante

1. Apri: http://127.0.0.1:5500
2. Dovrebbe caricare homepage con stelle
3. Click "Registrati"
4. Compila form
5. Se redirect a login → ✅ Funziona!

---

## 📝 Log e Debug

### Backend Logs

Configura in `.env`:
```env
RUST_LOG=debug
```

Livelli: `trace`, `debug`, `info`, `warn`, `error`

### Frontend Logs

Apri DevTools (F12):
- **Console**: Errori JavaScript
- **Network**: Chiamate API
- **Application**: Token salvati

---

## 🆘 Ancora Problemi?

### Checklist Finale

- [ ] Rust installato? `cargo --version`
- [ ] Backend `.env` configurato?
- [ ] Backend running su :8080?
- [ ] Frontend su http:// (non file://)?
- [ ] Browser console senza errori?
- [ ] Backend logs senza errori?

### Reset Completo

Se tutto il resto fallisce:

```bash
# 1. Chiudi tutto (backend, frontend)

# 2. Pulisci backend
cd backend
cargo clean
del zone4love.db

# 3. Ricrea .env
copy .env.example .env
# Edita .env con JWT_SECRET

# 4. Ricompila
cargo build

# 5. Avvia
cargo run

# 6. Nuovo terminale - Frontend
cd ..
python -m http.server 5500

# 7. Browser
# http://127.0.0.1:5500
```

---

## 💡 Tips Utili

### Performance

- Prima compilazione: 5-10 minuti ⏱️
- Compilazioni successive: < 30 secondi ⚡
- Release build più veloce: `cargo build --release`

### Sviluppo

```bash
# Auto-reload backend
cargo install cargo-watch
cargo watch -x run

# Formatta codice
cargo fmt

# Linting
cargo clippy
```

### Shortcuts

- `Ctrl+C` → Stop server
- `F12` → DevTools browser
- `Ctrl+Shift+R` → Hard refresh browser

---

**Se i problemi persistono, controlla:**
- [QUICKSTART.md](QUICKSTART.md) per setup dettagliato
- [backend/README.md](backend/README.md) per API docs
- Log del backend per errori specifici
