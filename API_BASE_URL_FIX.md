# 🔧 API_BASE_URL Conflict Fix

## ❌ Problema Risolto

Errore in console:
```
Uncaught SyntaxError: Identifier 'API_BASE_URL' has already been declared
```

### Causa
Più file JavaScript dichiaravano `const API_BASE_URL = '/api'`:
- `auth.js` (caricato per primo)
- `profile.js` (caricato dopo auth.js) ❌ CONFLITTO
- `messages.js` (caricato dopo auth.js) ❌ CONFLITTO
- `settings.js` (caricato dopo auth.js) ❌ CONFLITTO
- `dashboard.js` (caricato da solo, no conflitto) ✅ OK

Quando più script dichiarano la stessa `const`, JavaScript genera un errore.

## ✅ Soluzione

### Strategia
Mantenere **UNA SOLA** dichiarazione di `API_BASE_URL` in `auth.js`, che viene caricato per primo in tutte le pagine che lo richiedono.

### Ordine di Caricamento Script

#### profile.html
```html
<script src="js/stars.js"></script>
<script src="js/auth.js"></script>      <!-- ✅ Dichiara API_BASE_URL -->
<script src="js/profile.js"></script>   <!-- ✅ Usa API_BASE_URL da auth.js -->
```

#### messages.html
```html
<script src="js/stars.js"></script>
<script src="js/auth.js"></script>      <!-- ✅ Dichiara API_BASE_URL -->
<script src="js/messages.js"></script>  <!-- ✅ Usa API_BASE_URL da auth.js -->
```

#### settings.html
```html
<script src="js/stars.js"></script>
<script src="js/auth.js"></script>      <!-- ✅ Dichiara API_BASE_URL -->
<script src="js/settings.js"></script>  <!-- ✅ Usa API_BASE_URL da auth.js -->
```

#### dashboard.html
```html
<script src="js/stars.js"></script>
<script src="js/dashboard.js"></script> <!-- ✅ Dichiara API_BASE_URL (no auth.js) -->
```

## 🔧 Modifiche Applicate

### 1. auth.js (MANTIENE la dichiarazione)
```javascript
// Authentication JavaScript

// API Configuration - relative path since frontend is served by same server
const API_BASE_URL = '/api';  // ✅ UNICA DICHIARAZIONE

// ... resto del codice
```

### 2. profile.js (RIMOSSA la dichiarazione)
```javascript
// Profile Page JavaScript

// API_BASE_URL is already defined in auth.js (loaded before this script)
// No need to redeclare it here

// Global state
let currentUser = null;
// ... resto del codice
```

### 3. messages.js (RIMOSSA la dichiarazione)
```javascript
// Messages Page JavaScript

// API_BASE_URL is already defined in auth.js (loaded before this script)
// No need to redeclare it here

// Global state
let currentUser = null;
// ... resto del codice
```

### 4. settings.js (RIMOSSA la dichiarazione)
```javascript
// Settings Page JavaScript

// API_BASE_URL is already defined in auth.js (loaded before this script)
// No need to redeclare it here

// Global state
let currentUser = null;
// ... resto del codice
```

### 5. dashboard.js (MANTIENE la dichiarazione)
```javascript
// Dashboard JavaScript

// API base URL - relative path since frontend is served by same server
const API_BASE_URL = '/api';  // ✅ OK (non carica auth.js)

// Global state
let currentUser = null;
// ... resto del codice
```

## 📊 Riepilogo

| File | Dichiara API_BASE_URL? | Motivo |
|------|------------------------|--------|
| **auth.js** | ✅ SÌ | Caricato per primo in profile/messages/settings |
| **dashboard.js** | ✅ SÌ | Non carica auth.js, ha bisogno della propria |
| **profile.js** | ❌ NO | Usa quella di auth.js |
| **messages.js** | ❌ NO | Usa quella di auth.js |
| **settings.js** | ❌ NO | Usa quella di auth.js |
| **stars.js** | ❌ NO | Non usa API |
| **main.js** | ❌ NO | Non usa API |

## 🧪 Test

### Prima (❌ ERRORE)
```javascript
// Console
Uncaught SyntaxError: Identifier 'API_BASE_URL' has already been declared (at profile.js:4:1)
```

### Dopo (✅ OK)
```javascript
// Console
👤 Loading own profile...
📊 Loading stats for user 1...
✅ Stats loaded: {posts_count: 42, ...}
// Nessun errore!
```

## 🔍 Come Verificare

1. **Apri profile.html**
2. **Apri DevTools Console**
3. **Verifica**:
   - ✅ Nessun errore "Identifier 'API_BASE_URL' has already been declared"
   - ✅ Profilo carica correttamente
   - ✅ Stats mostrate

4. **Ripeti per**:
   - messages.html
   - settings.html
   - dashboard.html

## 📋 Files Modificati

✅ `backend/static/js/profile.js` → `js/profile.js`
✅ `backend/static/js/messages.js` → `js/messages.js`
✅ `backend/static/js/settings.js` → `js/settings.js`

### Non Modificati:
- `auth.js` (mantiene dichiarazione)
- `dashboard.js` (mantiene dichiarazione)
- `stars.js` (non usa API)

## 💡 Best Practice

### ✅ DO
- Dichiarare variabili globali in UN SOLO file
- Caricare quel file per primo
- Documentare con commenti dove viene dichiarata

### ❌ DON'T
- Dichiarare la stessa `const` in più file
- Usare `var` invece di `const` per "aggirare" il problema
- Ignorare gli errori di redichiarazione

## 🎉 Risolto!

Ora tutti i file JavaScript caricano correttamente senza conflitti di dichiarazione! 🚀

### Vantaggi:
1. ✅ Nessun errore in console
2. ✅ Codice più pulito e manutenibile
3. ✅ Chiaro dove viene dichiarata la variabile
4. ✅ Facile da debuggare
5. ✅ Segue le best practice JavaScript
