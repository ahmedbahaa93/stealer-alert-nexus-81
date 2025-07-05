
# Flask Backend for Dark Web Stealer Monitoring

This is a temporary Flask backend that provides mock data for the frontend dashboard.

## Quick Start

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install requirements:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the server:**
   ```bash
   python app.py
   ```
   
   Or use the startup script:
   ```bash
   python start.py
   ```

## Features

- **Temporary Login Bypass**: Accepts any username/password combination
- **Mock Data**: Generates realistic sample data for testing
- **Full API Compatibility**: Implements all endpoints expected by the frontend
- **CORS Enabled**: Allows cross-origin requests from the frontend

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (accepts any credentials)

### Dashboard Stats
- `GET /api/stats/overview` - Overall statistics
- `GET /api/stats/countries` - Statistics by country
- `GET /api/stats/stealers` - Statistics by stealer type
- `GET /api/stats/top-domains` - Top compromised domains
- `GET /api/stats/timeline` - Timeline statistics

### Credentials
- `GET /api/credentials/search` - Search credentials with filters
- `GET /api/credential/{id}` - Get detailed credential information

### Alerts
- `GET /api/alerts` - Get all alerts
- `POST /api/alerts/{id}/resolve` - Resolve an alert

### Watchlist
- `GET /api/watchlist` - Get watchlist items
- `POST /api/watchlist` - Create new watchlist item
- `DELETE /api/watchlist/{id}` - Delete watchlist item

### Export
- `GET /api/export/credentials` - Export credentials data

## Configuration

The backend runs on `http://localhost:5000` by default. The frontend is configured to connect to this URL.

## Development Notes

This is a **temporary solution** for development and testing. For production use:

1. Set up a proper database (PostgreSQL recommended)
2. Implement real authentication with JWT tokens
3. Add proper error handling and validation
4. Use the full FastAPI backend provided in the previous code

## Troubleshooting

If you encounter issues:

1. Make sure Python 3.7+ is installed
2. Check that port 5000 is not in use by another application
3. Verify that all requirements are installed
4. Check the console for error messages

The backend will generate random mock data each time it starts, so data will be different between restarts.
