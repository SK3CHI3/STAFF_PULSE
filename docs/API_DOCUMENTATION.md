# 🚀 STAFF_PULSE API Documentation

Complete API reference for the STAFF_PULSE employee wellness platform.

## 📋 Table of Contents

- [Authentication](#authentication)
- [Employee Management](#employee-management)
- [WhatsApp Integration](#whatsapp-integration)
- [AI Insights](#ai-insights)
- [Schedule Management](#schedule-management)
- [Super Admin APIs](#super-admin-apis)
- [System Health](#system-health)
- [Error Handling](#error-handling)

## 🔐 Authentication

All API endpoints require authentication via Supabase Auth. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## 👥 Employee Management

### Get Employees
```http
GET /api/employees?organizationId={id}&department={dept}&status={status}&search={query}
```

**Parameters:**
- `organizationId` (required): Organization UUID
- `department` (optional): Filter by department
- `status` (optional): `active`, `inactive`, or `all`
- `search` (optional): Search by name or email

**Response:**
```json
{
  "success": true,
  "employees": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@company.com",
      "phone": "+1234567890",
      "department": "Engineering",
      "position": "Developer",
      "is_active": true,
      "mood_stats": {
        "average_mood": 4.2,
        "response_count": 15,
        "last_response": "2024-01-15T10:30:00Z"
      }
    }
  ]
}
```

### Create Employee
```http
POST /api/employees
```

**Body:**
```json
{
  "organizationId": "uuid",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@company.com",
  "phone": "+1234567890",
  "department": "Marketing",
  "position": "Manager"
}
```

### Update Employee
```http
PUT /api/employees/{id}
```

### Delete Employee (Deactivate)
```http
DELETE /api/employees/{id}
```

### Import Employees (CSV)
```http
POST /api/employees/import
```

**Body:**
```json
{
  "organizationId": "uuid",
  "csvData": "first_name,last_name,email,phone,department\nJohn,Doe,john@company.com,+1234567890,Engineering"
}
```

**Response:**
```json
{
  "success": true,
  "imported": 25,
  "failed": 2,
  "errors": [
    {
      "row": 3,
      "error": "Invalid phone number",
      "data": {"first_name": "Invalid", "phone": "123"}
    }
  ]
}
```

## 📱 WhatsApp Integration

### Send Check-in Messages
```http
POST /api/whatsapp/send-checkin
```

**Body:**
```json
{
  "type": "organization", // "single", "department", "scheduled", "organization"
  "organizationId": "uuid",
  "employeeId": "uuid", // for single type
  "departmentFilter": "Engineering", // for department type
  "scheduleId": "uuid", // for scheduled type
  "messageType": "weekly" // "daily", "weekly", "monthly", "custom"
}
```

**Response:**
```json
{
  "success": true,
  "sent": 45,
  "failed": 2,
  "total": 47,
  "errors": ["Employee X: Invalid phone number"]
}
```

### WhatsApp Webhook (Twilio)
```http
POST /api/whatsapp/webhook
```

Handles incoming WhatsApp messages from employees. Automatically processes mood scores and generates AI insights.

### Get Message Logs
```http
GET /api/whatsapp/send-checkin?organizationId={id}&limit={limit}
```

## 🤖 AI Insights

### Get Insights
```http
GET /api/ai/insights?organizationId={id}&type={type}&severity={severity}&limit={limit}
```

**Parameters:**
- `organizationId` (required): Organization UUID
- `type` (optional): `trend_analysis`, `risk_detection`, `recommendation`, `department_insight`, `employee_insight`
- `severity` (optional): `info`, `warning`, `critical`
- `limit` (optional): Number of insights to return (default: 20)

**Response:**
```json
{
  "success": true,
  "insights": [
    {
      "id": "uuid",
      "insight_type": "trend_analysis",
      "title": "Positive Mood Trend",
      "description": "Team mood has improved by 0.8 points over the past week",
      "severity": "info",
      "department": "Engineering",
      "data_points": {
        "weekly_averages": [4.2, 3.8, 3.5],
        "change": 0.8
      },
      "action_items": [
        "Continue current management practices",
        "Share positive feedback with team"
      ],
      "is_read": false,
      "is_dismissed": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Generate New Insights
```http
POST /api/ai/insights
```

**Body:**
```json
{
  "organizationId": "uuid"
}
```

## 📅 Schedule Management

### Get Schedules
```http
GET /api/schedules?organizationId={id}
```

### Create Schedule
```http
POST /api/schedules
```

**Body:**
```json
{
  "organizationId": "uuid",
  "name": "Weekly Team Check-in",
  "frequency": "weekly",
  "day_of_week": 1,
  "time_of_day": "09:00",
  "timezone": "America/New_York",
  "message_template": "Custom message template",
  "target_departments": ["Engineering", "Marketing"],
  "target_employees": ["uuid1", "uuid2"],
  "is_active": true
}
```

### Update Schedule
```http
PUT /api/schedules
```

### Delete Schedule
```http
DELETE /api/schedules?scheduleId={id}
```

## 👑 Super Admin APIs

### Platform Statistics
```http
GET /api/super-admin/stats?timeframe={timeframe}
```

**Parameters:**
- `timeframe`: `7d`, `30d`, `90d`, `1y`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalOrganizations": 150,
    "activeOrganizations": 142,
    "totalEmployees": 5420,
    "totalResponses": 12350,
    "monthlyRevenue": 21300,
    "avgResponseRate": 78,
    "growthData": [...],
    "subscriptionData": [...],
    "topOrganizations": [...],
    "moodTrends": [...]
  }
}
```

### Organizations Management
```http
GET /api/super-admin/organizations?search={query}&status={status}&limit={limit}&offset={offset}
POST /api/super-admin/organizations
PUT /api/super-admin/organizations
DELETE /api/super-admin/organizations?organizationId={id}
```

### System Health
```http
GET /api/super-admin/system-health?timeframe={timeframe}
POST /api/super-admin/system-health (Create Alert)
```

## 🔧 System Health

### Get System Metrics
```http
GET /api/super-admin/system-health
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "uptime": 99.9,
    "responseTime": 245,
    "errorRate": 0.1,
    "activeConnections": 1247,
    "databaseHealth": 98.5,
    "whatsappDeliveryRate": 97.8,
    "apiCallsToday": 15420,
    "storageUsed": 67.3
  },
  "serviceHealth": [
    {
      "name": "Database",
      "status": "healthy",
      "uptime": "99.9%",
      "lastCheck": "2024-01-15T10:30:00Z"
    }
  ],
  "performanceData": [...],
  "errorData": [...],
  "alerts": [...]
}
```

## ❌ Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

### Error Codes

- `INVALID_ORGANIZATION` - Organization not found or access denied
- `INVALID_EMPLOYEE` - Employee not found or inactive
- `DUPLICATE_PHONE` - Phone number already exists
- `INVALID_PHONE_FORMAT` - Phone number format invalid
- `TWILIO_ERROR` - WhatsApp/Twilio API error
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions

## 🔒 Rate Limiting

API endpoints are rate limited:

- **General APIs**: 100 requests per minute per user
- **WhatsApp APIs**: 10 requests per minute per organization
- **Super Admin APIs**: 200 requests per minute
- **Webhook**: 1000 requests per minute (for Twilio)

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

## 📊 Webhook Events

### WhatsApp Message Received
Triggered when an employee responds via WhatsApp:

```json
{
  "event": "whatsapp_message_received",
  "data": {
    "employee_id": "uuid",
    "organization_id": "uuid",
    "mood_score": 4,
    "comment": "Good day today!",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### AI Insight Generated
Triggered when new AI insights are created:

```json
{
  "event": "ai_insight_generated",
  "data": {
    "insight_id": "uuid",
    "organization_id": "uuid",
    "insight_type": "risk_detection",
    "severity": "warning",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## 🧪 Testing

### Test Endpoints

Use these endpoints for testing:

```http
GET /api/health - System health check
GET /api/test/auth - Test authentication
POST /api/test/whatsapp - Send test WhatsApp message
```

### Sample Data

The system includes sample data for testing:
- Test organizations with employees
- Mock mood check-in data
- Sample AI insights
- Test WhatsApp logs

---

**Need help?** Check the [deployment guide](NETLIFY_DEPLOYMENT.md) or [troubleshooting section](DEPLOYMENT_CHECKLIST.md).
