# 🤖 AI Prompt - Copy & Paste This

When asking AI for help with database operations in this project, use this prompt:

---

**I'm working on a Node.js Express API (file: `index.js`) connected to MySQL on Railway.**

**Current Setup:**

-   Database library: `mysql2/promise`
-   Connection pool: `pool` (already created)
-   Middleware: `express.json()` configured
-   Response format: `{ status: 'success'|'error', message: '...', data: {...} }`

**Pattern to Follow:**

```javascript
app.METHOD("/endpoint", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query("SQL ?", [params]);
        connection.release();
        res.json({ status: "success", data: result });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed",
            error: error.message,
        });
    }
});
```

**Rules:**

1. ✅ Use async/await
2. ✅ Get connection: `await pool.getConnection()`
3. ✅ Use parameterized queries: `query(SQL, [params])`
4. ✅ ALWAYS release: `connection.release()`
5. ✅ Use try-catch blocks
6. ✅ Return consistent JSON responses

**My Request:**
[Describe what you want to build - e.g., "Create an endpoint to add products with name, price, and category"]

---

# 💡 Simple Explanation

## What You Have Now

Think of your setup like this:

```
Your Computer                Railway Cloud
    |                             |
index.js  ←--MYSQL_URL-->  MySQL Database
    |                             |
(reads .env)              (stores your data)
```

## The Connection Pool

```javascript
const pool = mysql.createPool({ ... });
```

**Analogy**: Like a parking lot with 10 spots for database connections

-   Instead of creating a new connection every time (slow)
-   We reuse connections from the pool (fast)
-   When done, we return it: `connection.release()`

## The Pattern (4 Steps)

### **Step 1: Get Connection**

```javascript
const connection = await pool.getConnection();
```

Like checking out a book from the library.

### **Step 2: Do Your Query**

```javascript
const [result] = await connection.query("SELECT * FROM users WHERE id = ?", [
    5,
]);
```

-   SQL goes first
-   Values go in array `[5]`
-   The `?` gets replaced with `5` safely

### **Step 3: Release Connection**

```javascript
connection.release();
```

Like returning the book. **Very important!** Without this, you'll run out of connections.

### **Step 4: Send Response**

```javascript
res.json({ status: "success", data: result });
```

## CRUD Operations Explained

### **CREATE (INSERT)**

```javascript
INSERT INTO users (name, email) VALUES (?, ?)
```

**Like**: Adding a new row to a spreadsheet

### **READ (SELECT)**

```javascript
SELECT * FROM users WHERE id = ?
```

**Like**: Looking up data in a spreadsheet

### **UPDATE**

```javascript
UPDATE users SET name = ? WHERE id = ?
```

**Like**: Changing a cell value in a spreadsheet

### **DELETE**

```javascript
DELETE FROM users WHERE id = ?
```

**Like**: Deleting a row from a spreadsheet

## Why Use `?` Instead of Direct Values?

```javascript
// ❌ BAD - Someone could hack your database
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ GOOD - Safe from hackers
const query = "SELECT * FROM users WHERE email = ?";
connection.query(query, [email]);
```

## Testing Flow

1. **Write code** in `index.js`
2. **Run**: `npm start`
3. **Test**: Use PowerShell commands from guide
4. **See response**: JSON with status and data
5. **If error**: Check terminal for error message

## Team Collaboration

```
1. Partner A: Creates table structure
2. Partner B: Adds INSERT endpoints
3. Partner C: Adds SELECT endpoints
4. Everyone: git push → Railway auto-deploys
```

## Key Files

-   **`index.js`** - Your API code (this is where you work)
-   **`.env`** - Database password (NEVER commit to git)
-   **`.gitignore`** - Protects .env from being uploaded
-   **`package.json`** - Lists dependencies (mysql2, express, dotenv)

## When Things Break

1. Check terminal for error messages
2. Make sure connection was released
3. Check SQL syntax
4. Verify `.env` has correct MYSQL_URL
5. Test locally before pushing to Railway
