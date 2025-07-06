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

# Stealer Alert Nexus - Backend API Documentation

This document provides comprehensive API documentation for frontend developers integrating with the Stealer Alert Nexus backend.

## 🚀 **Base URL**
```
http://localhost:5000/api
```

## 🔐 **Authentication**
Most endpoints require admin authentication for maintenance operations:
```bash
Authorization: Bearer admin-token
```

## 📊 **Dashboard APIs**

### **Overview Statistics**
Get comprehensive dashboard statistics with optional country filtering.

**Endpoint**: `GET /api/stats/overview`

**Query Parameters**:
- `country` (optional): Filter by country code (e.g., "EG")

**Response**:
```json
{
  "total_credentials": 15420,
  "total_cards": 8934,
  "total_systems": 2156,
  "total_alerts": 234,
  "alert_breakdown": {
    "credential_alerts": 167,
    "card_alerts": 67
  },
  "country_filter": "EG"
}
```

**Usage Examples**:
```javascript
// Get global statistics
fetch('/api/stats/overview')

// Get Egypt-specific statistics
fetch('/api/stats/overview?country=EG')
```

### **Comprehensive Dashboard (Single Call)**
Get all dashboard data in one optimized API call.

**Endpoint**: `GET /api/dashboard/comprehensive`

**Query Parameters**:
- `country` (optional): Filter by country code

**Response**:
```json
{
  "overview": {
    "total_credentials": 15420,
    "total_cards": 8934,
    "total_systems": 2156,
    "total_alerts": 234,
    "alert_breakdown": {
      "credential_alerts": 167,
      "card_alerts": 67
    }
  },
  "stealer_distribution": [
    {"stealer_type": "RedLine", "count": 1234},
    {"stealer_type": "Raccoon", "count": 890}
  ],
  "timeline": [
    {"date": "2024-01-15", "count": 45},
    {"date": "2024-01-14", "count": 38}
  ],
  "country_distribution": [
    {"country": "EG", "count": 567},
    {"country": "US", "count": 234}
  ],
  "top_domains": [
    {"domain": "gmail.com", "count": 789},
    {"domain": "yahoo.com", "count": 456}
  ],
  "filters": {
    "country": "EG"
  },
  "metadata": {
    "generated_at": "2024-01-15T10:30:00Z",
    "optimized": true,
    "single_call": true
  }
}
```

### **Stealer Distribution**
**Endpoint**: `GET /api/stats/stealers`
**Query Parameters**: `country` (optional)

**Response**:
```json
[
  {"stealer_type": "RedLine", "count": 1234},
  {"stealer_type": "Raccoon", "count": 890},
  {"stealer_type": "Vidar", "count": 567}
]
```

### **Timeline Statistics**
**Endpoint**: `GET /api/stats/timeline`
**Query Parameters**: `country` (optional)

**Response**:
```json
[
  {"date": "2024-01-15", "count": 45},
  {"date": "2024-01-14", "count": 38},
  {"date": "2024-01-13", "count": 52}
]
```

### **Country Statistics**
**Endpoint**: `GET /api/stats/countries`
**Query Parameters**: `country` (optional)

**Response**:
```json
[
  {"country": "EG", "count": 567},
  {"country": "US", "count": 234},
  {"country": "UK", "count": 189}
]
```

### **Top Domains**
**Endpoint**: `GET /api/stats/top-domains`
**Query Parameters**: `country` (optional)

**Response**:
```json
[
  {"domain": "gmail.com", "count": 789},
  {"domain": "yahoo.com", "count": 456},
  {"domain": "outlook.com", "count": 234}
]
```

## 🔍 **Search & Filter APIs**

### **Credentials Search**
Advanced credential search with pagination and filtering.

**Endpoint**: `GET /api/credentials/search`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Results per page (default: 100, fixed)
- `domain` (optional): Filter by domain
- `username` (optional): Filter by username
- `stealer_type` (optional): Filter by stealer type
- `country` (optional): Filter by country
- `date_from` (optional): Filter from date (YYYY-MM-DD)
- `date_to` (optional): Filter to date (YYYY-MM-DD)

**Response**:
```json
{
  "results": [
    {
      "id": 12345,
      "domain": "gmail.com",
      "url": "https://accounts.google.com",
      "username": "user@gmail.com",
      "password": "encrypted_password",
      "stealer_type": "RedLine",
      "created_at": "2024-01-15T10:30:00Z",
      "country": "EG",
      "computer_name": "DESKTOP-ABC123",
      "os_version": "Windows 10",
      "language": "en-US"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 100,
    "total_count": 1234,
    "total_pages": 13,
    "has_next": true,
    "has_prev": false,
    "max_records": 50000
  }
}
```

**Usage Examples**:
```javascript
// Search by domain
fetch('/api/credentials/search?domain=gmail.com&page=1')

// Search with multiple filters
fetch('/api/credentials/search?country=EG&stealer_type=RedLine&page=2')

// Search with date range
fetch('/api/credentials/search?date_from=2024-01-01&date_to=2024-01-15')
```

### **Cards Search**
Advanced card search with BIN and bank filtering.

**Endpoint**: `GET /api/cards/search`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Results per page (default: 100, fixed)
- `cardholder` (optional): Filter by cardholder name
- `card_type` (optional): Filter by card type
- `bin_number` (optional): Filter by BIN (first 6 digits)
- `bank_name` (optional): Filter by bank name
- `country` (optional): Filter by country
- `date_from` (optional): Filter from date
- `date_to` (optional): Filter to date

**Response**:
```json
{
  "results": [
    {
      "id": 6789,
      "number": "4263****1234",
      "cardholder": "AHMED MOHAMED",
      "expiry": "12/26",
      "cvv": "123",
      "card_type": "Credit",
      "created_at": "2024-01-15T10:30:00Z",
      "country": "EG",
      "stealer_type": "RedLine",
      "bin_info": {
        "scheme": "Visa",
        "issuer": "BANQUE MISR",
        "country": "EG",
        "card_type": "Credit"
      },
      "egyptian_bank": "BANQUE MISR",
      "scheme": "Visa",
      "is_egyptian": true
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 100,
    "total_count": 567,
    "total_pages": 6,
    "has_next": true,
    "has_prev": false,
    "max_records": 50000
  }
}
```

### **Egyptian Cards**
Get paginated Egyptian credit cards for the dashboard.

**Endpoint**: `GET /api/cards/egyptian`

**Query Parameters**:
- `page` (optional): Page number
- `per_page` (optional): Results per page (fixed at 100)

**Response**: Same structure as cards search, but filtered for Egyptian BINs only.

## 🚨 **Alerts APIs**

### **Regular Alerts**
**Endpoint**: `GET /api/alerts`

**Query Parameters**:
- `page` (optional): Page number
- `per_page` (optional): Results per page (default: 1000)
- `status` (optional): Filter by status ("new", "reviewed", "false_positive")
- `severity` (optional): Filter by severity ("low", "medium", "high", "critical")
- `date_from` (optional): Filter from date
- `date_to` (optional): Filter to date

**Response**:
```json
{
  "results": [
    {
      "id": 123,
      "watchlist_id": 45,
      "matched_field": "domain",
      "matched_value": "gmail.com",
      "record_type": "credential",
      "record_id": 6789,
      "severity": "high",
      "status": "new",
      "reviewed_by": null,
      "reviewed_at": null,
      "created_at": "2024-01-15T10:30:00Z",
      "keyword": "gmail.com",
      "description": "Monitor Gmail credentials",
      "field_type": "domain",
      "reviewed_by_username": null
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 1000,
    "total_count": 234,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

### **Optimized Alerts (Recommended)**
High-performance alerts with embedded credential details.

**Endpoint**: `GET /api/alerts/optimized`

**Query Parameters**: Same as regular alerts, plus:
- `country` (optional): Filter by country using optimized data

**Response**:
```json
{
  "results": [
    {
      "id": 123,
      "watchlist_id": 45,
      "matched_field": "domain",
      "matched_value": "gmail.com",
      "severity": "high",
      "status": "new",
      "created_at": "2024-01-15T10:30:00Z",
      "keyword": "gmail.com",
      "description": "Monitor Gmail credentials",
      "domain": "gmail.com",
      "credential_username": "user@gmail.com",
      "stealer_type": "RedLine",
      "system_country": "EG",
      "system_ip": "192.168.1.100",
      "computer_name": "DESKTOP-ABC123",
      "os_version": "Windows 10",
      "machine_user": "Ahmed",
      "used_optimized_data": true
    }
  ],
  "pagination": {...},
  "optimization_stats": {
    "optimized_data_used": 8,
    "fallback_data_used": 2,
    "optimization_percentage": 80.0
  },
  "optimized": true,
  "note": "Uses credential_alert_details table when available, falls back to live data otherwise"
}
```

### **Card Alerts**
**Endpoint**: `GET /api/card-alerts`

**Query Parameters**: Same as regular alerts

**Response**:
```json
{
  "results": [
    {
      "id": 456,
      "card_watchlist_id": 78,
      "matched_bin": "426336",
      "card_number": "4263****1234",
      "card_id": 9012,
      "bank_name": "BANQUE MISR",
      "severity": "high",
      "status": "new",
      "reviewed_by": null,
      "reviewed_at": null,
      "created_at": "2024-01-15T10:30:00Z",
      "bin_number": "426336",
      "description": "Monitor BANQUE MISR cards",
      "reviewed_by_username": null
    }
  ],
  "pagination": {...}
}
```

### **Alert Actions**

#### **Resolve Alert**
**Endpoint**: `POST /api/alerts/{alert_id}/resolve`

**Request Body**:
```json
{
  "user_id": 1
}
```

**Response**:
```json
{
  "message": "Alert resolved successfully"
}
```

#### **Mark as False Positive**
**Endpoint**: `POST /api/alerts/{alert_id}/false-positive`

**Request Body**: Same as resolve

#### **Card Alert Actions**
- `POST /api/card-alerts/{alert_id}/resolve`
- `POST /api/card-alerts/{alert_id}/false-positive`

## 📝 **Detail APIs**

### **Credential Details**
**Endpoint**: `GET /api/credential/{credential_id}`

**Response**:
```json
{
  "credential": {
    "id": 12345,
    "domain": "gmail.com",
    "url": "https://accounts.google.com",
    "username": "user@gmail.com",
    "password": "encrypted_password",
    "stealer_type": "RedLine",
    "created_at": "2024-01-15T10:30:00Z",
    "country": "EG",
    "computer_name": "DESKTOP-ABC123",
    "os_version": "Windows 10",
    "machine_user": "Ahmed",
    "ip": "192.168.1.100",
    "hwid": "ABC123-DEF456",
    "language": "en-US",
    "cpu_name": "Intel Core i7",
    "ram_size": "16 GB"
  },
  "related_cards": [
    {
      "id": 6789,
      "number": "4263****1234",
      "cardholder": "AHMED MOHAMED",
      "card_type": "Credit"
    }
  ],
  "related_credentials": [
    {
      "id": 12346,
      "domain": "yahoo.com",
      "username": "user@yahoo.com"
    }
  ]
}
```

### **Card Details**
**Endpoint**: `GET /api/card/{card_id}`

**Response**: Similar structure to credential details but for card information.

## 🔍 **Watchlist APIs**

### **Get Watchlist Items**
**Endpoint**: `GET /api/watchlist`

**Response**:
```json
[
  {
    "id": 45,
    "keyword": "gmail.com",
    "field_type": "domain",
    "severity": "high",
    "description": "Monitor Gmail credentials",
    "is_active": true,
    "created_by": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "created_by_username": "admin"
  }
]
```

### **Create Watchlist Item**
**Endpoint**: `POST /api/watchlist`

**Request Body**:
```json
{
  "keyword": "paypal.com",
  "field_type": "domain",
  "severity": "critical",
  "description": "Monitor PayPal credentials",
  "created_by": 1
}
```

**Response**: Created watchlist item object

### **Delete Watchlist Item**
**Endpoint**: `DELETE /api/watchlist/{item_id}`

**Response**:
```json
{
  "message": "Watchlist item deleted successfully"
}
```

## 💳 **BIN Watchlist APIs**

### **Get BIN Watchlist**
**Endpoint**: `GET /api/watchlist/bins`

**Response**:
```json
[
  {
    "id": 78,
    "bin_number": "426336",
    "bank_name": "BANQUE MISR",
    "country": "EG",
    "severity": "high",
    "description": "Monitor BANQUE MISR Visa cards",
    "is_active": true,
    "created_by": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "created_by_username": "admin"
  }
]
```

### **Create BIN Watchlist Item**
**Endpoint**: `POST /api/watchlist/bins`

**Request Body**:
```json
{
  "bin_number": "426336",
  "bank_name": "BANQUE MISR",
  "country": "EG",
  "severity": "high",
  "description": "Monitor BANQUE MISR cards",
  "created_by": 1
}
```

### **Upload BIN Watchlist**
Upload multiple BINs via file or manual input.

**Endpoint**: `POST /api/watchlist/bins/upload`

**Content-Type**: `multipart/form-data` (for file) or `application/json` (for manual)

**File Upload Request**:
```bash
curl -X POST "/api/watchlist/bins/upload" \
  -F "file=@bins.txt"
```

**Manual Input Request**:
```json
{
  "content": "BIN,Scheme,Bank,Country\n426336,Visa,BANQUE MISR,EG\n552919,Mastercard,CITIBANK,EG"
}
```

**Response**:
```json
{
  "success": true,
  "created_count": 5,
  "skipped_count": 2,
  "error_count": 0,
  "created_items": [...],
  "skipped_items": [
    "BIN 426336 already exists in watchlist"
  ],
  "errors": []
}
```

**File Format** (bins.txt):
```
BIN,Scheme,Bank,Country
426336,Visa,BANQUE MISR,EG
552919,Mastercard,CITIBANK,EG
559461,Mastercard,EMIRATES NATIONAL BANK,EG
```

### **Delete BIN Watchlist Item**
**Endpoint**: `DELETE /api/watchlist/bins/{item_id}`

## 📊 **Statistics APIs**

### **Watchlist Statistics**
**Endpoint**: `GET /api/watchlist/stats`

**Response**:
```json
{
  "watchlist_stats": [
    {
      "id": 45,
      "keyword": "gmail.com",
      "field_type": "domain",
      "severity": "high",
      "alert_count": 150,
      "new_alerts": 45,
      "reviewed_alerts": 100,
      "false_positive_alerts": 5,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "bin_watchlist_stats": [
    {
      "id": 78,
      "bin_number": "426336",
      "bank_name": "BANQUE MISR",
      "alert_count": 67,
      "new_alerts": 23,
      "reviewed_alerts": 40,
      "false_positive_alerts": 4
    }
  ],
  "total_stats": {
    "total_credential_alerts": 1234,
    "total_card_alerts": 567,
    "total_alerts": 1801,
    "total_watchlist_items": 25,
    "total_bin_watchlist_items": 85
  }
}
```

### **Card Statistics**
**Endpoint**: `GET /api/cards/stats`

**Response**:
```json
{
  "bin_stats": [
    {
      "bin_number": "426336",
      "count": 45,
      "bank_name": "BANQUE MISR",
      "scheme": "Visa",
      "card_type": "Credit"
    }
  ],
  "card_type_stats": [
    {"card_type": "Credit", "count": 234},
    {"card_type": "Debit", "count": 567}
  ],
  "timeline_stats": [
    {"date": "2024-01-15", "count": 12},
    {"date": "2024-01-14", "count": 8}
  ],
  "bank_stats": [
    {
      "bank_name": "BANQUE MISR",
      "count": 123,
      "bins": ["426336", "498880", "498881"]
    }
  ]
}
```

## 📤 **Export APIs**

### **Export Credentials**
**Endpoint**: `GET /api/export/credentials`

**Query Parameters**: Same as credential search (for filtering)

**Response**: CSV file download

**Usage**:
```javascript
// Export all credentials
window.open('/api/export/credentials', '_blank');

// Export filtered credentials
window.open('/api/export/credentials?country=EG&stealer_type=RedLine', '_blank');
```

## 🔧 **Maintenance APIs**

### **Backfill Alerts**
Manually trigger credential alert details backfill.

**Endpoint**: `POST /api/maintenance/backfill-alerts`

**Headers**: `Authorization: Bearer admin-token`

**Response**:
```json
{
  "success": true,
  "message": "Backfill completed successfully",
  "alerts_processed": 150,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### **Alert Details Status**
Check optimization table status.

**Endpoint**: `GET /api/maintenance/alert-details-status`

**Response**:
```json
{
  "total_credential_alerts": 1234,
  "alerts_with_details": 1100,
  "alerts_missing_details": 134,
  "coverage_percentage": 89.13,
  "missing_sample": [
    {
      "id": 123,
      "created_at": "2024-01-15T10:30:00Z",
      "severity": "high",
      "keyword": "gmail.com"
    }
  ],
  "status": "partial",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### **Force Watchlist Check**
**Endpoint**: `POST /api/maintenance/force-watchlist-check`

**Headers**: `Authorization: Bearer admin-token`

### **Fix Schema**
Fix database schema issues.

**Endpoint**: `POST /api/maintenance/fix-schema`

**Headers**: `Authorization: Bearer admin-token`

**Response**:
```json
{
  "success": true,
  "message": "Schema fixes completed",
  "fixes_applied": [
    "Updated system_country column from VARCHAR(10) to VARCHAR(50)",
    "Truncated 15 country values that were too long"
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🏥 **Health Check**

### **System Health**
**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "optimization": {
    "total_credential_alerts": 1234,
    "alerts_with_optimization": 1200,
    "alerts_missing_optimization": 34,
    "optimization_coverage_percentage": 97.24,
    "status": "partial"
  },
  "tables": {
    "credential_alert_details": {
      "exists": true,
      "record_count": 1200
    },
    "alerts": {
      "exists": true,
      "record_count": 1234
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "2.0.0",
  "features": {
    "credential_alert_optimization": true,
    "country_filtering": true,
    "bin_upload": true,
    "comprehensive_dashboard": true
  }
}
```

## 🔐 **Authentication**

### **Login**
**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "username": "admin",
  "password": "Test@2013"
}
```

**Response**:
```json
{
  "access_token": "jwt-token-1-1705401234.567",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@company.com",
    "role": "admin",
    "is_active": true,
    "api_key": "api-key-123",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

## ⚠️ **Error Responses**

All APIs return consistent error responses:

```json
{
  "error": "Error description message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Common HTTP Status Codes**:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## 📋 **Data Types & Validation**

### **Field Lengths**:
- `domain`: VARCHAR(255)
- `username`: VARCHAR(255)
- `password`: TEXT (unlimited)
- `stealer_type`: VARCHAR(100)
- `system_country`: VARCHAR(50)
- `computer_name`: VARCHAR(255)
- `os_version`: VARCHAR(255)
- `machine_user`: VARCHAR(255)

### **Enum Values**:

**Alert Status**:
- `"new"`
- `"reviewed"`
- `"false_positive"`

**Severity Levels**:
- `"low"`
- `"medium"`
- `"high"`
- `"critical"`

**Watchlist Field Types**:
- `"domain"`
- `"username"`
- `"ip"`
- `"url"`

**Card Types**:
- `"Credit"`
- `"Debit"`

## 🚀 **Performance Tips**

### **For Dashboard**:
1. Use `/api/dashboard/comprehensive` for single-call dashboard loading
2. Implement country filtering to reduce data size
3. Cache dashboard data for 5-10 minutes

### **For Alerts**:
1. Use `/api/alerts/optimized` for better performance
2. Implement pagination with reasonable page sizes
3. Use status filtering to show only relevant alerts

### **For Search**:
1. Always implement pagination
2. Use specific filters to reduce result sets
3. Limit to 50,000 max records as per API design

### **For Real-time Updates**:
1. Poll `/api/maintenance/alert-details-status` every 30 seconds
2. Use `/api/health` for system status monitoring
3. Implement exponential backoff for failed requests

## 📱 **Frontend Integration Examples**

### **React Hook for Dashboard**:
```javascript
import { useState, useEffect } from 'react';

const useDashboard = (country = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const url = country 
          ? `/api/dashboard/comprehensive?country=${country}`
          : '/api/dashboard/comprehensive';
        const response = await fetch(url);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboard();
  }, [country]);
  
  return { data, loading };
};
```

### **Search with Pagination**:
```javascript
const useSearch = (searchType, filters, page) => {
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  
  useEffect(() => {
    const searchData = async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        ...filters
      });
      
      const response = await fetch(`/api/${searchType}/search?${params}`);
      const data = await response.json();
      
      setResults(data.results);
      setPagination(data.pagination);
    };
    
    searchData();
  }, [searchType, filters, page]);
  
  return { results, pagination };
};
```

---

## 📞 **Support**

For technical issues or questions about the API:
1. Check the health endpoint: `/api/health`
2. Review error responses for specific details
3. Use maintenance endpoints for system diagnostics
4. Refer to this documentation for expected data structures

**Version**: 2.0.0  
**Last Updated**: January 2024
