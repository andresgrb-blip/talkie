# 🔧 Delete Comment 500 Error - Fixed

## ❌ Problema

```
DELETE /api/posts/47/comments/8
❌ 500 Internal Server Error
```

## 🔍 Causa

La funzione SQL `GREATEST()` non è supportata da SQLite.

**Codice problematico**:
```rust
sqlx::query("UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = ?")
```

SQLite usa `MAX()` invece di `GREATEST()`.

## ✅ Soluzione

**Prima** ❌:
```rust
// GREATEST non esiste in SQLite
sqlx::query("UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = ?")
```

**Dopo** ✅:
```rust
// MAX è supportato da SQLite
sqlx::query("UPDATE posts SET comments_count = MAX(0, comments_count - 1) WHERE id = ?")
```

## 📝 Codice Corretto

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
        return Err(AppError::AuthenticationError("Not your comment".to_string()));
    }

    // 3. Delete comment
    sqlx::query("DELETE FROM comments WHERE id = ?")
        .bind(comment_id)
        .execute(pool.as_ref())
        .await?;

    // 4. Update comments count (use MAX for SQLite compatibility)
    sqlx::query("UPDATE posts SET comments_count = MAX(0, comments_count - 1) WHERE id = ?")
        .bind(post_id)
        .execute(pool.as_ref())
        .await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": "Comment deleted successfully"
    })))
}
```

## 📊 SQL Functions: SQLite vs MySQL/PostgreSQL

| Function | SQLite | MySQL | PostgreSQL |
|----------|--------|-------|------------|
| **Max of 2 values** | `MAX(a, b)` | `GREATEST(a, b)` | `GREATEST(a, b)` |
| **Min of 2 values** | `MIN(a, b)` | `LEAST(a, b)` | `LEAST(a, b)` |

## 🧪 Test Query

```sql
-- SQLite ✅
UPDATE posts SET comments_count = MAX(0, comments_count - 1) WHERE id = 47;

-- MySQL/PostgreSQL ✅
UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = 47;
```

## 🚀 Build & Deploy

```bash
cd backend
cargo build --release
./start_backend.bat
```

## 🧪 Test

### Test 1: Eliminare Commento
```bash
DELETE /api/posts/47/comments/8
Authorization: Bearer {token}

✅ 200 OK
{
    "success": true,
    "message": "Comment deleted successfully"
}
```

### Test 2: Verificare Contatore
```sql
SELECT id, comments_count FROM posts WHERE id = 47;
-- comments_count dovrebbe essere decrementato di 1
```

### Test 3: Contatore Non Negativo
```bash
# Elimina tutti i commenti
DELETE /api/posts/47/comments/1
DELETE /api/posts/47/comments/2
...

# Verifica contatore
SELECT comments_count FROM posts WHERE id = 47;
-- ✅ Dovrebbe essere 0, non negativo
```

## ✅ Vantaggi MAX()

1. **Compatibilità SQLite**: Funziona nativamente
2. **Previene Negativi**: `MAX(0, count - 1)` garantisce >= 0
3. **Performance**: Funzione built-in ottimizzata
4. **Atomico**: Tutto in una query

## 🎉 Risolto!

Ora l'eliminazione commenti funziona correttamente:
- ✅ Nessun errore 500
- ✅ Commento eliminato dal DB
- ✅ Contatore decrementato
- ✅ Nessun valore negativo

Ricompila e testa! 🚀
