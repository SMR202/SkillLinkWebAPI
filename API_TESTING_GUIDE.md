# SkillLink API Testing Guide - Postman

**Base URL:** `https://skilllinkwebapi-production.up.railway.app`

---

## 📋 **Setup Instructions**

1. Open Postman
2. Create a new Collection called "SkillLink API"
3. Set Collection variable: `baseUrl` = `https://skilllinkwebapi-production.up.railway.app`
4. Use `{{baseUrl}}` in all requests

---

## 🔧 **STEP 1: Database Setup**

### 1.1 Test Connection

**GET** `{{baseUrl}}/test-db`

**Expected Response:**

```json
{
    "status": "success",
    "message": "Database connection successful!",
    "database": "railway"
}
```

### 1.2 Initialize Database (Create Tables)

**POST** `{{baseUrl}}/init-db`

**Expected Response:**

```json
{
    "status": "success",
    "message": "Database initialized successfully!",
    "categoriesSeeded": true
}
```

### 1.3 Verify Database

**GET** `{{baseUrl}}/db-info`

**Expected Response:**

```json
{
    "status": "success",
    "database": "railway",
    "tables": [
        "categories",
        "notifications",
        "post_images",
        "provider_responses",
        "service_posts",
        "users"
    ],
    "tableCount": 6
}
```

---

## 👤 **STEP 2: User Authentication**

### 2.1 Register a Customer

**POST** `{{baseUrl}}/api/auth/register`

**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
    "email": "customer1@test.com",
    "phoneNumber": "03111111111",
    "password": "test123",
    "fullName": "Ahmad Customer",
    "role": "customer",
    "city": "Karachi"
}
```

**Expected Response:**

```json
{
    "status": "success",
    "message": "User registered successfully",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": 1,
            "email": "customer1@test.com",
            "phoneNumber": "03111111111",
            "fullName": "Ahmad Customer",
            "role": "customer",
            "city": "Karachi"
        }
    }
}
```

**Action:** Copy the `token` value and save it as Postman variable `customerToken`

### 2.2 Register a Provider

**POST** `{{baseUrl}}/api/auth/register`

**Body (raw JSON):**

```json
{
    "email": "provider1@test.com",
    "phoneNumber": "03222222222",
    "password": "test123",
    "fullName": "Ali Electrician",
    "role": "provider",
    "city": "Karachi",
    "bio": "Certified electrician with 10 years experience"
}
```

**Action:** Copy the `token` value and save it as Postman variable `providerToken`

### 2.3 Login (Customer)

**POST** `{{baseUrl}}/api/auth/login`

**Body (raw JSON):**

```json
{
    "email": "customer1@test.com",
    "password": "test123"
}
```

**Expected Response:**

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### 2.4 Get Profile (Protected Route)

**GET** `{{baseUrl}}/api/auth/profile`

**Headers:**

```
Authorization: Bearer {{customerToken}}
```

**Expected Response:**

```json
{
    "status": "success",
    "data": {
        "user": {
            "id": 1,
            "email": "customer1@test.com",
            "fullName": "Ahmad Customer",
            "role": "customer"
        }
    }
}
```

### 2.5 Update Profile

**PUT** `{{baseUrl}}/api/auth/profile`

**Headers:**

```
Authorization: Bearer {{customerToken}}
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
    "fullName": "Ahmad Updated",
    "bio": "Looking for home services",
    "address": "Block 5, Clifton",
    "city": "Karachi"
}
```

---

## 📂 **STEP 3: Categories**

### 3.1 Get All Categories

**GET** `{{baseUrl}}/api/categories`

**Expected Response:**

```json
{
    "status": "success",
    "data": {
        "categories": [
            {
                "id": 1,
                "name": "Electrician",
                "icon": "⚡",
                "description": "Electrical repairs and installations",
                "isActive": true
            },
            {
                "id": 2,
                "name": "Plumber",
                "icon": "🔧",
                "description": "Plumbing services and repairs",
                "isActive": true
            }
        ]
    }
}
```

### 3.2 Get Single Category

**GET** `{{baseUrl}}/api/categories/1`

**Expected Response:**

```json
{
    "status": "success",
    "data": {
        "category": {
            "id": 1,
            "name": "Electrician",
            "icon": "⚡",
            "description": "Electrical repairs and installations"
        }
    }
}
```

---

## 📝 **STEP 4: Service Posts (Customer Side)**

### 4.1 Create a Service Post (Customer Only)

**POST** `{{baseUrl}}/api/posts`

**Headers:**

```
Authorization: Bearer {{customerToken}}
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
    "categoryId": 1,
    "title": "Need electrician for home wiring",
    "description": "I need urgent electrical work done. My circuit breaker keeps tripping and some outlets are not working.",
    "budget": "5000-7000",
    "city": "Karachi",
    "location": "DHA Phase 6",
    "timing": "This weekend"
}
```

**Expected Response:**

```json
{
  "status": "success",
  "message": "Service post created successfully",
  "data": {
    "post": {
      "id": 1,
      "userId": 1,
      "categoryId": 1,
      "title": "Need electrician for home wiring",
      "description": "I need urgent electrical work done...",
      "budget": "5000-7000",
      "status": "open",
      "city": "Karachi",
      "user": { ... },
      "category": { ... }
    }
  }
}
```

**Action:** Copy the `post.id` value and save it as Postman variable `postId`

### 4.2 Browse All Posts

**GET** `{{baseUrl}}/api/posts`

**Optional Query Parameters:**

-   `categoryId` - Filter by category (e.g., `?categoryId=1`)
-   `city` - Filter by city (e.g., `?city=Karachi`)
-   `status` - Filter by status (e.g., `?status=open`)
-   `search` - Search in title/description (e.g., `?search=electrician`)
-   `page` - Page number (default: 1)
-   `limit` - Results per page (default: 20)

**Example:** `{{baseUrl}}/api/posts?city=Karachi&categoryId=1&page=1&limit=10`

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "Need electrician for home wiring",
        "description": "...",
        "budget": "5000-7000",
        "city": "Karachi",
        "status": "open",
        "viewCount": 0,
        "responseCount": 0,
        "user": { ... },
        "category": { ... }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

### 4.3 Get Single Post Details

**GET** `{{baseUrl}}/api/posts/{{postId}}`

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "post": {
      "id": 1,
      "title": "Need electrician for home wiring",
      "description": "...",
      "budget": "5000-7000",
      "viewCount": 1,
      "responseCount": 0,
      "user": { ... },
      "category": { ... },
      "images": [],
      "responses": []
    }
  }
}
```

### 4.4 Get My Posts (Customer)

**GET** `{{baseUrl}}/api/posts/my/posts`

**Headers:**

```
Authorization: Bearer {{customerToken}}
```

**Optional Query Parameters:**

-   `status` - Filter by status (e.g., `?status=open`)
-   `page` - Page number
-   `limit` - Results per page

### 4.5 Update My Post

**PUT** `{{baseUrl}}/api/posts/{{postId}}`

**Headers:**

```
Authorization: Bearer {{customerToken}}
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
    "title": "URGENT: Need electrician for home wiring",
    "budget": "6000-8000",
    "timing": "Tomorrow morning"
}
```

### 4.6 Delete My Post

**DELETE** `{{baseUrl}}/api/posts/{{postId}}`

**Headers:**

```
Authorization: Bearer {{customerToken}}
```

---

## 💼 **STEP 5: Provider Responses (Provider Side)**

### 5.1 Provider Submits Response to a Post

**POST** `{{baseUrl}}/api/responses`

**Headers:**

```
Authorization: Bearer {{providerToken}}
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
    "postId": 1,
    "responseType": "quote",
    "quotedPrice": "6500",
    "message": "I can help you with this electrical work. I have 10 years of experience with home wiring and circuit breaker issues. Available this weekend.",
    "estimatedTime": "4-5 hours"
}
```

**Note:** `responseType` can be: `interested`, `quote`, `accepted`, or `rejected`

**Expected Response:**

```json
{
    "status": "success",
    "message": "Response submitted successfully",
    "data": {
        "response": {
            "id": 1,
            "postId": 1,
            "providerId": 2,
            "responseType": "quote",
            "quotedPrice": "6500",
            "message": "I can help you with this...",
            "estimatedTime": "4-5 hours",
            "status": "pending",
            "provider": {
                "id": 2,
                "fullName": "Ali Electrician",
                "city": "Karachi",
                "rating": "0.00",
                "reviewCount": 0
            }
        }
    }
}
```

**Action:** Copy the `response.id` value and save it as Postman variable `responseId`

### 5.2 Get All Responses for a Post

**GET** `{{baseUrl}}/api/responses/post/{{postId}}`

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "responses": [
      {
        "id": 1,
        "postId": 1,
        "responseType": "quote",
        "quotedPrice": "6500",
        "message": "I can help you with this...",
        "provider": { ... }
      }
    ]
  }
}
```

### 5.3 Get My Responses (Provider)

**GET** `{{baseUrl}}/api/responses/my/responses`

**Headers:**

```
Authorization: Bearer {{providerToken}}
```

**Optional Query Parameters:**

-   `status` - Filter by status (e.g., `?status=pending`)
-   `page` - Page number
-   `limit` - Results per page

### 5.4 Update My Response (Provider)

**PUT** `{{baseUrl}}/api/responses/{{responseId}}`

**Headers:**

```
Authorization: Bearer {{providerToken}}
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
    "quotedPrice": "6000",
    "message": "Updated price - I can do it for 6000 PKR",
    "estimatedTime": "3-4 hours"
}
```

### 5.5 Withdraw My Response (Provider)

**DELETE** `{{baseUrl}}/api/responses/{{responseId}}`

**Headers:**

```
Authorization: Bearer {{providerToken}}
```

---

## ✅ **STEP 6: Accept Provider Response (Customer Side)**

### 6.1 Customer Views Responses to Their Posts

**GET** `{{baseUrl}}/api/responses/my-posts/responses`

**Headers:**

```
Authorization: Bearer {{customerToken}}
```

**Optional Query Parameters:**

-   `postId` - Filter by specific post (e.g., `?postId=1`)

**Expected Response:**

```json
{
    "status": "success",
    "data": {
        "responses": [
            {
                "id": 1,
                "postId": 1,
                "quotedPrice": "6500",
                "message": "I can help you with this...",
                "status": "pending",
                "post": {
                    "id": 1,
                    "title": "Need electrician for home wiring",
                    "status": "open"
                },
                "provider": {
                    "id": 2,
                    "fullName": "Ali Electrician",
                    "city": "Karachi",
                    "rating": "0.00"
                }
            }
        ]
    }
}
```

### 6.2 Customer Accepts a Response

**PUT** `{{baseUrl}}/api/responses/{{responseId}}/accept`

**Headers:**

```
Authorization: Bearer {{customerToken}}
```

**Expected Response:**

```json
{
    "status": "success",
    "message": "Response accepted successfully",
    "data": {
        "response": {
            "id": 1,
            "status": "accepted_by_customer",
            "post": {
                "status": "assigned"
            }
        }
    }
}
```

**Note:** This will:

-   Update response status to `accepted_by_customer`
-   Update post status from `open` to `assigned`
-   Create a notification for the provider

---

## 🔔 **STEP 7: Notifications**

### 7.1 Get My Notifications

**GET** `{{baseUrl}}/api/notifications`

**Headers:**

```
Authorization: Bearer {{providerToken}}
```

**Optional Query Parameters:**

-   `isRead` - Filter by read status (e.g., `?isRead=false` for unread only)
-   `page` - Page number
-   `limit` - Results per page

**Expected Response:**

```json
{
  "status": "success",
  "data": {
    "notifications": [
      {
        "id": 1,
        "userId": 2,
        "type": "request_accepted",
        "title": "Response Accepted!",
        "message": "Ahmad Customer accepted your response for: Need electrician for home wiring",
        "postId": 1,
        "isRead": false,
        "createdAt": "2025-12-07T12:30:00.000Z"
      }
    ],
    "unreadCount": 1,
    "pagination": { ... }
  }
}
```

### 7.2 Mark Notification as Read

**PUT** `{{baseUrl}}/api/notifications/1/read`

**Headers:**

```
Authorization: Bearer {{providerToken}}
```

### 7.3 Mark All Notifications as Read

**PUT** `{{baseUrl}}/api/notifications/mark-all-read`

**Headers:**

```
Authorization: Bearer {{providerToken}}
```

### 7.4 Delete Notification

**DELETE** `{{baseUrl}}/api/notifications/1`

**Headers:**

```
Authorization: Bearer {{providerToken}}
```

---

## 🎯 **Complete Testing Flow**

### Scenario: Full Customer-Provider Interaction

1. **Customer** registers and logs in
2. **Customer** creates a service post (e.g., "Need electrician")
3. **Provider** registers and logs in
4. **Provider** browses open posts
5. **Provider** views post details
6. **Provider** submits a response with a quote
7. **Customer** gets notification about new response
8. **Customer** views responses to their post
9. **Customer** accepts the provider's response
10. **Provider** gets notification that response was accepted
11. **Both** can view their notifications

---

## ⚠️ **Common Test Cases**

### Error: Invalid Token

**Response:**

```json
{
    "status": "error",
    "message": "Invalid token"
}
```

**Fix:** Make sure you're using the correct token in the Authorization header

### Error: Only customers can create posts

**Response:**

```json
{
    "status": "error",
    "message": "Only customers can create service posts"
}
```

**Fix:** Use the `customerToken` (not `providerToken`) for creating posts

### Error: Only providers can respond

**Response:**

```json
{
    "status": "error",
    "message": "Only providers can respond to service posts"
}
```

**Fix:** Use the `providerToken` (not `customerToken`) for submitting responses

### Error: Email already registered

**Response:**

```json
{
    "status": "error",
    "message": "Email already registered"
}
```

**Fix:** Use a different email address

---

## 📊 **Database Status Endpoints**

### Check Server Health

**GET** `{{baseUrl}}/`

**Expected Response:**

```
🚀 SkillLink API - Running Successfully!
```

### Check Database Connection

**GET** `{{baseUrl}}/test-db`

### View All Database Tables

**GET** `{{baseUrl}}/db-info`

---

## 🔐 **Authentication Notes**

-   All tokens expire after **7 days**
-   Use the **Authorization** header with format: `Bearer YOUR_TOKEN_HERE`
-   Customer role: Can create posts, accept responses
-   Provider role: Can respond to posts
-   Protected routes require valid JWT token

---

## 📱 **Response Status Codes**

-   `200` - Success
-   `201` - Created successfully
-   `400` - Bad request (validation error)
-   `401` - Unauthorized (invalid/missing token)
-   `403` - Forbidden (insufficient permissions)
-   `404` - Not found
-   `409` - Conflict (duplicate entry)
-   `500` - Server error

---

## ✅ **Testing Checklist**

-   [ ] Database connection successful
-   [ ] Tables created successfully
-   [ ] Categories loaded (8 categories)
-   [ ] Customer registration working
-   [ ] Provider registration working
-   [ ] Login working
-   [ ] Profile retrieval working
-   [ ] Create service post working
-   [ ] Browse posts working
-   [ ] Provider submit response working
-   [ ] Customer view responses working
-   [ ] Customer accept response working
-   [ ] Notifications created correctly
-   [ ] All CRUD operations working

---

**Happy Testing! 🚀**

For issues or questions, check the Railway deployment logs at:
https://railway.app/project/skilllinkwebapi-production
