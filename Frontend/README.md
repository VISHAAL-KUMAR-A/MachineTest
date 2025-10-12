# Frontend - Agent Management System

React-based frontend with dark theme built using Tailwind CSS.

## Available Scripts

### `npm start`
Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm run build`
Builds the app for production to the `build` folder.

### `npm test`
Launches the test runner in interactive watch mode.

---

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.js       # Main layout with sidebar
│   ├── LoadingSpinner.js
│   └── PrivateRoute.js # Protected route wrapper
├── pages/              # Page components
│   ├── Login.js        # Login page
│   ├── Dashboard.js    # Dashboard with stats
│   ├── Agents.js       # Agent management
│   └── UploadLists.js  # CSV upload & distribution view
├── utils/              # Utility functions
│   ├── api.js          # Axios instance with interceptors
│   └── auth.js         # Authentication helpers
├── App.js              # Main app with routing
├── index.js            # Entry point
└── index.css           # Global styles + Tailwind
```

---

## Routes

| Path | Component | Protected | Description |
|------|-----------|-----------|-------------|
| `/login` | Login | No | User login page |
| `/` | Dashboard | Yes | Dashboard with statistics |
| `/agents` | Agents | Yes | Agent management page |
| `/upload` | UploadLists | Yes | CSV upload and view distributions |

---

## Components

### Layout
Provides consistent navigation and layout across all pages.
- Sidebar with navigation
- User information
- Logout functionality

### PrivateRoute
Wrapper component that protects routes requiring authentication.
Redirects to login if user is not authenticated.

### LoadingSpinner
Reusable loading spinner with configurable sizes (sm, md, lg).

---

## Pages

### Login
- Email and password authentication
- JWT token storage
- Redirect to dashboard on success
- Error handling with toast notifications

### Dashboard
- Total agents count
- Total lists count
- Upload batches count
- Recent uploads table
- Quick action cards

### Agents
- View all agents in grid layout
- Add new agent with modal form
- Edit existing agent
- Delete agent (soft delete)
- Validation for all fields

### UploadLists
- File upload (CSV, XLSX, XLS)
- File validation (type and size)
- Batch filter dropdown
- Distributed lists grouped by agent
- Agent cards with assigned items table

---

## State Management

Uses React hooks for state management:
- `useState` - Local component state
- `useEffect` - Side effects and data fetching
- `useNavigate` - Programmatic navigation

---

## API Integration

All API calls use the `api` utility from `utils/api.js`:
```javascript
import api from '../utils/api';

// GET request
const response = await api.get('/agents');

// POST request
const response = await api.post('/agents', data);

// PUT request
const response = await api.put(`/agents/${id}`, data);

// DELETE request
const response = await api.delete(`/agents/${id}`);
```

---

## Authentication Flow

1. User enters credentials on login page
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates and returns JWT token
4. Token stored in localStorage
5. Token attached to all subsequent requests
6. Protected routes check for token
7. Redirect to login if token invalid/expired

---

## Styling

### Dark Theme Colors
- Background: `#0f172a` (dark-bg)
- Card: `#1e293b` (dark-card)
- Hover: `#334155` (dark-hover)
- Border: `#475569` (dark-border)
- Text: `#e2e8f0` (dark-text)
- Text Muted: `#94a3b8` (dark-textMuted)

### Tailwind Configuration
See `tailwind.config.js` for custom theme extensions.

---

## Notifications

Uses `react-hot-toast` for user notifications:
- Success messages (green)
- Error messages (red)
- Styled to match dark theme

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Environment Variables

Required environment variables in `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel deploy
```

### Deploy to Netlify
```bash
netlify deploy --prod --dir=build
```

---

## Development Tips

1. Use React DevTools for debugging
2. Check Network tab for API calls
3. Console logs for troubleshooting
4. Hot reload enabled in development
5. Clear localStorage if auth issues occur

---

For backend API documentation, see `Backend/README.md`

