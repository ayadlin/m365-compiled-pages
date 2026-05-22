# M365 WebApps - Quick Start Guide

**Get Microsoft Office running on Linux in 5 minutes**

---

## What You'll Need

- Ubuntu/Debian-based Linux distribution
- Google Chrome, Chromium, or Microsoft Edge browser
- Microsoft 365 account
- Internet connection

---

## Step 1: Install M365 WebApps

Open a terminal and run these commands:

```bash
# Add repository
echo "deb [trusted=yes] https://ytech.tools stable main" | sudo tee /etc/apt/sources.list.d/m365-compiled.list

# Install package
sudo apt update && sudo apt install m365-compiled

# Install desktop launchers
m365ctl -mode install
```

**Done!** You should now see Microsoft Office apps in your application menu.

---

## Step 2: Get Your License

### Option A: Free Trial (30 Days)

1. Visit: https://ytech.tools/m365/trial.html
2. Enter your name and email
3. Click **"Generate Free Trial License"**
4. Check your email for two files:
   - `license.json`
   - `license.sig`

### Option B: Purchase a Plan

1. Visit: https://ytech.tools/m365/pricing.html
2. Choose your plan:
   - **Personal**: $8/mo or $79/yr (1 seat)
   - **Team**: $59/mo or $599/yr (5 seats)
   - **Business**: $499/mo or $5,090/yr (25 seats; SCIM + SSO + audit)
   - **Enterprise**: $999/mo or $10,190/yr (up to 500 seats; white-label + Acrobat included)
3. Complete checkout with Stripe
4. Check your email for license files

---

## Step 3: Activate Your License

Copy your license files to the config directory:

```bash
# Create config directory
mkdir -p ~/.config/m365_webapps

# Copy license files (adjust path if needed)
cp ~/Downloads/license.json ~/.config/m365_webapps/
cp ~/Downloads/license.sig ~/.config/m365_webapps/

# Verify activation
m365-pro -feature picker \
  -license ~/.config/m365_webapps/license.json \
  -sig ~/.config/m365_webapps/license.sig
```

**Expected output:** `ok:pro:your@email.com` ✓

---

## Step 4: Launch and Use

### Launch from Application Menu

1. Click your application menu (Activities, Start, etc.)
2. Search for "Microsoft Word" (or Excel, PowerPoint, etc.)
3. Click to launch

### Or launch from terminal:

```bash
# Launch Word
m365-launch -app word

# Launch Excel
m365-launch -app excel

# Launch PowerPoint
m365-launch -app powerpoint

# Other apps: outlook, onenote, teams, onedrive
```

### First-Time Sign In

1. Microsoft login page will appear
2. Sign in with your Microsoft 365 account
3. Start working!

---

## That's It!

You're now running Microsoft Office on Linux.

### Available Apps

- 📝 Microsoft Word
- 📊 Microsoft Excel
- 📈 Microsoft PowerPoint
- 📧 Microsoft Outlook
- 📔 Microsoft OneNote
- 💬 Microsoft Teams
- ☁️ Microsoft OneDrive

### Quick Tips

**Opening Files:**
- Right-click a `.docx`, `.xlsx`, or `.pptx` file
- Select "Open With" → "Microsoft Word/Excel/PowerPoint"

**Saving Files:**
- Save to OneDrive for automatic sync
- Or File → Download for local copy

**Multiple Accounts:**
- Each app uses its own isolated profile
- Sign into Word with one account, Excel with another

---

## Need Help?

### Common Issues

**"No compatible browser found"**
```bash
# Install Chrome
sudo apt install google-chrome-stable
```

**Desktop launchers missing**
```bash
# Reinstall launchers
m365ctl -mode install
```

**License validation fails**
```bash
# Check files are in the right place
ls ~/.config/m365_webapps/
# Should show: license.json  license.sig
```

### Get Support

**Full Documentation:** See `docs/USER_GUIDE.md` for comprehensive guide

**Website:** https://ytech.tools/m365/

---

## Managing Your Account

### Access Customer Portal

1. Visit: https://ytech.tools/portal/
2. Enter your email
3. Click the magic link sent to your email
4. View license status, download files, etc.

### Manage Billing

1. Visit: https://ytech.tools/m365/pricing.html
2. Scroll to "Manage Your Billing"
3. Enter your email
4. Update payment, view invoices, cancel subscription

---

## Uninstalling

To remove M365 WebApps:

```bash
# Remove desktop launchers
m365ctl -mode uninstall

# Uninstall package
sudo apt remove m365-compiled

# (Optional) Remove config and license files
rm -rf ~/.config/m365_webapps/
```

---

## Upgrading Your Plan

Contact support@ytech.tools to switch between Free Trial, Pro, Team, or Enterprise plans.

---

**Questions?** Contact support@ytech.tools

**Full Documentation:** `docs/USER_GUIDE.md`

**Version:** 1.0.1 | **Updated:** 2025-12-08
