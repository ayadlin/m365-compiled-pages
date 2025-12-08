# Azure AD Enterprise Integration - IT Admin Setup Guide

**Configure Azure AD SSO and SCIM provisioning for M365 WebApps**

**Last Updated:** 2025-12-08

---

## Overview

M365 WebApps supports Azure AD enterprise integration, providing:
- Single Sign-On (SSO) for seamless authentication
- SCIM 2.0 automated user provisioning
- Centralized user management
- Enhanced security and compliance

This guide will walk you through configuring Azure AD for your organization.

---

## Prerequisites

- Azure AD tenant with administrator access
- Active M365 WebApps enterprise subscription
- Users with Microsoft 365 accounts in your Azure AD tenant

---

## Part 1: Register Azure AD Enterprise Application

### Step 1: Create Enterprise Application

1. Sign in to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **Enterprise applications**
3. Click **+ New application**
4. Click **+ Create your own application**
5. Enter application name: **M365 WebApps**
6. Select: **Integrate any other application you don't find in the gallery (Non-gallery)**
7. Click **Create**

### Step 2: Configure Single Sign-On

1. In your new enterprise application, go to **Single sign-on**
2. Select **SAML** as the SSO method
3. Click **Edit** on **Basic SAML Configuration**

Configure the following URLs:

```
Identifier (Entity ID): https://ytech.tools/m365/
Reply URL (Assertion Consumer Service URL): https://ytech.tools/auth/azure/callback
Sign on URL: https://ytech.tools/auth/azure/login
```

4. Click **Save**

### Step 3: Configure User Attributes & Claims

1. In the SAML configuration, click **Edit** on **Attributes & Claims**
2. Ensure these claims are configured:

| Claim Name | Value |
|------------|-------|
| `unique_user_identifier` | `user.userprincipalname` |
| `emailaddress` | `user.mail` |
| `name` | `user.displayname` |
| `givenname` | `user.givenname` |
| `surname` | `user.surname` |

3. Click **Save**

### Step 4: Get OAuth Credentials

1. Go to **Azure Active Directory** > **App registrations**
2. Find and click on **M365 WebApps**
3. Note your **Application (client) ID** - you'll need this
4. Click **Certificates & secrets**
5. Click **+ New client secret**
6. Add description: "M365 WebApps SSO"
7. Select expiration: **24 months** (recommended)
8. Click **Add**
9. **Important**: Copy the **Value** immediately - it won't be shown again

### Step 5: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - `User.Read` - Sign in and read user profile
   - `email` - View users' email address
   - `openid` - Sign users in
   - `profile` - View users' basic profile

6. Click **Add permissions**
7. Click **Grant admin consent for [Your Organization]**
8. Click **Yes** to confirm

---

## Part 2: Configure SCIM Provisioning

### Step 1: Enable Provisioning

1. Return to your enterprise application in Azure AD
2. Go to **Provisioning**
3. Click **Get started**
4. Set **Provisioning Mode** to **Automatic**

### Step 2: Get SCIM Configuration from M365 WebApps

1. Sign in to [M365 WebApps Enterprise Portal](https://ytech.tools/portal/enterprise/dashboard)
2. Navigate to **SCIM Tokens**
3. Click **Generate New Token**
4. Copy the following values:
   - **Tenant URL**: `https://ytech.tools/scim/v2`
   - **Secret Token**: (generated token - save securely)

### Step 3: Configure Azure AD Provisioning

1. Back in Azure Portal, under Admin Credentials:
   - **Tenant URL**: Paste `https://ytech.tools/scim/v2`
   - **Secret Token**: Paste your generated token

2. Click **Test Connection**
3. When you see "The supplied credentials are authorized to enable provisioning", click **Save**

### Step 4: Configure Attribute Mappings

1. Expand **Mappings**
2. Click **Provision Azure Active Directory Users**
3. Verify these attribute mappings:

| Azure AD Attribute | M365 WebApps Attribute |
|-------------------|------------------------|
| `userPrincipalName` | `userName` |
| `Switch([IsSoftDeleted], , "False", "True", "True", "False")` | `active` |
| `mail` | `emails[type eq "work"].value` |
| `displayName` | `displayName` |
| `givenName` | `name.givenName` |
| `surname` | `name.familyName` |

4. Click **Save**

### Step 5: Assign Users and Groups

1. Go to **Users and groups**
2. Click **+ Add user/group**
3. Select users or groups to provision to M365 WebApps
4. Click **Assign**

### Step 6: Start Provisioning

1. Go back to **Provisioning**
2. Set **Provisioning Status** to **On**
3. Click **Save**

**Note**: Initial sync can take 20-40 minutes. Subsequent syncs occur every 40 minutes automatically.

---

## Part 3: Configure M365 WebApps Server

### Set Environment Variables

On your M365 WebApps server, configure these environment variables:

```bash
export AZURE_CLIENT_ID="your-application-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
export AZURE_REDIRECT_URI="https://ytech.tools/auth/azure/callback"
```

Or add to your systemd service file:

```ini
[Service]
Environment="AZURE_CLIENT_ID=your-application-client-id"
Environment="AZURE_CLIENT_SECRET=your-client-secret"
Environment="AZURE_REDIRECT_URI=https://ytech.tools/auth/azure/callback"
```

Restart the service:

```bash
sudo systemctl restart m365-license-server
```

---

## Part 4: Verify Integration

### Test SSO

1. Open browser in private/incognito mode
2. Navigate to: https://ytech.tools/auth/azure/login
3. Sign in with an assigned user's Azure AD credentials
4. You should be redirected to M365 WebApps after successful authentication

### Verify Provisioning

1. Sign in to [Enterprise Portal](https://ytech.tools/portal/enterprise/dashboard)
2. Navigate to **Provisioned Users**
3. Verify your users appear in the list
4. Check **Audit Logs** for provisioning events

### Monitor Provisioning in Azure AD

1. In Azure Portal, go to your enterprise application
2. Navigate to **Provisioning**
3. Click **View provisioning logs**
4. Review sync status and any errors

---

## Part 5: Configure Conditional Access (Optional but Recommended)

Conditional access policies provide an additional security layer by enforcing access controls based on conditions.

### Why Use Conditional Access?

- **Enhanced Security**: Require MFA for M365 WebApps access
- **Location-Based Access**: Block or require MFA from untrusted locations
- **Device Compliance**: Require compliant or managed devices
- **Risk-Based Protection**: Block or challenge high-risk sign-ins

### Step 1: Create Conditional Access Policy

1. Navigate to **Azure Active Directory** > **Security** > **Conditional Access**
2. Click **+ New policy**
3. Name: **M365 WebApps - Require MFA**

### Step 2: Configure Assignments

**Users**:
- Include: Select **All users** or specific groups
- Exclude: Consider excluding emergency access accounts

**Cloud apps**:
- Select apps: Choose **M365 WebApps**

**Conditions** (configure as needed):
- Sign-in risk: Medium and high
- Device platforms: All or specific (iOS, Android, Windows, macOS)
- Locations: All locations or exclude trusted locations
- Client apps: Browser, Mobile apps and desktop clients

### Step 3: Configure Access Controls

**Grant**:
- Select **Grant access**
- Check **Require multi-factor authentication**
- Optionally add:
  - Require device to be marked as compliant
  - Require Hybrid Azure AD joined device
  - Require approved client app

**Session**:
- Sign-in frequency: Set to 7 days (or as required)
- Persistent browser session: Don't persist

### Step 4: Enable Policy

1. Set **Enable policy** to **Report-only** first (recommended for testing)
2. Click **Create**
3. Monitor sign-ins for 24-48 hours
4. Review sign-ins in **Sign-ins** > **Conditional Access** insights
5. Once verified, change policy to **On**

### Example Policies

**Policy 1: Require MFA for all users**
```
Users: All users
Cloud apps: M365 WebApps
Conditions: Any
Grant: Require MFA
```

**Policy 2: Block access from untrusted locations**
```
Users: All users
Cloud apps: M365 WebApps
Locations: All locations (exclude corporate network)
Grant: Require MFA OR Block access
```

**Policy 3: Require compliant device**
```
Users: All users
Cloud apps: M365 WebApps
Device platforms: All
Grant: Require MFA AND Require compliant device
```

---

## Part 6: Configure Provisioning Notifications

Stay informed about provisioning activities and failures with email notifications.

### Step 1: Enable Notification Emails

1. In your enterprise application, go to **Provisioning**
2. Expand **Settings**
3. Under **Notification**, configure:
   - **Notification Email**: Enter email addresses (comma-separated for multiple)
   - Check **Send an email notification when a failure occurs**

4. Click **Save**

### Step 2: Configure Azure Monitor Alerts (Advanced)

For more comprehensive monitoring:

1. Navigate to **Azure Active Directory** > **Monitoring** > **Diagnostic settings**
2. Click **+ Add diagnostic setting**
3. Name: **M365 WebApps Provisioning Monitoring**
4. Select log categories:
   - **ProvisioningLogs**
   - **AuditLogs** (for SSO events)
5. Destination: **Send to Log Analytics workspace**
6. Click **Save**

### Step 3: Create Alert Rules

1. Go to **Azure Monitor** > **Alerts** > **+ Create** > **Alert rule**
2. Select scope: Your Log Analytics workspace
3. Condition: Create custom query:

```kql
// Alert on provisioning failures
AuditLogs
| where Category == "Provisioning"
| where OperationName == "Export"
| where ResultType == "Failure"
| project TimeGenerated, OperationName, ResultDescription, TargetResources
```

4. Actions: Create action group
   - Add email/SMS/webhook notifications
   - Enter recipient details

5. Alert details:
   - Severity: 2 - Warning (for provisioning failures)
   - Severity: 1 - Error (for authentication failures)

6. Click **Create alert rule**

### Step 4: Monitor M365 WebApps Portal

The Enterprise Portal provides real-time monitoring:

1. Sign in to: https://ytech.tools/portal/enterprise/dashboard
2. **Dashboard** - Overview of provisioning statistics
3. **Audit Logs** - Real-time authentication events
4. **Provisioned Users** - User provisioning status

### Notification Types You'll Receive

**Provisioning Failures**:
- User creation failures
- Attribute mapping errors
- SCIM token authentication issues
- Quota exceeded errors

**Authentication Events** (via Azure Monitor):
- Failed sign-in attempts
- Conditional access policy blocks
- High-risk sign-ins detected

### Best Practices for Notifications

1. **Use distribution lists**: Send notifications to IT admin team, not individuals
2. **Set up escalation**: Configure webhooks to ticketing systems
3. **Regular review**: Check notification settings quarterly
4. **Test notifications**: Generate test provisioning event to verify delivery
5. **Document runbooks**: Create response procedures for common alerts

---

## Security Best Practices

1. **Rotate client secrets regularly**: Set a reminder to rotate before expiration
2. **Use conditional access**: Configure Azure AD conditional access policies (see Part 5)
3. **Monitor audit logs**: Regularly review authentication and provisioning logs
4. **Limit SCIM token access**: Only share tokens with authorized administrators
5. **Enable MFA**: Require multi-factor authentication for all users
6. **Review app permissions**: Periodically audit API permissions
7. **Set up alerts**: Configure email notifications for provisioning failures (see Part 6)
8. **Test disaster recovery**: Verify backup and restore procedures for user data

---

## Support

For assistance with Azure AD integration:
- Email: support@ytech.tools
- Documentation: https://ytech.tools/docs/
- Enterprise Portal: https://ytech.tools/portal/enterprise/dashboard

---

## Next Steps

- [End User SSO Guide](AZURE_AD_SSO.md) - Share with your users
- [Troubleshooting Guide](AZURE_AD_TROUBLESHOOTING.md) - Common issues and solutions
- Configure conditional access policies in Azure AD
- Set up email notifications for provisioning events
