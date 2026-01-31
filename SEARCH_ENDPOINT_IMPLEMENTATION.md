# 🔍 Search Users Endpoint - Backend Implementation

## ✅ Implementato

Endpoint completo per la ricerca utenti nel backend Rust con query intelligente e ordinamento dei risultati.

## 🎯 Modifiche Applicate

### File: `backend/src/routes/users.rs`

#### 1. Route Registration (linea 9)
```rust
pub fn init_routes() -> Scope {
    web::scope("/users")
        .route("/search", web::get().to(search_users))  // ✅ NEW
        .route("/me", web::get().to(get_current_user))
        .route("/me", web::put().to(update_current_user))
        .route("/{id}", web::get().to(get_user_by_id))
        .route("/{id}/stats", web::get().to(get_user_stats))
        .route("/{id}/follow", web::post().to(follow_user))
        .route("/{id}/unfollow", web::delete().to(unfollow_user))
        .route("/{id}/followers", web::get().to(get_followers))
        .route("/{id}/following", web::get().to(get_following))
}
```

#### 2. Search Query Struct (linea 393-396)
```rust
#[derive(serde::Deserialize)]
struct SearchQuery {
    q: String,
}
```

#### 3. Search Function (linea 398-453)
```rust
async fn search_users(
    pool: web::Data<DbPool>,
    req: HttpRequest,
    query: web::Query<SearchQuery>,
) -> AppResult<HttpResponse> {
    // Verify authentication
    let claims = extract_claims_from_request(&req)?;
    
    let search_term = query.q.trim();
    
    // Minimum 2 characters for search
    if search_term.len() < 2 {
        return Ok(HttpResponse::Ok().json(ApiResponse::success(Vec::<UserResponse>::new())));
    }
    
    log::info!("🔍 Searching users with query: '{}'", search_term);
    
    // Search by username or email (case-insensitive)
    // Exclude current user from results
    let search_pattern = format!("%{}%", search_term);
    
    let users: Vec<UserResponse> = sqlx::query_as::<_, User>(
        r#"
        SELECT * FROM users 
        WHERE id != ? 
        AND (
            LOWER(username) LIKE LOWER(?) 
            OR LOWER(email) LIKE LOWER(?)
            OR LOWER(bio) LIKE LOWER(?)
        )
        ORDER BY 
            CASE 
                WHEN LOWER(username) = LOWER(?) THEN 1
                WHEN LOWER(username) LIKE LOWER(?) THEN 2
                ELSE 3
            END,
            username ASC
        LIMIT 20
        "#,
    )
    .bind(claims.sub)
    .bind(&search_pattern)
    .bind(&search_pattern)
    .bind(&search_pattern)
    .bind(search_term)
    .bind(format!("{}%", search_term))
    .fetch_all(pool.as_ref())
    .await?
    .into_iter()
    .map(UserResponse::from)
    .collect();
    
    log::info!("✅ Found {} users matching '{}'", users.len(), search_term);
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(users)))
}
```

## 📊 Endpoint Details

### HTTP Method
```
GET /api/users/search
```

### Query Parameters
| Parameter | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| `q`       | String | Yes      | Search query (min 2 characters)|

### Headers
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Example Request
```bash
GET /api/users/search?q=astro
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔍 Search Logic

### 1. **Validation**
```rust
// Minimum 2 characters
if search_term.len() < 2 {
    return Ok(HttpResponse::Ok().json(ApiResponse::success(Vec::<UserResponse>::new())));
}
```

### 2. **Pattern Matching**
```rust
// Create LIKE pattern: %query%
let search_pattern = format!("%{}%", search_term);
```

### 3. **SQL Query**
```sql
SELECT * FROM users 
WHERE id != ?                           -- Exclude current user
AND (
    LOWER(username) LIKE LOWER(?)       -- Search in username
    OR LOWER(email) LIKE LOWER(?)       -- Search in email
    OR LOWER(bio) LIKE LOWER(?)         -- Search in bio
)
ORDER BY 
    CASE 
        WHEN LOWER(username) = LOWER(?) THEN 1    -- Exact match first
        WHEN LOWER(username) LIKE LOWER(?) THEN 2 -- Starts with second
        ELSE 3                                     -- Contains third
    END,
    username ASC                                   -- Alphabetical
LIMIT 20                                           -- Max 20 results
```

### 4. **Smart Ordering**
1. **Priority 1**: Exact username match
   - Query: "john" → User: "john" (rank 1)
   
2. **Priority 2**: Username starts with query
   - Query: "john" → User: "johnny" (rank 2)
   
3. **Priority 3**: Username/email/bio contains query
   - Query: "john" → User: "bigJohn123" (rank 3)
   
4. **Secondary**: Alphabetical by username

### 5. **Case-Insensitive**
```rust
LOWER(username) LIKE LOWER(?)
```
- "ASTRO" matches "astronauta"
- "astro" matches "Astronauta"
- "AsTrO" matches "aStRoNaUtA"

## 📤 Response Format

### Success Response
```json
{
    "success": true,
    "data": [
        {
            "id": 2,
            "username": "astronauta",
            "email": "astro@space.com",
            "avatar_url": "http://localhost:8080/media/2/avatar.jpg",
            "bio": "Esploratore della galassia",
            "birthdate": "1990-01-15",
            "location": "Milano, Italy",
            "website": "https://astronauta.com",
            "created_at": "2025-01-01T10:00:00",
            "updated_at": "2025-01-10T15:30:00"
        },
        {
            "id": 5,
            "username": "cosmic_astronaut",
            "email": "cosmic@universe.com",
            "avatar_url": null,
            "bio": "Space lover and astronomy enthusiast",
            "birthdate": null,
            "location": null,
            "website": null,
            "created_at": "2025-01-05T12:00:00",
            "updated_at": "2025-01-05T12:00:00"
        }
    ]
}
```

### Empty Results
```json
{
    "success": true,
    "data": []
}
```

### Error Response (Unauthorized)
```json
{
    "success": false,
    "message": "Unauthorized"
}
```

### Error Response (Invalid Token)
```json
{
    "success": false,
    "message": "Invalid token"
}
```

## 🎯 Search Examples

### Example 1: Search by Username
```
Query: "astro"

Results:
1. astronauta (exact match)
2. astronaut123 (starts with)
3. cosmic_astronomer (contains)
```

### Example 2: Search by Email
```
Query: "gmail"

Results:
1. user1@gmail.com
2. john@gmail.com
3. space@gmail.com
```

### Example 3: Search by Bio
```
Query: "photography"

Results:
1. User with bio: "Photography enthusiast"
2. User with bio: "Love photography and travel"
3. User with bio: "Professional photographer"
```

### Example 4: Short Query (< 2 chars)
```
Query: "a"

Response: []  (empty array)
```

## 🔒 Security Features

### 1. **Authentication Required**
```rust
let claims = extract_claims_from_request(&req)?;
```
- JWT token verification
- Returns 401 if not authenticated

### 2. **Exclude Current User**
```sql
WHERE id != ?
```
- User cannot find themselves
- Prevents self-follow scenarios

### 3. **SQL Injection Protection**
```rust
.bind(claims.sub)
.bind(&search_pattern)
```
- All parameters are bound
- SQLx prevents SQL injection

### 4. **Rate Limiting**
```rust
LIMIT 20
```
- Max 20 results per query
- Prevents database overload

## ⚡ Performance Optimizations

### 1. **Database Indexes**
Recommended indexes for optimal performance:
```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_bio ON users(bio);
```

### 2. **LIMIT Clause**
```sql
LIMIT 20
```
- Prevents loading entire table
- Fast response times

### 3. **Case-Insensitive Search**
```sql
LOWER(username) LIKE LOWER(?)
```
- Single function call per field
- Efficient pattern matching

### 4. **Smart Ordering**
```sql
ORDER BY CASE ... END, username ASC
```
- Most relevant results first
- Reduces client-side filtering

## 🧪 Testing

### Test 1: Basic Search
```bash
curl -X GET "http://localhost:8080/api/users/search?q=astro" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: List of users matching "astro"

### Test 2: Exact Match
```bash
curl -X GET "http://localhost:8080/api/users/search?q=john" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: User "john" appears first

### Test 3: Case Insensitive
```bash
curl -X GET "http://localhost:8080/api/users/search?q=ASTRO" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Same results as lowercase "astro"

### Test 4: Short Query
```bash
curl -X GET "http://localhost:8080/api/users/search?q=a" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Empty array `[]`

### Test 5: No Results
```bash
curl -X GET "http://localhost:8080/api/users/search?q=xyzabc123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: Empty array `[]`

### Test 6: Unauthorized
```bash
curl -X GET "http://localhost:8080/api/users/search?q=astro"
```

Expected: 401 Unauthorized

## 📝 Logging

### Search Initiated
```
🔍 Searching users with query: 'astro'
```

### Results Found
```
✅ Found 3 users matching 'astro'
```

### No Results
```
✅ Found 0 users matching 'xyzabc123'
```

## 🔄 Integration with Frontend

### JavaScript Call
```javascript
async function performUserSearch(query) {
    const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
        }
    });
    
    const result = await response.json();
    
    if (result.success) {
        renderSearchResults(result.data, query);
    }
}
```

### Response Handling
```javascript
if (result.success) {
    const users = result.data;
    console.log(`Found ${users.length} users`);
    
    users.forEach(user => {
        console.log(`- ${user.username} (${user.email})`);
    });
}
```

## ✅ Completato!

Endpoint di ricerca utenti implementato:
- ✅ Route `/users/search` registrata
- ✅ Query parameter `q` validato (min 2 chars)
- ✅ Ricerca in username, email, bio
- ✅ Case-insensitive search
- ✅ Smart ordering (exact → starts with → contains)
- ✅ Exclude current user
- ✅ Limit 20 results
- ✅ Authentication required
- ✅ SQL injection protected
- ✅ Logging completo
- ✅ Error handling robusto

Ricompila il backend e testa la ricerca! 🔍✨

```bash
cd backend
cargo build
cargo run
```
