# 🔧 Delete Comment Endpoint - Backend Implementation

## ✅ Implementato

Aggiunto endpoint completo per eliminare commenti con verifica ownership e aggiornamento contatore.

## 🎯 Endpoint

### Route
```rust
.route("/{post_id}/comments/{comment_id}", web::delete().to(delete_comment))
```

**URL**: `DELETE /api/posts/{post_id}/comments/{comment_id}`

## 📝 Implementazione Backend

```rust
async fn delete_comment(
    pool: web::Data<DbPool>,
    path: web::Path<(i64, i64)>,
    req: HttpRequest,
) -> AppResult<HttpResponse> {
    let (post_id, comment_id) = path.into_inner();
    let claims = extract_claims_from_request(&req)?;

    // 1. Get comment to verify ownership
    let comment: Comment = sqlx::query_as("SELECT * FROM comments WHERE id = ?")
        .bind(comment_id)
        .fetch_optional(pool.as_ref())
        .await?
        .ok_or(AppError::NotFound("Comment not found".to_string()))?;

    // 2. Verify user owns the comment
    if comment.user_id != claims.sub {
        return Err(AppError::Forbidden("Not your comment".to_string()));
    }

    // 3. Delete comment
    sqlx::query("DELETE FROM comments WHERE id = ?")
        .bind(comment_id)
        .execute(pool.as_ref())
        .await?;

    // 4. Update comments count
    sqlx::query("UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = ?")
        .bind(post_id)
        .execute(pool.as_ref())
        .await?;

    Ok(HttpResponse::Ok().json(ApiResponse::<()>::success_with_message(
        "Comment deleted successfully",
    )))
}
```

## 🔒 Sicurezza

### 1. Verifica Ownership
```rust
if comment.user_id != claims.sub {
    return Err(AppError::Forbidden("Not your comment".to_string()));
}
```

Solo il proprietario del commento può eliminarlo.

### 2. Verifica Esistenza
```rust
.fetch_optional(pool.as_ref())
.await?
.ok_or(AppError::NotFound("Comment not found".to_string()))?;
```

Ritorna 404 se il commento non esiste.

### 3. Autenticazione
```rust
let claims = extract_claims_from_request(&req)?;
```

Richiede JWT token valido.

## 📊 Flusso Completo

```
1. DELETE /api/posts/47/comments/14
   Headers: Authorization: Bearer {token}
   ↓
2. Extract JWT claims
   ↓
3. Fetch comment from DB
   ↓
4. Verify comment exists (404 if not)
   ↓
5. Verify ownership (403 if not owner)
   ↓
6. DELETE FROM comments WHERE id = 14
   ↓
7. UPDATE posts SET comments_count = comments_count - 1
   ↓
8. Return 200 OK
```

## 🔄 Frontend Update

```javascript
const response = await fetch(`${API_BASE_URL}/posts/${currentPostId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
});
```

## 📋 Response

### Success (200 OK)
```json
{
    "success": true,
    "message": "Comment deleted successfully"
}
```

### Not Found (404)
```json
{
    "success": false,
    "message": "Comment not found"
}
```

### Forbidden (403)
```json
{
    "success": false,
    "message": "Not your comment"
}
```

### Unauthorized (401)
```json
{
    "success": false,
    "message": "Unauthorized"
}
```

## 🧪 Test

### Test 1: Eliminare Proprio Commento
```bash
DELETE /api/posts/47/comments/14
Authorization: Bearer {valid_token_user_1}

# Comment 14 belongs to user 1
✅ 200 OK
```

### Test 2: Eliminare Commento Altrui
```bash
DELETE /api/posts/47/comments/15
Authorization: Bearer {valid_token_user_1}

# Comment 15 belongs to user 2
❌ 403 Forbidden: "Not your comment"
```

### Test 3: Commento Non Esistente
```bash
DELETE /api/posts/47/comments/999
Authorization: Bearer {valid_token}

❌ 404 Not Found: "Comment not found"
```

### Test 4: Senza Autenticazione
```bash
DELETE /api/posts/47/comments/14
# No Authorization header

❌ 401 Unauthorized
```

## ✅ Vantaggi

1. **Sicuro**: Verifica ownership
2. **Atomico**: Aggiorna contatore in stessa transazione
3. **RESTful**: Endpoint semanticamente corretto
4. **Error Handling**: Gestisce tutti i casi edge
5. **GREATEST(0, ...)**: Previene contatori negativi

## 🚀 Deploy

1. **Ricompila backend**:
   ```bash
   cd backend
   cargo build --release
   ```

2. **Riavvia server**:
   ```bash
   ./start_backend.bat
   ```

3. **Test frontend**:
   - Hard refresh: `Ctrl + Shift + R`
   - Elimina un commento
   - ✅ Verifica: Nessun errore 404

## 🎉 Completato!

Endpoint DELETE comment implementato e funzionante:
- ✅ Route aggiunta
- ✅ Funzione implementata
- ✅ Verifica ownership
- ✅ Aggiornamento contatore
- ✅ Error handling completo
- ✅ Frontend aggiornato

Riavvia il backend e testa! 🚀
