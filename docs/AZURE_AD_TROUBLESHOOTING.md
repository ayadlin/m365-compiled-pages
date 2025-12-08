# Azure AD Integration - Troubleshooting Guide

**Solutions for common Azure AD SSO and SCIM issues**

**Last Updated:** 2025-12-08

---

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Provisioning Issues](#provisioning-issues)
3. [Application Launch Issues](#application-launch-issues)
4. [Token and Session Issues](#token-and-session-issues)
5. [Network and Connectivity](#network-and-connectivity)
6. [Diagnostic Commands](#diagnostic-commands)
7. [Getting Support](#getting-support)

---

## Authentication Issues

### Error: "Access Denied" or "401 Unauthorized"

**Symptoms**:
- User cannot sign in via Azure AD
- Gets "Access Denied" message after authentication
- Sees 401 Unauthorized error

**Possible Causes**:
1. User not assigned to M365 WebApps in Azure AD
2. User not provisioned via SCIM
3. SCIM provisioning failed or incomplete
4. User account inactive in Azure AD

**Solutions**:

**For IT Admins**:
1. Verify user assignment:
   ```
   Azure Portal > Enterprise Applications > M365 WebApps > Users and groups
   ```
   - Ensure user or their group is assigned

2. Check provisioning status:
   ```
   Azure Portal > Enterprise Applications > M365 WebApps > Provisioning > View provisioning logs
   ```
   - Look for user's provisioning event
   - Check for any errors

3. Verify user in M365 WebApps:
   - Sign in to Enterprise Portal: https://ytech.tools/portal/enterprise/dashboard
   - Navigate to **Provisioned Users**
   - Search for user's email
   - Check status is "active"

4. Manual re-provision if needed:
   ```
   Azure Portal > Provisioning > Provision on demand
   ```
   - Enter user's principal name
   - Click **Provision**

**For End Users**:
- Contact your IT help desk
- Provide your work email address
- Mention the exact error message

---

### Error: "AADSTS50105: User is not assigned to the application"

**Symptoms**:
- Azure AD error during sign-in
- Error code AADSTS50105

**Cause**: User hasn't been assigned to the M365 WebApps enterprise application.

**Solution** (IT Admin):
1. Go to: `Azure Portal > Enterprise Applications > M365 WebApps`
2. Click **Users and groups**
3. Click **+ Add user/group**
4. Select the user or their group
5. Click **Assign**
6. Wait 5-10 minutes for assignment to propagate
7. User should try signing in again

---

### Error: "AADSTS65001: Consent Required"

**Symptoms**:
- Error during first sign-in
- Message about admin consent

**Cause**: Application permissions require admin consent, but it hasn't been granted.

**Solution** (IT Admin):
1. Go to: `Azure Portal > App registrations > M365 WebApps`
2. Click **API permissions**
3. Click **Grant admin consent for [Your Organization]**
4. Click **Yes** to confirm
5. Users can now sign in without individual consent

---

### Infinite Redirect Loop / Stuck on "Signing in..."

**Symptoms**:
- Browser keeps redirecting between M365 WebApps and Microsoft
- Never completes authentication
- Page loads indefinitely

**Cause**: Browser cookies blocked, third-party cookie restrictions, or cached session data.

**Solutions**:

**For End Users**:
1. Clear browser cache and cookies:
   - Chrome: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Firefox: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Edge: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)

2. Try incognito/private browsing mode

3. Check third-party cookies are allowed:
   - Chrome: `Settings > Privacy and security > Cookies and other site data`
   - Select "Allow all cookies" or add exception for `*.microsoftonline.com` and `*.ytech.tools`

4. Try a different browser

5. Disable browser extensions that might block cookies

6. Check if corporate VPN or proxy is interfering

**For IT Admins**:
- Verify redirect URIs are correct in Azure AD app registration
- Check that no conditional access policies are blocking access
- Review firewall rules aren't blocking authentication endpoints

---

## Provisioning Issues

### Users Not Appearing in Provisioned Users List

**Symptoms**:
- Users assigned in Azure AD but not showing in M365 WebApps
- Enterprise Portal shows no provisioned users

**Solutions** (IT Admin):

1. **Check provisioning is enabled**:
   ```
   Azure Portal > Enterprise Applications > M365 WebApps > Provisioning
   ```
   - Verify **Provisioning Status** is **On**
   - Check **Current cycle status** isn't showing errors

2. **Review provisioning logs**:
   ```
   Azure Portal > Provisioning > View provisioning logs
   ```
   - Look for CREATE or UPDATE actions
   - Check for failures with error details

3. **Verify SCIM configuration**:
   - Tenant URL: `https://ytech.tools/scim/v2`
   - Secret Token: Valid and not expired
   - Test Connection should succeed

4. **Check SCIM token**:
   - Sign in to Enterprise Portal
   - Navigate to **SCIM Tokens**
   - Verify token is Active
   - Check **Last Used At** is recent
   - Generate new token if needed and update in Azure AD

5. **Manual provision**:
   ```
   Azure Portal > Provisioning > Provision on demand
   ```
   - Enter user's UserPrincipalName
   - Click **Provision**
   - Review detailed step-by-step results

6. **Restart provisioning cycle**:
   ```
   Azure Portal > Provisioning > Restart provisioning
   ```
   - Click **Yes** to confirm
   - Initial sync will run again (takes 20-40 minutes)

---

### Error: "Failed to Create User" in Provisioning Logs

**Symptoms**:
- Provisioning log shows "Failed to create user"
- Error codes like 400, 403, or 500

**Common Errors**:

**400 Bad Request - Invalid Attribute Mapping**:
```
Cause: Required attributes missing or invalid format
Solution: Check attribute mappings match SCIM schema
```

**403 Forbidden - Invalid SCIM Token**:
```
Cause: SCIM token expired, revoked, or incorrect
Solution: Generate new token in Enterprise Portal and update in Azure AD
```

**409 Conflict - User Already Exists**:
```
Cause: User with same userName already exists
Solution: Verify attribute mappings for userName field, or delete duplicate user
```

**500 Internal Server Error**:
```
Cause: Server-side issue processing request
Solution: Check M365 WebApps server logs, verify database connectivity
```

---

### Provisioning Sync Taking Too Long

**Symptoms**:
- Initial sync started hours ago but not complete
- Users still not appearing

**Expected Timing**:
- Initial sync: 20-40 minutes for first batch
- Incremental syncs: Every 40 minutes
- Large directories (1000+ users): May take several hours

**Solutions** (IT Admin):

1. **Check sync is actually running**:
   ```
   Azure Portal > Provisioning > Current cycle status
   ```
   - Should show "In progress" or next sync time

2. **Review progress**:
   ```
   Azure Portal > Provisioning > View provisioning logs
   ```
   - Filter by date range
   - Look for successful CREATE actions
   - Check how many users processed so far

3. **For large deployments**:
   - Consider scoping rules to provision in batches
   - Start with a pilot group (50-100 users)
   - Gradually add more users/groups

4. **Monitor server resources**:
   - Check M365 WebApps server CPU/memory
   - Check database performance
   - Ensure adequate resources for SCIM requests

---

## Application Launch Issues

### Applications Won't Start After SSO

**Symptoms**:
- SSO succeeds but apps don't launch
- Desktop launchers show error

**Solutions**:

**For End Users**:
1. Verify M365 WebApps is installed:
   ```bash
   which m365ctl
   ```
   Should output: `/usr/bin/m365ctl`

2. Check license status:
   ```bash
   m365ctl -mode check-license
   ```

3. Try manual launch:
   ```bash
   m365ctl -app word
   ```

4. Check for error messages:
   ```bash
   journalctl --user -u m365-webapps -n 50
   ```

**For IT Admins**:
1. Verify license server is running:
   ```bash
   sudo systemctl status m365-license-server
   ```

2. Check server logs:
   ```bash
   sudo journalctl -u m365-license-server -f
   ```

3. Verify environment variables are set:
   ```bash
   sudo systemctl show m365-license-server | grep AZURE
   ```

4. Test OAuth flow manually:
   ```bash
   curl -v https://ytech.tools/auth/azure/login
   ```

---

## Token and Session Issues

### "Session Expired" Messages

**Symptoms**:
- User gets logged out frequently
- Apps require re-authentication

**Solutions**:

**For End Users**:
1. When signing in, check **Stay signed in** on Microsoft login page
2. Keep browser open in background
3. Ensure cookies are enabled and not being cleared automatically

**For IT Admins**:
1. Check Azure AD session lifetime settings:
   ```
   Azure Portal > Azure Active Directory > Security > Conditional Access
   ```
   - Review sign-in frequency settings
   - Adjust if too restrictive

2. Review token lifetime policies

3. Check if conditional access policies are forcing re-authentication

---

### SCIM Token Expired or Invalid

**Symptoms**:
- Provisioning stopped working
- "403 Forbidden" in provisioning logs
- Test Connection fails

**Solution** (IT Admin):

1. Generate new SCIM token:
   - Sign in to: https://ytech.tools/portal/enterprise/dashboard
   - Navigate to **SCIM Tokens**
   - Click **Generate New Token**
   - Copy the token immediately (it won't be shown again)

2. Update token in Azure AD:
   ```
   Azure Portal > Enterprise Applications > M365 WebApps > Provisioning
   ```
   - Click **Edit Provisioning**
   - Update **Secret Token** field
   - Click **Test Connection**
   - Should show: "The supplied credentials are authorized"
   - Click **Save**

3. Restart provisioning:
   - Set **Provisioning Status** to **Off**, save
   - Set back to **On**, save
   - Initial sync will start again

---

## Network and Connectivity

### Cannot Reach Azure AD Endpoints

**Symptoms**:
- Timeout errors during authentication
- "Cannot connect to server" messages

**Solutions**:

**For End Users**:
1. Check internet connectivity
2. Try accessing: https://login.microsoftonline.com
3. Disable VPN temporarily to test
4. Check corporate firewall/proxy settings

**For IT Admins**:

Required domains for allowlist:
```
*.microsoftonline.com
*.windows.net
*.microsoft.com
*.ytech.tools
login.live.com
```

Required ports:
- 443 (HTTPS)
- 80 (HTTP redirects)

Test connectivity:
```bash
curl -v https://login.microsoftonline.com
curl -v https://graph.microsoft.com/v1.0
curl -v https://ytech.tools/auth/azure/login
```

---

### SCIM Provisioning Network Errors

**Symptoms**:
- "Connection timeout" in provisioning logs
- SCIM requests failing

**Solutions** (IT Admin):

1. Verify SCIM endpoint is reachable from Azure:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" https://ytech.tools/scim/v2/Users
   ```

2. Check firewall rules allow inbound HTTPS from Azure IP ranges

3. Verify SSL certificate is valid:
   ```bash
   openssl s_client -connect ytech.tools:443 -servername ytech.tools
   ```

4. Check M365 WebApps server is running:
   ```bash
   sudo systemctl status m365-license-server
   ```

5. Review server error logs:
   ```bash
   sudo journalctl -u m365-license-server | grep scim
   ```

---

## Diagnostic Commands

### Check Azure AD Configuration

**IT Admin - Azure Portal**:

```
# View app registration
Azure Portal > App registrations > M365 WebApps

# Check OAuth configuration
- Application (client) ID: [note this down]
- Redirect URIs: Should include https://ytech.tools/auth/azure/callback
- Client secrets: Should have active secret

# View enterprise application
Azure Portal > Enterprise Applications > M365 WebApps

# Check assignments
- Users and groups: Should list assigned users
- Single sign-on: Should be configured for OAuth 2.0
- Provisioning: Should be enabled and status "On"
```

### Check M365 WebApps Server

**IT Admin - Server Terminal**:

```bash
# Check service status
sudo systemctl status m365-license-server

# View recent logs
sudo journalctl -u m365-license-server -n 100

# Check Azure AD environment variables
sudo systemctl show m365-license-server | grep AZURE_

# Test OAuth endpoints
curl -v https://ytech.tools/auth/azure/login
curl -v https://ytech.tools/auth/azure/callback

# Check SCIM endpoint
curl -v https://ytech.tools/scim/v2/Users

# View database users
sqlite3 /var/lib/m365-license-server/licenses.db "SELECT * FROM azure_assignments LIMIT 10;"

# Check authentication events
sqlite3 /var/lib/m365-license-server/licenses.db "SELECT * FROM azure_auth_events ORDER BY created_at DESC LIMIT 10;"
```

### End User Diagnostics

**End User - Terminal**:

```bash
# Check M365 WebApps installation
which m365ctl
m365ctl -mode check-license

# Check running processes
ps aux | grep chromium

# View user logs
journalctl --user -n 50

# Test manual app launch
m365ctl -app word

# Check browser process
pgrep -f chromium | xargs -I{} cat /proc/{}/cmdline | tr '\0' ' '
```

---

## Getting Support

### Information to Gather Before Contacting Support

**For IT Admins**:

1. **Azure AD Configuration**:
   - Tenant ID
   - Application (client) ID
   - Screenshot of app registration settings
   - Screenshot of provisioning logs (redact sensitive info)

2. **Server Logs**:
   ```bash
   sudo journalctl -u m365-license-server -n 200 > m365-server-logs.txt
   ```

3. **Environment Details**:
   - M365 WebApps version: `dpkg -l | grep m365-compiled`
   - OS version: `lsb_release -a`
   - Server hostname/IP

4. **Error Details**:
   - Exact error message
   - Time of occurrence
   - Steps to reproduce
   - Number of affected users

**For End Users**:
- Your work email address
- Exact error message (screenshot if possible)
- What you were trying to do
- Browser and version
- Whether it worked before

### Contact Information

**M365 WebApps Support**:
- Email: support@ytech.tools
- Subject line: "Azure AD Integration Issue - [Brief Description]"
- Include diagnostic information above

**Enterprise Portal**:
- Dashboard: https://ytech.tools/portal/enterprise/dashboard
- View audit logs and provisioned users

**Microsoft Azure Support**:
- For Azure AD-specific issues (not M365 WebApps related)
- Azure Portal > Help + support > New support request

---

## Additional Resources

- [IT Admin Setup Guide](AZURE_AD_SETUP.md) - Initial configuration steps
- [End User SSO Guide](AZURE_AD_SSO.md) - User sign-in instructions
- [M365 WebApps User Guide](USER_GUIDE.md) - General application usage
- [Microsoft Azure AD Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
- [SCIM 2.0 Protocol Specification](https://tools.ietf.org/html/rfc7644)
