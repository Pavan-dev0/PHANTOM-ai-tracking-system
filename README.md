# PHANTOM AI Tracking System

PHANTOM is a prototype missing-person tracking system with a React frontend and a Flask backend. 

## Tech Stack
- React
- Flask
- Python
- JavaScript

## Project Structure
- `frontend/` - React application
- `backend/routes/app.py` - Flask server entry point
- `backend/requirements.txt` - backend Python dependencies
- `tests/` - repo validation scripts

## Prerequisites
- Python 3.11 or newer
- Node.js 18 or newer
- npm

## Backend Setup
From the project root:

```powershell
python -m pip install flask
python -m pip install -r backend\requirements.txt
```

If you are using macOS or Linux:

```bash
python3 -m pip install flask
python3 -m pip install -r backend/requirements.txt
```

## Frontend Setup
From the project root:

```powershell
cd frontend
npm install
```

## Run the Backend
Open a terminal in the project root and run:

```powershell
python backend\routes\app.py
```

The Flask server should start on:
- `http://127.0.0.1:5000`
- `http://localhost:5000`

## Run the Frontend
Open a second terminal and run:

```powershell
cd frontend
npm start
```

The React app should open on:
- `http://localhost:3000`

## Manual Health Check
After starting the backend, test the health endpoint:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:5000/api/health" | Select-Object -ExpandProperty Content
```

Expected result:

```json
{
  "port": 5000,
  "server": "phantom-flask",
  "status": "healthy"
}
```

## Manual API Test
To test the mock analysis endpoint:

```powershell
$body = '{"name":"Alex Doe","lat":12.34,"lng":56.78,"hours_missing":4,"notes":"Last seen near station","transport":"bus"}'
Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:5000/api/analyze" -Method POST -ContentType "application/json" -Body $body | Select-Object -ExpandProperty Content
```

The response should include:
- `coordinates`
- `destination_category`
- `category`
- `confidence`
- `reasoning`
- `signal_breakdown`

## Running Repo Checks
From the project root:

```powershell
python tests\routes-check.py
python tests\system-check.py
```

Notes:
- `routes-check.py` is the main backend route validation script.
- Some other repo checks may be skipped if unrelated modules are not part of your branch work.

## Troubleshooting
- `Unable to connect to the remote server`
  The Flask server is not running. Start `python backend\routes\app.py` first.

- `No module named 'flask'`
  Install Flask with:

  ```powershell
  python -m pip install flask
  ```

- `No module named 'flask_cors'`
  Install backend dependencies with:

  ```powershell
  python -m pip install -r backend\requirements.txt
  ```

