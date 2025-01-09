# Real-Time Data Dashboard

A full-stack application featuring real-time data visualization, authentication, and CRUD operations.

## Live Demo

- Frontend: [https://blackrose-git-master-himanshuchittora23908s-projects.vercel.app/](https://blackrose-git-master-himanshuchittora23908s-projects.vercel.app/)
- Backend: [https://blackrose-vyhg.onrender.com/](https://blackrose-vyhg.onrender.com/)

## Features

- User authentication with JWT
- Real-time random number generation and visualization
- CRUD operations on CSV data with concurrent access handling
- Data backup and recovery
- Responsive dark theme UI
- Pagination and sorting

## Tech Stack

### Backend

- FastAPI
- SQLite
- WebSocket
- JWT authentication

### Frontend

- React
- Redux Toolkit
- Chart.js
- TailwindCSS
- React Router

## Setup Instructions

### Backend Setup

1. Create a virtual environment:

```bash
python -m venv venv
source venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install fastapi uvicorn websockets python-jwt sqlite3 python-multipart
```

3. Run the backend:

```bash
uvicorn main:app --reload
```

### Frontend Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment variables:

```bash
# .env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

3. Run the frontend:

```bash
npm start
```

## API Documentation

### Authentication

```
POST /login
Parameters:
- username: string
- password: string
Returns: JWT token
```

### Data Endpoints

```
WebSocket /ws/random-numbers
Returns: Real-time random numbers

GET /csv
Returns: CSV data

POST /csv
Body: Row data
Returns: Success message

PUT /csv/{row_id}
Body: Updated row data
Returns: Success message

DELETE /csv/{row_id}
Returns: Success message

POST /restore
Returns: Success message
```

## Security Considerations

- JWT tokens expire after 24 hours
- File locking mechanism prevents race conditions
- Automatic backup before modifications
- CORS configuration for production
- Protected routes require authentication

## Development Notes

- The backend uses SQLite for simplicity
- WebSocket connection automatically reconnects on disconnection
- CSV operations are atomic with file locking
- Frontend includes error handling and loading states
- Dark theme UI with responsive design
