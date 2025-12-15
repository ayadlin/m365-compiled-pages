# M365 WebApps - Technical Reference Documentation

**🔒 ADMIN-ONLY DOCUMENT - Contains sensitive technical details**

> **Last Updated:** 2025-12-08
> **Version:** 1.2.0
> **Access Level:** Administrator Only

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Backend Implementation](#2-backend-implementation)
3. [Database Design](#3-database-design)
4. [API Reference](#4-api-reference)
5. [Authentication & Security](#5-authentication--security)
6. [Cryptographic System](#6-cryptographic-system)
7. [External Integrations](#7-external-integrations)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Code Organization](#9-code-organization)
10. [Development Guide](#10-development-guide)

---

## 1. System Architecture

### 1.1 High-Level Overview

M365 WebApps is a complete SaaS platform for distributing Microsoft Office applications on Linux with cryptographically-signed offline licensing.

**Architecture Diagram:**
```
┌─────────────────────────────────────────────────────────────┐
│                     Public Internet                          │
└───────────┬────────────────────────────────┬────────────────┘
            │                                │
    ┌───────▼───────┐                ┌──────▼──────┐
    │  Cloudflare   │                │   Stripe    │
    │  (ytech.tools)│                │  (Payments) │
    └───────┬───────┘                └──────┬──────┘
            │                                │
    ┌───────▼────────────────────────────────▼──────────┐
    │         Fly.io (api.ytech.tools)                  │
    │  ┌─────────────────────────────────────────────┐  │
    │  │   Go HTTP Server (Port 8080)                │  │
    │  │   - Admin Dashboard                         │  │
    │  │   - Customer Portal                         │  │
    │  │   - License API                             │  │
    │  │   - Webhook Handlers                        │  │
    │  └──────┬──────────────────────────────────────┘  │
    │         │                                          │
    │  ┌──────▼──────────┐      ┌──────────────┐       │
    │  │ SQLite Database │      │  /data/      │       │
    │  │ (licenses.db)   │      │  backups/    │       │
    │  └─────────────────┘      └──────────────┘       │
    └───────────────────────────────────────────────────┘
            │                                │
    ┌───────▼──────┐                ┌───────▼────────┐
    │   Resend     │                │   OneDrive     │
    │   (Email)    │                │   (Backups)    │
    └──────────────┘                └────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Language** | Go | 1.24.0 | Backend server, CLI tools |
| **Database** | SQLite3 | 3.x | Embedded database, single-file |
| **Cryptography** | Ed25519 | - | License signing & verification |
| **Encryption** | Age | v1.2.1 | Private key encryption |
| **Payments** | Stripe API | v79 | Subscriptions, billing portal |
| **Email** | Resend | - | Transactional emails |
| **Hosting** | Fly.io | - | Container platform |
| **Frontend** | Vanilla JS | - | No framework, lightweight |
| **Styling** | Custom CSS | - | Theme variables, responsive |

### 1.3 Directory Structure

```
m365-compiled/
├── cmd/                           # CLI tools and server
│   ├── m365-license-server/       # Main HTTP server (1,600+ lines)
│   ├── m365-grant-license/        # Manual license provisioning
│   ├── m365-sign/                 # Offline license signing
│   ├── m365-keygen/               # Ed25519 keypair generation
│   ├── m365-agedec/               # Age decryption utility
│   └── m365-revoke/               # Revocation list management
├── internal/                      # Private Go packages
│   ├── admin/                     # Admin dashboard backend
│   │   ├── auth.go                # Magic link authentication
│   │   ├── handlers.go            # API endpoints (1,000+ lines)
│   │   ├── dashboard.html         # Admin UI
│   │   └── static/                # CSS/JS assets
│   ├── customer/                  # Customer portal backend
│   │   ├── portal.go              # Self-service API
│   │   └── team.go                # Team management
│   ├── database/                  # Data access layer
│   │   ├── db.go                  # Database operations
│   │   └── schema.sql             # Table definitions
│   ├── email/                     # Email service
│   │   └── sender.go              # Resend integration
│   ├── licensegen/                # License generation
│   │   └── generator.go           # Ed25519 signing
│   ├── middleware/                # HTTP middleware
│   │   ├── ratelimit.go           # Per-IP rate limiting
│   │   └── csrf.go                # CSRF token validation
│   └── services/                  # External APIs
│       ├── backup.go              # Database backup system
│       ├── flyio.go               # Fly.io billing API
│       ├── cloudflare.go          # Cloudflare billing API
│       ├── resend.go              # Resend billing API
│       └── onedrive.go            # Microsoft Graph backup
├── site/                          # Frontend assets
│   ├── m365/                      # Public marketing site
│   │   ├── index.html             # Homepage
│   │   ├── pricing.html           # Pricing page
│   │   ├── docs.html              # User documentation
│   │   ├── trial.html             # Free trial signup
│   │   └── static/                # CSS/JS per page
│   ├── portal/                    # Customer portal
│   │   ├── index.html             # Login page
│   │   ├── dashboard.html         # License management
│   │   └── static/                # CSS/JS
│   ├── theme.css                  # Global theme (light/dark)
│   ├── ga.js                      # Google Analytics
│   └── brand.json                 # Branding config
├── keys/                          # Cryptographic keys
│   ├── m365.pub.pem               # Public key (embedded in apps)
│   └── m365.priv.pem.age          # Private key (Age encrypted)
├── templates/                     # License templates
├── packaging/                     # Distribution packages
│   ├── deb/                       # Debian package
│   └── flatpak/                   # Flatpak manifest
├── scripts/                       # Maintenance scripts
├── .github/workflows/             # CI/CD automation
├── fly.toml                       # Fly.io deployment config
├── Dockerfile.server              # Container image
├── go.mod                         # Go dependencies
└── docs/                          # Documentation (this file)
```

### 1.4 Key Components

**Server (cmd/m365-license-server/main.go):**
- HTTP server listening on port 8080
- Routes 50+ API endpoints
- Integrates all internal packages
- Runs background automation (backups, tax reports)

**Database (internal/database/):**
- SQLite3 file-based database
- 10 tables: customers, licenses, transactions, expenses, teams, audit logs, etc.
- Foreign key constraints enabled
- Indexed for performance

**License Generator (internal/licensegen/):**
- Ed25519 private key signing
- JSON license data structure
- Offline verification (no server needed)

**Admin Dashboard (internal/admin/):**
- Magic link authentication
- CRUD operations on licenses
- Expense tracking with API imports
- Backup management
- Audit logging

**Customer Portal (internal/customer/):**
- Self-service license downloads
- Stripe billing portal integration
- Team member management (Team/Enterprise plans)

---

## 2. Backend Implementation

### 2.1 Main Server Entry Point

**File:** `cmd/m365-license-server/main.go`

**Server Struct:**
```go
type Server struct {
    db                  *database.DB
    generator           *licensegen.Generator
    emailer             *email.Sender
    stripeKey           string
    stripeWebhookSecret string
}
```

**Initialization Flow:**
1. Load environment variables
2. Connect to SQLite database (`DATABASE_PATH`)
3. Run schema migrations (if needed)
4. Decrypt and load Ed25519 private key (`PRIVATE_KEY_HEX`)
5. Initialize license generator
6. Initialize email sender (Resend API)
7. Start background scheduler (backups, automation)
8. Register HTTP routes
9. Apply middleware (rate limiting, CSRF)
10. Start HTTP server on port 8080

### 2.2 Environment Variables

**Required:**
```bash
DATABASE_PATH=/data/licenses.db        # SQLite database file
PRIVATE_KEY_HEX=<hex>                  # Ed25519 private key (64 bytes hex)
RESEND_API_KEY=<key>                   # Email service API key
STRIPE_SECRET_KEY=<key>                # Stripe secret key
STRIPE_WEBHOOK_SECRET=<secret>         # Webhook signature validation
ADMIN_EMAILS=admin@example.com         # Comma-separated admin list
```

**Optional:**
```bash
PORT=8080                              # HTTP listen port (default: 8080)
BACKUP_DIR=/data/backups               # Backup directory (default: /data/backups)
BACKUP_RETENTION_DAYS=30               # Days to keep backups (default: 30)
FLY_API_TOKEN=<token>                  # Fly.io GraphQL API token
CLOUDFLARE_API_TOKEN=<token>           # Cloudflare REST API token
CLOUDFLARE_ACCOUNT_ID=<id>             # Cloudflare account ID
ONEDRIVE_TENANT_ID=<id>                # Microsoft tenant ID
ONEDRIVE_CLIENT_ID=<id>                # Azure app registration ID
ONEDRIVE_CLIENT_SECRET=<secret>        # App secret
ONEDRIVE_REFRESH_TOKEN=<token>         # Long-lived OAuth refresh token
ONEDRIVE_USER_ID=<id>                  # OneDrive user ID or UPN
```

### 2.3 HTTP Routes

**Public Endpoints (Rate: 30 req/min):**
```go
http.HandleFunc("/health", server.handleHealth)                           // Health check
http.HandleFunc("/api/trial", publicAPILimiter.Limit(server.handleTrial)) // Free trial
http.HandleFunc("/api/webhook/stripe", server.handleStripeWebhook)        // Stripe webhooks (no rate limit)
http.HandleFunc("/api/licenses/", publicAPILimiter.Limit(server.handleGetLicenses)) // Retrieve licenses
http.HandleFunc("/api/create-portal-session", publicAPILimiter.Limit(server.handleCreatePortalSession)) // Billing portal
```

**Admin Routes (Rate: 100 req/min, CSRF protected):**
```go
// Authentication
http.HandleFunc("/admin/", serveAdminLogin)                               // Login page
http.HandleFunc("/admin/dashboard", serveAdminDashboard)                  // Dashboard page
http.HandleFunc("/admin/static/", serveAdminStatic)                       // Static assets
http.HandleFunc("/api/admin/request-login", loginLimiter.Limit(adminServer.HandleRequestLogin))
http.HandleFunc("/api/admin/login", loginLimiter.Limit(adminServer.HandleLogin))
http.HandleFunc("/api/admin/logout", adminAPILimiter.Limit(adminServer.RequireAuth(csrfProtector.Protect(adminServer.HandleLogout))))

// Dashboard
http.HandleFunc("/api/admin/stats", adminAPILimiter.Limit(adminServer.RequireAuth(adminServer.HandleGetStats)))
http.HandleFunc("/api/admin/analytics", adminAPILimiter.Limit(adminServer.RequireAuth(adminServer.HandleGetAnalytics)))

// License Management
http.HandleFunc("/api/admin/licenses", adminAPILimiter.Limit(adminServer.RequireAuth(adminServer.HandleGetLicenses)))
http.HandleFunc("/api/admin/licenses/create", adminAPILimiter.Limit(adminServer.RequireAuth(csrfProtector.Protect(adminServer.HandleCreateLicense))))
http.HandleFunc("/api/admin/licenses/revoke", adminAPILimiter.Limit(adminServer.RequireAuth(csrfProtector.Protect(adminServer.HandleRevokeLicense))))
http.HandleFunc("/api/admin/licenses/delete", adminAPILimiter.Limit(adminServer.RequireAuth(csrfProtector.Protect(adminServer.HandleDeleteLicense))))
// ... 30+ more admin endpoints
```

**Customer Portal Routes (Rate: 30 req/min):**
```go
http.HandleFunc("/portal/", servePortalLogin)                             // Portal login
http.HandleFunc("/portal/dashboard", customerPortal.RequireAuth(servePortalDashboard))
http.HandleFunc("/api/portal/request-access", loginLimiter.Limit(customerPortal.HandleRequestAccess))
http.HandleFunc("/api/portal/login", customerPortal.HandleLogin)
http.HandleFunc("/api/portal/license-info", publicAPILimiter.Limit(customerPortal.HandleGetLicenseInfo))
// ... team management endpoints
```

### 2.4 Middleware Chain

**Middleware Applied:**
1. **Rate Limiting** - Per-IP token bucket
2. **Authentication** - Token validation
3. **CSRF Protection** - Token-based for mutations
4. **Security Headers** - CORS, CSP
5. **Logging** - Request/response logging

**Example Middleware Stack:**
```go
http.HandleFunc("/api/admin/licenses/revoke",
    adminAPILimiter.Limit(                    // 100 req/min
        adminServer.RequireAuth(              // Validate session token
            csrfProtector.Protect(            // Validate CSRF token
                adminServer.HandleRevokeLicense // Execute handler
            )
        )
    )
)
```

### 2.5 Background Automation

**Scheduler Implementation:**
```go
// Runs in goroutine
func runDailyAutomation(db *database.DB, emailer *email.Sender) {
    ticker := time.NewTicker(24 * time.Hour)
    for range ticker.C {
        now := time.Now()

        // Daily 2 AM: Database backup
        if now.Hour() == 2 {
            CreateBackup(db)
            CleanOldBackups()
        }

        // 1st of month: Generate recurring expenses
        if now.Day() == 1 {
            GenerateRecurringExpenses(db)
        }

        // January 10th: Annual tax report
        if now.Month() == time.January && now.Day() == 10 {
            GenerateAndEmailTaxReport(db, emailer)
        }

        // 25th & 30th: Expense reminders
        if now.Day() == 25 || now.Day() == 30 {
            SendExpenseReminder(emailer)
        }
    }
}
```

---

## 3. Database Design

### 3.1 Schema Overview

**File:** `internal/database/schema.sql`

**Tables:**
1. `customers` - Customer accounts
2. `licenses` - License records
3. `transactions` - Payment history
4. `expenses` - Cost tracking
5. `teams` - Team/Enterprise groups
6. `team_members` - Team membership
7. `admin_sessions` - Authentication tokens
8. `audit_logs` - Compliance logging
9. `portal_sessions` - Customer portal tokens
10. Views: `active_licenses`

### 3.2 Core Tables

#### customers
```sql
CREATE TABLE customers (
    email TEXT PRIMARY KEY,              -- Unique identifier
    name TEXT NOT NULL,                  -- Full name
    phone TEXT,                          -- Optional contact
    company TEXT,                        -- Optional company
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_customers_created ON customers(created_at);
```

**Purpose:** Store customer account information
**Primary Key:** Email address
**Relationships:** Referenced by `licenses.email`

#### licenses
```sql
CREATE TABLE licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,                 -- FK to customers
    plan TEXT NOT NULL,                  -- free, pro, team, enterprise
    license_json TEXT NOT NULL,          -- JSON license data
    signature TEXT NOT NULL,             -- Ed25519 hex signature
    issued_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    stripe_payment_id TEXT,              -- Link to transaction
    stripe_subscription_id TEXT,         -- Recurring billing ID
    status TEXT DEFAULT 'active',        -- active, expired, revoked
    devices_allowed INTEGER DEFAULT 1,   -- License seats
    FOREIGN KEY (email) REFERENCES customers(email)
);
CREATE INDEX idx_licenses_email ON licenses(email);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_expires ON licenses(expires_at);
```

**Purpose:** Store license records and cryptographic signatures
**Primary Key:** Auto-increment ID
**Status Values:**
- `active` - Valid, not expired, not revoked
- `expired` - Past expiration date (checked client-side)
- `revoked` - Admin revoked (checked via registry)

#### transactions
```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stripe_payment_id TEXT UNIQUE NOT NULL,
    stripe_subscription_id TEXT,
    email TEXT NOT NULL,
    amount INTEGER NOT NULL,            -- Cents (USD)
    currency TEXT DEFAULT 'usd',
    plan TEXT NOT NULL,
    status TEXT NOT NULL,               -- succeeded, pending, failed, refunded
    timestamp TIMESTAMP NOT NULL,
    metadata TEXT                       -- JSON extra data
);
CREATE INDEX idx_transactions_email ON transactions(email);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);
```

**Purpose:** Payment history for revenue tracking
**Primary Key:** Auto-increment ID
**Unique Constraint:** `stripe_payment_id` (prevents duplicate charges)

#### expenses
```sql
CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,             -- hosting, email, dns, payment-processing, etc.
    vendor TEXT NOT NULL,               -- fly.io, resend, cloudflare, stripe, manual
    amount INTEGER NOT NULL,            -- Cents (USD)
    currency TEXT DEFAULT 'usd',
    description TEXT NOT NULL,
    date DATE NOT NULL,                 -- Billing period (YYYY-MM-DD)
    source TEXT DEFAULT 'manual',       -- api, manual
    external_id TEXT,                   -- Deduplication key
    is_recurring BOOLEAN DEFAULT 0,     -- Recurring expense flag
    recurrence_period TEXT,             -- monthly, quarterly, annual
    recurrence_day INTEGER,             -- Day of month for recurrence
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor, external_id)         -- Prevent duplicate imports
);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
```

**Purpose:** Track operational costs for tax reporting
**Deduplication:** `UNIQUE(vendor, external_id)` prevents re-importing same expense

#### teams & team_members
```sql
CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    plan TEXT NOT NULL,                 -- team, enterprise
    primary_admin_email TEXT NOT NULL,
    license_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (license_id) REFERENCES licenses(id)
);

CREATE TABLE team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,                 -- admin, member
    added_by TEXT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    permissions TEXT,                   -- JSON fine-grained permissions
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE(team_id, email)              -- One membership per team
);
```

**Purpose:** Team license management for Team/Enterprise plans
**Team Limits:**
- Team plan: 10 members
- Enterprise plan: Unlimited

#### admin_sessions
```sql
CREATE TABLE admin_sessions (
    token TEXT PRIMARY KEY,             -- 64-char hex token
    email TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,      -- 24-hour expiration
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);
```

**Purpose:** Magic link authentication tokens
**Expiration:** Automatically cleaned up after 24 hours

#### audit_logs
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,               -- create_license, revoke_license, etc.
    resource_type TEXT NOT NULL,        -- license, customer, expense
    resource_id TEXT,                   -- ID of affected resource
    details TEXT,                       -- JSON additional context
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_email);
```

**Purpose:** Compliance and security auditing
**Retention:** Indefinite (for regulatory compliance)

### 3.3 Views

#### active_licenses
```sql
CREATE VIEW active_licenses AS
SELECT
    l.id,
    l.email,
    l.plan,
    l.issued_at,
    l.expires_at,
    l.status,
    l.devices_allowed,
    c.name,
    c.company
FROM licenses l
JOIN customers c ON l.email = c.email
WHERE l.status != 'revoked'
  AND l.expires_at > datetime('now');
```

**Purpose:** Quick query for valid licenses
**Use Case:** Dashboard statistics, license listings

### 3.4 Database Operations

**File:** `internal/database/db.go`

**Key Functions:**
```go
// Customer operations
func (db *DB) CreateCustomer(customer *Customer) error
func (db *DB) GetCustomer(email string) (*Customer, error)
func (db *DB) ListCustomers(limit, offset int) ([]*Customer, error)

// License operations
func (db *DB) CreateLicense(license *License) error
func (db *DB) GetLicense(id int) (*License, error)
func (db *DB) GetLicensesByEmail(email string) ([]*License, error)
func (db *DB) RevokeLicense(id int) error
func (db *DB) DeleteLicense(id int) error
func (db *DB) ListLicenses(filters map[string]interface{}, limit, offset int) ([]*License, error)

// Transaction operations
func (db *DB) CreateTransaction(tx *Transaction) error
func (db *DB) GetTransactionsByEmail(email string) ([]*Transaction, error)
func (db *DB) ListTransactions(limit, offset int) ([]*Transaction, error)

// Expense operations
func (db *DB) CreateExpense(expense *Expense) error
func (db *DB) GetExpense(id int) (*Expense, error)
func (db *DB) UpdateExpense(expense *Expense) error
func (db *DB) DeleteExpense(id int) error
func (db *DB) ListExpensesByMonth(year int, month time.Month) ([]*Expense, error)

// Session operations
func (db *DB) CreateAdminSession(token, email string, expires time.Time) error
func (db *DB) ValidateAdminSession(token string) (*AdminSession, error)
func (db *DB) DeleteAdminSession(token string) error
func (db *DB) CleanExpiredSessions() error

// Audit logging
func (db *DB) LogAudit(log *AuditLog) error
func (db *DB) GetAuditLogs(filters map[string]interface{}, limit, offset int) ([]*AuditLog, error)
```

---

## 4. API Reference

### 4.1 Public API Endpoints

#### POST /api/trial
**Generate free trial license**

**Rate Limit:** 30 req/min per IP

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Free trial license has been sent to your email",
  "expires_in_days": 30
}
```

**Errors:**
- `400` - Invalid email format
- `429` - Rate limit exceeded
- `500` - License generation failed

**Side Effects:**
- Creates customer record (if new)
- Generates license (30-day free trial)
- Sends email with license files

---

#### POST /api/webhook/stripe
**Stripe webhook handler**

**Authentication:** Stripe signature validation

**Supported Events:**
- `payment_intent.succeeded` - Payment completed
- `charge.refunded` - Refund issued

**Response:** `200 OK` (acknowledges receipt)

**Side Effects:**
- Creates transaction record
- Generates and emails license
- Creates audit log entry

---

#### GET /api/licenses/{email}
**Retrieve customer licenses**

**Rate Limit:** 30 req/min per IP

**Response (200 OK):**
```json
{
  "licenses": [
    {
      "id": 123,
      "plan": "pro",
      "issued_at": "2024-01-15T10:30:00Z",
      "expires_at": "2025-01-15T10:30:00Z",
      "status": "active",
      "devices_allowed": 1
    }
  ]
}
```

---

#### POST /api/create-portal-session
**Create Stripe billing portal session**

**Rate Limit:** 30 req/min per IP

**Request:**
```json
{
  "search": "user@example.com",
  "return_url": "https://ytech.tools/m365/pricing.html"
}
```

**Response (200 OK):**
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

**Response (200 OK - Free User):**
```json
{
  "is_free_user": "true",
  "message": "You have a free trial. Upgrade to a paid plan to access billing."
}
```

---

### 4.2 Admin API Endpoints

**Authentication:** Bearer token in `Authorization` header or `admin_token` cookie
**CSRF Protection:** `X-CSRF-Token` header required for mutations

#### POST /api/admin/request-login
**Request admin magic link**

**Rate Limit:** 5 req/15min per IP

**Request:**
```json
{
  "email": "admin@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login link sent to your email"
}
```

**Errors:**
- `403` - Email not in ADMIN_EMAILS list
- `429` - Rate limit exceeded

---

#### POST /api/admin/login
**Complete magic link authentication**

**Request:**
```json
{
  "token": "64-char-hex-string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "email": "admin@example.com"
}
```

**Side Effects:**
- Sets `admin_token` cookie (24-hour expiration)
- Updates `last_accessed` timestamp

---

#### GET /api/admin/stats
**Dashboard statistics**

**Authentication:** Required

**Response (200 OK):**
```json
{
  "total_licenses": 150,
  "active_licenses": 120,
  "total_customers": 140,
  "total_revenue": 450000
}
```

---

#### GET /api/admin/licenses
**List licenses (paginated)**

**Authentication:** Required

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50, max: 100)
- `search` - Filter by email/company/plan

**Response (200 OK):**
```json
{
  "licenses": [...],
  "total": 150,
  "page": 1,
  "limit": 50
}
```

---

#### POST /api/admin/licenses/create
**Manually create license**

**Authentication:** Required
**CSRF:** Required

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "plan": "pro",
  "days": 365,
  "devices": 1,
  "reason": "Beta tester"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "license_id": 123
}
```

**Side Effects:**
- Creates customer (if new)
- Generates signed license
- Sends email with license files
- Logs audit entry

---

#### POST /api/admin/licenses/revoke
**Revoke license**

**Authentication:** Required
**CSRF:** Required

**Request:**
```json
{
  "license_id": 123
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Side Effects:**
- Updates `status` to "revoked"
- Desktop apps will fail validation
- Logs audit entry

---

#### DELETE /api/admin/licenses/delete
**Permanently delete license**

**Authentication:** Required
**CSRF:** Required

**Request:**
```json
{
  "license_id": 123
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Warning:** Unrecoverable operation

---

### 4.3 Customer Portal API Endpoints

#### POST /api/portal/request-access
**Request customer portal magic link**

**Rate Limit:** 5 req/15min per IP

**Request:**
```json
{
  "email": "customer@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Access link sent to your email"
}
```

---

#### POST /api/portal/login
**Authenticate via magic link token**

**Query Parameter:** `token=<64-char-hex>`

**Response:** Redirect to `/portal/dashboard` with session cookie

---

#### GET /api/portal/license-info
**Get customer license details**

**Authentication:** Required (portal session)

**Response (200 OK):**
```json
{
  "license": {
    "plan": "pro",
    "expires_at": "2025-01-15T10:30:00Z",
    "devices_allowed": 1,
    "features": {...}
  }
}
```

---

#### GET /api/portal/download-license
**Download license files**

**Authentication:** Required

**Query Parameters:**
- `license_id` - License ID
- `type` - `json` or `sig`

**Response:** File download (application/octet-stream)

---

#### GET /api/portal/team/info
**Get team details (Team/Enterprise only)**

**Authentication:** Required

**Response (200 OK):**
```json
{
  "team_id": 5,
  "company_name": "Acme Corp",
  "plan": "team",
  "primary_admin": "admin@acme.com",
  "is_admin": true,
  "members": [
    {
      "email": "member@acme.com",
      "role": "member",
      "added_at": "2024-01-10T08:00:00Z",
      "last_login": "2024-01-20T14:30:00Z"
    }
  ]
}
```

---

#### POST /api/portal/team/member/add
**Add team member**

**Authentication:** Required (admin role)
**CSRF:** Required

**Request:**
```json
{
  "email": "newmember@acme.com",
  "role": "member"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "member_id": 42
}
```

**Validation:**
- Team plan: Max 10 members
- Enterprise: Unlimited

---

## 5. Authentication & Security

### 5.1 Magic Link Authentication

**Process:**
1. User enters email on login page
2. Server validates email (admin list or customer check)
3. Generate 64-character random hex token
4. Store in database with 24-hour expiration
5. Send email with login URL containing token
6. User clicks link, token validates, session created

**Token Generation:**
```go
func generateToken() (string, error) {
    bytes := make([]byte, 32) // 256 bits
    if _, err := rand.Read(bytes); err != nil {
        return "", err
    }
    return hex.EncodeToString(bytes), nil // 64 chars
}
```

**Advantages:**
- No password storage (eliminates credential theft risk)
- Phishing-resistant (token single-use, time-limited)
- Simple UX (no password resets)

### 5.2 Session Management

**File:** `internal/admin/auth.go`, `internal/customer/portal.go`

**Architecture:** Database-backed sessions with sliding window timeout

**Admin Sessions:**
- **Storage:** `admin_sessions` table in SQLite
- **TTL:** 24 hours from creation
- **Inactivity Timeout:** 1-hour sliding window (auto-extends on activity)
- **Token Format:** 64-character hex string (32 random bytes)
- **Delivery:** Cookie (`admin_token`, HttpOnly, Secure, SameSite=Lax)
- **Cleanup:** Automatic hourly cleanup of expired sessions

**Customer Portal Sessions:**
- **Storage:** `customer_sessions` table in SQLite
- **TTL:** 7 days from creation
- **Inactivity Timeout:** 1-hour sliding window (auto-extends on activity)
- **Token Format:** 64-character hex string (32 random bytes)
- **Delivery:** Cookie (`customer_token`, HttpOnly, Secure, SameSite=Lax)
- **Cleanup:** Automatic hourly cleanup of expired sessions

**Session Creation:**
```go
// Generate 64-character random hex token
bytes := make([]byte, 32)
if _, err := rand.Read(bytes); err != nil {
    return "", err
}
token := hex.EncodeToString(bytes)

// Store in database
expiresAt := time.Now().Add(24 * time.Hour)
if err := am.db.CreateSession(token, email, expiresAt); err != nil {
    return "", fmt.Errorf("create session: %w", err)
}
```

**Session Validation:**
```go
func (am *AuthManager) ValidateToken(token string) (*Session, error) {
    dbSession, err := am.db.GetSession(token)
    if err != nil {
        return nil, fmt.Errorf("get session: %w", err)
    }

    if dbSession == nil {
        return nil, fmt.Errorf("invalid or expired token")
    }

    return &Session{
        Email:     dbSession.Email,
        Token:     dbSession.Token,
        ExpiresAt: dbSession.ExpiresAt,
    }, nil
}
```

**Periodic Cleanup:**
```go
func (am *AuthManager) periodicCleanup() {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    for range ticker.C {
        if err := am.db.CleanExpiredSessions(); err != nil {
            fmt.Printf("Failed to clean expired sessions: %v\n", err)
        }
    }
}
```

**Benefits of Database-Backed Sessions:**
- Sessions persist across server restarts
- Centralized session management (revoke from any instance)
- Audit trail for security compliance
- Easy cleanup of expired sessions via SQL queries

### 5.3 Rate Limiting

**File:** `internal/middleware/ratelimit.go` (115 lines)

**Algorithm:** Token bucket with sliding window reset

**Implementation:**
```go
type RateLimiter struct {
    visitors map[string]*visitor
    mu       sync.RWMutex
    rate     int           // requests allowed
    window   time.Duration // time window
}

type visitor struct {
    count     int
    lastReset time.Time
    mu        sync.Mutex
}

func NewRateLimiter(rate int, window time.Duration) *RateLimiter {
    rl := &RateLimiter{
        visitors: make(map[string]*visitor),
        rate:     rate,
        window:   window,
    }

    // Cleanup old visitors every 5 minutes
    go rl.cleanup()

    return rl
}

func (rl *RateLimiter) allow(ip string) bool {
    rl.mu.Lock()
    v, exists := rl.visitors[ip]
    if !exists {
        v = &visitor{
            count:     0,
            lastReset: time.Now(),
        }
        rl.visitors[ip] = v
    }
    rl.mu.Unlock()

    v.mu.Lock()
    defer v.mu.Unlock()

    // Reset counter if window has passed
    if time.Since(v.lastReset) > rl.window {
        v.count = 0
        v.lastReset = time.Now()
    }

    // Check if limit exceeded
    if v.count >= rl.rate {
        return false
    }

    v.count++
    return true
}
```

**IP Extraction (Proxy-Aware):**
```go
func getIP(r *http.Request) string {
    // Check X-Forwarded-For header (for proxies/load balancers)
    if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
        return xff
    }

    // Check X-Real-IP header
    if xri := r.Header.Get("X-Real-IP"); xri != "" {
        return xri
    }

    // Use RemoteAddr as fallback
    return r.RemoteAddr
}
```

**Automatic Cleanup:**
```go
func (rl *RateLimiter) cleanup() {
    ticker := time.NewTicker(5 * time.Minute)
    defer ticker.Stop()

    for range ticker.C {
        rl.mu.Lock()
        for ip, v := range rl.visitors {
            v.mu.Lock()
            if time.Since(v.lastReset) > rl.window*2 {
                delete(rl.visitors, ip)
            }
            v.mu.Unlock()
        }
        rl.mu.Unlock()
    }
}
```

**Rate Limits by Endpoint:**
- **Admin login:** 5 requests / 1 hour (prevents brute force)
- **Admin API:** 100 requests / minute
- **Public API:** 30 requests / minute
- **Webhooks:** No limit (Stripe signature verified)

**Benefits:**
- Per-IP tracking prevents single-source abuse
- Sliding window resets for fairness
- Automatic cleanup prevents memory leaks
- Proxy/load balancer support (X-Forwarded-For)
- Thread-safe with RWMutex for high concurrency

### 5.4 CSRF Protection

**File:** `internal/middleware/csrf.go` (124 lines)

**Architecture:** Session-bound tokens with 1-hour expiration

**Data Structures:**
```go
type CSRFProtector struct {
    tokens map[string]*csrfToken
    mu     sync.RWMutex
}

type csrfToken struct {
    value     string
    createdAt time.Time
}
```

**Token Generation:**
```go
func (cp *CSRFProtector) GenerateToken(sessionToken string) (string, error) {
    bytes := make([]byte, 32)
    if _, err := rand.Read(bytes); err != nil {
        return "", err
    }
    tokenValue := hex.EncodeToString(bytes)

    cp.mu.Lock()
    defer cp.mu.Unlock()

    cp.tokens[sessionToken] = &csrfToken{
        value:     tokenValue,
        createdAt: time.Now(),
    }

    return tokenValue, nil
}
```

**Token Validation:**
```go
func (cp *CSRFProtector) ValidateToken(sessionToken, csrfToken string) bool {
    cp.mu.RLock()
    defer cp.mu.RUnlock()

    token, exists := cp.tokens[sessionToken]
    if !exists {
        return false
    }

    // Check if token is expired (1 hour)
    if time.Since(token.createdAt) > 1*time.Hour {
        return false
    }

    return token.value == csrfToken
}
```

**Middleware Protection:**
```go
func (cp *CSRFProtector) Protect(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Only check CSRF for state-changing methods
        if r.Method == "POST" || r.Method == "PUT" || r.Method == "DELETE" || r.Method == "PATCH" {
            // Get session token from cookie
            cookie, err := r.Cookie("admin_token")
            if err != nil {
                http.Error(w, "Unauthorized", http.StatusUnauthorized)
                return
            }

            // Get CSRF token from header
            csrfToken := r.Header.Get("X-CSRF-Token")
            if csrfToken == "" {
                http.Error(w, "CSRF token missing", http.StatusForbidden)
                return
            }

            // Validate CSRF token
            if !cp.ValidateToken(cookie.Value, csrfToken) {
                http.Error(w, "Invalid CSRF token", http.StatusForbidden)
                return
            }
        }

        next(w, r)
    }
}
```

**Automatic Cleanup:**
```go
func (cp *CSRFProtector) cleanup() {
    ticker := time.NewTicker(10 * time.Minute)
    defer ticker.Stop()

    for range ticker.C {
        cp.mu.Lock()
        now := time.Now()
        for sessionToken, token := range cp.tokens {
            if now.Sub(token.createdAt) > 1*time.Hour {
                delete(cp.tokens, sessionToken)
            }
        }
        cp.mu.Unlock()
    }
}
```

**Protected Operations:**
- All `POST`, `PUT`, `DELETE`, `PATCH` admin endpoints
- License creation/revocation/deletion
- Expense operations (create/update/delete)
- Transaction management
- Team member operations
- Customer portal actions

**Token Delivery:**
- Generated on successful login
- Sent in response headers: `X-CSRF-Token: <64-char-hex>`
- Must be included in `X-CSRF-Token` request header for state-changing requests
- Bound to session token (prevents token reuse across sessions)

**Security Features:**
- **Session-bound:** Token only valid for specific session
- **Time-limited:** 1-hour expiration (auto-refresh on page load)
- **State-changing only:** GET/HEAD requests exempt
- **Automatic cleanup:** Expired tokens removed every 10 minutes
- **Thread-safe:** RWMutex for concurrent access

### 5.5 Security Headers

**Applied Headers:**
```go
func securityHeaders(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
        w.Header().Set("X-Content-Type-Options", "nosniff")
        w.Header().Set("X-Frame-Options", "DENY")
        w.Header().Set("Content-Security-Policy", "default-src 'self'")
        next.ServeHTTP(w, r)
    })
}
```

### 5.6 Audit Logging

**Logged Events:**
- License creation/revocation/deletion/changes
- Admin login/logout
- Expense creation/updates/deletions
- Backup operations
- CSRF token refresh

**Audit Entry:**
```go
type AuditLog struct {
    AdminEmail   string
    Action       string    // create_license, revoke_license, etc.
    ResourceType string    // license, customer, expense
    ResourceID   string
    Details      string    // JSON
    IPAddress    string
    UserAgent    string
    Timestamp    time.Time
}
```

**Retention:** Indefinite (for compliance)

### 5.7 Single-Session Enforcement

**File:** `internal/admin/auth.go`, `internal/customer/portal.go`

**Commit:** 242f896 (2024-11-03)

**Security Policy:** Only one active session allowed per user at a time

**Implementation:**

When a user logs in, all existing sessions for that user are automatically revoked before creating the new session. This ensures that only the most recent login remains valid.

**Admin Session Revocation:**
```go
func (am *AuthManager) RevokeAllUserSessions(email string) error {
    return am.db.DeleteUserSessions(email)
}

// Called during login flow (in handlers.go)
func handleAdminLogin(email string) {
    // Revoke all existing sessions for this user
    if err := am.RevokeAllUserSessions(email); err != nil {
        log.Printf("Warning: Failed to revoke old sessions: %v", err)
        // Continue with login (graceful degradation)
    }

    // Create new session
    token, err := am.GenerateToken(email)
    // ...
}
```

**Customer Portal Session Revocation:**
```go
// Called during customer portal login (in portal.go)
func handleCustomerLogin(email string) {
    // Revoke all existing customer sessions
    if err := db.DeleteCustomerSessions(email); err != nil {
        log.Printf("Warning: Failed to revoke old sessions: %v", err)
        // Continue with login
    }

    // Create new session
    token, err := generateCustomerToken(email)
    // ...
}
```

**Session Lifecycle:**

1. **User logs in:** All old sessions deleted → New session created
2. **User uses session:** Session validated, last_accessed updated
3. **User logs in again:** All sessions deleted (including current) → New session created
4. **Old sessions:** Immediately invalidated, cannot be reused
5. **Explicit logout:** Session deleted, cookie cleared (MaxAge: -1)
6. **Auto-expiration:** Sessions deleted by periodic cleanup after TTL

**Security Benefits:**

- **Prevents session hijacking:** Old/leaked tokens immediately invalidated on new login
- **Forces logout on all devices:** User must re-authenticate on all devices after logging in elsewhere
- **Reduces attack surface:** Limits exposure time for compromised credentials
- **Audit trail:** All session revocations logged for security monitoring
- **Graceful degradation:** Login succeeds even if session cleanup fails (logged as warning)

**Database Queries:**

```sql
-- Delete all admin sessions for a user
DELETE FROM admin_sessions WHERE email = ?;

-- Delete all customer sessions for a user
DELETE FROM customer_sessions WHERE email = ?;
```

**Use Cases:**

1. **Suspicious activity detected:** Admin can force re-authentication by triggering new login
2. **Device lost/stolen:** User logs in from new device, old device's session immediately invalidated
3. **Shared credentials:** Only most recent login remains valid (encourages unique credentials)
4. **Security audit:** Single active session per user simplifies audit trail

**Comparison with Multi-Session Support:**

| Feature | Single-Session (Current) | Multi-Session (Alternative) |
|---------|-------------------------|---------------------------|
| Security | ✅ Higher (limits exposure) | ⚠️ Lower (more attack surface) |
| UX | ⚠️ Logout on device switch | ✅ Stay logged in everywhere |
| Audit | ✅ Simple (1 session/user) | ⚠️ Complex (track N sessions) |
| Compromise Recovery | ✅ Instant (one logout) | ⚠️ Requires revoking all tokens |
| Use Case | Admin/sensitive operations | Consumer apps (email, social) |

**Rationale:**

Single-session enforcement is appropriate for this application because:
- **Admin operations** require high security (license management, financial data)
- **Customer portal** handles sensitive license keys and billing information
- **Simplifies security model:** One session per user is easier to reason about
- **Industry standard:** Banking, healthcare, and enterprise SaaS use similar policies

---

## 6. Cryptographic System

### 6.1 Ed25519 Digital Signatures

**Algorithm:** Ed25519 (RFC 8032)
**Key Size:** 256 bits (32 bytes)
**Signature Size:** 512 bits (64 bytes)
**Security Level:** 128-bit (equivalent to RSA-3072)

**Advantages:**
- Fast signing and verification
- Deterministic signatures (no random nonce)
- Small keys and signatures
- Resistant to side-channel attacks

### 6.2 Key Generation

**File:** `cmd/m365-keygen/main.go`

**Process:**
```go
// Generate Ed25519 keypair
pubKey, privKey, _ := ed25519.GenerateKey(rand.Reader)

// PEM encode public key
pubPEM := pem.EncodeToMemory(&pem.Block{
    Type:  "PUBLIC KEY",
    Bytes: pubKey,
})

// PEM encode private key
privPEM := pem.EncodeToMemory(&pem.Block{
    Type:  "PRIVATE KEY",
    Bytes: privKey,
})

// Encrypt private key with Age
encrypted := ageEncrypt(privPEM, passphrase)

// Save files
os.WriteFile("m365.pub.pem", pubPEM, 0644)
os.WriteFile("m365.priv.pem.age", encrypted, 0600)
```

**Files:**
- `keys/m365.pub.pem` - Public key (embedded in desktop apps)
- `keys/m365.priv.pem.age` - Private key (Age encrypted, stored securely)

### 6.3 License Signing

**File:** `internal/licensegen/generator.go`

**License Data Structure:**
```go
type LicenseData struct {
    Email    string         `json:"email"`
    Plan     string         `json:"plan"`       // free, pro, team, enterprise
    Exp      string         `json:"exp"`        // YYYY-MM-DD
    Seats    int            `json:"seats"`      // 1, 10, -1 (unlimited)
    RegURL   string         `json:"registry_url"`
    Features map[string]any `json:"features"`
    Notes    string         `json:"notes,omitempty"`
}
```

**Signing Process:**
```go
func (g *Generator) SignLicense(data *LicenseData) (json, sig string, err error) {
    // Marshal to JSON (standard indentation)
    jsonBytes, _ := json.MarshalIndent(data, "", "  ")

    // Sign with Ed25519 private key
    signature := ed25519.Sign(g.privateKey, jsonBytes)

    // Return JSON and hex signature
    return string(jsonBytes), hex.EncodeToString(signature), nil
}
```

**Output:**
- `license.json` - Plain JSON license data
- `license.sig` - Hex-encoded Ed25519 signature (128 chars)

### 6.4 License Verification (Desktop)

**File:** `cmd/m365-pro/main.go` (desktop application)

**Verification Process:**
```go
// Load embedded public key
pubKeyPEM := []byte(PUBLIC_KEY_EMBEDDED)
pubKey := parsePublicKey(pubKeyPEM)

// Read license files
licenseJSON, _ := os.ReadFile("~/.config/m365_webapps/license.json")
signatureHex, _ := os.ReadFile("~/.config/m365_webapps/license.sig")

// Decode hex signature
signature, _ := hex.DecodeString(string(signatureHex))

// Verify signature
if !ed25519.Verify(pubKey, licenseJSON, signature) {
    return errors.New("invalid license signature")
}

// Parse and validate expiration
var license LicenseData
json.Unmarshal(licenseJSON, &license)

expDate, _ := time.Parse("2006-01-02", license.Exp)
if time.Now().After(expDate) {
    return errors.New("license expired")
}

// Check revocation list (from GitHub Pages)
revoked := checkRevocationRegistry(license.Email)
if revoked {
    return errors.New("license revoked")
}

return nil // License valid
```

**Offline Validation:** No server communication needed after download

### 6.5 Age Encryption (Private Key Protection)

**Library:** `filippo.io/age` v1.2.1

**Encryption:**
```go
import "filippo.io/age"

func encryptWithAge(plaintext []byte, passphrase string) ([]byte, error) {
    recipient, _ := age.NewScryptRecipient(passphrase)

    var buf bytes.Buffer
    writer, _ := age.Encrypt(&buf, recipient)
    writer.Write(plaintext)
    writer.Close()

    return buf.Bytes(), nil
}
```

**Decryption:**
```go
func decryptWithAge(ciphertext []byte, passphrase string) ([]byte, error) {
    identity, _ := age.NewScryptIdentity(passphrase)

    reader, _ := age.Decrypt(bytes.NewReader(ciphertext), identity)
    return io.ReadAll(reader)
}
```

**Security:** Scrypt key derivation (computationally expensive brute-force protection)

---

## 7. External Integrations

### 7.1 Stripe Payment Integration

**API Version:** v79
**Library:** `github.com/stripe/stripe-go/v79`

**Checkout Flow:**
1. Customer clicks "Buy Pro" on pricing page
2. Redirect to Stripe-hosted checkout (`https://buy.stripe.com/...`)
3. Customer enters payment info (Stripe handles PCI compliance)
4. Stripe processes payment
5. Stripe sends webhook to server
6. Server provisions license and sends email

**Webhook Handler:**
```go
func (s *Server) handleStripeWebhook(w http.ResponseWriter, r *http.Request) {
    // Validate webhook signature
    payload, _ := io.ReadAll(r.Body)
    event, err := webhook.ConstructEvent(payload, r.Header.Get("Stripe-Signature"), s.stripeWebhookSecret)
    if err != nil {
        http.Error(w, "Invalid signature", http.StatusUnauthorized)
        return
    }

    // Process event
    switch event.Type {
    case "payment_intent.succeeded":
        var pi stripe.PaymentIntent
        json.Unmarshal(event.Data.Raw, &pi)

        // Extract customer info
        email := pi.Metadata["email"]
        plan := pi.Metadata["plan"]

        // Create transaction record
        s.db.CreateTransaction(&Transaction{
            StripePaymentID: pi.ID,
            Email:           email,
            Amount:          pi.Amount,
            Plan:            plan,
            Status:          "succeeded",
        })

        // Generate and email license
        s.provisionLicense(email, plan)

    case "charge.refunded":
        // Handle refund
        // ...
    }

    w.WriteHeader(http.StatusOK)
}
```

**Billing Portal:**
```go
import "github.com/stripe/stripe-go/v79/billingportal/session"

func (s *Server) handleCreatePortalSession(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Search    string `json:"search"`
        ReturnURL string `json:"return_url"`
    }
    json.NewDecoder(r.Body).Decode(&req)

    // Find customer by email
    customer := s.db.GetCustomerByEmail(req.Search)

    // Create portal session
    params := &stripe.BillingPortalSessionParams{
        Customer:  stripe.String(customer.StripeCustomerID),
        ReturnURL: stripe.String(req.ReturnURL),
    }
    sess, _ := session.New(params)

    respondJSON(w, http.StatusOK, map[string]string{
        "url": sess.URL,
    })
}
```

### 7.2 Resend Email Service

**API Endpoint:** `https://api.resend.com/emails`
**Authentication:** Bearer token

**Email Sending:**
```go
func (s *Sender) SendLicenseEmail(email, name, licenseJSON, signature string) error {
    htmlBody := fmt.Sprintf(`
        <h1>Your M365 WebApps License</h1>
        <p>Hi %s,</p>
        <p>Your license is ready! Follow these steps:</p>
        <ol>
          <li>Create directory: <code>~/.config/m365_webapps/</code></li>
          <li>Save license.json (below)</li>
          <li>Save license.sig (below)</li>
        </ol>
        <h3>license.json</h3>
        <pre><code>%s</code></pre>
        <h3>license.sig</h3>
        <pre><code>%s</code></pre>
    `, name, licenseJSON, signature)

    payload := map[string]interface{}{
        "from":    "M365 WebApps <licenses@ytech.tools>",
        "to":      []string{email},
        "subject": "Your M365 WebApps License",
        "html":    htmlBody,
    }

    body, _ := json.Marshal(payload)
    req, _ := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer "+s.apiKey)
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    return err
}
```

### 7.3 Fly.io Billing API

**API:** GraphQL (`https://api.fly.io/graphql`)
**Authentication:** Bearer token

**Query:**
```graphql
query($month: String!) {
    organization(slug: "personal") {
        billing {
            invoices(month: $month) {
                id
                totalAmount
                lineItems {
                    description
                    amount
                }
            }
        }
    }
}
```

**Go Implementation:**
```go
func (fc *FlyioClient) GetMonthlyInvoice(year int, month time.Month) (float64, error) {
    query := `{"query": "query($month: String!) { ... }"}`
    variables := fmt.Sprintf(`{"month": "%04d-%02d"}`, year, month)

    req, _ := http.NewRequest("POST", "https://api.fly.io/graphql", strings.NewReader(query+variables))
    req.Header.Set("Authorization", "Bearer "+fc.token)

    resp, _ := http.DefaultClient.Do(req)

    var result struct {
        Data struct {
            Organization struct {
                Billing struct {
                    Invoices []struct {
                        TotalAmount float64 `json:"totalAmount"`
                    } `json:"invoices"`
                } `json:"billing"`
            } `json:"organization"`
        } `json:"data"`
    }

    json.NewDecoder(resp.Body).Decode(&result)

    return result.Data.Organization.Billing.Invoices[0].TotalAmount, nil
}
```

### 7.4 Cloudflare Billing API

**API:** REST (`https://api.cloudflare.com/client/v4/accounts/{id}/billing/history`)
**Authentication:** Bearer token

**Go Implementation:**
```go
func (cc *CloudflareClient) GetMonthlyCharges(year int, month time.Month) (float64, error) {
    url := fmt.Sprintf("https://api.cloudflare.com/client/v4/accounts/%s/billing/history", cc.accountID)

    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer "+cc.token)

    resp, _ := http.DefaultClient.Do(req)

    var result struct {
        Result []struct {
            Type   string  `json:"type"`
            Amount float64 `json:"amount"`
            Date   string  `json:"occurred_at"`
        } `json:"result"`
    }

    json.NewDecoder(resp.Body).Decode(&result)

    total := 0.0
    for _, item := range result.Result {
        if item.Type == "charge" && strings.HasPrefix(item.Date, fmt.Sprintf("%04d-%02d", year, month)) {
            total += item.Amount
        }
    }

    return total, nil
}
```

### 7.5 OneDrive Cloud Backup

**API:** Microsoft Graph (`https://graph.microsoft.com/v1.0/`)
**Authentication:** OAuth2 with refresh token

**Authentication Flow:**
```go
func (oc *OneDriveClient) getAccessToken() (string, error) {
    url := fmt.Sprintf("https://login.microsoftonline.com/%s/oauth2/v2.0/token", oc.tenantID)

    form := url.Values{
        "grant_type":    {"refresh_token"},
        "client_id":     {oc.clientID},
        "client_secret": {oc.clientSecret},
        "refresh_token": {oc.refreshToken},
        "scope":         {"https://graph.microsoft.com/.default"},
    }

    resp, _ := http.PostForm(url, form)

    var result struct {
        AccessToken string `json:"access_token"`
    }
    json.NewDecoder(resp.Body).Decode(&result)

    return result.AccessToken, nil
}
```

**Upload Backup:**
```go
func (oc *OneDriveClient) UploadBackup(filename string, data []byte) error {
    token, _ := oc.getAccessToken()

    // Encrypt with Age before upload
    encrypted, _ := ageEncrypt(data, oc.passphrase)

    url := fmt.Sprintf("https://graph.microsoft.com/v1.0/users/%s/drive/root:/backups/%s:/content", oc.userID, filename+".age")

    req, _ := http.NewRequest("PUT", url, bytes.NewReader(encrypted))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/octet-stream")

    resp, err := http.DefaultClient.Do(req)
    return err
}
```

### 7.6 Google Analytics

**Measurement ID:** `G-ETMMN0VXS4`
**File:** `site/ga.js`

**Tracked Events:**
- Trial downloads
- Purchase clicks
- Pricing page views
- Documentation views
- Admin login/operations
- Billing portal access

**Implementation:**
```javascript
// Initialize gtag
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-ETMMN0VXS4');

// Custom event tracking
window.trackTrialDownload = function(source) {
    gtag('event', 'trial_download', {
        'event_category': 'conversion',
        'event_label': source,
        'value': 1
    });
};

window.trackPurchaseClick = function(plan) {
    gtag('event', 'purchase_initiated', {
        'event_category': 'conversion',
        'event_label': plan,
        'value': 1
    });
};
```

---

## 8. Deployment Architecture

### 8.1 Fly.io Configuration

**File:** `fly.toml`

```toml
app = "m365-license-server"
primary_region = "sjc"  # San Jose, CA

[build]
dockerfile = "Dockerfile.server"

[env]
PORT = "8080"
DATABASE_PATH = "/data/licenses.db"
BACKUP_DIR = "/data/backups"

[[mounts]]
source = "licenses_data"
destination = "/data"
initial_size = "1GB"

[http_service]
internal_port = 8080
force_https = true
auto_stop_machines = "off"
auto_start_machines = true
min_machines_running = 1

[http_service.concurrency]
type = "requests"
hard_limit = 100
soft_limit = 80

[[vm]]
memory = "256mb"
cpu_kind = "shared"
cpus = 1
```

**Resource Allocation:**
- 256MB RAM
- 1 shared CPU
- 1GB persistent volume

**Scaling:**
- Minimum 1 machine always running
- Request-based concurrency (100 hard limit)
- Auto-start disabled (always-on server)

### 8.2 Container Image

**File:** `Dockerfile.server`

```dockerfile
# Builder stage
FROM golang:alpine AS builder

RUN apk add --no-cache gcc musl-dev sqlite-dev

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo \
    -o m365-license-server ./cmd/m365-license-server

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates sqlite-libs

WORKDIR /app
COPY --from=builder /app/m365-license-server .

RUN mkdir -p /data && chmod 777 /data

EXPOSE 8080

CMD ["./m365-license-server"]
```

**Image Size:** ~15 MB

### 8.3 Secrets Management

**Setting Secrets:**
```bash
fly secrets set PRIVATE_KEY_HEX=<value>
fly secrets set RESEND_API_KEY=<value>
fly secrets set STRIPE_SECRET_KEY=<value>
fly secrets set STRIPE_WEBHOOK_SECRET=<value>
fly secrets set FLY_API_TOKEN=<value>
fly secrets set CLOUDFLARE_API_TOKEN=<value>
fly secrets set CLOUDFLARE_ACCOUNT_ID=<value>
fly secrets set ONEDRIVE_TENANT_ID=<value>
fly secrets set ONEDRIVE_CLIENT_ID=<value>
fly secrets set ONEDRIVE_CLIENT_SECRET=<value>
fly secrets set ONEDRIVE_REFRESH_TOKEN=<value>
fly secrets set ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

**Viewing Secrets:**
```bash
fly secrets list
```

**Secrets Rotation:**
1. Generate new secret value
2. Update via `fly secrets set`
3. Fly automatically restarts machine with new value

### 8.4 DNS Configuration

**Domains:**
- `api.ytech.tools` - Backend API (Fly.io)
- `ytech.tools` - Public website (Cloudflare Pages)

**Cloudflare DNS:**
```
Type: CNAME
Name: api.ytech.tools
Value: m365-license-server.fly.dev
Proxy: Enabled
```

**SSL/TLS:**
- Automatic Let's Encrypt certificates via Fly.io
- Cloudflare flexible SSL for public site

### 8.5 Monitoring & Health Checks

**Health Endpoint:**
```go
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
    // Check database connection
    if err := s.db.Ping(); err != nil {
        http.Error(w, "Database unavailable", http.StatusServiceUnavailable)
        return
    }

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{
        "status": "healthy",
        "uptime": time.Since(startTime).String(),
    })
}
```

**Fly.io Monitoring:**
```bash
fly status                    # Check machine status
fly logs                      # Real-time logs
fly logs --hours=24           # Last 24 hours
fly metrics                   # Resource usage
```

**Alerts:**
- Fly.io sends alerts on machine crashes
- Email notifications for downtime

---

## 9. Code Organization

### 9.1 Project Layout

**Go Project Structure:**
```
cmd/              # Executables
internal/         # Private packages (cannot be imported externally)
pkg/              # Public packages (unused in this project)
```

**Internal Package Guidelines:**
- `admin/` - Admin-specific logic
- `customer/` - Customer-specific logic
- `database/` - Data access layer
- `email/` - Email sending
- `licensegen/` - License generation
- `middleware/` - HTTP middleware
- `services/` - External API clients

### 9.2 Dependency Management

**File:** `go.mod`

**Key Dependencies:**
```go
module github.com/ayadlin/m365-compiled

go 1.24

require (
    filippo.io/age v1.2.1
    github.com/stripe/stripe-go/v79 v79.0.0
    github.com/mattn/go-sqlite3 v1.14.18
)
```

**Updating Dependencies:**
```bash
go get -u ./...
go mod tidy
```

### 9.3 Error Handling Patterns

**Wrapped Errors:**
```go
func (db *DB) GetLicense(id int) (*License, error) {
    row := db.QueryRow("SELECT ... FROM licenses WHERE id = ?", id)
    var license License
    if err := row.Scan(...); err != nil {
        return nil, fmt.Errorf("get license %d: %w", id, err)
    }
    return &license, nil
}
```

**HTTP Error Responses:**
```go
func respondError(w http.ResponseWriter, code int, message string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(code)
    json.NewEncoder(w).Encode(map[string]string{
        "error": message,
    })
}
```

### 9.4 Testing Strategy

**Unit Tests:**
```bash
go test ./internal/...
```

**Integration Tests:**
```bash
go test -tags=integration ./...
```

**Test Files:**
- `internal/database/db_test.go`
- `internal/licensegen/generator_test.go`

---

## 10. Development Guide

### 10.1 Local Setup

**Prerequisites:**
- Go 1.24+
- SQLite3
- Age CLI (`brew install age`)

**Clone Repository:**
```bash
git clone https://github.com/ayadlin/m365-compiled.git
cd m365-compiled
```

**Generate Keys:**
```bash
./cmd/m365-keygen/main.go -out ./keys -age
# Enter passphrase when prompted
```

**Decrypt Private Key:**
```bash
age --decrypt -i ~/.ssh/id_ed25519 keys/m365.priv.pem.age > /tmp/m365.priv.pem
export PRIVATE_KEY_HEX=$(xxd -p -c 256 < /tmp/m365.priv.pem)
```

**Setup Environment:**
```bash
export DATABASE_PATH=./licenses.db
export RESEND_API_KEY=your_key
export STRIPE_SECRET_KEY=your_key
export STRIPE_WEBHOOK_SECRET=your_secret
export ADMIN_EMAILS=you@example.com
export PORT=8080
```

**Initialize Database:**
```bash
sqlite3 licenses.db < internal/database/schema.sql
```

**Run Server:**
```bash
go run ./cmd/m365-license-server/main.go
```

**Access:**
- Admin: http://localhost:8080/admin/
- Health: http://localhost:8080/health

### 10.2 Building Binaries

**Build Server:**
```bash
CGO_ENABLED=1 go build -o m365-license-server ./cmd/m365-license-server
```

**Build All Tools:**
```bash
make all
```

**Build Debian Package:**
```bash
bash packaging/deb/make_deb.sh 1.0.0
```

### 10.3 Database Migrations

**Manual Migration:**
```bash
sqlite3 /data/licenses.db

-- Add new column
ALTER TABLE licenses ADD COLUMN new_column TEXT;

-- Create new table
CREATE TABLE new_table (...);
```

**Backup Before Migration:**
```bash
cp /data/licenses.db /data/licenses.db.backup
```

### 10.4 Debugging

**Enable Verbose Logging:**
```go
import "log"

log.SetFlags(log.LstdFlags | log.Lshortfile)
log.Printf("Debug: %+v", variable)
```

**Database Inspection:**
```bash
sqlite3 /data/licenses.db

.tables
.schema licenses
SELECT * FROM licenses LIMIT 10;
```

**Live Debugging (Fly.io):**
```bash
fly ssh console
sqlite3 /data/licenses.db
```

### 10.5 Common Maintenance Tasks

**Rotate Private Key:**
1. Generate new keypair
2. Update embedded public key in desktop apps
3. Re-sign all active licenses
4. Update `PRIVATE_KEY_HEX` secret
5. Deploy

**Manual Backup:**
```bash
fly ssh console
cp /data/licenses.db /data/backups/manual_$(date +%Y%m%d_%H%M%S).db
```

**Restore from Backup:**
```bash
fly ssh console
cp /data/backups/m365_backup_2024-01-15_03-45-12.db /data/licenses.db
# Restart machine
```

**View Audit Logs:**
```bash
sqlite3 /data/licenses.db "SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50;"
```

---

## Appendices

### A. File Reference Table

| File Path | Purpose | Size | Critical |
|-----------|---------|------|----------|
| `cmd/m365-license-server/main.go` | Main server entry point | 1,600+ lines | Yes |
| `internal/database/db.go` | Database operations | 800+ lines | Yes |
| `internal/database/schema.sql` | Database schema | 200 lines | Yes |
| `internal/admin/handlers.go` | Admin API endpoints | 1,000+ lines | Yes |
| `internal/licensegen/generator.go` | License signing | 300 lines | Yes |
| `internal/email/sender.go` | Email templates | 400 lines | Medium |
| `internal/middleware/ratelimit.go` | Rate limiting | 150 lines | Medium |
| `fly.toml` | Deployment config | 50 lines | High |

### B. Environment Variables Reference

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DATABASE_PATH` | Yes | - | SQLite database file path |
| `PRIVATE_KEY_HEX` | Yes | - | Ed25519 private key (hex) |
| `RESEND_API_KEY` | Yes | - | Email service API key |
| `STRIPE_SECRET_KEY` | Yes | - | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | - | Webhook signature validation |
| `ADMIN_EMAILS` | Yes | - | Comma-separated admin list |
| `PORT` | No | 8080 | HTTP listen port |
| `BACKUP_DIR` | No | /data/backups | Backup directory |
| `BACKUP_RETENTION_DAYS` | No | 30 | Days to keep backups |
| `FLY_API_TOKEN` | No | - | Fly.io GraphQL API |
| `CLOUDFLARE_API_TOKEN` | No | - | Cloudflare REST API |
| `CLOUDFLARE_ACCOUNT_ID` | No | - | Cloudflare account ID |
| `ONEDRIVE_TENANT_ID` | No | - | Microsoft tenant ID |
| `ONEDRIVE_CLIENT_ID` | No | - | Azure app ID |
| `ONEDRIVE_CLIENT_SECRET` | No | - | App secret |
| `ONEDRIVE_REFRESH_TOKEN` | No | - | OAuth refresh token |
| `ONEDRIVE_USER_ID` | No | - | OneDrive user ID |

### C. API Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid auth token |
| 403 | Forbidden | Invalid CSRF token or insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Database connection failed |

### D. Database Indexes

```sql
-- Customers
CREATE INDEX idx_customers_created ON customers(created_at);

-- Licenses
CREATE INDEX idx_licenses_email ON licenses(email);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_expires ON licenses(expires_at);

-- Transactions
CREATE INDEX idx_transactions_email ON transactions(email);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);

-- Expenses
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- Sessions
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Audit Logs
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_email);
```

---

**End of Technical Reference Documentation**

*This document is confidential and intended for authorized administrators only. Do not distribute without permission.*
