# Azure AD Single Sign-On - End User Guide

**Sign in to M365 WebApps with your work account**

---

## Overview

If your organization uses Azure AD (Microsoft 365 work accounts), you can sign in to M365 WebApps using Single Sign-On (SSO). This means:

- No separate username/password to remember
- Automatic access when configured by your IT administrator
- Seamless authentication with your existing Microsoft 365 credentials
- Enhanced security with your organization's security policies

---

## Prerequisites

Your IT administrator must have:
- Configured Azure AD integration for M365 WebApps
- Assigned you access to the M365 WebApps application
- Provisioned your account via SCIM

If you're unsure, contact your IT help desk.

---

## Signing In with Azure AD

### First-Time Sign In

1. **Launch M365 WebApps**
   - Open any M365 WebApp (Word, Excel, PowerPoint, etc.)
   - Or visit: https://ytech.tools/auth/azure/login

2. **Microsoft Sign-In Page**
   - You'll be redirected to Microsoft's sign-in page
   - Enter your work email address (e.g., `yourname@company.com`)
   - Click **Next**

3. **Enter Your Password**
   - Enter your work account password
   - If your organization requires MFA, complete the additional verification step
   - Check **Stay signed in** if you want to remember your sign-in (optional)
   - Click **Sign in**

4. **Grant Permissions (First Time Only)**
   - You may see a permissions request screen
   - Review the permissions M365 WebApps is requesting:
     - View your basic profile
     - Read your email address
     - Maintain access to data you have given it access to
   - Click **Accept**

5. **Success**
   - You'll be redirected back to M365 WebApps
   - Your applications should now launch automatically

---

## Using M365 WebApps After Sign-In

### Desktop Applications

Once signed in, you can launch M365 WebApps from your application menu:

- **Microsoft Word** - Full-featured word processor
- **Microsoft Excel** - Spreadsheet application
- **Microsoft PowerPoint** - Presentation software
- **Microsoft Outlook** - Email and calendar (web-based)
- **Microsoft OneNote** - Note-taking application
- **Microsoft OneDrive** - Cloud storage access

### Command Line

You can also launch applications from the terminal:

```bash
m365ctl -app word
m365ctl -app excel
m365ctl -app powerpoint
m365ctl -app onenote
```

---

## Session Management

### Session Duration

- Your SSO session typically lasts 8-24 hours (configured by your IT admin)
- After session expiration, you'll need to sign in again
- Some organizations may require sign-in for each application launch

### Staying Signed In

To minimize sign-in prompts:
1. Check **Stay signed in** when signing into Microsoft
2. Keep your web browser open in the background
3. Ensure cookies are enabled in your browser

### Manual Sign Out

To sign out of M365 WebApps:

1. Visit: https://ytech.tools/portal/enterprise/dashboard
2. Click your profile icon
3. Select **Sign Out**
4. To fully sign out of Microsoft: https://login.microsoftonline.com/common/oauth2/v2.0/logout

---

## Troubleshooting

### "Access Denied" or "Unauthorized" Error

**Cause**: Your account hasn't been assigned to M365 WebApps in Azure AD.

**Solution**: Contact your IT administrator to:
1. Verify you're assigned to the M365 WebApps application
2. Check that provisioning has completed for your account
3. Review the provisioning logs for any errors

### Stuck on "Signing in..." or Infinite Loop

**Cause**: Browser cookie/cache issues or session conflicts.

**Solution**:
1. Clear your browser cache and cookies
2. Try in an incognito/private browsing window
3. Try a different browser (Chrome, Edge, Firefox)
4. Restart your browser completely

### "Interaction Required" Error

**Cause**: Azure AD needs you to complete additional authentication steps.

**Solution**:
1. Click the **Sign in** button when prompted
2. Complete any MFA challenges (enter code, approve push notification, etc.)
3. If using YubiKey or other hardware token, ensure it's plugged in

### Applications Won't Launch

**Cause**: M365 WebApps package not installed or authentication session expired.

**Solution**:
1. Verify M365 WebApps is installed: `which m365ctl`
2. Check authentication status: `m365ctl -mode check-auth`
3. Try signing in again: https://ytech.tools/auth/azure/login
4. Check system logs: `journalctl -u m365-license-server -f`

### Password Change Required

If your organization requires you to change your password:

1. Visit: https://myaccount.microsoft.com
2. Sign in with your current credentials
3. Go to **Security** > **Change password**
4. Follow the prompts to set a new password
5. Sign out of M365 WebApps and sign back in with your new password

---

## Security Best Practices

### Protect Your Account

1. **Use a strong password**: Follow your organization's password policy
2. **Enable MFA**: If not already required, enable multi-factor authentication
3. **Don't share credentials**: Never share your work account password
4. **Report suspicious activity**: Contact IT immediately if you notice unusual sign-ins
5. **Lock your screen**: Always lock your computer when stepping away

### Safe Browsing

1. **Verify URLs**: Always check you're on legitimate Microsoft sign-in pages
2. **Avoid public Wi-Fi**: Use VPN when signing in on public networks
3. **Keep software updated**: Ensure your OS and browser are up to date
4. **Use company devices**: Sign in only on IT-approved devices when possible

---

## Privacy

### What Data Does M365 WebApps Access?

M365 WebApps requests minimal permissions:

- **Profile information**: Name, email address, user ID
- **Email address**: Used for account identification
- **Authentication status**: To verify you're signed in

M365 WebApps **does not**:
- Read your emails or calendar
- Access your files or documents
- Monitor your activity beyond authentication
- Share your data with third parties

### Data Storage

- Authentication tokens are stored securely on your local device
- Session data is encrypted in transit and at rest
- Your IT administrator can review sign-in activity in audit logs

---

## FAQ

### Do I need a separate M365 WebApps account?

No. If your organization uses Azure AD SSO, you sign in with your existing work account. No separate registration is required.

### Can I use my personal Microsoft account?

No. Azure AD SSO is for work/school accounts only. Personal Microsoft accounts (like @outlook.com, @hotmail.com) are not supported for enterprise SSO.

### Will this affect my other Microsoft 365 apps?

No. Signing in to M365 WebApps does not affect your access to other Microsoft 365 services like Teams, Outlook, or SharePoint.

### Can I use M365 WebApps on multiple computers?

Yes, as long as your IT administrator has licensed multiple devices for your account. Check with IT for your organization's policy.

### What if I leave the company?

When you leave, your IT administrator will deprovision your account. You will automatically lose access to M365 WebApps, and all local session data will be invalidated.

---

## Need Help?

### Contact Your IT Department

For account-specific issues:
- Account access problems
- Password resets
- MFA setup
- Device authorization

### M365 WebApps Support

For application issues:
- Email: support@ytech.tools
- Documentation: https://ytech.tools/docs/
- Enterprise Portal: https://ytech.tools/portal/enterprise/dashboard

---

## Additional Resources

- [IT Admin Setup Guide](AZURE_AD_SETUP.md) - For your IT administrator
- [Troubleshooting Guide](AZURE_AD_TROUBLESHOOTING.md) - Detailed solutions
- [User Guide](USER_GUIDE.md) - Full M365 WebApps documentation
- [Quick Start](QUICK_START.md) - Getting started guide
