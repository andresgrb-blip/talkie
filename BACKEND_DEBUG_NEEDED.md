# 🚨 Backend Debug Necessario

## ❌ Problema Attuale

**500 Internal Server Error** su `PUT /api/users/me`

Anche testando **senza avatar**, solo con questi dati:
```json
{
    "username": "zion",
    "email": "andres.grb@outlook.com",
    "bio": "Ciao",
    "birthdate": "1998-04-07",
    "location": "Venezia, Italia",
    "website": null
}
```

## 🔍 Cosa Serve

### Backend Terminal Output

Quando fai il test, il backend **deve** mostrare un errore. Cerca nel terminal:

```
Error: ...
sqlx::Error: ...
thread 'actix-rt...' panicked at...
Database error: ...
NOT NULL constraint failed: ...
```

## 🧪 Test Isolato

Ho creato `TEST_UPDATE_PROFILE.html` per testare direttamente l'API.

### Come Usare:

1. **Apri**: `http://localhost:8080/TEST_UPDATE_PROFILE.html`
2. **Click**: "Test Update Bio Only"
3. **Guarda**:
   - Output nella pagina
   - **Backend terminal** per errore specifico

## 🔍 Possibili Cause 500

### 1. Campo NOT NULL nel DB

```sql
-- Verifica schema
sqlite3 backend/zone4love.db
.schema users

-- Se un campo è NOT NULL ma passi null:
-- Error: NOT NULL constraint failed: users.campo
```

### 2. Query Binding Errato

Il codice attuale usa:
```rust
if body.bio.is_some() {
    sqlx::query("UPDATE users SET bio = ? WHERE id = ?")
        .bind(&body.bio)  // Option<String>
        .bind(claims.sub)
        .execute(pool.as_ref())
        .await?;
}
```

**Problema**: Se `bio` è `Some(null)` o `Some("")`, potrebbe causare problemi.

### 3. Tipo Dati Errato

```rust
// Se birthdate è String ma DB vuole DATE
birthdate: Option<String>  // ❌ Potrebbe causare errore
```

## 🔧 Fix Possibili

### Fix 1: Gestire NULL Esplicitamente

```rust
if let Some(ref bio) = body.bio {
    if !bio.is_empty() {
        sqlx::query("UPDATE users SET bio = ? WHERE id = ?")
            .bind(bio)
            .bind(claims.sub)
            .execute(pool.as_ref())
            .await?;
    } else {
        // Set to NULL if empty string
        sqlx::query("UPDATE users SET bio = NULL WHERE id = ?")
            .bind(claims.sub)
            .execute(pool.as_ref())
            .await?;
    }
}
```

### Fix 2: Usare COALESCE

```rust
sqlx::query("UPDATE users SET bio = COALESCE(?, bio) WHERE id = ?")
    .bind(&body.bio)
    .bind(claims.sub)
    .execute(pool.as_ref())
    .await?;
```

### Fix 3: Query Singola con Tutti i Campi

```rust
sqlx::query(
    r#"
    UPDATE users 
    SET 
        username = COALESCE(?, username),
        email = COALESCE(?, email),
        bio = ?,
        birthdate = ?,
        location = ?,
        website = ?,
        avatar_url = COALESCE(?, avatar_url),
        updated_at = datetime('now')
    WHERE id = ?
    "#
)
.bind(&body.username)
.bind(&body.email)
.bind(&body.bio)
.bind(&body.birthdate)
.bind(&body.location)
.bind(&body.website)
.bind(&body.avatar_url)
.bind(claims.sub)
.execute(pool.as_ref())
.await?;
```

## 📊 Schema DB Atteso

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    bio TEXT,                    -- NULL OK
    birthdate TEXT,              -- NULL OK
    location TEXT,               -- NULL OK
    website TEXT,                -- NULL OK
    avatar_url TEXT,             -- NULL OK
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

## 🎯 Action Plan

### Step 1: Verifica Schema DB

```bash
cd backend
sqlite3 zone4love.db
.schema users
.quit
```

Condividi l'output!

### Step 2: Test con TEST_UPDATE_PROFILE.html

1. Apri `http://localhost:8080/TEST_UPDATE_PROFILE.html`
2. Click "Test Update Bio Only"
3. **Guarda backend terminal**
4. Condividi errore completo

### Step 3: Applica Fix

Basato sull'errore specifico, applicherò il fix corretto.

## 🚨 Urgente

**Serve l'output del backend terminal quando fai il test!**

Senza quello, non posso vedere l'errore SQL specifico.

Possibili output:
```
Error: NOT NULL constraint failed: users.campo
Error: no such column: campo
Error: datatype mismatch
Error: UNIQUE constraint failed: users.email
```

Uno di questi ci dirà esattamente cosa fixare! 🔍
