# M365 WebApps - Admin Operations Guide

**🔒 ADMIN-ONLY DOCUMENT - Contains sensitive operational procedures**

**Last Updated:** 2025-12-08
**Version:** 1.2

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Session Management](#2-session-management)
3. [Daily Operations](#3-daily-operations)
4. [License Management](#4-license-management)
5. [Customer Management](#5-customer-management)
6. [Team Management](#6-team-management)
7. [Expense Tracking](#7-expense-tracking)
8. [Backup & Recovery](#8-backup--recovery)
9. [Support Workflows](#9-support-workflows)
10. [Monitoring & Health Checks](#10-monitoring--health-checks)
11. [Maintenance Tasks](#11-maintenance-tasks)
12. [Security Procedures](#12-security-procedures)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Getting Started

### 1.1 Admin Dashboard Access

**URL:** https://api.ytech.tools/admin/dashboard

**Authentication:**
1. Navigate to https://api.ytech.tools/admin/
2. Enter your authorized admin email address
3. Click "Send Magic Link"
4. Check your email for the login link (expires in 15 minutes)
5. Click the link to access the dashboard
6. You'll be automatically redirected to the admin dashboard

**Security Notes:**
- Magic links are single-use and expire after 15 minutes
- Sessions use sliding 1-hour inactivity timeout (auto-extend on activity)
- Sessions persist across server restarts (database-backed)
- HttpOnly cookies prevent JavaScript access (XSS protection)
- All admin actions are logged in the audit log
- Access is restricted to pre-authorized email addresses only

### 1.2 Admin Dashboard Overview

**Header Navigation:**

The dashboard header provides quick access to key resources:
- **🏠 Home**: Link to main Y-Tech website (https://ytech.tools)
- **M365**: Link to M365 WebApps landing page (https://ytech.tools/m365/)
- **📚 Docs**: Link to Admin Documentation (opens in new tab at /admin/docs)
- **📊 Analytics**: Link to Google Analytics dashboard (external)
- **Logout**: End current admin session

**Dashboard Tabs:**

The dashboard provides access to:

- **Licenses Tab**: Create, revoke, delete, and bulk operations on licenses
- **Customers Tab**: View and manage customer records
- **Transactions Tab**: Review Stripe payment history
- **Expenses Tab**: Track and import monthly costs across all services
- **Analytics Tab**: View revenue, expenses, profit margins, and business metrics
- **Tax Reports Tab**: Generate annual tax reports for compliance
- **Backups Tab**: Download and manage database backups

### 1.3 Required Knowledge

Administrators should be familiar with:
- Basic command-line operations
- Ed25519 cryptographic signatures
- SQLite database structure
- Stripe payment integration
- Email delivery via Resend
- Fly.io deployment platform

---

## 2. Session Management

### 2.1 Session Architecture Overview

Both admin and customer portals use database-backed session management with sliding inactivity timeouts.

**Key Features:**
- Database-backed sessions (SQLite)
- 1-hour sliding inactivity timeout
- Sessions persist across server restarts
- HttpOnly secure cookies
- Automatic session cleanup every hour
- CSRF protection for state-changing operations
- **Single-session enforcement** (only one active session per user)

**Session Types:**
1. **Magic Link Sessions** (temporary, 15-minute lifetime)
   - Single-use authentication tokens
   - Expire after 15 minutes
   - Automatically deleted after use

2. **Dashboard Sessions** (persistent, 1-hour inactivity timeout)
   - Generated after magic link validation
   - Sliding expiration (refreshes on each request)
   - Maximum 7-day absolute expiration
   - Stored in `admin_sessions` or `customer_sessions` table

### 2.2 Admin Session Management

**Database Schema:**
```sql
CREATE TABLE admin_sessions (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Session Lifecycle:**

1. **Login:**
   ```
   User requests magic link
   → 15-minute token created
   → Email sent with link
   → User clicks link
   → Magic link validated and deleted
   → All existing sessions for this user REVOKED (single-session enforcement)
   → New session token created (24-hour expiration)
   → HttpOnly cookies set (admin_token, admin_logged_in)
   → User redirected to dashboard
   ```

   **Single-Session Enforcement (Commit: 242f896):**
   - Before creating new session, ALL existing admin sessions for the user are deleted
   - Ensures only one active admin session per user at any time
   - Old sessions immediately invalidated (prevents session hijacking from leaked tokens)
   - User must re-authenticate on all other devices after logging in

2. **Active Session:**
   ```
   Each dashboard request:
   → Validate session token from cookie
   → Check expires_at > now
   → Check last_accessed < 1 hour ago
   → Update last_accessed to now
   → Proceed with request
   ```

3. **Inactivity Timeout:**
   ```
   If last_accessed > 1 hour ago:
   → Session deleted from database
   → User redirected to login page
   → New magic link required
   ```

4. **Logout:**
   ```
   User clicks logout
   → Session deleted from database
   → Cookies cleared
   → Redirect to home page
   ```

**Session Inspection:**

```bash
# SSH into server
fly ssh console -a m365-license-server

# View all active admin sessions
sqlite3 /data/licenses.db "
  SELECT
    email,
    created_at,
    expires_at,
    last_accessed,
    ROUND((JULIANDAY('now') - JULIANDAY(last_accessed)) * 24 * 60) as minutes_inactive
  FROM admin_sessions
  WHERE expires_at > CURRENT_TIMESTAMP
  ORDER BY last_accessed DESC;
"

# Count active sessions
sqlite3 /data/licenses.db "SELECT COUNT(*) FROM admin_sessions WHERE expires_at > CURRENT_TIMESTAMP;"

# Find stale sessions (>50 minutes inactive)
sqlite3 /data/licenses.db "
  SELECT
    email,
    ROUND((JULIANDAY('now') - JULIANDAY(last_accessed)) * 24 * 60) as minutes_inactive
  FROM admin_sessions
  WHERE expires_at > CURRENT_TIMESTAMP
    AND (JULIANDAY('now') - JULIANDAY(last_accessed)) * 24 * 60 > 50
  ORDER BY minutes_inactive DESC;
"
```

### 2.3 Customer Session Management

**Database Schema:**
```sql
CREATE TABLE customer_sessions (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email) REFERENCES customers(email)
);
```

**Key Differences from Admin Sessions:**
- Same 1-hour inactivity timeout
- Same sliding expiration behavior
- Uses `customer_token` cookie instead of `admin_token`
- Cookie domain: `.ytech.tools` (wildcard for subdomain access)
- Sessions shared between https://ytech.tools/portal/ and https://api.ytech.tools/api/portal/

**Customer Session Lifecycle:**
```
Customer requests portal access
→ Magic link sent (15-minute expiration)
→ Customer clicks link
→ Magic link validated
→ All existing sessions for this customer REVOKED (single-session enforcement)
→ Long-lived session created (7-day max, 1-hour inactivity)
→ customer_token cookie set
→ Redirect to customer portal dashboard
```

**Single-Session Enforcement (Commit: 242f896):**
- Before creating new session, ALL existing customer sessions for the user are deleted
- Ensures only one active customer session per user at any time
- Old sessions immediately invalidated (prevents unauthorized access from old devices)
- Customer must re-authenticate on all other devices after logging in

**Session Inspection:**

```bash
# View active customer sessions
sqlite3 /data/licenses.db "
  SELECT
    cs.email,
    c.name,
    cs.created_at,
    cs.last_accessed,
    ROUND((JULIANDAY('now') - JULIANDAY(cs.last_accessed)) * 24 * 60) as minutes_inactive
  FROM customer_sessions cs
  JOIN customers c ON cs.email = c.email
  WHERE cs.expires_at > CURRENT_TIMESTAMP
  ORDER BY cs.last_accessed DESC;
"

# Verify single-session enforcement (should return 0 rows)
# If any customer has > 1 session, single-session enforcement failed
sqlite3 /data/licenses.db "
  SELECT
    email,
    COUNT(*) as session_count
  FROM customer_sessions
  WHERE expires_at > CURRENT_TIMESTAMP
  GROUP BY email
  HAVING session_count > 1;
"

# Expected: No rows (single-session enforcement ensures max 1 session per user)
# If rows appear: Bug in session revocation logic - investigate immediately
```

### 2.4 Session Security

**HttpOnly Cookies:**
- Prevent JavaScript access (XSS protection)
- Automatically sent with all requests to same domain
- Cannot be stolen via `document.cookie`
- Browser handles cookie storage and transmission

**Secure Flag:**
- Cookies only sent over HTTPS
- Prevents man-in-the-middle attacks on insecure connections
- All production endpoints use HTTPS

**SameSite Protection:**
- Set to `Lax` mode
- Prevents CSRF attacks from external sites
- Cookies sent with top-level navigations (clicking links)
- Cookies NOT sent with cross-site POST requests

**Additional Protection:**
```javascript
// Admin dashboard cookies
admin_token (HttpOnly, Secure, SameSite=Lax, Domain=api.ytech.tools)
admin_logged_in (Secure, SameSite=Lax, Domain=api.ytech.tools)  // Not HttpOnly - JS can check login status

// Customer portal cookies
customer_token (HttpOnly, Secure, SameSite=Lax, Domain=.ytech.tools)
```

### 2.5 Session Cleanup

**Automated Cleanup:**
- Runs every hour via background goroutine
- Deletes sessions where `expires_at < CURRENT_TIMESTAMP`
- Prevents database bloat from expired sessions

**Manual Cleanup:**

```bash
# SSH into server
fly ssh console -a m365-license-server

# Clean all expired admin sessions
sqlite3 /data/licenses.db "DELETE FROM admin_sessions WHERE expires_at <= CURRENT_TIMESTAMP;"

# Clean all expired customer sessions
sqlite3 /data/licenses.db "DELETE FROM customer_sessions WHERE expires_at <= CURRENT_TIMESTAMP;"

# Force logout specific admin
sqlite3 /data/licenses.db "DELETE FROM admin_sessions WHERE email = 'admin@example.com';"

# Force logout specific customer
sqlite3 /data/licenses.db "DELETE FROM customer_sessions WHERE email = 'customer@example.com';"

# Force logout all admins (emergency)
sqlite3 /data/licenses.db "DELETE FROM admin_sessions;"

# Force logout all customers (emergency)
sqlite3 /data/licenses.db "DELETE FROM customer_sessions;"
```

### 2.6 Session Troubleshooting

**Problem: User keeps getting logged out**

**Diagnosis:**
```bash
# Check session activity
sqlite3 /data/licenses.db "
  SELECT
    email,
    created_at,
    last_accessed,
    expires_at,
    ROUND((JULIANDAY('now') - JULIANDAY(last_accessed)) * 24 * 60) as minutes_inactive,
    ROUND((JULIANDAY(expires_at) - JULIANDAY('now')) * 24) as hours_until_expiration
  FROM admin_sessions
  WHERE email = 'user@example.com';
"
```

**Possible Causes:**
1. **Inactivity timeout reached:**
   - User idle for > 1 hour
   - Solution: Normal behavior, user needs to stay active

2. **Browser not sending cookies:**
   - Check browser console for cookie errors
   - Verify `credentials: 'same-origin'` in fetch calls
   - Solution: Clear browser cache, try different browser

3. **Multiple tabs/devices:**
   - Each device has separate session
   - Sessions don't conflict
   - Solution: Login on each device

4. **Server restart cleared sessions:**
   - Sessions are database-backed, persist across restarts
   - If issue persists, check database integrity

**Problem: Session not expiring after inactivity**

**Diagnosis:**
```bash
# Check if GetSession is being called
fly logs -a m365-license-server | grep "Auth successful"

# Verify inactivity check logic
sqlite3 /data/licenses.db "
  SELECT
    email,
    last_accessed,
    ROUND((JULIANDAY('now') - JULIANDAY(last_accessed)) * 24 * 60) as minutes_inactive
  FROM admin_sessions
  WHERE expires_at > CURRENT_TIMESTAMP;
"
```

**Possible Causes:**
1. **Background requests refreshing session:**
   - Auto-refresh scripts
   - Browser extensions
   - Polling APIs
   - Solution: Normal behavior if requests being made

2. **Clock skew:**
   - Server time incorrect
   - Solution: Check system time with `date`

**Problem: "Invalid or expired token" immediately after login**

This was a bug fixed on 2025-11-01. If still occurring:

**Diagnosis:**
```bash
# Check recent logs
fly logs -a m365-license-server | grep -A 5 "Admin login successful"
```

**Expected Log Pattern (correct):**
```
✅ Admin login successful for user@example.com
🔑 Generated new session token for user@example.com
🍪 Cookies set for user@example.com, redirecting to dashboard
✅ Auth successful for /admin/dashboard (user: user@example.com)
✅ Auth successful for /api/admin/csrf-token (user: user@example.com)
```

**If seeing errors:**
1. Check browser console for cookie errors
2. Verify server deployed latest code
3. Clear browser cache and cookies
4. Try incognito mode

### 2.7 Single Active Session Enforcement

**Security Feature (Implemented 2025-11-01):**

To prevent session hijacking and unauthorized access from leaked or stolen tokens, the system now enforces a single active session per user. When a user logs in, all existing sessions for that user are automatically revoked.

**How It Works:**

**Admin Login Process:**
```
1. User requests magic link (email: admin@example.com)
2. User clicks magic link
3. Magic link validated
4. System revokes ALL existing sessions for admin@example.com
5. New session token generated
6. User redirected to dashboard
7. Previous sessions (from other devices/browsers) are now invalid
```

**Customer Portal Login Process:**
```
1. Customer requests portal access magic link
2. Customer clicks magic link
3. Magic link validated
4. System revokes ALL existing sessions for customer@example.com
5. New session token generated (7-day max, 1-hour inactivity)
6. Customer redirected to portal
7. Previous sessions are now invalid
```

**Benefits:**
- **Prevents Session Hijacking**: Old tokens cannot be used after new login
- **Forced Logout**: User can log out from all devices by logging in once
- **Reduced Attack Surface**: Stolen tokens become useless after legitimate login
- **Audit Trail**: Login events in logs show session revocation

**Implementation Details:**

**Database Methods:**
- `AuthManager.RevokeAllUserSessions(email)` - Revokes all admin sessions
- `DB.DeleteUserSessions(email)` - Deletes all admin session records
- `DB.DeleteCustomerSessions(email)` - Deletes all customer session records

**Code Location:**
- `internal/admin/auth.go:98-102` - RevokeAllUserSessions method
- `internal/admin/handlers.go:203-215` - Admin login session revocation
- `internal/customer/portal.go:169-180` - Customer portal session revocation

**Logging:**
```bash
# View session revocation in logs
fly logs -a m365-license-server | grep "Revoked all existing sessions"

# Expected output on login:
✅ Admin login successful for admin@example.com
🗑️  Revoked all existing sessions for admin@example.com
🔑 Generated new session token for admin@example.com
```

**User Experience:**
- **Single Device User**: No noticeable change
- **Multi-Device User**: Other devices logged out when logging in on new device
- **Shared Account** (not recommended): Each login invalidates other sessions

**Troubleshooting:**

**Problem: User complains about being logged out unexpectedly**

**Cause**: Another device/browser logged in with same credentials

**Solution**: This is expected behavior. Explain that:
1. Only one active session allowed per user (security feature)
2. Logging in on new device logs out other devices
3. Each user should have their own admin credentials

**Problem: Session revocation failed during login**

**Diagnosis:**
```bash
# Check logs for warnings
fly logs -a m365-license-server | grep "Failed to revoke existing sessions"
```

**Impact**: Login still succeeds (graceful degradation), but old sessions remain valid. This is logged as a warning but doesn't block authentication.

**Solution**: Check database health and retry login.

### 2.8 Migration Notes

**Previous System (Before 2025-11-01):**
- Customer portal used in-memory sessions (map[string]*CustomerSession)
- Sessions lost on server restart
- Admin portal already database-backed

**Current System (After 2025-11-01):**
- Both portals use database-backed sessions
- Sessions persist across restarts
- Consistent 1-hour inactivity timeout for both
- Sliding expiration on all sessions

**Database Migration:**
The `customer_sessions` table is created automatically on first deployment after update. No manual migration required.

**Backwards Compatibility:**
- Old in-memory customer sessions were lost on deployment (users needed to re-login once)
- No data loss for licenses or customer records
- Admin sessions were not affected

---

## 3. Daily Operations

### 3.1 Morning Checklist

**Every Day (9:00 AM):**

1. **Check Dashboard Metrics**
   - Total active licenses
   - New signups in last 24 hours
   - Failed payment notifications
   - Expiring licenses (next 7 days)

2. **Review Audit Log**
   - Any unusual admin activity?
   - Any failed login attempts?
   - Check for automated backup success

3. **Monitor Email Delivery**
   - Check Resend dashboard for failed emails
   - Verify magic link emails are being delivered
   - Check trial license emails

4. **Check Stripe Dashboard**
   - Review new subscriptions
   - Check for failed payments
   - Verify webhook delivery

### 3.2 Customer Support Queue

**Priority Order:**

1. **Critical (Respond within 1 hour):**
   - License activation failures
   - Payment issues preventing access
   - Security concerns

2. **High (Respond within 4 hours):**
   - Trial license requests
   - License renewal questions
   - Team management issues

3. **Normal (Respond within 24 hours):**
   - General questions
   - Documentation clarifications
   - Feature requests

### 3.3 Automated Tasks

**These run automatically:**

- **2:00 AM Daily**: Database backup to `/data/backups/`
- **Every Hour**: Stripe expense sync
- **Every 4 Hours**: Fly.io/Cloudflare/Resend expense sync
- **On Stripe Webhook**: License generation and email delivery

**Verify Automation:**
```bash
# Check latest backup
fly ssh console -a m365-license-server
ls -lh /data/backups/ | tail -5

# Check automated backup log
fly logs -a m365-license-server | grep "backup"
```

---

## 4. License Management

### 4.1 Creating Manual Licenses

**Use Cases:**
- Custom pricing negotiations
- Promotional licenses
- Partner agreements
- Extended trial periods

**Steps:**

1. Navigate to **Admin Dashboard → License Management**
2. Click **"Create Manual License"**
3. Fill in details:
   - Email: Customer's email address
   - Plan: `free` (30 days), `pro` (1 device), `team` (10 devices), `enterprise` (unlimited)
   - Duration: Days until expiration
   - Stripe Payment ID: (optional) Link to payment record
   - Notes: Internal notes about this license

4. Click **"Generate License"**
5. System will:
   - Create `license.json` with Ed25519 signature
   - Email files to customer
   - Log action in audit trail

**Important:**
- All licenses are signed with the master private key
- Signatures cannot be forged without access to the private key
- License files are sent via email automatically

### 4.2 Revoking Licenses

**Use Cases:**
- Payment disputes
- Terms of service violations
- Refund requests
- Security concerns

**Steps:**

1. Navigate to **Admin Dashboard → Customer Search**
2. Find the customer by email
3. Click **"View License Details"**
4. Click **"Revoke License"**
5. Confirm revocation
6. Enter revocation reason (logged in audit trail)

**Effects:**
- License status changes to `revoked`
- Customer can no longer validate license
- Stripe subscription is NOT automatically cancelled
- Customer receives no notification (manual email recommended)

**Post-Revocation:**
- Send email explaining revocation
- Process refund via Stripe if applicable
- Update internal notes

### 4.3 Deleting Licenses

**⚠️ WARNING: This is destructive and cannot be undone**

**Use Cases:**
- Test licenses
- Duplicate records
- Data cleanup requests (GDPR)

**Steps:**

1. Navigate to **Admin Dashboard → Customer Search**
2. Find the customer by email
3. Click **"View License Details"**
4. Scroll to bottom → **"Delete License (Permanent)"**
5. Type the customer's email to confirm
6. Click **"Permanently Delete"**

**Effects:**
- License record is permanently removed from database
- Customer record remains (unless also deleted)
- Action is logged in audit trail
- **CANNOT BE UNDONE**

### 4.4 Bulk Operations

**Use Cases:**
- Mass expiration extensions
- Promotional upgrades
- Migration from old plans

**Available Operations:**

1. **Bulk Extend Expiration**
   ```
   Admin Dashboard → Bulk Operations → Extend Expiration
   - Upload CSV: email,days_to_add
   - Preview changes
   - Confirm and execute
   ```

2. **Bulk Plan Upgrade**
   ```
   Admin Dashboard → Bulk Operations → Upgrade Plans
   - Upload CSV: email,new_plan
   - Preview changes
   - Confirm and execute
   ```

3. **Bulk Email**
   ```
   Admin Dashboard → Bulk Operations → Send Email
   - Select customer segment (all/plan/expiring)
   - Compose email
   - Preview and send
   ```

**CSV Format:**
```csv
email,days_to_add
user1@example.com,30
user2@example.com,90
user3@example.com,365
```

### 4.5 License Validation

**Verify a license manually:**

1. **Via Admin Dashboard:**
   - Customer Search → View License
   - Shows validation status, expiration, device count

2. **Via Command Line:**
   ```bash
   # SSH into server
   fly ssh console -a m365-license-server

   # Use m365-pro tool
   /app/m365-pro -feature picker -license /tmp/license.json -sig /tmp/license.sig

   # Expected output: ok:plan:email@example.com
   ```

3. **Via API:**
   ```bash
   curl -X POST https://api.ytech.tools/api/validate \
     -H "Content-Type: application/json" \
     -d '{"license": "base64_license_json", "signature": "hex_signature"}'
   ```

---

## 5. Customer Management

### 5.1 Customer Records

**Database Schema:**
```sql
customers (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  created_at TIMESTAMP,
  last_login TIMESTAMP,
  stripe_customer_id TEXT,
  notes TEXT
)
```

**Fields:**
- **email**: Primary identifier, must be unique
- **name**: Customer's full name
- **company**: Company name (for team/enterprise plans)
- **phone**: Optional contact number
- **stripe_customer_id**: Links to Stripe customer record
- **notes**: Internal admin notes (not visible to customer)

### 5.2 Searching Customers

**Admin Dashboard Search:**

1. Navigate to **Admin Dashboard → Customer Search**
2. Enter search query (email, name, or company)
3. Click **"Search"**
4. Results show:
   - Customer details
   - Active licenses
   - Device registrations (for team plans)
   - Stripe payment history
   - Audit log entries

**Advanced Search (SQL):**

```bash
# SSH into server
fly ssh console -a m365-license-server

# Search by email pattern
sqlite3 /data/licenses.db "SELECT * FROM customers WHERE email LIKE '%@company.com';"

# Search by company
sqlite3 /data/licenses.db "SELECT * FROM customers WHERE company = 'Acme Corp';"

# Find customers with expiring licenses (next 7 days)
sqlite3 /data/licenses.db "
  SELECT c.email, c.name, l.expires_at
  FROM customers c
  JOIN licenses l ON c.email = l.email
  WHERE l.expires_at BETWEEN datetime('now') AND datetime('now', '+7 days')
  AND l.status = 'active';
"
```

### 5.3 Updating Customer Information

**Via Admin Dashboard:**

1. Search for customer
2. Click **"Edit Customer Details"**
3. Update fields:
   - Name
   - Company
   - Phone
   - Internal notes
4. Click **"Save Changes"**

**⚠️ Warning:** Email cannot be changed via dashboard (requires database migration)

**Changing Email (Advanced):**

```bash
# SSH into server
fly ssh console -a m365-license-server

# Backup database first
cp /data/licenses.db /data/licenses.db.backup-$(date +%Y%m%d)

# Update customer email
sqlite3 /data/licenses.db "
  BEGIN TRANSACTION;
  UPDATE customers SET email = 'newemail@example.com' WHERE email = 'oldemail@example.com';
  UPDATE licenses SET email = 'newemail@example.com' WHERE email = 'oldemail@example.com';
  UPDATE transactions SET email = 'newemail@example.com' WHERE email = 'oldemail@example.com';
  UPDATE teams SET email = 'newemail@example.com' WHERE email = 'oldemail@example.com';
  UPDATE team_devices SET owner_email = 'newemail@example.com' WHERE owner_email = 'oldemail@example.com';
  COMMIT;
"

# Verify update
sqlite3 /data/licenses.db "SELECT * FROM customers WHERE email = 'newemail@example.com';"
```

### 5.4 Customer Lifecycle

**1. New Customer (Trial):**
```
Trial Request → Free License Generated → Email Sent → 30-Day Trial
```

**2. Trial to Paid:**
```
Purchase Plan → Stripe Checkout → Webhook → Paid License Generated → Email Sent
```

**3. Renewal:**
```
Subscription Renewal → Stripe Webhook → License Extended → Email Sent
```

**4. Cancellation:**
```
Customer Cancels → Stripe Webhook → License Expires at Period End → No Action
```

**5. Refund:**
```
Admin Issues Refund → Stripe Webhook → License Revoked → Email Notification
```

---

## 6. Team Management

### 6.1 Team Plans Overview

**Plan Types:**
- **Team Plan**: 10 device registrations
- **Enterprise Plan**: Unlimited device registrations

**Device Registry:**
- Stored in private GitHub repository
- Each device has unique hardware fingerprint
- Tracked via SQLite `teams` and `team_devices` tables

### 6.2 Viewing Team Devices

**Via Admin Dashboard:**

1. Search for customer (team owner)
2. Navigate to **"Team Devices"** tab
3. View:
   - Total devices registered
   - Device limit (10 or unlimited)
   - Each device: hostname, user, fingerprint, registration date

**Via Database:**

```bash
sqlite3 /data/licenses.db "
  SELECT
    td.device_id,
    td.hostname,
    td.username,
    td.fingerprint,
    td.registered_at,
    t.github_repo_url
  FROM team_devices td
  JOIN teams t ON td.team_id = t.id
  WHERE t.email = 'teamowner@example.com';
"
```

### 6.3 Removing Team Devices

**Use Cases:**
- Employee leaves company
- Device replaced/retired
- Security concern (compromised device)

**Steps:**

1. Admin Dashboard → Customer Search → Team Devices
2. Find device to remove
3. Click **"Remove Device"**
4. Confirm removal
5. Device record is:
   - Marked as `removed` in database
   - Removed from GitHub registry
   - Can no longer validate licenses

**Manual Removal:**

```bash
# SSH into server
fly ssh console -a m365-license-server

# Remove device by fingerprint
sqlite3 /data/licenses.db "
  UPDATE team_devices
  SET status = 'removed', removed_at = datetime('now')
  WHERE fingerprint = 'device_fingerprint_here';
"

# Push update to GitHub
# (Automated by system, or manually trigger sync)
```

### 6.4 Team Plan Upgrades

**Team → Enterprise:**

1. Customer requests upgrade
2. Create new Stripe subscription for Enterprise plan
3. License automatically regenerated with `enterprise` plan
4. Device limit changes to unlimited
5. No need to re-register existing devices

**Pro → Team:**

1. Customer requests upgrade
2. Create new Stripe subscription for Team plan
3. Create GitHub repository for device registry
4. Update license plan to `team`
5. Customer must register devices (max 10)

---

## 7. Expense Tracking

### 7.1 Automated Expense Import

**Configured Services:**
- **Stripe**: Payment processing fees (2.9% + $0.30)
- **Fly.io**: Hosting costs ($0.02/GB/month)
- **Cloudflare**: DNS/CDN ($0/month on free plan)
- **Resend**: Email delivery ($0.001/email after free tier)
- **OneDrive**: File storage ($1.99/month for 100GB)

**Import Schedule:**
- **Stripe**: Hourly sync of transactions
- **Fly.io**: Every 4 hours
- **Cloudflare**: Every 4 hours
- **Resend**: Every 4 hours

### 7.2 Viewing Expenses

**Admin Dashboard:**

1. Navigate to **"Expense Tracker"**
2. View monthly breakdown:
   - Total expenses by service
   - Daily expense graph
   - Cost per customer metric
   - Profit margin calculation

**Example Output:**
```
Current Month: January 2025
┌─────────────┬─────────┬────────────┐
│ Service     │ Cost    │ Trend      │
├─────────────┼─────────┼────────────┤
│ Stripe      │ $124.50 │ +12% ↑    │
│ Fly.io      │  $8.75  │  -2% ↓    │
│ Resend      │  $2.10  │  +5% ↑    │
│ OneDrive    │  $1.99  │   0% →    │
│ Cloudflare  │  $0.00  │   0% →    │
├─────────────┼─────────┼────────────┤
│ TOTAL       │ $137.34 │  +10% ↑   │
└─────────────┴─────────┴────────────┘

Revenue:      $1,847.00
Profit:       $1,709.66
Margin:       92.6%
```

### 7.3 Automated Expense Import Buttons

**Quick Import Actions:**

The Expenses tab provides buttons for importing expenses from various services:

1. **Calculate Stripe Fees**
   - Automatically calculates 2.9% + $0.30 per transaction
   - Imports all Stripe processing fees from transactions table
   - Creates expense entries for current month
   - Click button: "Calculate Stripe Fees"

2. **Import Cloudflare Expenses**
   - Fetches expenses from Cloudflare API
   - Requires Cloudflare API token in environment variables
   - Imports DNS/CDN costs automatically
   - Click button: "Import Cloudflare"
   - Note: Free plan typically shows $0.00

3. **Add Expense (Manual)**
   - Opens modal for manual expense entry
   - Use for services without API integration
   - See section 7.4 below

**Expected Workflow:**

```
1. Navigate to Expenses Tab
2. Click "Calculate Stripe Fees" (updates monthly fees)
3. Click "Import Cloudflare" (if on paid plan)
4. Review imported expenses
5. Add any manual expenses as needed
```

**Troubleshooting Import Issues:**

**Problem: "Import Cloudflare" button fails**

**Diagnosis:**
```bash
# Check Cloudflare API credentials
fly secrets list -a m365-license-server | grep CLOUDFLARE

# View error logs
fly logs -a m365-license-server | grep -i cloudflare
```

**Solutions:**
1. Verify `CLOUDFLARE_API_TOKEN` secret is set
2. Check Cloudflare API rate limits
3. Verify API token has billing:read permission
4. Try again after a few minutes (rate limit cooldown)

### 7.4 Manual Expense Entry

**For services without API integration:**

1. Admin Dashboard → Expense Tracker → **"Add Expense"**
2. Fill in the modal form:
   - **Date**: Date expense occurred
   - **Vendor**: Select from dropdown or choose "Other"
     - Fly.io, Stripe, Cloudflare, Resend, iPostal1, OneDrive, Ziply, PSE, PayPal, Other
   - **Category**: Expense type
     - Hosting, Email, DNS, Payment Processing, Mailbox, Storage, Office, Utilities, Other
   - **Amount**: Cost in USD (e.g., 12.99)
   - **Description**: Brief note (e.g., "Annual domain renewal")
   - **Recurring**: Check if this is a recurring monthly expense
3. Click **"Add Expense"**
4. Expense appears in table immediately

**Via Database (Advanced):**

```bash
sqlite3 /data/licenses.db "
  INSERT INTO expenses (service, amount, currency, recorded_at, category, description, recurring)
  VALUES ('Domain Registration', 12.99, 'USD', datetime('now'), 'infrastructure', 'Annual .com renewal', 0);
"
```

### 7.5 Monthly Expense Reports

**Automated Report Generation:**

```bash
# SSH into server
fly ssh console -a m365-license-server

# Generate current month report
sqlite3 /data/licenses.db "
  SELECT
    service,
    SUM(amount) as total_cost,
    COUNT(*) as transaction_count,
    AVG(amount) as avg_transaction
  FROM expenses
  WHERE recorded_at >= date('now', 'start of month')
  GROUP BY service
  ORDER BY total_cost DESC;
"

# Compare to previous month
sqlite3 /data/licenses.db "
  SELECT
    service,
    SUM(CASE WHEN recorded_at >= date('now', 'start of month') THEN amount ELSE 0 END) as current_month,
    SUM(CASE WHEN recorded_at >= date('now', '-1 month', 'start of month')
             AND recorded_at < date('now', 'start of month') THEN amount ELSE 0 END) as previous_month
  FROM expenses
  GROUP BY service;
"
```

### 7.6 Analytics Tab

**Overview:**

The Analytics tab provides comprehensive business intelligence metrics and visualizations to track financial performance.

**Key Metrics Displayed:**

1. **Total Revenue**
   - Sum of all successful Stripe transactions
   - Updated in real-time from transactions table
   - Displayed in USD with proper formatting

2. **Total Expenses**
   - Sum of all recorded expenses across all services
   - Includes automated imports (Stripe fees, Cloudflare, etc.)
   - Includes manual expense entries

3. **Net Profit**
   - Calculated as: Total Revenue - Total Expenses
   - Updates automatically when revenue or expenses change
   - Color-coded: Green (profit) or Red (loss)

4. **Profit Margin**
   - Calculated as: (Net Profit / Total Revenue) × 100
   - Displayed as percentage
   - Industry benchmark: >20% is healthy for SaaS

**Visualizations:**

1. **Monthly Revenue vs Expenses Chart**
   - Line graph showing trends over time
   - X-axis: Months
   - Y-axis: Amount in USD
   - Two lines: Revenue (green) and Expenses (red)
   - Helps identify seasonal patterns

2. **Expenses by Category Chart**
   - Pie chart showing expense distribution
   - Categories: Hosting, Email, DNS, Payment Processing, etc.
   - Click segment to see detailed breakdown
   - Helps identify cost optimization opportunities

**Accessing Analytics:**

1. Navigate to **Admin Dashboard**
2. Click **"Analytics"** tab
3. Wait for data to load (typically 1-2 seconds)
4. Scroll to view charts

**Use Cases:**

**Monthly Business Review:**
```
1. Check Net Profit trend
2. Compare revenue growth month-over-month
3. Identify expense categories that grew unexpectedly
4. Calculate Cost Per Customer (Total Expenses / Total Customers)
5. Track Profit Margin trend
```

**Cost Optimization:**
```
1. View "Expenses by Category" pie chart
2. Identify largest expense categories
3. Research alternatives for high-cost services
4. Set budget alerts for specific categories
```

**Investor/Stakeholder Reporting:**
```
1. Export revenue and expense data
2. Calculate key SaaS metrics:
   - Monthly Recurring Revenue (MRR)
   - Customer Acquisition Cost (CAC)
   - Lifetime Value (LTV)
   - LTV:CAC Ratio
3. Generate monthly financial summary
```

**Troubleshooting:**

**Problem: Analytics showing "Loading..." indefinitely**

**Diagnosis:**
```bash
# Check if analytics endpoint is responding
curl -H "Cookie: admin_token=$ADMIN_TOKEN" https://api.ytech.tools/api/admin/analytics

# View error logs
fly logs -a m365-license-server | grep analytics
```

**Solutions:**
1. Refresh the page (F5)
2. Check browser console for JavaScript errors (F12)
3. Verify transactions and expenses tables have data
4. Check database connectivity

**Problem: Charts not rendering correctly**

**Possible Causes:**
- Chart.js library not loaded
- Browser compatibility issues
- Data format issues

**Solutions:**
1. Clear browser cache
2. Try a different browser (Chrome recommended)
3. Check browser console for Chart.js errors
4. Verify CDN accessibility (Chart.js loaded from CDN)

### 7.7 Tax Reports Tab

**Overview:**

The Tax Reports tab allows administrators to generate comprehensive annual tax reports for accounting and compliance purposes.

**Features:**

**Report Generation:**
1. Navigate to **Admin Dashboard → Tax Reports**
2. Select tax year from dropdown (shows last 5 years + current year)
3. Click **"Generate & Email Tax Report"**
4. Report is generated and emailed to all admin addresses

**Report Contents:**

The generated tax report includes:

1. **Revenue Summary**
   - Total annual revenue
   - Revenue by month
   - Revenue by plan type (Pro, Team, Enterprise)
   - Number of transactions

2. **Expense Summary**
   - Total annual expenses
   - Expenses by category
   - Expenses by vendor
   - Monthly expense breakdown

3. **Profit Summary**
   - Gross profit (Revenue - Expenses)
   - Net profit margin percentage
   - Month-over-month comparison
   - Year-over-year comparison (if previous year data exists)

4. **Tax Calculations**
   - Estimated tax liability (based on configured tax rate)
   - Quarterly estimated tax payments
   - Deductible expenses breakdown

5. **Customer Metrics**
   - Total customers served
   - New customers acquired
   - Customer churn rate
   - Average revenue per customer

**Configuration:**

Tax rate is configured via environment variable:

```bash
# Set tax rate (e.g., 25% = 0.25)
fly secrets set TAX_RATE="0.25" -a m365-license-server
```

**Email Delivery:**

Reports are automatically emailed to all addresses in `ADMIN_EMAILS`:

```
Subject: M365 WebApps - Annual Tax Report for 2024

Attached:
- m365-tax-report-2024.pdf (formatted PDF report)
- m365-tax-report-2024.csv (raw data for spreadsheets)
```

**Use Cases:**

**Annual Tax Filing:**
```
1. Generate report for previous tax year (e.g., 2024)
2. Download attached PDF and CSV files
3. Provide to accountant or tax preparer
4. Use data for Schedule C (business income/expenses)
```

**Quarterly Estimated Taxes:**
```
1. Generate report for current year (YTD)
2. Review estimated tax liability
3. Calculate quarterly payment amount
4. Make estimated tax payment to IRS
```

**Financial Planning:**
```
1. Generate reports for last 3 years
2. Analyze revenue and expense trends
3. Project next year's financials
4. Set budget targets for growth
```

**Troubleshooting:**

**Problem: "Generate & Email Tax Report" button not working**

**Diagnosis:**
```bash
# Check logs for report generation errors
fly logs -a m365-license-server | grep "tax report"

# Verify email configuration
fly secrets list -a m365-license-server | grep RESEND
```

**Solutions:**
1. Verify `RESEND_API_KEY` is set and valid
2. Check `ADMIN_EMAILS` contains valid email addresses
3. Verify sufficient data exists for selected year
4. Check Resend dashboard for email delivery status

**Problem: Report data looks incorrect**

**Diagnosis:**
```bash
# Verify revenue data for year
sqlite3 /data/licenses.db "
  SELECT
    COUNT(*) as transaction_count,
    SUM(amount) as total_revenue
  FROM transactions
  WHERE strftime('%Y', timestamp) = '2024'
    AND status = 'succeeded';
"

# Verify expense data for year
sqlite3 /data/licenses.db "
  SELECT
    COUNT(*) as expense_count,
    SUM(amount) as total_expenses
  FROM expenses
  WHERE strftime('%Y', recorded_at) = '2024';
"
```

**Solutions:**
1. Verify all Stripe transactions imported correctly
2. Confirm all expenses recorded (automated + manual)
3. Check for duplicate expense entries
4. Verify date ranges are correct

**Problem: Report not received via email**

**Diagnosis:**
```bash
# Check Resend logs
# Visit: https://resend.com/logs

# Check admin email addresses
fly secrets list -a m365-license-server | grep ADMIN_EMAILS
```

**Solutions:**
1. Check spam/junk folder
2. Verify admin email addresses are correct
3. Check Resend API quota/rate limits
4. Regenerate report and check for email delivery errors

---

## 8. Backup & Recovery

### 8.1 Automated Backups

**Schedule:** Daily at 2:00 AM UTC

**Backup Location:**
```
/data/backups/licenses-backup-YYYYMMDD-HHMMSS.db
```

**Retention Policy:**
- Daily backups kept for 30 days
- Older backups automatically deleted

**Verify Backups:**

```bash
# SSH into server
fly ssh console -a m365-license-server

# List recent backups
ls -lh /data/backups/ | tail -10

# Check backup file integrity
sqlite3 /data/backups/licenses-backup-20250130-020000.db "PRAGMA integrity_check;"
# Expected output: ok

# View backup size
du -h /data/backups/
```

### 8.2 Manual Backups

**Before risky operations (always):**

```bash
# SSH into server
fly ssh console -a m365-license-server

# Create timestamped backup
cp /data/licenses.db /data/backups/manual-backup-$(date +%Y%m%d-%H%M%S).db

# Verify backup
ls -lh /data/backups/manual-backup-*
```

**Download backup to local machine:**

```bash
# From local machine
fly ssh sftp shell -a m365-license-server

# In SFTP session
get /data/backups/licenses-backup-20250130-020000.db ./local-backup.db
exit
```

### 8.3 Restoring from Backup

**⚠️ WARNING: This will overwrite current database**

**Steps:**

1. **Stop the application:**
   ```bash
   fly scale count 0 -a m365-license-server
   ```

2. **SSH into the server:**
   ```bash
   fly ssh console -a m365-license-server
   ```

3. **Backup current state (just in case):**
   ```bash
   cp /data/licenses.db /data/licenses.db.pre-restore-$(date +%Y%m%d-%H%M%S)
   ```

4. **Restore from backup:**
   ```bash
   cp /data/backups/licenses-backup-20250130-020000.db /data/licenses.db
   ```

5. **Verify restoration:**
   ```bash
   sqlite3 /data/licenses.db "PRAGMA integrity_check;"
   sqlite3 /data/licenses.db "SELECT COUNT(*) FROM customers;"
   sqlite3 /data/licenses.db "SELECT COUNT(*) FROM licenses;"
   ```

6. **Restart the application:**
   ```bash
   exit
   fly scale count 1 -a m365-license-server
   ```

7. **Verify application health:**
   ```bash
   fly logs -a m365-license-server
   curl https://api.ytech.tools/health
   ```

### 8.4 Disaster Recovery

**Complete server loss scenario:**

1. **Create new Fly.io app:**
   ```bash
   fly apps create m365-license-server-new
   ```

2. **Create persistent volume:**
   ```bash
   fly volumes create license_data --size 10 -a m365-license-server-new
   ```

3. **Deploy application:**
   ```bash
   fly deploy -a m365-license-server-new
   ```

4. **Upload latest backup:**
   ```bash
   fly ssh sftp shell -a m365-license-server-new
   put ./local-backup.db /data/licenses.db
   exit
   ```

5. **Update DNS:**
   - Point api.ytech.tools to new app IP

6. **Verify restoration:**
   ```bash
   curl https://api.ytech.tools/health
   fly logs -a m365-license-server-new
   ```

---

## 9. Support Workflows

### 9.1 License Activation Issues

**Symptoms:**
- Customer reports "License validation failed"
- License signature verification fails
- Expired license errors

**Troubleshooting Steps:**

1. **Verify license exists:**
   ```
   Admin Dashboard → Customer Search → [email]
   Check if license record exists and is active
   ```

2. **Check license status:**
   - Status should be `active` (not `revoked` or `expired`)
   - Expiration date should be in the future
   - Signature should match the license JSON

3. **Re-send license files:**
   ```
   Admin Dashboard → Customer Details → "Resend License Email"
   ```

4. **Verify email delivery:**
   - Check Resend dashboard for delivery status
   - Check spam folder
   - Try alternative email if available

5. **Generate new license (if corrupted):**
   ```
   Admin Dashboard → License Management → "Regenerate License"
   This creates new signature for same expiration date
   ```

### 9.2 Payment Issues

**Failed Payment:**

1. **Check Stripe dashboard:**
   - Subscription status
   - Payment method validity
   - Decline reason

2. **Contact customer:**
   - Inform about failed payment
   - Request payment method update
   - Provide Stripe billing portal link

3. **Grace period:**
   - Stripe retries failed payments for 3 days
   - License remains active during retry period
   - After 3 failed attempts, subscription cancels

**Refund Request:**

1. **Verify reason:**
   - License not working
   - Accidental purchase
   - Not satisfied with product

2. **Issue refund via Stripe:**
   ```
   Stripe Dashboard → Payment → Refund → Full/Partial
   ```

3. **Revoke license:**
   ```
   Admin Dashboard → Customer Details → Revoke License
   Reason: "Refund processed"
   ```

4. **Send confirmation email:**
   - Refund amount and timeline
   - License has been revoked
   - Thank customer for trying the product

### 9.3 Team Device Management

**Cannot Register Device:**

1. **Check device limit:**
   ```
   Admin Dashboard → Team Devices
   Verify: registered_devices < device_limit
   ```

2. **If limit reached:**
   - Ask customer which device to remove
   - Remove old device via admin dashboard
   - Customer can now register new device

3. **GitHub sync issues:**
   ```bash
   # SSH into server
   fly ssh console -a m365-license-server

   # Check GitHub sync status
   sqlite3 /data/licenses.db "SELECT * FROM teams WHERE email = 'customer@example.com';"

   # Force sync
   curl -X POST https://api.ytech.tools/admin/sync-team-devices \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"email": "customer@example.com"}'
   ```

### 9.4 Installation Help

**Common Installation Issues:**

1. **"No compatible browser found"**
   - Customer needs Chrome/Chromium
   - Provide installation instructions:
     ```bash
     sudo apt install google-chrome-stable
     # or
     sudo apt install chromium-browser
     ```

2. **"Desktop launchers not showing"**
   - Verify installation:
     ```bash
     m365ctl -mode install
     ```
   - Check desktop file permissions
   - May need to logout/login to refresh desktop database

3. **"License files not found"**
   - Verify files in `~/.config/m365_webapps/`
   - Check file names: `license.json` and `license.sig`
   - Verify file permissions (should be readable by user)

**Escalation Path:**
1. Basic troubleshooting (user docs)
2. Email support (support@ytech.tools)
3. Admin investigation (logs, database)
4. Technical escalation (developer)

---

## 10. Monitoring & Health Checks

### 10.1 Application Health

**Health Endpoint:**
```bash
curl https://api.ytech.tools/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "uptime": "142h 34m",
  "version": "1.0.0"
}
```

**Monitoring Checklist:**

- [ ] Health endpoint returns 200 OK
- [ ] Database queries responding < 100ms
- [ ] Fly.io app shows "running" status
- [ ] No error spikes in logs
- [ ] Email delivery rate > 98%
- [ ] Stripe webhooks being received

### 10.2 Fly.io Monitoring

**Check App Status:**
```bash
fly status -a m365-license-server
```

**Expected Output:**
```
App
  Name     = m365-license-server
  Owner    = personal
  Hostname = api.ytech.tools
  Platform = machines

Machines
ID              STATE   REGION  CHECKS
e784e3d4f3d987  started iad     3 total, 3 passing
```

**View Resource Usage:**
```bash
fly scale show -a m365-license-server

# Memory usage
fly ssh console -a m365-license-server
free -h

# Disk usage
df -h /data
```

**Alert Thresholds:**
- Memory usage > 80%: Consider scaling up
- Disk usage > 80%: Clean old backups or scale volume
- Response time > 2s: Investigate database queries

### 10.3 Log Monitoring

**Real-time logs:**
```bash
fly logs -a m365-license-server
```

**Search logs:**
```bash
# Find errors in last hour
fly logs -a m365-license-server | grep -i error

# Find specific customer activity
fly logs -a m365-license-server | grep "customer@example.com"

# Find Stripe webhook activity
fly logs -a m365-license-server | grep "stripe_webhook"
```

**Common log patterns:**

**Good:**
```
[INFO] License generated for pro@example.com (plan: pro)
[INFO] Email sent successfully to pro@example.com
[INFO] Stripe webhook processed: checkout.session.completed
[INFO] Backup completed: licenses-backup-20250130-020000.db
```

**Warning:**
```
[WARN] Rate limit exceeded for IP 192.168.1.100
[WARN] Email delivery delayed for trial@example.com
[WARN] Stripe webhook retry attempt 2/3
```

**Error:**
```
[ERROR] Database connection failed: timeout
[ERROR] Email delivery failed: invalid recipient
[ERROR] Stripe webhook signature verification failed
[ERROR] License signature generation failed
```

### 10.4 External Service Status

**Check service health:**

1. **Stripe:**
   - https://status.stripe.com
   - Check webhook delivery in Stripe dashboard

2. **Resend:**
   - https://resend.com/status
   - Check email delivery rate in Resend dashboard

3. **Fly.io:**
   - https://status.flyio.net
   - Check region availability

4. **Cloudflare:**
   - https://www.cloudflarestatus.com
   - Check DNS propagation

**Service Degradation Response:**
1. Check status pages
2. Enable maintenance mode if critical
3. Communicate with customers
4. Monitor for resolution

---

## 11. Maintenance Tasks

### 11.1 Daily Tasks

**Morning (9:00 AM):**
- [ ] Review dashboard metrics
- [ ] Check audit log for anomalies
- [ ] Respond to support emails
- [ ] Verify backup completed successfully

**Evening (5:00 PM):**
- [ ] Review expense tracker
- [ ] Check for failed Stripe payments
- [ ] Monitor email delivery rate

### 11.2 Weekly Tasks

**Monday:**
- [ ] Review weekly revenue report
- [ ] Check for expiring licenses (next 7 days)
- [ ] Clean up test licenses
- [ ] Review audit log for unusual patterns

**Friday:**
- [ ] Download weekly backup to local machine
- [ ] Review support ticket resolution time
- [ ] Update internal documentation if needed

### 11.3 Monthly Tasks

**First of Month:**
- [ ] Generate monthly expense report
- [ ] Calculate profit margin
- [ ] Review customer churn rate
- [ ] Archive old audit logs (>90 days)
- [ ] Clean up old backups (>30 days)
- [ ] Review and update pricing if needed

**SQL Maintenance:**
```bash
# SSH into server
fly ssh console -a m365-license-server

# Vacuum database (reclaim space)
sqlite3 /data/licenses.db "VACUUM;"

# Analyze tables (optimize queries)
sqlite3 /data/licenses.db "ANALYZE;"

# Check database integrity
sqlite3 /data/licenses.db "PRAGMA integrity_check;"
```

### 11.4 Quarterly Tasks

**Every 3 Months:**
- [ ] Review and update security procedures
- [ ] Audit admin access permissions
- [ ] Review rate limiting thresholds
- [ ] Test disaster recovery procedures
- [ ] Update documentation
- [ ] Review API endpoint usage patterns

### 11.5 Annual Tasks

**January:**
- [ ] Generate annual revenue report
- [ ] Review total expenses vs revenue
- [ ] Plan infrastructure scaling
- [ ] Review and renew SSL certificates (auto via Fly.io)
- [ ] Review and renew domain registrations
- [ ] Tax documentation preparation

---

## 12. Security Procedures

### 12.1 Admin Access Control

**Authorized Admins:**
- Stored in environment variable: `ADMIN_EMAILS`
- Comma-separated list of email addresses
- Only these emails can access admin dashboard

**Adding New Admin:**
```bash
# Update Fly.io secrets
fly secrets set ADMIN_EMAILS="admin1@example.com,admin2@example.com,newadmin@example.com" -a m365-license-server

# Verify update
fly secrets list -a m365-license-server
```

**Removing Admin:**
```bash
# Update secrets with removed email
fly secrets set ADMIN_EMAILS="admin1@example.com,admin2@example.com" -a m365-license-server
```

### 12.2 Private Key Security

**Master Signing Key:**
- Location: Environment variable `PRIVATE_KEY_ENCRYPTED`
- Format: Age-encrypted Ed25519 private key
- Passphrase: Stored in `PRIVATE_KEY_PASSPHRASE`

**⚠️ CRITICAL: Never expose these values**

**Key Rotation (if compromised):**

1. **Generate new Ed25519 keypair:**
   ```bash
   # On secure local machine
   ssh-keygen -t ed25519 -f m365_master_key

   # Encrypt with age
   age -p -o m365_master_key.age < m365_master_key
   ```

2. **Update Fly.io secrets:**
   ```bash
   fly secrets set PRIVATE_KEY_ENCRYPTED="$(cat m365_master_key.age)" -a m365-license-server
   fly secrets set PRIVATE_KEY_PASSPHRASE="new_secure_passphrase" -a m365-license-server
   fly secrets set PUBLIC_KEY="$(cat m365_master_key.pub)" -a m365-license-server
   ```

3. **Regenerate all active licenses:**
   ```bash
   # This invalidates old signatures
   # Run bulk license regeneration script
   ```

4. **Securely delete old keys:**
   ```bash
   shred -vfz -n 10 m365_master_key m365_master_key.age
   ```

### 12.3 Audit Log Review

**Weekly Security Audit:**

```bash
sqlite3 /data/licenses.db "
  SELECT
    timestamp,
    admin_email,
    action,
    target_email,
    ip_address
  FROM audit_log
  WHERE timestamp >= datetime('now', '-7 days')
  ORDER BY timestamp DESC;
"
```

**Look for:**
- Failed login attempts from same IP
- Unusual admin actions (mass deletions)
- Access from unexpected IP addresses
- Actions outside normal hours

**Suspicious Activity Response:**
1. Document findings
2. Verify with admin (if their account)
3. Revoke admin access if compromised
4. Force password reset (new magic link)
5. Review affected customer records

### 12.4 Rate Limiting

**Current Limits:**
- Login endpoints: 5 requests / 15 minutes per IP
- Admin endpoints: 100 requests / minute per IP
- Public endpoints: 30 requests / minute per IP

**Adjusting Limits:**

Edit `internal/middleware/ratelimit.go`:
```go
var rateLimiters = map[string]*TokenBucket{
    "login":  NewTokenBucket(5, 15*time.Minute),
    "admin":  NewTokenBucket(100, time.Minute),
    "public": NewTokenBucket(30, time.Minute),
}
```

Deploy changes:
```bash
git add internal/middleware/ratelimit.go
git commit -m "security: adjust rate limits"
fly deploy --ha=false
```

### 12.5 CSRF Protection

**Token Generation:**
- 32-byte random tokens
- Stored in session
- Validated on all POST/PUT/DELETE requests

**Verify CSRF Protection:**
```bash
# Attempt request without CSRF token (should fail)
curl -X POST https://api.ytech.tools/admin/license/revoke \
  -H "Cookie: session_id=valid_session" \
  -d '{"email": "test@example.com"}'

# Expected: 403 Forbidden - Invalid CSRF token
```

---

## 13. Troubleshooting

### 13.1 Application Won't Start

**Symptoms:**
- Fly.io shows app as "crashed"
- Health endpoint not responding
- Logs show startup errors

**Diagnosis:**

```bash
# Check app status
fly status -a m365-license-server

# View recent logs
fly logs -a m365-license-server | tail -100

# Check for common issues:
# - Database connection failure
# - Missing environment variables
# - Port binding issues
```

**Solutions:**

1. **Database locked:**
   ```bash
   fly ssh console -a m365-license-server
   fuser /data/licenses.db  # Check if locked
   rm /data/licenses.db-journal  # Remove stale journal
   ```

2. **Missing secrets:**
   ```bash
   fly secrets list -a m365-license-server
   # Verify all required secrets present
   ```

3. **Volume mount issues:**
   ```bash
   fly volumes list -a m365-license-server
   # Verify volume is attached
   ```

4. **Restart app:**
   ```bash
   fly apps restart m365-license-server
   ```

### 13.2 Database Performance Issues

**Symptoms:**
- Slow query responses
- High memory usage
- Timeout errors

**Diagnosis:**

```bash
sqlite3 /data/licenses.db "
  -- Check database size
  SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();

  -- Check table sizes
  SELECT name, COUNT(*) FROM sqlite_master WHERE type='table' GROUP BY name;
"
```

**Solutions:**

1. **Vacuum database:**
   ```bash
   sqlite3 /data/licenses.db "VACUUM;"
   ```

2. **Rebuild indexes:**
   ```bash
   sqlite3 /data/licenses.db "REINDEX;"
   ```

3. **Analyze query patterns:**
   ```bash
   sqlite3 /data/licenses.db "ANALYZE;"
   ```

4. **Archive old data:**
   ```bash
   # Archive expired licenses older than 1 year
   sqlite3 /data/licenses.db "
     DELETE FROM licenses
     WHERE status = 'expired'
     AND expires_at < datetime('now', '-1 year');
   "
   ```

### 13.3 Email Delivery Failures

**Symptoms:**
- Customers not receiving licenses
- Resend dashboard shows failures
- High bounce rate

**Diagnosis:**

1. **Check Resend dashboard:**
   - Delivery rate
   - Bounce/spam complaints
   - API quota usage

2. **Check logs:**
   ```bash
   fly logs -a m365-license-server | grep "email"
   ```

3. **Test email sending:**
   ```bash
   curl -X POST https://api.ytech.tools/admin/test-email \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"to": "admin@example.com"}'
   ```

**Solutions:**

1. **Resend API key expired:**
   ```bash
   fly secrets set RESEND_API_KEY="new_api_key" -a m365-license-server
   ```

2. **Domain reputation issues:**
   - Check SPF/DKIM records
   - Review Resend domain health
   - Consider adding DMARC policy

3. **Rate limiting:**
   - Verify Resend API quota
   - Implement email queuing if needed

### 13.4 Stripe Webhook Issues

**Symptoms:**
- Payments not triggering license generation
- Webhook failures in Stripe dashboard
- Duplicate license generation

**Diagnosis:**

1. **Check Stripe webhook status:**
   - Stripe Dashboard → Webhooks → View logs
   - Check for 4xx/5xx errors

2. **Verify webhook endpoint:**
   ```bash
   curl https://api.ytech.tools/webhooks/stripe
   # Should return 405 Method Not Allowed (GET not supported)
   ```

3. **Check logs for webhook processing:**
   ```bash
   fly logs -a m365-license-server | grep "stripe_webhook"
   ```

**Solutions:**

1. **Webhook signature mismatch:**
   ```bash
   fly secrets set STRIPE_WEBHOOK_SECRET="whsec_..." -a m365-license-server
   ```

2. **Idempotency issues (duplicate processing):**
   - Verify database unique constraints
   - Check `transactions` table for duplicate `stripe_payment_id`

3. **Retry webhook manually:**
   - Stripe Dashboard → Webhooks → Event → "Resend"

### 13.5 License Validation Failures

**Symptoms:**
- Customer reports "License validation failed"
- Signature verification fails
- License appears valid in admin dashboard

**Diagnosis:**

1. **Check license in database:**
   ```bash
   sqlite3 /data/licenses.db "SELECT * FROM licenses WHERE email = 'customer@example.com';"
   ```

2. **Verify signature manually:**
   ```bash
   # Extract signature from database
   # Verify using m365-pro tool
   /app/m365-pro -feature picker -license /tmp/license.json -sig /tmp/license.sig
   ```

3. **Check public key distribution:**
   - Verify customer has correct `m365-compiled` package version
   - Check public key in package matches server public key

**Solutions:**

1. **Regenerate license:**
   ```
   Admin Dashboard → Customer Details → "Regenerate License"
   ```

2. **Customer has old public key:**
   - Instruct customer to update package:
     ```bash
     sudo apt update && sudo apt upgrade m365-compiled
     ```

3. **Signature corruption:**
   - Download license from admin dashboard
   - Verify files locally
   - If valid, customer's files corrupted → resend

---

## Quick Reference

### Essential Commands

```bash
# SSH into server
fly ssh console -a m365-license-server

# View logs
fly logs -a m365-license-server

# Check app status
fly status -a m365-license-server

# Update secrets
fly secrets set KEY=value -a m365-license-server

# Deploy changes
fly deploy --ha=false

# Database backup
cp /data/licenses.db /data/backups/manual-$(date +%Y%m%d).db

# Query database
sqlite3 /data/licenses.db "SELECT COUNT(*) FROM licenses WHERE status='active';"
```

### Emergency Contacts

- **Stripe Support:** https://support.stripe.com
- **Resend Support:** support@resend.com
- **Fly.io Support:** https://fly.io/support
- **Primary Admin:** support@ytech.tools

### Critical Files

```
/data/licenses.db              # Main database
/data/backups/                 # Automated backups
/app/m365-license-server       # Application binary
/app/m365-pro                  # License validation tool
```

### Dashboard URLs

- **Admin Dashboard:** https://api.ytech.tools/admin/dashboard
- **Customer Portal:** https://api.ytech.tools/portal/
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Resend Dashboard:** https://resend.com/dashboard
- **Fly.io Dashboard:** https://fly.io/dashboard

---

**Document Version:** 1.2
**Last Updated:** 2025-12-08
**Maintained By:** M365 WebApps Admin Team

**Changelog:**
- **v1.1.0 (2025-11-01)**: Added single active session enforcement, Analytics tab, Tax Reports tab, Cloudflare expense import, admin docs navigation link
- **v1.0.0 (2025-01-30)**: Initial comprehensive admin operations guide
