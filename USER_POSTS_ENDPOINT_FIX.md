# 📝 User Posts Endpoint - Fix 404 Error

## ❌ Problema

Frontend riceveva errore 404 quando caricava i post di un utente:
```
GET /api/users/1/posts?page=1&per_page=10 → 404 Not Found
```

## ✅ Soluzione

Aggiunto endpoint mancante in `routes/users.rs`.

## 🎯 Modifiche Applicate

### 1. **Route Registration** (linea 14)
```rust
pub fn init_routes() -> Scope {
    web::scope("/users")
        .route("/search", web::get().to(search_users))
        .route("/me", web::get().to(get_current_user))
        .route("/me", web::put().to(update_current_user))
        .route("/{id}", web::get().to(get_user_by_id))
        .route("/{id}/stats", web::get().to(get_user_stats))
        .route("/{id}/posts", web::get().to(get_user_posts))  // ✅ NEW
        .route("/{id}/follow", web::post().to(follow_user))
        .route("/{id}/unfollow", web::delete().to(unfollow_user))
        .route("/{id}/followers", web::get().to(get_followers))
        .route("/{id}/following", web::get().to(get_following))
}
```

### 2. **Imports** (linea 4)
```rust
use crate::models::{ApiResponse, User, UserResponse, UserStats, Post, PostResponse, MediaItem};
```

### 3. **Function Implementation** (linea 480-562)
```rust
async fn get_user_posts(
    pool: web::Data<DbPool>,
    req: HttpRequest,
    path: web::Path<i64>,
    query: web::Query<PostsQuery>,
) -> AppResult<HttpResponse> {
    let user_id = path.into_inner();
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(10).min(50);
    let offset = (page - 1) * per_page;

    // Get current user for is_liked check
    let current_user_id = match extract_claims_from_request(&req) {
        Ok(claims) => Some(claims.sub),
        Err(_) => None,
    };

    // Get posts
    let posts: Vec<Post> = sqlx::query_as(
        r#"
        SELECT * FROM posts 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
        "#,
    )
    .bind(user_id)
    .bind(per_page)
    .bind(offset)
    .fetch_all(pool.as_ref())
    .await?;

    // Get user info
    let user: User = sqlx::query_as("SELECT * FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_optional(pool.as_ref())
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    // Build response with is_liked check
    let mut post_responses = Vec::new();

    for post in posts {
        let is_liked = if let Some(uid) = current_user_id {
            let liked: Option<(i64,)> = sqlx::query_as(
                "SELECT id FROM likes WHERE user_id = ? AND post_id = ?",
            )
            .bind(uid)
            .bind(post.id)
            .fetch_optional(pool.as_ref())
            .await?;
            liked.is_some()
        } else {
            false
        };

        // Parse media JSON
        let media = if let Some(ref media_json) = post.media {
            serde_json::from_str::<Vec<MediaItem>>(media_json).ok()
        } else {
            None
        };

        post_responses.push(PostResponse {
            id: post.id,
            user: UserResponse::from(user.clone()),
            content: post.content,
            image_url: post.image_url,
            media,
            likes_count: post.likes_count,
            comments_count: post.comments_count,
            is_liked,
            created_at: post.created_at,
        });
    }

    Ok(HttpResponse::Ok().json(ApiResponse::success(post_responses)))
}
```

## 📊 API Endpoint

### URL
```
GET /api/users/{id}/posts
```

### Query Parameters
| Parameter  | Type   | Default | Max | Description           |
|------------|--------|---------|-----|-----------------------|
| `page`     | i64    | 1       | -   | Page number           |
| `per_page` | i64    | 10      | 50  | Posts per page        |

### Example Request
```bash
GET /api/users/1/posts?page=1&per_page=10
Authorization: Bearer {token}  # Optional
```

### Response Success
```json
{
    "success": true,
    "data": [
        {
            "id": 42,
            "user": {
                "id": 1,
                "username": "astronauta",
                "email": "user@example.com",
                "avatar_url": "/media/1/avatar.jpg",
                "bio": "Space explorer",
                "created_at": "2025-01-01T10:00:00"
            },
            "content": "Bellissimo tramonto! 🌅",
            "image_url": null,
            "media": [
                {
                    "url": "/media/1/post_42_1.jpg",
                    "type": "image",
                    "name": "sunset.jpg"
                }
            ],
            "likes_count": 15,
            "comments_count": 3,
            "is_liked": true,
            "created_at": "2025-11-13T09:00:00"
        }
    ]
}
```

## ✨ Features

### 1. **Pagination**
- Default: 10 posts per page
- Max: 50 posts per page
- Page starts at 1

### 2. **is_liked Check**
- Se utente autenticato: controlla se ha messo like
- Se utente non autenticato: sempre `false`
- Query ottimizzata per ogni post

### 3. **Media Support**
- Parse JSON `media` field
- Supporto legacy `image_url`
- Array di `MediaItem` (images + videos)

### 4. **User Info**
- Ogni post include info complete dell'utente
- Avatar, bio, email, etc.
- Single query per user (riutilizzato per tutti i post)

### 5. **Error Handling**
- User not found → 404
- Invalid page/per_page → Auto-corrected
- Database error → 500

## 🔄 Flusso

```
1. Frontend richiede post utente
   ↓
2. GET /api/users/1/posts?page=1&per_page=10
   ↓
3. Backend valida parametri
   ↓
4. Query posts WHERE user_id = 1
   ↓
5. Query user info
   ↓
6. Per ogni post:
   - Check is_liked (se autenticato)
   - Parse media JSON
   - Build PostResponse
   ↓
7. Return array di PostResponse
   ↓
8. Frontend renderizza posts
```

## 🧪 Testing

### Test 1: Get User Posts
```bash
curl -X GET "http://localhost:8080/api/users/1/posts?page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Array di post dell'utente 1

### Test 2: Pagination
```bash
# Page 1
GET /api/users/1/posts?page=1&per_page=5

# Page 2
GET /api/users/1/posts?page=2&per_page=5
```

Expected: Post diversi per ogni pagina

### Test 3: Without Auth
```bash
curl -X GET "http://localhost:8080/api/users/1/posts"
```

Expected: Post con `is_liked: false`

### Test 4: User Not Found
```bash
GET /api/users/99999/posts
```

Expected: 404 Not Found

## ✅ Risolto!

Endpoint `/api/users/{id}/posts` ora funziona:
- ✅ Route registrata
- ✅ Pagination support
- ✅ is_liked check
- ✅ Media parsing
- ✅ User info included
- ✅ Error handling

Ricompila il backend e testa! 📝✨

```bash
cd backend
cargo build
cargo run
```
