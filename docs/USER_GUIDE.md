# M365 WebApps - Complete User Guide

**Run Microsoft Office on Linux with Native Desktop Integration**

**Last Updated:** 2025-01-30

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Requirements](#2-system-requirements)
3. [Installation](#3-installation)
4. [Getting Your License](#4-getting-your-license)
5. [License Activation](#5-license-activation)
6. [Using M365 WebApps](#6-using-m365-webapps)
7. [Managing Your Account](#7-managing-your-account)
8. [Troubleshooting](#8-troubleshooting)
9. [FAQ](#9-faq)
10. [Getting Support](#10-getting-support)

---

## 1. Introduction

### 1.1 What is M365 WebApps?

**M365 WebApps** brings Microsoft Office applications to Linux as native desktop apps. Instead of opening a browser and navigating to Office.com every time you want to use Word or Excel, M365 WebApps provides:

- **Desktop launchers** for each Microsoft app
- **Dedicated windows** that feel like native applications
- **Taskbar integration** with proper window management
- **Offline license verification** that doesn't require constant internet connectivity
- **Isolated browser profiles** for multi-account support

### 1.2 What's Included?

M365 WebApps provides desktop integration for these Microsoft 365 applications:

- **Microsoft Word** - Document creation and editing
- **Microsoft Excel** - Spreadsheets and data analysis
- **Microsoft PowerPoint** - Presentations and slideshows
- **Microsoft Outlook** - Email and calendar
- **Microsoft OneNote** - Note-taking and organization
- **Microsoft Teams** - Chat, meetings, and collaboration
- **Microsoft OneDrive** - Cloud file storage and sync

### 1.3 How It Works

M365 WebApps uses your installed Chromium-based browser (Chrome, Chromium, or Edge) to run the official Microsoft Office web apps in dedicated windows. Each application:

1. Runs in its own isolated browser profile
2. Maintains separate login sessions
3. Appears as a native desktop application
4. Uses cryptographically-signed licenses for offline verification

**Important:** You still need a Microsoft 365 subscription to use Office apps. M365 WebApps provides the desktop integration layer for Linux.

### 1.4 Available Plans

| Plan | Price | Devices | Best For |
|------|-------|---------|----------|
| **Free Trial** | $0 | 1 device, 30 days | Trying the product |
| **Pro** | $9.99/month | 1 device | Individual users |
| **Team** | $29.99/month | 10 devices | Small teams |
| **Enterprise** | $99.99/month | Unlimited devices | Large organizations |

*Prices subject to change. See https://ytech.tools/m365/ for current pricing.*

---

## 2. System Requirements

### 2.1 Operating System

**Supported:**
- Ubuntu 20.04 LTS or newer
- Debian 11 (Bullseye) or newer
- Linux Mint 20 or newer
- Pop!_OS 20.04 or newer
- Other Debian-based distributions

**Architecture:**
- x86_64 (AMD64) only
- ARM architectures not currently supported

### 2.2 Required Software

**Essential:**
- **Chromium-based browser**: Google Chrome, Chromium, or Microsoft Edge
- **Internet connection**: Required for Microsoft 365 login and Office app functionality
- **Desktop environment**: GNOME, KDE, XFCE, or similar

**Recommended:**
- 4GB RAM or more
- Modern multi-core processor
- 2GB free disk space

### 2.3 Microsoft 365 Subscription

You must have one of these Microsoft 365 subscriptions:

- Microsoft 365 Personal
- Microsoft 365 Family
- Microsoft 365 Business Basic
- Microsoft 365 Business Standard
- Microsoft 365 Business Premium
- Office 365 E1/E3/E5

**Free Microsoft accounts** can access limited functionality in Office web apps, but paid subscriptions are recommended for full features.

---

## 3. Installation

### 3.1 Install via APT Repository (Recommended)

This method ensures you'll receive automatic updates.

**Step 1: Add the Repository**

Open a terminal and run:

```bash
echo "deb [trusted=yes] https://ytech.tools stable main" | sudo tee /etc/apt/sources.list.d/m365-compiled.list
```

**Step 2: Update Package Lists**

```bash
sudo apt update
```

**Step 3: Install M365 WebApps**

```bash
sudo apt install m365-compiled
```

**Step 4: Install Desktop Launchers**

```bash
m365ctl -mode install
```

You should now see Microsoft Office applications in your application menu.

### 3.2 Install via .deb Package

If you prefer manual installation or don't want automatic updates:

**Step 1: Download the Package**

```bash
wget https://ytech.tools/pool/main/m365-compiled_latest_amd64.deb
```

**Step 2: Install the Package**

```bash
sudo dpkg -i m365-compiled_latest_amd64.deb
```

**Step 3: Install Desktop Launchers**

```bash
m365ctl -mode install
```

### 3.3 Verifying Installation

Check that the installation was successful:

```bash
# Check installed version
dpkg -l | grep m365-compiled

# Verify desktop launchers
ls ~/.local/share/applications/ | grep Microsoft

# Test launcher tool
m365-launch -help
```

You should see:
- Package version information
- Desktop launcher files (`.desktop` files)
- Help output from `m365-launch`

### 3.4 Installing a Browser (If Needed)

M365 WebApps requires a Chromium-based browser. If you don't have one installed:

**Install Google Chrome:**
```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt install -f  # Fix any dependency issues
```

**Or Install Chromium:**
```bash
sudo apt install chromium-browser
```

**Or Install Microsoft Edge:**
```bash
curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
sudo install -o root -g root -m 644 microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/edge stable main" > /etc/apt/sources.list.d/microsoft-edge.list'
sudo apt update
sudo apt install microsoft-edge-stable
```

---

## 4. Getting Your License

### 4.1 Free Trial

Try M365 WebApps free for 30 days with full functionality.

**Step 1: Visit the Trial Page**

Navigate to: https://ytech.tools/m365/trial.html

**Step 2: Fill Out the Form**

Enter:
- Your full name
- Email address (where license files will be sent)
- Phone number (optional)
- Company name (optional)
- Accept the Terms of Service

**Step 3: Submit**

Click **"Generate Free Trial License"**

**Step 4: Check Your Email**

You'll receive an email with:
- `license.json` - Your license file
- `license.sig` - Cryptographic signature

Download both files to a known location (e.g., `~/Downloads/`).

**Note:** Trial licenses are valid for 30 days from issuance and work on 1 device.

### 4.2 Purchasing a Plan

**Step 1: Visit the Pricing Page**

Navigate to: https://ytech.tools/m365/pricing.html

**Step 2: Choose Your Plan**

Select the plan that fits your needs:
- **Pro**: Individual use, 1 device
- **Team**: Small team, 10 devices
- **Enterprise**: Large organization, unlimited devices

**Step 3: Complete Checkout**

Click **"Subscribe"** and you'll be redirected to Stripe Checkout:
1. Enter your email
2. Enter payment information
3. Review subscription details
4. Click **"Subscribe"**

**Step 4: Receive Your License**

Within 2-3 minutes, you'll receive an email with:
- `license.json`
- `license.sig`
- Activation instructions

**Important:** Save these files securely. You'll need them to activate M365 WebApps on your device.

### 4.3 Managing Subscriptions

**Access Billing Portal:**

1. Visit: https://ytech.tools/m365/pricing.html
2. Scroll to **"Manage Your Billing"**
3. Enter your email or company name
4. Click **"Open Billing Portal"**

**In the Billing Portal, you can:**
- Update payment method
- View invoices
- Cancel subscription
- Update billing information

**Subscription Renewal:**
- Paid subscriptions auto-renew monthly
- Your license expiration is automatically extended
- You'll receive an email confirmation
- No action needed on your part

**Cancellation:**
- You can cancel anytime
- Access continues until the end of your paid period
- No refunds for partial months
- You can resubscribe at any time

---

## 5. License Activation

### 5.1 One-Time Activation

After receiving your license files, activate M365 WebApps on your device.

**Step 1: Create Config Directory**

```bash
mkdir -p ~/.config/m365_webapps
```

**Step 2: Copy License Files**

```bash
# Assuming files are in ~/Downloads/
cp ~/Downloads/license.json ~/.config/m365_webapps/
cp ~/Downloads/license.sig ~/.config/m365_webapps/
```

**Step 3: Verify Activation**

```bash
m365-pro -feature picker \
  -license ~/.config/m365_webapps/license.json \
  -sig ~/.config/m365_webapps/license.sig
```

**Expected Output:**
```
ok:pro:your@email.com
```

This means your license is valid!

**Output Meanings:**
- `ok:free:email` - Free trial license, valid
- `ok:pro:email` - Pro license, valid
- `ok:team:email` - Team license, valid
- `ok:enterprise:email` - Enterprise license, valid
- `error:...` - License validation failed (see troubleshooting)

### 5.2 Team Device Registration

**For Team and Enterprise plans only.** These plans track which devices are using the license.

**Automatic Registration:**

The first time you launch an app with a Team or Enterprise license, your device is automatically registered. No manual action needed!

**What Gets Registered:**
- Device hostname
- Username
- Unique device fingerprint (hardware-based)

**Device Limits:**
- **Team Plan**: Maximum 10 devices
- **Enterprise Plan**: Unlimited devices

**Checking Your Device:**

```bash
# Your device fingerprint is shown during validation
m365-pro -feature picker \
  -license ~/.config/m365_webapps/license.json \
  -sig ~/.config/m365_webapps/license.sig
```

**Removing a Device:**

If you've reached your device limit, contact support at ytechm365@gmail.com to remove old devices.

### 5.3 Renewing Your License

When you receive a renewal license (after subscription renews):

**Step 1: Receive New Files**

You'll get updated `license.json` and `license.sig` files via email.

**Step 2: Replace Old Files**

```bash
# Backup old files (optional)
cp ~/.config/m365_webapps/license.json ~/.config/m365_webapps/license.json.old
cp ~/.config/m365_webapps/license.sig ~/.config/m365_webapps/license.sig.old

# Copy new files
cp ~/Downloads/license.json ~/.config/m365_webapps/
cp ~/Downloads/license.sig ~/.config/m365_webapps/
```

**Step 3: Verify New License**

```bash
m365-pro -feature picker \
  -license ~/.config/m365_webapps/license.json \
  -sig ~/.config/m365_webapps/license.sig
```

**Note:** Your device registration is preserved - no need to re-register!

---

## 6. Using M365 WebApps

### 6.1 Launching Applications

**Via Application Menu:**

1. Open your application menu (Activities, Start Menu, etc.)
2. Search for "Microsoft Word", "Microsoft Excel", etc.
3. Click the application icon to launch

**Via Command Line:**

```bash
# Launch Word
m365-launch -app word

# Launch Excel
m365-launch -app excel

# Launch PowerPoint
m365-launch -app powerpoint

# Launch Outlook
m365-launch -app outlook

# Launch OneNote
m365-launch -app onenote

# Launch Teams
m365-launch -app teams

# Launch OneDrive
m365-launch -app onedrive
```

### 6.2 First-Time Setup

**When you launch an app for the first time:**

1. **Microsoft Login Screen Appears**
   - This is the official Microsoft login page
   - Your credentials never go through M365 WebApps servers
   - All authentication is directly with Microsoft

2. **Sign In**
   - Enter your Microsoft 365 email
   - Enter your password
   - Complete two-factor authentication if enabled

3. **Grant Permissions (if asked)**
   - Allow the Office app to access your Microsoft account
   - This is standard for Office 365 web apps

4. **App Opens**
   - You're now ready to use the application!
   - Your session is saved in the app's browser profile

### 6.3 Working with Files

**Opening Files:**

1. **From within the app:**
   - Click File → Open
   - Browse OneDrive or upload from computer

2. **From file manager:**
   - Right-click a file (`.docx`, `.xlsx`, `.pptx`)
   - Select "Open With" → "Microsoft Word/Excel/PowerPoint"

3. **From command line:**
   ```bash
   m365-launch -app word -file ~/Documents/report.docx
   ```

**Saving Files:**

- **To OneDrive (recommended):**
  - Click File → Save
  - Choose OneDrive location
  - Files automatically sync across devices

- **To Local Computer:**
  - Click File → Download
  - File saves to your Downloads folder
  - Or use File → Save As → Download a Copy

**Real-Time Collaboration:**

All standard Office 365 collaboration features work:
- Share documents with others
- Real-time co-authoring
- Comments and track changes
- Version history

### 6.4 Multiple Microsoft Accounts

Each M365 WebApps application uses an **isolated browser profile**, allowing you to:

- Sign into **Word** with one Microsoft account
- Sign into **Excel** with a different Microsoft account
- Keep personal and work accounts separate

**To use multiple accounts:**

1. Launch different apps (Word, Excel, PowerPoint, etc.)
2. Sign into each with a different Microsoft account
3. Each app maintains its own session

**Note:** You cannot sign into the same app with multiple accounts simultaneously. To switch accounts in an app, sign out and sign back in.

### 6.5 Keyboard Shortcuts

M365 WebApps supports all standard Microsoft Office keyboard shortcuts:

**Common Shortcuts:**
- `Ctrl + S` - Save
- `Ctrl + O` - Open
- `Ctrl + N` - New document
- `Ctrl + P` - Print
- `Ctrl + Z` - Undo
- `Ctrl + Y` - Redo
- `Ctrl + C/V/X` - Copy/Paste/Cut

**App-Specific Shortcuts:**
- All keyboard shortcuts from Office 365 web apps work
- See Microsoft's official documentation for complete lists

**Desktop Shortcuts:**
- `Alt + Tab` - Switch between applications
- `Super + Q` (or `Alt + F4`) - Close application window

### 6.6 Offline Work

**Important:** Microsoft Office 365 web apps require an internet connection for full functionality. However:

**What works offline:**
- License validation (uses offline cryptographic verification)
- Previously opened/cached files (limited editing)
- Reading documents already loaded

**What requires internet:**
- Opening new files from OneDrive
- Saving files to OneDrive
- Real-time collaboration
- Accessing templates and online features
- Initial sign-in

**Best Practice:** Ensure you have an internet connection when working with Office apps. For true offline work, consider Microsoft's desktop Office suite (which can run on Linux via Wine).

---

## 7. Managing Your Account

### 7.1 Customer Portal

Access your customer portal to view your license information.

**URL:** https://ytech.tools/portal/

**Login Process:**

1. Visit the portal URL
2. Enter your email address
3. Click **"Send Magic Link"**
4. Check your email for the login link (valid for 24 hours)
5. Click the link to access your portal

**No passwords needed!** We use secure, time-limited magic links for authentication.

### 7.2 Viewing Your License

In the customer portal, you can see:

- **Plan Type**: Free, Pro, Team, or Enterprise
- **Status**: Active, Expired, or Revoked
- **Issued Date**: When your license was created
- **Expiration Date**: When your license expires
- **Devices Allowed**: Number of devices you can use
- **Subscription Status**: Active recurring or one-time

### 7.3 Managing Subscriptions

**To manage your subscription:**

1. Visit https://ytech.tools/m365/pricing.html
2. Scroll to **"Manage Your Billing"**
3. Enter your email or company name
4. Click **"Open Billing Portal"**

**Available Actions:**
- Update payment method
- View payment history
- Download invoices
- Cancel subscription
- Update billing address

### 7.4 Updating Payment Information

**If your payment fails:**

1. You'll receive an email notification
2. Click the link to update payment method
3. Or visit the billing portal manually
4. Stripe will retry the payment

**Grace Period:**
- Failed payments are retried for 3 days
- Your license remains active during this period
- After 3 failed attempts, subscription cancels

### 7.5 Canceling Your Subscription

**To cancel:**

1. Access the billing portal (see section 7.3)
2. Click **"Cancel Subscription"**
3. Confirm cancellation

**After Cancellation:**
- Your license remains active until the end of your current billing period
- No further charges will be made
- You can resubscribe at any time
- Your device registrations are preserved for 90 days

**No Refunds:**
- We do not offer refunds for partial months
- Try the free trial before purchasing if unsure

### 7.6 Downloading License Files

**If you lose your license files:**

1. Access the customer portal
2. Navigate to **"License Files"**
3. Click **"Download license.json"**
4. Click **"Download license.sig"**
5. Copy files to `~/.config/m365_webapps/`

**Or request via email:**
- Send request to ytechm365@gmail.com
- Include your registered email address
- We'll resend your license files

---

## 8. Troubleshooting

### 8.1 Installation Issues

#### Issue: "Package not found" during apt install

**Cause:** Repository not properly added

**Solution:**
```bash
# Re-add repository
echo "deb [trusted=yes] https://ytech.tools stable main" | sudo tee /etc/apt/sources.list.d/m365-compiled.list

# Update package lists
sudo apt update

# Try installation again
sudo apt install m365-compiled
```

#### Issue: "No compatible browser found"

**Cause:** No Chromium-based browser installed

**Solution:**
```bash
# Install Google Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb

# Or install Chromium
sudo apt install chromium-browser
```

#### Issue: Desktop launchers don't appear

**Cause:** Desktop database not refreshed

**Solution:**
```bash
# Re-run launcher installation
m365ctl -mode install

# Refresh desktop database
update-desktop-database ~/.local/share/applications/

# Logout and login again
```

### 8.2 License Activation Issues

#### Issue: "License validation failed"

**Possible Causes and Solutions:**

1. **Files in wrong location:**
   ```bash
   # Verify files exist
   ls ~/.config/m365_webapps/

   # Should show: license.json  license.sig
   ```

2. **Files corrupted during download:**
   - Re-download files from email
   - Or request resend via customer portal

3. **License expired:**
   ```bash
   # Check expiration
   cat ~/.config/m365_webapps/license.json | grep expires_at
   ```
   - If expired, renew subscription
   - New license files will be emailed

4. **Wrong license files:**
   - Ensure you're using files for YOUR email
   - License files are not transferable between accounts

#### Issue: "error:signature:invalid"

**Cause:** Signature doesn't match license

**Solution:**
```bash
# Download fresh files from customer portal
# Or request resend:
# Email ytechm365@gmail.com with your registered email
```

#### Issue: "Device limit reached" (Team plans)

**Cause:** You've registered 10 devices (Team plan limit)

**Solution:**
- Email ytechm365@gmail.com
- Specify which device(s) to remove
- Provide device fingerprint or hostname
- We'll remove old devices so you can register new ones

### 8.3 Application Issues

#### Issue: App window doesn't open

**Solution 1: Kill stuck processes**
```bash
# Kill any hung Office processes
pkill -f "chrome.*office"
pkill -f "m365-launch"

# Try launching again
m365-launch -app word
```

**Solution 2: Clear app cache**
```bash
# Remove app cache and profiles
rm -rf ~/.config/m365_webapps/profiles/

# Launch app again (will re-create profile)
m365-launch -app word
```

#### Issue: Can't sign in to Microsoft account

**Possible Causes:**

1. **Incorrect credentials:**
   - Verify email and password
   - Try signing in at office.com in regular browser

2. **Two-factor authentication:**
   - Complete 2FA challenge
   - Approve sign-in on Authenticator app

3. **Account locked:**
   - Visit account.microsoft.com
   - Follow Microsoft's unlock procedures

4. **Cookies blocked:**
   ```bash
   # Clear app profile
   rm -rf ~/.config/m365_webapps/profiles/word/

   # Try again
   m365-launch -app word
   ```

#### Issue: Files won't open

**Cause 1: OneDrive sync issue**
- Check internet connection
- Try opening from office.com directly
- Wait a few minutes for sync

**Cause 2: File permissions**
```bash
# Check file is readable
ls -l ~/path/to/file.docx

# Fix permissions if needed
chmod 644 ~/path/to/file.docx
```

#### Issue: App crashes or freezes

**Solution:**
```bash
# Enable debug logging
export M365_DEBUG=1

# Launch app
m365-launch -app word

# Check logs
cat ~/.config/m365_webapps/logs/m365-launch-word-*.log
```

Send logs to ytechm365@gmail.com for investigation.

### 8.4 Performance Issues

#### Issue: Apps are slow to start

**Causes:**
- Large browser cache
- Many browser extensions (if using existing profile)
- Low system resources

**Solutions:**

1. **Clear cache:**
   ```bash
   rm -rf ~/.config/m365_webapps/profiles/*/Cache/
   ```

2. **Close other applications:**
   - Free up RAM
   - Close unused browser tabs

3. **Check system resources:**
   ```bash
   free -h  # Check available RAM
   top      # Check CPU usage
   ```

#### Issue: High CPU usage

**Cause:** Multiple Office apps running simultaneously

**Solution:**
- Close apps you're not using
- Consider upgrading system RAM
- Reduce number of open documents

### 8.5 Email Delivery Issues

#### Issue: Not receiving license emails

**Check:**

1. **Spam/Junk folder:**
   - Look for emails from noreply@ytech.tools
   - Mark as "Not Spam" if found

2. **Email typo:**
   - Verify you entered correct email during signup
   - Check customer portal for registered email

3. **Email provider blocking:**
   - Some providers block automated emails
   - Try alternative email address
   - Contact ytechm365@gmail.com for manual send

#### Issue: Magic link not working

**Cause:** Link expired (24 hour limit)

**Solution:**
- Request a new magic link
- Check email timestamp
- Ensure clicking the link, not pasting (some email clients break links)

---

## 9. FAQ

### 9.1 General Questions

**Q: Do I need a Microsoft 365 subscription?**

A: Yes. M365 WebApps provides desktop integration for Linux, but you still need a Microsoft 365 subscription to access Office apps. Think of M365 WebApps as a "desktop launcher" for your existing Office 365 account.

**Q: Is this affiliated with Microsoft?**

A: No. M365 WebApps is an independent product by Ytech that provides desktop integration for Microsoft's Office 365 web apps. We are not affiliated with, endorsed by, or sponsored by Microsoft Corporation.

**Q: Can I use this without an internet connection?**

A: Partially. License validation works offline, but Office 365 web apps require internet connectivity for full functionality (opening files, saving to OneDrive, collaboration, etc.).

**Q: What browsers are supported?**

A: M365 WebApps requires a Chromium-based browser: Google Chrome, Chromium, or Microsoft Edge. Firefox and other browsers are not supported.

**Q: Is my data secure?**

A: Yes. Your Microsoft credentials and documents never pass through M365 WebApps servers. Authentication is directly with Microsoft, and files are stored in your OneDrive. M365 WebApps only provides the desktop integration layer.

### 9.2 Licensing Questions

**Q: Can I share my license with others?**

A: No. Licenses are tied to the purchaser's email address and cannot be shared or transferred.

**Q: Can I use one license on multiple devices?**

A:
- **Free & Pro**: 1 device only
- **Team**: Up to 10 devices
- **Enterprise**: Unlimited devices

**Q: What happens when my license expires?**

A: Apps will no longer validate the license and you won't be able to use M365 WebApps. Your Microsoft 365 account and files are unaffected - you can still access them via a regular browser.

**Q: Can I downgrade or upgrade my plan?**

A: Yes. Contact ytechm365@gmail.com to change plans. You'll receive a new license and can cancel the old subscription.

**Q: Do you offer student discounts?**

A: Not currently, but contact us at ytechm365@gmail.com to discuss educational pricing.

### 9.3 Technical Questions

**Q: Which Linux distributions are supported?**

A: Officially:
- Ubuntu 20.04 LTS and newer
- Debian 11 (Bullseye) and newer
- Derivatives (Linux Mint, Pop!_OS, etc.)

Other Debian-based distributions may work but are not officially supported.

**Q: Can I run this on ARM devices (like Raspberry Pi)?**

A: No. M365 WebApps currently only supports x86_64 (AMD64) architecture.

**Q: Does this work with Wayland?**

A: Yes. M365 WebApps works with both X11 and Wayland display servers.

**Q: Can I customize the desktop launchers?**

A: Yes. Desktop files are located in `~/.local/share/applications/`. You can edit them to change icons, names, or launch parameters. Note that running `m365ctl -mode install` will overwrite your customizations.

**Q: Where are my license files stored?**

A: License files are stored in `~/.config/m365_webapps/`:
- `license.json` - License details
- `license.sig` - Cryptographic signature

Keep these files secure and backed up.

**Q: How does device fingerprinting work?**

A: For Team and Enterprise plans, M365 WebApps generates a unique fingerprint based on:
- Hostname
- Username
- Hardware identifiers (CPU, motherboard)

This fingerprint is used to track device registrations. It changes if you reinstall your OS or change hardware.

### 9.4 Billing Questions

**Q: How do I get a receipt/invoice?**

A: Access the billing portal (see section 7.3) and click "Invoices". You can download PDF receipts for all payments.

**Q: What payment methods are accepted?**

A: We use Stripe for payments, which accepts:
- Credit cards (Visa, MasterCard, American Express, Discover)
- Debit cards
- Some regional payment methods

**Q: Can I pay annually?**

A: Currently only monthly subscriptions are available. Contact ytechm365@gmail.com if you'd like to discuss annual pricing.

**Q: Do you offer refunds?**

A: We do not offer refunds for partial months. Please try the free trial before purchasing. If you experience technical issues, contact support - we're happy to help troubleshoot.

**Q: Will prices increase?**

A: Current subscribers are locked into their plan price. Price changes only apply to new subscribers or those who cancel and resubscribe.

---

## 10. Getting Support

### 10.1 Self-Service Resources

Before contacting support, please try:

1. **Check this user guide** - Search for your issue above
2. **Review FAQ** - Common questions answered in section 9
3. **Check system logs**:
   ```bash
   # Enable debug logging
   export M365_DEBUG=1
   m365-launch -app word

   # View logs
   cat ~/.config/m365_webapps/logs/*.log
   ```

### 10.2 Contacting Support

**Email:** ytechm365@gmail.com

**When emailing, please include:**
1. **Subject line** describing the issue
2. **Your registered email address**
3. **Plan type** (Free, Pro, Team, Enterprise)
4. **Description of the problem**
5. **What you've already tried**
6. **Error messages** (if any)
7. **Debug logs** (optional but helpful)

**Example Email:**
```
Subject: License activation failing on Ubuntu 22.04

Hi,

I'm unable to activate my Pro license on Ubuntu 22.04.

Email: user@example.com
Plan: Pro

When I run the activation command, I get:
error:signature:invalid

I've tried:
- Re-downloading the license files
- Checking file permissions
- Verifying the files are in ~/.config/m365_webapps/

Please help!

Thanks
```

### 10.3 Response Times

We aim for:
- **Critical issues** (license activation, billing): 1 business day
- **Technical issues** (app problems, installation): 2-3 business days
- **General questions**: 3-5 business days

Support is provided via email Monday-Friday, 9 AM - 5 PM EST. No phone support is available.

### 10.4 Community Resources

While we don't have official forums, you may find these resources helpful:

- **Linux on Desktop subreddit**: r/linuxondesktop
- **Ubuntu Forums**: ubuntuforums.org
- **Debian User Forums**: forums.debian.net

**Note:** These are third-party communities. For official support, email ytechm365@gmail.com.

### 10.5 Feature Requests

We welcome feedback and feature requests!

**To suggest a feature:**
1. Email ytechm365@gmail.com
2. Subject: "Feature Request: [brief description]"
3. Explain:
   - What feature you'd like
   - Why it would be useful
   - Your use case

We read all suggestions and consider them for future updates.

### 10.6 Bug Reports

**Found a bug?** Please report it!

**Email:** ytechm365@gmail.com
**Subject:** Bug Report: [brief description]

**Include:**
1. Steps to reproduce the bug
2. Expected behavior
3. Actual behavior
4. System information (OS version, browser version)
5. Debug logs (if applicable)

**Example:**
```
Subject: Bug Report: Excel crashes when opening large spreadsheets

Steps to reproduce:
1. Launch Excel via m365-launch -app excel
2. Open a spreadsheet with 100,000+ rows
3. Excel window closes immediately

Expected: Excel should open the file
Actual: Window crashes

System: Ubuntu 22.04, Chrome 120.0.6099.109
Logs: Attached m365-launch-excel.log

Thanks!
```

---

## Appendix A: Command Reference

### m365-launch

**Purpose:** Launch Microsoft Office applications

**Usage:**
```bash
m365-launch -app <app_name> [-file <file_path>]
```

**Options:**
- `-app <app_name>` - Application to launch (required)
  - `word` - Microsoft Word
  - `excel` - Microsoft Excel
  - `powerpoint` - Microsoft PowerPoint
  - `outlook` - Microsoft Outlook
  - `onenote` - Microsoft OneNote
  - `teams` - Microsoft Teams
  - `onedrive` - Microsoft OneDrive

- `-file <file_path>` - Open specific file (optional)

**Examples:**
```bash
# Launch Word
m365-launch -app word

# Launch Excel with specific file
m365-launch -app excel -file ~/Documents/budget.xlsx

# Launch PowerPoint
m365-launch -app powerpoint
```

### m365-pro

**Purpose:** Validate license files

**Usage:**
```bash
m365-pro -feature picker -license <license_path> -sig <signature_path>
```

**Options:**
- `-feature picker` - Use license picker feature (required)
- `-license <path>` - Path to license.json
- `-sig <path>` - Path to license.sig

**Examples:**
```bash
# Validate license
m365-pro -feature picker \
  -license ~/.config/m365_webapps/license.json \
  -sig ~/.config/m365_webapps/license.sig

# Output: ok:pro:your@email.com
```

### m365ctl

**Purpose:** Control M365 WebApps installation

**Usage:**
```bash
m365ctl -mode <mode>
```

**Options:**
- `-mode install` - Install desktop launchers
- `-mode uninstall` - Remove desktop launchers

**Examples:**
```bash
# Install launchers
m365ctl -mode install

# Remove launchers
m365ctl -mode uninstall
```

---

## Appendix B: File Locations

### Configuration Files
```
~/.config/m365_webapps/license.json     # License file
~/.config/m365_webapps/license.sig      # License signature
```

### Browser Profiles
```
~/.config/m365_webapps/profiles/word/         # Word browser profile
~/.config/m365_webapps/profiles/excel/        # Excel browser profile
~/.config/m365_webapps/profiles/powerpoint/   # PowerPoint browser profile
~/.config/m365_webapps/profiles/outlook/      # Outlook browser profile
~/.config/m365_webapps/profiles/onenote/      # OneNote browser profile
~/.config/m365_webapps/profiles/teams/        # Teams browser profile
~/.config/m365_webapps/profiles/onedrive/     # OneDrive browser profile
```

### Desktop Launchers
```
~/.local/share/applications/microsoft-word.desktop
~/.local/share/applications/microsoft-excel.desktop
~/.local/share/applications/microsoft-powerpoint.desktop
~/.local/share/applications/microsoft-outlook.desktop
~/.local/share/applications/microsoft-onenote.desktop
~/.local/share/applications/microsoft-teams.desktop
~/.local/share/applications/microsoft-onedrive.desktop
```

### Log Files
```
~/.config/m365_webapps/logs/m365-launch-word-*.log
~/.config/m365_webapps/logs/m365-launch-excel-*.log
~/.config/m365_webapps/logs/m365-pro-*.log
```

---

## Appendix C: Uninstallation

### Complete Removal

To completely remove M365 WebApps from your system:

**Step 1: Remove Desktop Launchers**
```bash
m365ctl -mode uninstall
```

**Step 2: Uninstall Package**
```bash
sudo apt remove m365-compiled
```

**Step 3: Remove Configuration (Optional)**
```bash
# This deletes your license files and browser profiles
rm -rf ~/.config/m365_webapps/
```

**Step 4: Remove Repository (Optional)**
```bash
sudo rm /etc/apt/sources.list.d/m365-compiled.list
sudo apt update
```

### Keeping Your License

If you want to reinstall later, **do NOT** delete `~/.config/m365_webapps/`. This preserves your license files and device registration.

---

**Thank you for using M365 WebApps!**

For questions or support: ytechm365@gmail.com
Website: https://ytech.tools/m365/

*Document Version: 1.0.0*
*Last Updated: 2025-01-30*
