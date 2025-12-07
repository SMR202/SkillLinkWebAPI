# 🧪 STEP 1 Testing Guide

## What We Just Created:
✅ 7 Database models (Users, Categories, ServicePosts, PostImages, ProviderResponses, Notifications)
✅ Sequelize ORM setup with relationships
✅ Database initialization endpoint

## How to Test:

### 1️⃣ Install Dependencies
```bash
cd SkillLinkWebAPI
npm install
```

### 2️⃣ Start Server Locally
```bash
npm start
```

You should see:
```
🚀 Server running on port 3000
📊 Database URL configured: ✅
✅ Database connection established successfully.
```

### 3️⃣ Test Endpoints

**Test 1: Check Homepage**
```
Open browser: http://localhost:3000
```
Should see: "🚀 SkillLink API - Running Successfully!"

**Test 2: Test Database Connection**
```
Open browser: http://localhost:3000/test-db
```
Should return:
```json
{
  "status": "success",
  "message": "Database connection successful!",
  "timestamp": "2025-12-07T..."
}
```

**Test 3: Initialize Database (Create Tables)**
Use Postman, Thunder Client, or curl:
```bash
# POST request to create tables
curl -X POST http://localhost:3000/init-db
```
Should return:
```json
{
  "status": "success",
  "message": "Database initialized successfully!",
  "categoriesSeeded": true
}
```

**Test 4: Check Database Schema**
```
GET: http://localhost:3000/db-info
```
Should show all created tables:
```json
{
  "status": "success",
  "data": {
    "database": "railway",
    "tables": [
      "categories",
      "users",
      "service_posts",
      "post_images",
      "provider_responses",
      "notifications"
    ],
    "tableCount": 6
  }
}
```

## Database Schema Created:

### Tables:
1. **users** - Customer and Provider accounts
2. **categories** - Service categories (Electrician, Plumber, etc.)
3. **service_posts** - Service requests from customers
4. **post_images** - Images attached to service posts
5. **provider_responses** - Provider quotes/responses to requests
6. **notifications** - Push notification records

### Pre-seeded Data:
8 Categories: Electrician, Plumber, Tutor, Cleaning, Development, Design, Carpentry, Painting

## What's Next?
Once you confirm these tests work, we'll move to **STEP 2: Authentication API** (register, login, JWT tokens).

## Troubleshooting:
❌ "Cannot find module 'sequelize'" → Run `npm install`
❌ "Database connection failed" → Check `.env` file has `MYSQL_URL`
❌ Table already exists → Add `?force=true` to init-db: `POST /init-db?force=true` (⚠️ This drops all data!)
