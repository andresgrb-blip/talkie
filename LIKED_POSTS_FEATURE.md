# 💜 Liked Posts Feature - Post Piaciuti

## ✅ Implementato

Sistema completo per visualizzare i post che l'utente ha messo "Mi piace"!

## 🎯 Backend - Nuovo Endpoint

### Route
```rust
.route("/liked", web::get().to(get_liked_posts))
```

### Endpoint: GET /api/posts/liked
```rust
async fn get_liked_posts(
    pool: web::Data<DbPool>,
    req: HttpRequest,
    query: web::Query<FeedQuery>,
) -> AppResult<HttpResponse> {
    let claims = extract_claims_from_request(&req)?;
    let user_id = claims.sub;
    
    // Get posts that user has liked
    let posts: Vec<Post> = sqlx::query_as(
        r#"
        SELECT p.* FROM posts p
        INNER JOIN likes l ON p.id = l.post_id
        WHERE l.user_id = ?
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
        "#
    )
    .bind(user_id)
    .bind(per_page)
    .bind(offset)
    .fetch_all(pool.as_ref())
    .await?;
    
    // Convert to PostResponse with user info
    // ...
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(post_responses)))
}
```

### Query SQL
```sql
SELECT p.* FROM posts p
INNER JOIN likes l ON p.id = l.post_id
WHERE l.user_id = ?
ORDER BY l.created_at DESC
LIMIT ? OFFSET ?
```

**Spiegazione**:
- `INNER JOIN likes`: Unisce posts con likes
- `WHERE l.user_id = ?`: Solo post piaciuti dall'utente
- `ORDER BY l.created_at DESC`: Più recenti prima
- `LIMIT ? OFFSET ?`: Paginazione

## 🎨 Frontend - Tab "Mi piace"

### Variables
```javascript
let likedPosts = [];
let likedPostsLoaded = false;
let likedPostsPage = 1;
let hasMoreLikedPosts = true;
let isLoadingLikedPosts = false;
```

### Load Function
```javascript
async function loadLikedPosts(page = 1) {
    if (isLoadingLikedPosts) return;
    
    isLoadingLikedPosts = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/posts/liked?page=${page}&per_page=10`, {
            headers: getAuthHeaders()
        });
        
        const result = await response.json();
        
        if (result.success) {
            const newPosts = result.data;
            
            if (page === 1) {
                likedPosts = newPosts;
            } else {
                likedPosts = [...likedPosts, ...newPosts];
            }
            
            hasMoreLikedPosts = newPosts.length === 10;
            likedPostsLoaded = true;
            
            renderLikedPosts();
        }
    } catch (error) {
        showLikedPostsError('Errore nel caricamento');
    } finally {
        isLoadingLikedPosts = false;
    }
}
```

### Render Function
```javascript
function renderLikedPosts() {
    const container = document.getElementById('likes-content');
    
    if (likedPosts.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">💜</div>
                <h3>Nessun post piaciuto</h3>
                <p>I post che ti piacciono appariranno qui</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    likedPosts.forEach(post => {
        const postElement = createPostElement(post);
        container.appendChild(postElement);
    });
}
```

### Tab Integration
```javascript
function initTabs() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Load content based on tab
            if (targetTab === 'likes' && !likedPostsLoaded) {
                loadLikedPosts();
            }
        });
    });
}
```

## 🔄 Flusso Completo

```
1. User click su tab "Mi piace"
   ↓
2. initTabs() rileva click
   ↓
3. Check: likedPostsLoaded = false
   ↓
4. loadLikedPosts() chiamato
   ↓
5. showLikedPostsLoading() → Spinner
   ↓
6. GET /api/posts/liked?page=1&per_page=10
   ↓
7. Backend query:
   SELECT p.* FROM posts p
   INNER JOIN likes l ON p.id = l.post_id
   WHERE l.user_id = 1
   ↓
8. Backend ritorna array di PostResponse
   ↓
9. Frontend: likedPosts = result.data
   ↓
10. renderLikedPosts() → Mostra post
   ↓
11. likedPostsLoaded = true (cache)
```

## 🎨 UI States

### Loading State
```html
<div class="flex justify-center items-center py-12">
    <div class="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
</div>
```

### Empty State
```html
<div class="text-center py-12">
    <div class="text-6xl mb-4">💜</div>
    <h3 class="text-xl font-semibold mb-2">Nessun post piaciuto</h3>
    <p class="text-purple-300">I post che ti piacciono appariranno qui</p>
</div>
```

### Error State
```html
<div class="text-center py-12">
    <div class="text-6xl mb-4">😕</div>
    <h3 class="text-xl font-semibold mb-2">Errore</h3>
    <p class="text-purple-300 mb-4">Errore nel caricamento dei post piaciuti</p>
    <button onclick="loadLikedPosts()">Riprova</button>
</div>
```

### Posts Loaded
```
Post 1 (con avatar, media, like button, etc.)
Post 2
Post 3
...
```

## 📊 Features

### 1. **Lazy Loading**
- Post caricati solo quando tab aperto
- Cache: `likedPostsLoaded = true`
- Evita ricaricamenti inutili

### 2. **Paginazione**
- 10 post per pagina
- `hasMoreLikedPosts` per infinite scroll
- `page` parameter per load more

### 3. **Riutilizzo Codice**
- Usa `createPostElement()` esistente
- Stessi post cards del feed
- Like/unlike funziona normalmente

### 4. **Real-time Updates**
- Quando unlike un post → Rimuovi da likedPosts
- Quando like un post → Aggiungi a likedPosts
- UI sempre sincronizzata

### 5. **Error Handling**
- Try/catch completo
- Error messages user-friendly
- Retry button

## 🧪 Test

### Test 1: Tab "Mi piace" Vuoto
1. Vai al profilo
2. Click tab "Mi piace"
3. ✅ Verifica: Empty state con 💜

### Test 2: Con Post Piaciuti
1. Metti like a 3 post
2. Vai al profilo
3. Click tab "Mi piace"
4. ✅ Verifica: 3 post mostrati

### Test 3: Unlike da Tab
1. Apri tab "Mi piace"
2. Click unlike su un post
3. ✅ Verifica: Post rimosso dalla lista

### Test 4: Like da Feed
1. Metti like a nuovo post nel feed
2. Vai al profilo → Tab "Mi piace"
3. ✅ Verifica: Nuovo post presente

### Test 5: Paginazione
1. Metti like a 15 post
2. Apri tab "Mi piace"
3. ✅ Verifica: 10 post caricati
4. Scroll down
5. ✅ Verifica: Altri 5 post caricati

### Test 6: Cache
1. Apri tab "Mi piace" → Carica post
2. Cambia tab → "Post"
3. Torna a tab "Mi piace"
4. ✅ Verifica: Post già caricati (no spinner)

### Test 7: Error Handling
1. Spegni backend
2. Click tab "Mi piace"
3. ✅ Verifica: Error state con retry button
4. Riaccendi backend
5. Click "Riprova"
6. ✅ Verifica: Post caricati

## 📊 Database Schema

### Table: likes
```sql
CREATE TABLE likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id)
);
```

### Query Example
```sql
-- Get liked posts for user 1
SELECT p.*, u.username, u.avatar_url
FROM posts p
INNER JOIN likes l ON p.id = l.post_id
INNER JOIN users u ON p.user_id = u.id
WHERE l.user_id = 1
ORDER BY l.created_at DESC
LIMIT 10 OFFSET 0;
```

## 🎯 API Response

### Success Response
```json
{
    "success": true,
    "data": [
        {
            "id": 42,
            "content": "Post content...",
            "media_urls": ["http://..."],
            "user_id": 2,
            "user": {
                "id": 2,
                "username": "altro_user",
                "avatar_url": "http://..."
            },
            "likes_count": 15,
            "comments_count": 3,
            "created_at": "2025-11-13T08:00:00",
            "updated_at": "2025-11-13T08:00:00",
            "liked": true
        }
    ]
}
```

### Empty Response
```json
{
    "success": true,
    "data": []
}
```

## ✅ Completato!

Sistema "Post Piaciuti":
- ✅ Backend endpoint `/api/posts/liked`
- ✅ SQL query con JOIN
- ✅ Frontend tab integration
- ✅ Lazy loading
- ✅ Empty/Error/Loading states
- ✅ Riutilizzo post cards
- ✅ Paginazione ready
- ✅ Real-time updates

## 🔧 Fix Applicati (2025-11-13)

### Errori di Compilazione Risolti

**7 errori risolti in `posts.rs`**:

1. **CommentResponse.post_id** (line 422)
   - ❌ Campo `post_id` non esiste in `CommentResponse`
   - ✅ Rimosso dal costruttore

2. **PostResponse.media_urls** (line 589)
   - ❌ Campo `media_urls` non esiste
   - ✅ Sostituito con `image_url` e `media`

3. **Post.media_urls** (line 589)
   - ❌ Campo non esiste in `Post`
   - ✅ Deserializzazione corretta del campo `media` JSON

4. **PostResponse.user_id** (line 590)
   - ❌ Campo non esiste in `PostResponse`
   - ✅ Rimosso (usa `user` invece)

5. **PostResponse.user type mismatch** (line 591)
   - ❌ `Some(UserResponse)` invece di `UserResponse`
   - ✅ Cambiato a `UserResponse::from(user)`

6. **PostResponse.updated_at** (line 595)
   - ❌ Campo non esiste in `PostResponse`
   - ✅ Rimosso

7. **PostResponse.liked** (line 596)
   - ❌ Campo si chiama `is_liked`, non `liked`
   - ✅ Rinominato a `is_liked`

### Funzione `get_liked_posts` Corretta

```rust
async fn get_liked_posts(...) -> AppResult<HttpResponse> {
    // ... query posts ...
    
    for post in posts {
        let user: User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
            .bind(post.user_id)
            .fetch_one(pool.as_ref())
            .await?;
        
        // Deserialize media from JSON
        let media: Option<Vec<crate::models::MediaItem>> = post.media.as_ref()
            .and_then(|m| serde_json::from_str(m).ok());
        
        post_responses.push(PostResponse {
            id: post.id,
            user: UserResponse::from(user),           // ✅ Non wrapped in Some()
            content: post.content,
            image_url: post.image_url,                // ✅ Legacy support
            media,                                     // ✅ New media array
            likes_count: post.likes_count,
            comments_count: post.comments_count,
            is_liked: true,                           // ✅ Always true for liked posts
            created_at: post.created_at,
        });
    }
}
```

### Frontend Implementation

**File**: `backend/static/js/profile.js`

```javascript
async function loadUserLikes() {
    const likesContainer = document.getElementById('user-likes');
    
    // Show loading
    likesContainer.innerHTML = `<div class="animate-spin...">...</div>`;
    
    try {
        const response = await fetch(`${API_BASE_URL}/posts/liked?page=1&per_page=20`, {
            headers: getAuthHeaders()
        });
        
        const result = await response.json();
        
        if (result.success) {
            const likedPosts = result.data;
            
            if (likedPosts.length === 0) {
                // Empty state
                likesContainer.innerHTML = `<div>Nessun post piaciuto</div>`;
                return;
            }
            
            // Render posts using existing createPostElement()
            likesContainer.innerHTML = '';
            likedPosts.forEach(post => {
                const postElement = createPostElement(post);
                likesContainer.appendChild(postElement);
            });
        }
    } catch (error) {
        // Error state with retry button
        likesContainer.innerHTML = `<div>Errore + Riprova button</div>`;
    }
}
```

## 🚀 Come Testare

1. **Compila il backend**:
   ```bash
   cd backend
   cargo build
   ```

2. **Avvia il server**:
   ```bash
   cargo run
   ```

3. **Testa la funzionalità**:
   - Vai al profilo (http://localhost:8080/profile.html)
   - Click sulla tab "Mi Piace" (❤️)
   - Verifica che i post piaciuti vengano caricati
   - Testa empty state (se non hai like)
   - Metti like a qualche post e ricarica la tab

## 📝 Note Tecniche

- **Media Support**: Supporta sia `image_url` (legacy) che `media` array (nuovo sistema)
- **User Info**: Ogni post include info completa dell'autore (`UserResponse`)
- **Like Status**: `is_liked` è sempre `true` per post in questa lista
- **Paginazione**: Supporta `page` e `per_page` query params
- **Riuso Codice**: Usa `createPostElement()` esistente per rendering consistente

Ricompila backend, riavvia e testa! 💜✨
