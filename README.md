# Agent Management System - MERN Stack

A full-stack web application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) for managing agents and distributing tasks from uploaded CSV/Excel files.

## Features

### 1. User Authentication
- Secure login with JWT authentication
- Protected routes and API endpoints
- Session management

### 2. Agent Management
- Create, read, update, and delete agents
- Store agent details (name, email, mobile number with country code, password)
- View all active agents

### 3. CSV/Excel Upload & Distribution
- Upload CSV, XLSX, or XLS files
- Automatic validation of file format and data
- Equal distribution of records among active agents
- Remainder handling for unequal distributions
- View distributed lists by agent
- Filter by upload batch

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **CSV-Parser** - CSV file parsing
- **XLSX** - Excel file parsing

### Frontend
- **React.js** - UI library
- **React Router** - Navigation
- **Tailwind CSS** - Styling (Dark theme)
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## Project Structure

```
MachineTest/
├── Backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── agentController.js
│   │   └── listController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Agent.js
│   │   └── List.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── agentRoutes.js
│   │   └── listRoutes.js
│   ├── uploads/
│   ├── utils/
│   │   └── generateToken.js
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
├── Frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.js
│   │   │   ├── LoadingSpinner.js
│   │   │   └── PrivateRoute.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Agents.js
│   │   │   └── UploadLists.js
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── auth.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- npm or yarn package manager

### Backend Setup

1. Navigate to the Backend directory:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - The `.env` file is already configured with MongoDB credentials
   - Review and modify if needed:
     - `MONGODB_URI` - MongoDB connection string
     - `JWT_SECRET` - Secret key for JWT tokens
     - `PORT` - Server port (default: 5000)
     - `FRONTEND_URL` - Frontend URL for CORS

4. Start the backend server:
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The backend server will start at `http://localhost:5000`

### Frontend Setup

1. Navigate to the Frontend directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - The `.env` file is already configured
   - Review and modify if needed:
     - `REACT_APP_API_URL` - Backend API URL (default: http://localhost:5000/api)

4. Start the frontend development server:
```bash
npm start
```

The frontend will start at `http://localhost:3000` and open automatically in your browser.

## Usage Guide

### 1. Create Admin Account

Before logging in, you need to create an admin account. Use any API client (Postman, cURL, etc.):

**Endpoint:** `POST http://localhost:5000/api/auth/register`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

### 2. Login

1. Open the application at `http://localhost:3000`
2. Enter your admin credentials
3. Click "Sign In"

### 3. Manage Agents

1. Navigate to "Agents" from the sidebar
2. Click "Add Agent" to create a new agent
3. Fill in the required fields:
   - Name
   - Email
   - Mobile Number (with country code, e.g., +1 234 567 8900)
   - Password
4. Edit or delete agents as needed

### 4. Upload CSV/Excel Files

1. Navigate to "Upload Lists" from the sidebar
2. Click "Choose File" and select a CSV, XLSX, or XLS file
3. The file must contain these columns:
   - **FirstName** - Text (required)
   - **Phone** - Number/Text (required)
   - **Notes** - Text (optional)
4. Click "Upload" to process the file
5. Records will be automatically distributed equally among all active agents
6. If the total records are not divisible by the number of agents, remaining records are distributed sequentially

### 5. View Distributed Lists

1. After uploading, distributed lists are displayed by agent
2. Use the batch filter dropdown to view specific uploads
3. Each agent card shows:
   - Agent name and email
   - Number of assigned items
   - Complete list with FirstName, Phone, and Notes

## CSV/Excel File Format

### Sample CSV Format:
```csv
FirstName,Phone,Notes
John,1234567890,Follow up needed
Jane,0987654321,Interested in product
Mike,5551234567,Call after 3 PM
```

### Sample Excel Format:
| FirstName | Phone      | Notes               |
|-----------|------------|---------------------|
| John      | 1234567890 | Follow up needed    |
| Jane      | 0987654321 | Interested in product|
| Mike      | 5551234567 | Call after 3 PM     |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register admin user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Agents
- `GET /api/agents` - Get all agents (Protected)
- `GET /api/agents/:id` - Get single agent (Protected)
- `POST /api/agents` - Create agent (Protected)
- `PUT /api/agents/:id` - Update agent (Protected)
- `DELETE /api/agents/:id` - Delete agent (Protected)

### Lists
- `POST /api/lists/upload` - Upload CSV/Excel file (Protected)
- `GET /api/lists` - Get distributed lists (Protected)
- `GET /api/lists/batches` - Get upload batches (Protected)

## Distribution Logic

The system distributes uploaded records equally among all active agents:

1. Calculate records per agent: `recordsPerAgent = Math.floor(totalRecords / agentCount)`
2. Calculate remainder: `remainder = totalRecords % agentCount`
3. First `remainder` agents receive `recordsPerAgent + 1` records
4. Remaining agents receive `recordsPerAgent` records

**Example:**
- 25 records, 5 agents → Each agent gets 5 records
- 27 records, 5 agents → First 2 agents get 6 records, remaining 3 get 5 records

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Protected API routes
- Protected frontend routes
- Environment variables for sensitive data
- Input validation and sanitization
- File type and size validation

## Dark Theme

The application features a modern dark theme built with Tailwind CSS:
- Background: `#0f172a`
- Cards: `#1e293b`
- Borders: `#475569`
- Text: `#e2e8f0`
- Accent: Blue (`#2563eb`)

## Git & GitHub

The project is configured with `.gitignore` files to exclude:
- `node_modules/`
- `.env` files
- Build directories
- Logs
- OS-specific files
- IDE configurations

### To push to GitHub:

1. Initialize git repository (if not already done):
```bash
git init
```

2. Add all files:
```bash
git add .
```

3. Commit changes:
```bash
git commit -m "Initial commit: Agent Management System"
```

4. Add remote repository:
```bash
git remote add origin https://github.com/yourusername/your-repo-name.git
```

5. Push to GitHub:
```bash
git push -u origin main
```

## Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
- Verify MongoDB URI in `.env` file
- Check network connectivity
- Ensure MongoDB Atlas IP whitelist includes your IP

**Port Already in Use:**
- Change PORT in `.env` file
- Kill process using the port: `npx kill-port 5000`

### Frontend Issues

**API Connection Error:**
- Ensure backend is running
- Verify `REACT_APP_API_URL` in `.env` file
- Check CORS configuration in backend

**Build Errors:**
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear cache: `npm cache clean --force`

## Production Deployment

### Backend Deployment (Heroku/Railway/Render)

1. Set environment variables in your hosting platform
2. Ensure `NODE_ENV=production`
3. Update `FRONTEND_URL` to your deployed frontend URL
4. Deploy using Git or hosting platform CLI

### Frontend Deployment (Vercel/Netlify)

1. Build the project: `npm run build`
2. Set `REACT_APP_API_URL` to your deployed backend URL
3. Deploy the `build` folder

## Support

For issues or questions, please open an issue in the GitHub repository.

## License

This project is open source and available under the MIT License.

---

**Developed for Machine Test Assignment**

