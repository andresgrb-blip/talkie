# 🚀 Zone4Love - Quick Start Guide

Guida rapida per avviare il progetto completo (Frontend + Backend).

## 📋 Prerequisiti

### Obbligatori
- **Rust** 1.70+ - [Download](https://rustup.rs/)
- **Browser** moderno (Chrome, Firefox, Edge)

### Opzionali (per server locale)
- **Python** 3.x (per server HTTP) o
- **Node.js** (per http-server) o
- **PHP** (per server integrato)

## 🔧 Setup Backend (Prima volta)

### Windows

1. Apri PowerShell o CMD nella cartella `backend`:
```cmd
cd backend
```

2. Esegui lo script di setup:
```cmd
setup.bat
```

3. **Importante**: Edita il file `.env` creato:
```env
JWT_SECRET=your-super-secret-key-change-this
FRONTEND_URL=http://127.0.0.1:5500
```

4. Il setup installa le dipendenze e crea il database automaticamente.

### Setup Manuale (se lo script non funziona)

```cmd
cd backend
copy .env.example .env
cargo build
mkdir uploads
```

Poi edita `.env` con il tuo JWT_SECRET.

**⏱️ Nota Importante**: La prima compilazione (`cargo build`) richiede **5-10 minuti** per scaricare e compilare tutte le dipendenze Rust. È normale! Le compilazioni successive saranno molto più veloci.

## 🚀 Avvio del Progetto

### Step 1: Avvia il Backend

Apri un terminale nella cartella `backend`:

```cmd
cd backend
cargo run
```

Aspetta il messaggio:
```
Starting Zone4Love server...
Server will run on 127.0.0.1:8080
Database initialized successfully
```

✅ Il backend è pronto su **http://127.0.0.1:8080**

### Step 2: Avvia il Frontend

Hai 3 opzioni:

#### Opzione A: Apri direttamente (semplice ma CORS limitato)

Apri `index.html` con doppio click.

⚠️ **Nota**: Alcune funzionalità potrebbero non funzionare per restrizioni CORS.

#### Opzione B: Python HTTP Server (consigliato)

Apri un altro terminale nella cartella principale:

```cmd
python -m http.server 5500
```

Poi visita: **http://127.0.0.1:5500**

#### Opzione C: Node.js http-server

```cmd
npx http-server -p 5500
```

Poi visita: **http://127.0.0.1:5500**

#### Opzione D: PHP Server

```cmd
php -S 127.0.0.1:5500
```

Poi visita: **http://127.0.0.1:5500**

### Step 3: Usa l'applicazione! 🎉

1. Apri **http://127.0.0.1:5500** nel browser
2. Clicca su "Inizia l'Avventura" o "Registrati Ora"
3. Crea un nuovo account
4. Fai login
5. Esplora la dashboard!

## 🧪 Testare l'API

### Test con Browser

Visita: **http://127.0.0.1:8080/health**

Dovresti vedere:
```json
{
  "status": "ok",
  "message": "Zone4Love API is running"
}
```

### Test Registrazione

Usa PowerShell o CMD:

```powershell
curl.exe -X POST http://127.0.0.1:8080/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"test\",\"email\":\"test@example.com\",\"password\":\"password123\",\"birthdate\":\"2000-01-15\"}'
```

### Test Login

```powershell
curl.exe -X POST http://127.0.0.1:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'
```

## 🎯 Flusso Utente Completo

1. **Homepage** (`index.html`)
   - Benvenuto con animazioni galattiche
   - Clicca "Accedi" o "Registrati"

2. **Registrazione** (`register.html`)
   - Compila form con username, email, password, data nascita
   - Indicatore forza password real-time
   - Validazione età (min 13 anni)
   - Click "Crea Account"
   - ✅ Account creato su database

3. **Login** (`login.html`)
   - Inserisci email e password
   - Click "Accedi"
   - ✅ JWT token ricevuto e salvato

4. **Dashboard** (`dashboard.html`)
   - Vedi stats personalizzate
   - Feed post (placeholder per ora)
   - Sidebar con menu
   - Logout funzionante

## 🐛 Troubleshooting

### Backend non si avvia

```
Error: JWT_SECRET must be set
```
**Soluzione**: Edita `.env` e imposta `JWT_SECRET`

```
Error: database is locked
```
**Soluzione**: Chiudi altre istanze del backend

### Frontend non si connette al backend

```
Failed to fetch
```
**Soluzione**: 
1. Verifica che il backend sia avviato su porta 8080
2. Usa un server HTTP (non file://) per evitare CORS

### Login/Registrazione non funziona

**Controlla la Console del Browser** (F12):
- Errori di rete? → Backend non raggiungibile
- Errori CORS? → Usa server HTTP locale
- Errore 400/401? → Controlla credenziali

**Controlla i Log del Backend**:
- Dovrebbero apparire richieste POST a `/api/auth/login`
- Se non vedi nulla, problema di rete

## 📁 Struttura Porte

- **Backend API**: http://127.0.0.1:8080
- **Frontend**: http://127.0.0.1:5500 (consigliato)
- **WebSocket**: ws://127.0.0.1:8080/api/ws

## 🔄 Riavvio Rapido

### Solo Backend
```cmd
cd backend
cargo run
```

### Solo Frontend  
```cmd
python -m http.server 5500
```

## 💾 Database

Il database SQLite viene creato automaticamente in:
```
backend/zone4love.db
```

Per reset completo:
```cmd
cd backend
del zone4love.db
cargo run
```

Il database verrà ricreato con schema vuoto.

## 📊 Monitoraggio

### Log Backend

Il backend stampa log su console:
```
[INFO] User registered successfully: astronauta123
[INFO] User logged in successfully: test@example.com
[INFO] WebSocket session abc123 started
```

### DevTools Frontend

Apri DevTools (F12) per vedere:
- Network: Chiamate API
- Console: Log JavaScript  
- Application > Storage: Token salvati

## 🎨 Funzionalità Implementate

### ✅ Completamente Funzionanti

- [x] Registrazione utente con validazione
- [x] Login con JWT
- [x] Dashboard protetta
- [x] Logout completo
- [x] Campo stellare animato
- [x] Tema galattico responsive
- [x] Validazioni form real-time
- [x] Password strength indicator
- [x] Error handling completo

### 🚧 In Sviluppo (Backend pronto, UI placeholder)

- [ ] Create post (API ready)
- [ ] Like/Unlike post (API ready)
- [ ] Commenti (API ready)
- [ ] Follow/Unfollow (API ready)
- [ ] Feed personalizzato (API ready)
- [ ] WebSocket real-time (connessione ready)

## 🔐 Security Note

⚠️ **Per Sviluppo**:
- JWT_SECRET è nel file .env locale
- CORS permette solo localhost

⚠️ **Per Produzione**:
- Usa JWT_SECRET casuale e sicuro
- Configura CORS per dominio reale
- Usa HTTPS
- Database su disco sicuro
- Rate limiting
- Logging professionale

## 📚 Prossimi Passi

1. **Testa le funzionalità base**: Registrazione → Login → Dashboard
2. **Esplora l'API**: Leggi `backend/README.md`
3. **Personalizza**: Modifica stili, colori, contenuti
4. **Espandi**: Aggiungi nuove features usando le API esistenti
5. **Deploy**: Segui guide deploy in README principale

## 🆘 Supporto

Se hai problemi:

1. **Controlla i log**: Backend console + Browser DevTools
2. **Verifica porte**: Backend su 8080, Frontend su 5500
3. **Leggi errori**: Messaggi dettagliati in console
4. **README completo**: Vedi `README.md` e `backend/README.md`

## 🎉 Tutto Pronto!

Ora hai:
- ✅ Backend Rust funzionante con SQLite
- ✅ Frontend con tema galattico
- ✅ Autenticazione JWT completa  
- ✅ Database persistente
- ✅ WebSocket ready
- ✅ API RESTful complete

**Buon coding! 🚀🌌**
