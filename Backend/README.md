# Backend - Agent Management System

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Auth Endpoints

### Register Admin User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "admin@example.com",
    "role": "admin",
    "token": "jwt_token_here"
  },
  "message": "User registered successfully"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "admin@example.com",
    "role": "admin",
    "token": "jwt_token_here"
  },
  "message": "Login successful"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

---

## Agent Endpoints

### Get All Agents
```http
GET /agents
Authorization: Bearer <token>
```

### Get Single Agent
```http
GET /agents/:id
Authorization: Bearer <token>
```

### Create Agent
```http
POST /agents
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "mobileNumber": "+1 234 567 8900",
  "password": "agent123"
}
```

### Update Agent
```http
PUT /agents/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "email": "john@example.com",
  "mobileNumber": "+1 234 567 8900"
}
```

### Delete Agent
```http
DELETE /agents/:id
Authorization: Bearer <token>
```

---

## List Endpoints

### Upload CSV/Excel File
```http
POST /lists/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <your_file.csv>
```

**Accepted file types:** .csv, .xlsx, .xls

**Required columns:**
- FirstName (required)
- Phone (required)
- Notes (optional)

### Get Distributed Lists
```http
GET /lists
Authorization: Bearer <token>

# Optional query parameters:
GET /lists?uploadBatch=1234567890
GET /lists?agentId=agent_id_here
```

### Get Upload Batches
```http
GET /lists/batches
Authorization: Bearer <token>
```

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## Database Models

### User
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  role: String (default: 'admin'),
  createdAt: Date
}
```

### Agent
```javascript
{
  name: String (required),
  email: String (unique, required),
  mobileNumber: String (required),
  password: String (hashed, required),
  isActive: Boolean (default: true),
  createdAt: Date
}
```

### List
```javascript
{
  firstName: String (required),
  phone: String (required),
  notes: String,
  agent: ObjectId (ref: Agent),
  uploadedBy: ObjectId (ref: User),
  uploadBatch: String,
  createdAt: Date
}
```

---

## Running the Backend

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Environment Variables
See `.env` file for configuration options.

