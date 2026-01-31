# 👋 START HERE - Zone4Love

**Benvenuto su Zone4Love!** Sei a 3 minuti dal vedere il progetto funzionante.

---

## ⚡ Super Quick Start (3 minuti)

### Step 1: Setup Backend (1 min)
```bash
cd backend
setup.bat
```

Questo installa tutto e crea `.env`. **Importante**: Apri `.env` e verifica che `JWT_SECRET` sia impostato (qualsiasi valore va bene per test).

### Step 2: Avvia Tutto (1 click)
```bash
START.bat
```

Questo avvia automaticamente backend e frontend! 🚀

### Step 3: Usa l'App! (30 sec)
1. Il browser si apre automaticamente
2. Click "Registrati Ora"
3. Compila il form
4. Login
5. Esplora la dashboard!

**Done! Progetto funzionante in 3 minuti! 🎉**

---

## 🆘 Problemi?

### Backend non si avvia?
```bash
# Installa Rust se non presente
# https://rustup.rs/

# Verifica Rust installato
cargo --version

# Se ok, riprova
cd backend
cargo run
```

### Frontend non si carica?
```bash
# Opzione 1: Python
python -m http.server 5500

# Opzione 2: Apri direttamente
# Doppio click su index.html
```

### Ancora problemi?
Leggi [QUICKSTART.md](QUICKSTART.md) per troubleshooting completo!

---

## 📚 Cosa Leggere Dopo

1. **Sei nuovo?** → [QUICKSTART.md](QUICKSTART.md)
2. **Vuoi capire tutto?** → [README.md](README.md)
3. **Backend API?** → [backend/README.md](backend/README.md)
4. **Progress del progetto?** → [PROGRESS.md](PROGRESS.md)
5. **Feature complete?** → [COMPLETED.md](COMPLETED.md)

---

## 🎯 Quick Reference

| Cosa | URL/Command |
|------|-------------|
| **Backend** | http://127.0.0.1:8080 |
| **Frontend** | http://127.0.0.1:5500 |
| **Health Check** | http://127.0.0.1:8080/health |
| **Avvia Backend** | `cd backend && cargo run` |
| **Avvia Frontend** | `python -m http.server 5500` |
| **Avvia Tutto** | `START.bat` |
| **Test API** | `cd backend && test-api.bat` |

---

## 🏗️ Cosa C'è nel Progetto?

### Frontend
- 🏠 **Homepage** - Tema galattico con stelle animate
- 🔐 **Login/Register** - Autenticazione completa
- 📊 **Dashboard** - Stats, feed, sidebar

### Backend (Rust)
- 🔒 **Auth API** - JWT con register/login/refresh
- 👥 **Users API** - Profile, follow, followers
- 📝 **Posts API** - Create, read, update, delete, like
- 💬 **Comments API** - Add e list commenti
- 🔌 **WebSocket** - Real-time ready

### Database
- 🗄️ **SQLite** - 8 tabelle, auto-migrations
- 📊 **Schema** - Users, Posts, Likes, Comments, Follows, etc.

---

## ✅ Checklist Veloce

Prima di iniziare, verifica:
- [ ] Rust installato (`cargo --version`)
- [ ] Python installato (opzionale)
- [ ] Porte 8080 e 5500 libere

Se tutto ✅:
```bash
START.bat
```

---

## 🎉 È Tutto!

**Il progetto è pronto, testato e funzionante!**

Cosa aspetti? Avvia e divertiti! 🚀🌌

```bash
START.bat
```

---

**Made with 💜 and 🦀**
