# 🗄️ SkillLink Database Guide

## 📋 Project Setup

### Database Connection

-   **Database**: MySQL on Railway
-   **Connection**: Using `mysql2/promise` with connection pooling
-   **Environment Variable**: `MYSQL_URL` (stored in `.env` file locally, Railway environment variables for production)

### Current Setup

```javascript
const pool = mysql.createPool({
    uri: process.env.MYSQL_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
```

---

## 🤖 AI Prompt for Working with This Database

Copy and paste this prompt when asking AI to help with database operations:

````
I'm working on a Node.js Express API connected to a MySQL database on Railway.

PROJECT STRUCTURE:
- File: index.js
- Database library: mysql2/promise
- Connection: Using a connection pool called `pool`
- Middleware: express.json() is already configured

IMPORTANT PATTERNS TO FOLLOW:
1. Always use async/await
2. Get connection from pool: `const connection = await pool.getConnection();`
3. Execute queries with parameterized statements: `await connection.query(SQL, [params])`
4. ALWAYS release connection: `connection.release();`
5. Use try-catch for error handling
6. Return JSON responses with this format:
   - Success: { status: 'success', message: '...', data: {...} }
   - Error: { status: 'error', message: '...', error: error.message }

EXAMPLE PATTERN:
```javascript
app.post('/endpoint', async (req, res) => {
  try {
    const { field1, field2 } = req.body;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO table_name (field1, field2) VALUES (?, ?)',
      [field1, field2]
    );
    connection.release();

    res.status(201).json({
      status: 'success',
      message: 'Created successfully',
      data: { id: result.insertId, field1, field2 }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Operation failed',
      error: error.message
    });
  }
});
````

When creating new endpoints, follow the RESTful API pattern:

-   POST /resource - Create
-   GET /resource - Get all
-   GET /resource/:id - Get one
-   PUT /resource/:id - Update
-   DELETE /resource/:id - Delete

````

---

## 📖 Understanding the Code Pattern

### 1. **Connection Pool** (Already Set Up)
```javascript
const pool = mysql.createPool({ ... });
````

**What it does**: Creates a pool of reusable database connections
**Why**: More efficient than creating new connection for each request

### 2. **Basic Endpoint Structure**

```javascript
app.METHOD("/endpoint", async (req, res) => {
    try {
        // 1. Get data from request
        const { field } = req.body; // For POST/PUT
        const { id } = req.params; // For /endpoint/:id

        // 2. Get connection from pool
        const connection = await pool.getConnection();

        // 3. Execute query (SAFE - uses ? placeholders)
        const [result] = await connection.query(
            "SELECT * FROM table WHERE id = ?",
            [id] // Values replace ? in order
        );

        // 4. MUST release connection back to pool
        connection.release();

        // 5. Send response
        res.json({ status: "success", data: result });
    } catch (error) {
        // 6. Handle errors
        console.error("Error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed",
            error: error.message,
        });
    }
});
```

### 3. **Query Types**

#### **CREATE (INSERT)**

```javascript
const [result] = await connection.query(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    [name, email]
);
// result.insertId = the new row's ID
```

#### **READ (SELECT)**

```javascript
const [rows] = await connection.query("SELECT * FROM users");
// rows = array of objects
```

#### **UPDATE**

```javascript
const [result] = await connection.query(
    "UPDATE users SET name = ? WHERE id = ?",
    [newName, userId]
);
// result.affectedRows = number of rows updated
```

#### **DELETE**

```javascript
const [result] = await connection.query("DELETE FROM users WHERE id = ?", [
    userId,
]);
// result.affectedRows = number of rows deleted
```

### 4. **Why Use `?` Placeholders?**

```javascript
// ❌ DANGEROUS - SQL Injection risk
connection.query(`SELECT * FROM users WHERE id = ${id}`);

// ✅ SAFE - Prevents SQL injection
connection.query("SELECT * FROM users WHERE id = ?", [id]);
```

### 5. **Understanding async/await**

```javascript
// Without await - returns a Promise (incomplete)
const result = connection.query("SELECT * FROM users");

// With await - waits for result (complete)
const [rows] = await connection.query("SELECT * FROM users");
```

---

## 🛠️ Common Operations Examples

### Create a Table

```javascript
app.post("/setup-table", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        connection.release();
        res.json({ status: "success", message: "Table created" });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});
```

### Insert Data

```javascript
app.post("/users", async (req, res) => {
    try {
        const { name, email } = req.body;
        const connection = await pool.getConnection();
        const [result] = await connection.query(
            "INSERT INTO users (name, email) VALUES (?, ?)",
            [name, email]
        );
        connection.release();
        res.status(201).json({
            status: "success",
            data: { id: result.insertId, name, email },
        });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});
```

### Get All Data

```javascript
app.get("/users", async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query("SELECT * FROM users");
        connection.release();
        res.json({ status: "success", count: rows.length, data: rows });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});
```

### Get One by ID

```javascript
app.get("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            "SELECT * FROM users WHERE id = ?",
            [id]
        );
        connection.release();

        if (rows.length === 0) {
            return res
                .status(404)
                .json({ status: "error", message: "User not found" });
        }
        res.json({ status: "success", data: rows[0] });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});
```

### Update Data

```javascript
app.put("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;
        const connection = await pool.getConnection();
        const [result] = await connection.query(
            "UPDATE users SET name = ?, email = ? WHERE id = ?",
            [name, email, id]
        );
        connection.release();

        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ status: "error", message: "User not found" });
        }
        res.json({ status: "success", message: "User updated" });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});
```

### Delete Data

```javascript
app.delete("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        const [result] = await connection.query(
            "DELETE FROM users WHERE id = ?",
            [id]
        );
        connection.release();

        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ status: "error", message: "User not found" });
        }
        res.json({ status: "success", message: "User deleted" });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});
```

---

## ⚠️ Critical Rules

1. **ALWAYS release connections**: `connection.release();`
2. **ALWAYS use parameterized queries**: `query(SQL, [params])`
3. **ALWAYS use try-catch** for error handling
4. **NEVER commit `.env`** to git (contains database password)
5. **Test locally first** before pushing to Railway

---

## 🚀 Testing Your Endpoints

### Using PowerShell (Windows)

**GET Request:**

```powershell
Invoke-WebRequest -Uri http://localhost:3000/users -UseBasicParsing | Select-Object -ExpandProperty Content
```

**POST Request:**

```powershell
$body = @{ name = "John"; email = "john@example.com" } | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:3000/users -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**PUT Request:**

```powershell
$body = @{ name = "Jane"; email = "jane@example.com" } | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:3000/users/1 -Method PUT -Body $body -ContentType "application/json" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**DELETE Request:**

```powershell
Invoke-WebRequest -Uri http://localhost:3000/users/1 -Method DELETE -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## 👥 Team Workflow

1. **Pull latest code**: `git pull`
2. **Create `.env` file** with the public MySQL URL (ask team lead)
3. **Install dependencies**: `npm install`
4. **Start server**: `npm start`
5. **Test endpoints** using PowerShell or Postman
6. **Push changes**:
    ```powershell
    git add .
    git commit -m "Add feature X"
    git push
    ```
7. Railway will **auto-deploy** when you push to GitHub

---

## 📞 Questions?

-   Check Railway logs for production errors
-   Test locally before deploying
-   Use the AI prompt above to generate new endpoints
-   Always follow the pattern: get connection → query → release → respond
