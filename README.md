# Zone4Love - Social Galaxy 🌌

Una piattaforma social media innovativa con tema galattico, animazioni fluide e un'esperienza utente straordinaria.

**Status**: ✅ MVP Completo e Funzionante  
**Version**: 1.0.0-MVP  
**Last Update**: 9 Novembre 2024

---

## 🚀 Quick Start

### Avvio Rapido (Un Click!)
```bash
START.bat
```

### Avvio Manuale
```bash
# Terminal 1 - Backend
cd backend
cargo run

# Terminal 2 - Frontend
python -m http.server 5500

# Browser: http://127.0.0.1:5500
```

📖 **Guida Completa**: Vedi [QUICKSTART.md](QUICKSTART.md)

## 🚀 Caratteristiche

- **Design Galattico Unico**: Interfaccia ispirata all'universo con stelle, pianeti e nebulose
- **Animazioni GSAP**: Effetti fluidi e professionali usando i plugin GSAP
- **Campo Stellare Dinamico**: Canvas HTML5 con stelle scintillanti e stelle cadenti
- **Real-Time Ready**: Struttura preparata per WebSocket e comunicazione in tempo reale
- **Responsive**: Design completamente responsive e ottimizzato per tutti i dispositivi
- **Performance**: Codice ottimizzato per prestazioni eccellenti

## 📂 Struttura del Progetto

```
zone4love/
├── index.html          # Homepage principale
├── login.html          # Pagina di login
├── register.html       # Pagina di registrazione
├── dashboard.html      # Dashboard utente
├── styles/
│   ├── main.css       # Stili personalizzati con tema galaxy
│   ├── auth.css       # Stili per pagine autenticazione
│   └── dashboard.css  # Stili per dashboard
├── js/
│   ├── main.js        # Logica principale e animazioni GSAP
│   ├── stars.js       # Campo stellare riutilizzabile
│   ├── auth.js        # Gestione autenticazione
│   └── dashboard.js   # Logica dashboard
├── gsap/              # Plugin GSAP
│   ├── gsap.min.js
│   ├── ScrollTrigger.min.js
│   ├── ScrollToPlugin.min.js
│   ├── ScrollSmoother.min.js
│   └── ... (altri plugin)
├── project.txt        # Specifiche del progetto
└── README.md          # Questo file
```

## 🎨 Tecnologie Utilizzate

### Frontend
- **HTML5** - Struttura semantica
- **CSS3** - Animazioni e stili personalizzati
- **TailwindCSS** (CDN) - Utility-first CSS framework
- **JavaScript ES6+** - Logica applicativa
- **GSAP 3** - Animazioni professionali
- **Canvas API** - Effetti grafici dinamici

### Plugin GSAP Utilizzati
- ScrollTrigger - Animazioni basate sullo scroll
- ScrollToPlugin - Smooth scrolling
- ScrollSmoother - Scrolling fluido e parallax
- MorphSVG - Morphing SVG avanzato
- DrawSVG - Animazioni di disegno SVG
- SplitText - Animazioni testo avanzate

### Backend (In Sviluppo)
- **Rust** - Linguaggio backend
- **Actix-web** - Framework web veloce
- **SQLite** - Database per sviluppo
- **WebSocket** - Comunicazione real-time
- **JWT** - Autenticazione sicura

## 🎯 Avvio Rapido

### Opzione 1: File System Locale
Semplicemente apri `index.html` nel tuo browser preferito.

### Opzione 2: Server Locale
Per una migliore esperienza (specialmente per WebSocket in futuro):

```bash
# Con Python
python -m http.server 8000

# Con Node.js (npx http-server)
npx http-server -p 8000

# Con PHP
php -S localhost:8000
```

Poi visita: `http://localhost:8000`

## 🔗 Navigazione tra le Pagine

### Flusso Utente

1. **Homepage (`index.html`)** 
   - Bottone "Accedi" → `login.html`
   - Bottone "Inizia l'Avventura" → `register.html`
   - Bottone "Registrati Ora" → `register.html`
   - Se già loggato: Bottone "Accedi" diventa "Dashboard" → `dashboard.html`

2. **Login (`login.html`)**
   - Form di login con validazione
   - Link "Registrati ora" → `register.html`
   - Link "Home" → `index.html`
   - Dopo login con successo → `dashboard.html`

3. **Registrazione (`register.html`)**
   - Form completo con validazione
   - Indicatore forza password
   - Link "Accedi" → `login.html`
   - Link "Home" → `index.html`
   - Dopo registrazione → `login.html`

4. **Dashboard (`dashboard.html`)**
   - Accessibile solo se autenticato
   - Sidebar con navigazione
   - Feed social
   - Stats e widgets
   - Bottone logout → `index.html`

### Sistema di Autenticazione

**Demo Mode**: Attualmente l'autenticazione è in modalità demo:
- Qualsiasi credenziale viene accettata dopo 1.5 secondi
- La sessione viene salvata in localStorage/sessionStorage
- Il token demo è: `demo_token`

**Per Produzione**: Sostituire le chiamate simulate in `auth.js` con vere chiamate API al backend Rust.

## ✨ Funzionalità della Homepage

### Sezioni Principali
1. **Hero Section** - Intro con titolo animato e pianeti fluttuanti
2. **Features Section** - Tre card animate con le caratteristiche principali
3. **Experience Section** - Sistema orbitale interattivo con spiegazioni
4. **CTA Section** - Call-to-action con effetto gradiente animato
5. **Footer** - Link utili e informazioni

### Effetti e Animazioni
- Campo stellare con 300+ stelle scintillanti
- Stelle cadenti periodiche
- Parallax mouse per pianeti e nebulosa
- Animazioni scroll-triggered per ogni sezione
- Hover effects sui bottoni e card
- Ripple effect sui click
- Smooth scrolling tra le sezioni
- Sistema orbitale con 3 orbite animate

### Interazioni
- **Navigation**: Smooth scroll alle sezioni
- **Bottoni**: Hover e click effects
- **Card**: Sollevamento e rotazione al hover
- **Mouse Parallax**: Pianeti e nebulosa seguono il cursore

## 🔐 Pagine di Autenticazione

### Login (`login.html`)
**Caratteristiche:**
- Form con email/username e password
- Toggle visibilità password
- Checkbox "Ricordami"
- Link recupero password
- Login social (Google, GitHub) - UI ready
- Validazione real-time
- Messaggi errore/successo animati
- Loading state durante l'invio

**Animazioni:**
- Fade-in container con scale
- Stagger animation per form fields
- Smooth transitions su focus
- Glow effect su input attivi

### Registrazione (`register.html`)
**Caratteristiche:**
- Form completo (username, email, password, data nascita)
- Conferma password con validazione match
- Indicatore forza password in tempo reale (4 livelli)
- Validazione età (minimo 13 anni)
- Checkbox termini e privacy
- Opzione newsletter
- Registrazione social (Google, GitHub) - UI ready
- Validazione completa lato client

**Validazioni:**
- Username: minimo 3 caratteri
- Password: minimo 8 caratteri con indicatore forza
- Email: formato valido
- Password match: controllo real-time
- Età: calcolo automatico e verifica

**Indicatore Forza Password:**
- 🔴 Molto debole (solo lunghezza)
- 🟠 Debole (lunghezza + maiuscole/minuscole)
- 🟡 Media (+ numeri)
- 🟢 Forte (+ caratteri speciali)

### Dashboard (`dashboard.html`)
**Caratteristiche:**
- **Sidebar Responsive**: 
  - Menu navigazione completo
  - Badge notifiche/messaggi
  - Profilo utente in basso
  - Collassabile su mobile
  
- **Top Bar**:
  - Benvenuto personalizzato
  - Barra di ricerca
  - Bottone "Nuovo Post"
  
- **Stats Cards** (4):
  - Followers con trend
  - Post totali
  - Interazioni (like, commenti)
  - Visualizzazioni
  - Animazioni hover 3D
  
- **Feed**:
  - Card post con avatar
  - Supporto immagini
  - Like, commenti, condivisioni
  - Animazioni interattive
  
- **Sidebar Widgets**:
  - Suggerimenti utenti da seguire
  - Trending topics con conteggi
  - Eventi prossimi
  
**Interazioni:**
- Like/Unlike con animazione scale
- Follow/Unfollow con feedback visivo
- Hover effects su tutte le card
- Menu mobile con toggle animato
- Logout con fade-out

**Shortcuts Tastiera:**
- `Ctrl/Cmd + K` → Focus search
- `Ctrl/Cmd + N` → Nuovo post
- `Esc` → Chiudi sidebar mobile

## 🎨 Palette Colori

- **Purple Primary**: `#9333ea`
- **Pink Primary**: `#ec4899`
- **Blue Primary**: `#3b82f6`
- **Background**: `#000000`

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔧 Personalizzazione

### Modificare i Colori
Edita le variabili CSS in `styles/main.css`:

```css
:root {
    --purple-primary: #9333ea;
    --pink-primary: #ec4899;
    --blue-primary: #3b82f6;
    --bg-dark: #000000;
}
```

### Aggiungere/Modificare Stelle
Nel file `js/main.js`, modifica la classe `StarField`:

```javascript
const starCount = 300; // Numero di stelle
```

### Velocità Animazioni
Modifica le durate in `js/main.js` nelle timeline GSAP.

## 🚧 Prossimi Sviluppi

- [ ] Backend Rust con Actix-web
- [ ] Sistema di autenticazione JWT
- [ ] WebSocket per real-time updates
- [ ] Database SQLite
- [ ] Sistema di registrazione/login
- [ ] Profili utente
- [ ] Feed social
- [ ] Messaggistica real-time
- [ ] Notifiche push
- [ ] Dark/Light mode toggle (attualmente solo dark)

## 📝 Note di Sviluppo

### Performance
- Le animazioni si disabilitano automaticamente se l'utente ha `prefers-reduced-motion` attivo
- ScrollTrigger è configurato per ottimizzare i callback
- Canvas è ottimizzato per gestire 300+ stelle senza lag

### Browser Support
- Chrome/Edge: ✅ Completo
- Firefox: ✅ Completo
- Safari: ✅ Completo (verificare alcuni gradient)
- Opera: ✅ Completo

### GSAP License
Nota: Alcuni plugin GSAP utilizzati (MorphSVG, DrawSVG, SplitText, etc.) richiedono una licenza commerciale per uso in produzione. Per sviluppo e testing è possibile usare la versione trial.

## 🤝 Contributi

Questo progetto è in sviluppo attivo. Per contribuire:

1. Fork il repository
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

[Specifica la licenza del progetto]

## 👨‍💻 Autore

Zone4Love Team

---

**Made with 💜 and ✨ in the Galaxy**
