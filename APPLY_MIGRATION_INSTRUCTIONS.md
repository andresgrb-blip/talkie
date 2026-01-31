# 🔧 Come Applicare la Migration

## Problema Trovato ✅

```
[ERROR] ❌ Failed to update location: Database(SqliteError { 
    code: 1, 
    message: "no such column: location" 
})
```

Il campo `location` (e probabilmente `website`) non esistono nella tabella `users`.

## 🎯 Soluzione: Applicare Migration

### Opzione 1: Dal tuo IDE (RustRover/DataGrip)

1. **Apri** la console SQL del database `zone4love.db`
2. **Copia e incolla** questo SQL:

```sql
-- Add location field
ALTER TABLE users ADD COLUMN location TEXT;

-- Add website field  
ALTER TABLE users ADD COLUMN website TEXT;
```

3. **Esegui** (Ctrl + Enter o click Run)

### Opzione 2: File SQL Pronto

Ho creato `backend/apply_migration_003.sql` con il codice necessario.

1. Apri il file in RustRover
2. Esegui tutto il contenuto

### Opzione 3: PowerShell con SQLite

Se hai SQLite installato:

```powershell
cd backend
# Scarica sqlite3.exe se non ce l'hai
# Poi:
.\sqlite3.exe zone4love.db < apply_migration_003.sql
```

## ✅ Verifica

Dopo aver applicato la migration, verifica che i campi esistano:

```sql
PRAGMA table_info(users);
```

Dovresti vedere nelle ultime righe:
```
10|location|TEXT|0||0
11|website|TEXT|0||0
```

## 🚀 Dopo la Migration

1. **Riavvia Backend**: `./start_backend.bat`
2. **Hard Refresh**: `Ctrl + Shift + R`
3. **Test Update Profile**:
   - Modifica bio: "Test"
   - Modifica location: "Venezia, Italia"
   - Modifica website: "https://example.com"
   - Click "Salva Modifiche"

## 📊 Log Atteso (Successo)

```
[INFO] 🔄 UPDATE USER REQUEST - User ID: 1
[DEBUG] Updating bio to: Some("Test")
[DEBUG] ✅ Bio updated successfully
[DEBUG] Updating location to: Some("Venezia, Italia")
[DEBUG] ✅ Location updated successfully
[DEBUG] Updating website to: Some("https://example.com")
[DEBUG] ✅ Website updated successfully
[INFO] ✅ User updated successfully: 1
```

## 🎉 Fatto!

Una volta applicata la migration, il sistema di modifica profilo sarà completamente funzionante! 🚀
