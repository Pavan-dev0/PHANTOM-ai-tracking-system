# PHANTOM Frontend

This is the React frontend for the PHANTOM AI Tracking System.

## Prerequisites
- Node.js 18 or newer
- npm
- Flask backend running on `http://localhost:5000`

## Install Dependencies
From the `frontend` folder:

```powershell
npm install
```

## Run the Frontend
From the `frontend` folder:

```powershell
npm start
```

The app will start on:
- `http://localhost:3000`

## Backend Connection
The frontend sends analysis requests to:

```text
http://localhost:5000/api/analyze
```

Make sure the backend is started before using the analysis flow.

From the project root, the backend can be started with:

```powershell
python backend\routes\app.py
```

## Available Scripts

### `npm start`
Runs the React app in development mode.

### `npm test`
Runs the frontend test suite.

### `npm run build`
Builds the frontend for production.

## Common Issue

If you see requests failing for `/analyse`, the frontend is pointing to the wrong backend route.
The correct backend endpoint is:

```text
/api/analyze
```
