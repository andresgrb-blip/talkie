# Pagination & Stats Count Fix

## Problem Identified

The post count widget was showing **21 posts** after creating a new post, but the database actually has **31 posts**. This was caused by:

1. **Backend pagination**: The `/api/posts` endpoint returns only 20 posts by default
2. **Stats calculation mismatch**: 
   - When loading posts: Only 20 posts loaded → stats calculated from 20 posts
   - After creating post: Stats fetched from database → shows actual count (31)
   - This caused the count to jump from 21 to 31 instead of incrementing properly

## Database Status
```
📊 Total posts in database: 32
📋 Posts by user:
  - User zion (ID: 1): 31 posts
  - User testuser (ID: 2): 1 posts
```

## Root Cause

**Backend** (`backend/src/routes/posts.rs` line 41):
```rust
let per_page = query.per_page.unwrap_or(20).min(100);
```

**Frontend** was calling:
```javascript
fetch(`${API_BASE_URL}/posts`)  // Only gets 20 posts
```

Then calculating stats from the 20 loaded posts, which didn't match the database count.

## Solution Applied

### 1. Increased Pagination Limit
**File**: `js/dashboard.js` - `loadPosts()` function

Changed from:
```javascript
const response = await fetch(`${API_BASE_URL}/posts`, {
    headers: getAuthHeaders()
});
```

To:
```javascript
const response = await fetch(`${API_BASE_URL}/posts?per_page=100`, {
    headers: getAuthHeaders()
});
```

### 2. Always Use Backend Stats API
**File**: `js/dashboard.js` - `loadPosts()` function

Changed from:
```javascript
// Update stats from loaded posts
calculateStatsFromPosts();
```

To:
```javascript
// ✅ Load stats from backend API instead of calculating from posts array
// This ensures accurate count even with pagination
loadUserStats();
```

This ensures stats are always fetched from the database, not calculated from the limited posts array.

### 3. Added Warning for Fallback Calculation
**File**: `js/dashboard.js` - `calculateStatsFromPosts()` function

Added warnings when calculating from posts array (offline mode):
```javascript
console.warn('⚠️ Calculating stats from loaded posts (may be inaccurate due to pagination)');
console.warn('⚠️ Note: This count may not match database if you have more posts than loaded');
```

## How It Works Now

### On Page Load:
1. Fetch up to 100 posts from backend
2. Fetch accurate stats from `/api/users/{id}/stats` endpoint
3. Display correct count from database (31 posts)

### After Creating Post:
1. Post created in database (count becomes 32)
2. Post added to local array
3. Stats refreshed from backend API
4. Widget shows 32 with pulse animation ✅

## Testing Steps

1. **Clear localStorage**:
   ```javascript
   localStorage.clear();
   ```

2. **Refresh page** - Should show 31 posts

3. **Create a new post** - Widget should increment to 32 with animation

4. **Check console** - Should see:
   ```
   📊 Loaded 31 posts from backend
   📡 Fetching fresh stats from backend...
   ✅ Stats loaded from backend: {posts_count: 31, ...}
   ```

5. **After creating post**:
   ```
   🔄 Updating stats after post creation...
   📡 Fetching fresh stats from backend...
   ✅ Stats loaded from backend: {posts_count: 32, ...}
   ✅ Stats updated successfully from backend
   ```

## Files Modified

1. ✅ `js/dashboard.js` - `loadPosts()` - Added `?per_page=100` parameter
2. ✅ `js/dashboard.js` - `loadPosts()` - Changed to use `loadUserStats()` instead of `calculateStatsFromPosts()`
3. ✅ `js/dashboard.js` - `calculateStatsFromPosts()` - Added warnings about pagination

## Result

✅ **Post count now accurate**: Always matches database count
✅ **Increments properly**: Goes from 31 → 32 when creating new post
✅ **No more jumps**: Stats are always fetched from backend, not calculated from limited array
