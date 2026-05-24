// API base URL - use api.ytech.tools for production, or same domain for local/direct access
const API_BASE = window.location.hostname === 'ytech.tools' ? 'https://api.ytech.tools' : '';

// Escape user-controlled strings before interpolating into innerHTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

// Show admin link for logged-in admin users
(function checkAdminAccess() {
  const hasAdminAccess = document.cookie.split('; ').find(row => row.startsWith('admin_logged_in='));
  if (hasAdminAccess) {
    document.getElementById('admin-link').style.display = 'block';
  }
})();

// Load brand logo
fetch('/brand.json').then(r => r.json()).then(b => {
  document.getElementById('logo').src = '/' + (b.logo || 'branding/logo.svg');
  // Colors are now managed by CSS theme system (theme.css) for light/dark mode support
});

// Show message for users without an active license
function showNoLicenseMessage() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display = 'none';
  document.getElementById('dashboardContent').style.display = 'block';

  // Replace the license card content with upgrade message
  const licenseCard = document.querySelector('.dashboard-card');
  licenseCard.innerHTML = `
    <h2>🆓 Free Trial Account</h2>
    <div style="background: rgba(var(--muted-rgb), 0.1); border: 2px solid var(--muted); padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
      <p style="margin: 0 0 1rem 0; font-size: 1.1rem;">
        <strong>You currently have a free trial account.</strong>
      </p>
      <p style="margin: 0 0 1rem 0;">
        To access your license files and manage your account, you need to purchase a subscription plan.
      </p>
      <a href="/m365/pricing.html" class="btn btn-primary" style="display: inline-block; margin-top: 1rem;">
        📊 View Plans & Upgrade
      </a>
    </div>
    <p style="color: var(--muted); margin-top: 1.5rem;">
      Already purchased? It may take a few minutes for your account to activate. Try refreshing the page.
    </p>
  `;
}

// Load license information
async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE}/api/portal/license-info`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      // Check if it's a "no license found" error (free trial user)
      if (response.status === 404) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes('no active license')) {
          showNoLicenseMessage();
          return;
        }
      }
      throw new Error('Failed to load license info');
    }

    const data = await response.json();

    // Update UI with license data
    document.getElementById('licenseStatus').innerHTML =
      `<span class="status-badge status-${data.status}">${data.status.toUpperCase()}</span>`;
    document.getElementById('licensePlan').textContent = data.plan;
    document.getElementById('licenseDevices').textContent = data.max_devices;
    document.getElementById('licenseEmail').textContent = data.email;

    // Format expiry date
    const expiryDate = new Date(data.expires_at);
    document.getElementById('licenseExpiry').textContent = expiryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Show billing button if customer has Stripe billing
    if (data.has_billing) {
      document.getElementById('billingBtn').style.display = 'block';
    }

    // Show contextual upgrade button based on plan
    const upgradeBtn = document.getElementById('upgradeBtn');
    const plan = data.plan.toLowerCase();

    if (plan.includes('free') || plan.includes('trial')) {
      // Free trial user: can upgrade to any v2 paid tier
      upgradeBtn.href = `mailto:support@ytech.tools?subject=Upgrade from Free Trial&body=Hi,%0D%0A%0D%0AI would like to upgrade my M365 WebApps free trial to a paid v2 plan.%0D%0A%0D%0ACurrent License Email: ${encodeURIComponent(data.email)}%0D%0ACurrent Plan: Free Trial%0D%0A%0D%0AInterested in:%0D%0A[ ] Personal ($8/month or $79/year - 1 seat)%0D%0A[ ] Team ($59/month or $599/year - 5 seats)%0D%0A[ ] Business ($499/month or $5,090/year - 25 seats)%0D%0A[ ] Enterprise ($999/month or $10,190/year - unlimited seats)%0D%0A%0D%0AThank you!`;
      upgradeBtn.textContent = '⬆️ Upgrade to Personal/Team/Business/Enterprise';
      upgradeBtn.style.display = 'block';
    } else if (plan.includes('personal')) {
      // Personal user: can upgrade to Team, Business, or Enterprise
      upgradeBtn.href = `mailto:support@ytech.tools?subject=License Upgrade Request - Current Plan: Personal&body=Hi,%0D%0A%0D%0AI would like to upgrade my M365 WebApps license from Personal to a higher v2 tier.%0D%0A%0D%0ACurrent License Email: ${encodeURIComponent(data.email)}%0D%0ACurrent Plan: Personal%0D%0A%0D%0AInterested in:%0D%0A[ ] Team (5 seats)%0D%0A[ ] Business (25 seats)%0D%0A[ ] Enterprise (unlimited seats)%0D%0A%0D%0AThank you!`;
      upgradeBtn.textContent = '⬆️ Upgrade to Team/Business/Enterprise';
      upgradeBtn.style.display = 'block';
    } else if (plan.includes('team')) {
      // Team user: can upgrade to Business or Enterprise
      upgradeBtn.href = `mailto:support@ytech.tools?subject=License Upgrade Request - Current Plan: Team&body=Hi,%0D%0A%0D%0AI would like to upgrade my M365 WebApps license from Team to a higher v2 tier.%0D%0A%0D%0ACurrent License Email: ${encodeURIComponent(data.email)}%0D%0ACurrent Plan: Team%0D%0A%0D%0AInterested in:%0D%0A[ ] Business (25 seats)%0D%0A[ ] Enterprise (unlimited seats)%0D%0A%0D%0AThank you!`;
      upgradeBtn.textContent = '⬆️ Upgrade to Business/Enterprise';
      upgradeBtn.style.display = 'block';
    } else if (plan.includes('business')) {
      // Business user: can upgrade to Enterprise
      upgradeBtn.href = `mailto:support@ytech.tools?subject=License Upgrade Request - Current Plan: Business&body=Hi,%0D%0A%0D%0AI would like to upgrade my M365 WebApps license from Business to Enterprise.%0D%0A%0D%0ACurrent License Email: ${encodeURIComponent(data.email)}%0D%0ACurrent Plan: Business%0D%0A%0D%0AThank you!`;
      upgradeBtn.textContent = '⬆️ Upgrade to Enterprise';
      upgradeBtn.style.display = 'block';
    }
    // Enterprise users don't see the upgrade button (already on highest tier)

    // Hide loading, show content
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';

  } catch (error) {
    console.error('Dashboard load error:', error);
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
  }
}

// Download license files (as ZIP archive)
document.getElementById('downloadBtn').addEventListener('click', async () => {
  try {
    const response = await fetch(`${API_BASE}/api/portal/download-license`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to download license');
    }

    // Get ZIP file as blob
    const blob = await response.blob();

    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'm365-license.zip';
    if (contentDisposition) {
      const matches = /filename="([^"]+)"/.exec(contentDisposition);
      if (matches && matches[1]) {
        filename = matches[1];
      }
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    alert('License ZIP file downloaded! Extract it to get license.json and license.sig files.');

  } catch (error) {
    console.error('Download error:', error);
    alert('Failed to download license files. Please try again.');
  }
});

// Manage billing
document.getElementById('billingBtn').addEventListener('click', async () => {
  const btn = document.getElementById('billingBtn');
  btn.disabled = true;
  btn.textContent = 'Opening billing portal...';

  try {
    const response = await fetch(`${API_BASE}/api/portal/billing-session`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to create billing session');
    }

    const data = await response.json();
    window.location.href = data.url;

  } catch (error) {
    console.error('Billing error:', error);
    alert('Failed to open billing portal. Please try again.');
    btn.disabled = false;
    btn.textContent = '💳 Manage Billing';
  }
});

// Logout
document.getElementById('logoutLink').addEventListener('click', async (e) => {
  e.preventDefault();

  try {
    await fetch(`${API_BASE}/api/portal/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    window.location.href = '/portal/';
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = '/portal/';
  }
});

// Team management functions
let currentTeamData = null;

async function loadTeamInfo() {
  try {
    const response = await fetch(`${API_BASE}/api/portal/team/info`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      // Not a team account or no team found
      return;
    }

    currentTeamData = await response.json();

    // Show team card
    document.getElementById('teamCard').style.display = 'block';

    // Fill team info
    document.getElementById('teamCompany').textContent = currentTeamData.company_name;
    document.getElementById('teamPlan').textContent = currentTeamData.plan.toUpperCase();
    document.getElementById('teamAdmin').textContent = currentTeamData.primary_admin;

    // Render team members
    renderTeamMembers();

    // Show add member section for admins
    if (currentTeamData.is_admin) {
      document.getElementById('addMemberSection').style.display = 'block';
    }
  } catch (error) {
    console.error('Error loading team info:', error);
  }
}

function renderTeamMembers() {
  const membersList = document.getElementById('teamMembersList');
  membersList.innerHTML = '';

  if (!currentTeamData || !currentTeamData.members || currentTeamData.members.length === 0) {
    membersList.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 2rem;">No team members yet</p>';
    return;
  }

  currentTeamData.members.forEach(member => {
    const card = document.createElement('div');
    card.className = 'member-card';

    const roleClass = member.role === 'admin' ? 'role-admin' : 'role-member';
    const roleBadge = `<span class="role-badge ${roleClass}">${member.role.toUpperCase()}</span>`;

    const addedDate = new Date(member.added_at).toLocaleDateString();
    const lastLogin = member.last_login ? new Date(member.last_login).toLocaleDateString() : 'Never';

    card.innerHTML = `
      <div class="member-info">
        <div class="member-email">${escapeHtml(member.email)}${roleBadge}</div>
        <div class="member-meta">Added by ${escapeHtml(member.added_by)} on ${addedDate}</div>
        <div class="member-meta">Last login: ${lastLogin}</div>
      </div>
      <div class="member-actions"></div>
    `;

    membersList.appendChild(card);

    // Add action buttons for admins
    if (currentTeamData.is_admin && member.email !== currentTeamData.primary_admin) {
      const actionsDiv = card.querySelector('.member-actions');

      // Toggle role button
      const newRole = member.role === 'admin' ? 'member' : 'admin';
      const roleBtn = document.createElement('button');
      roleBtn.className = 'btn-sm btn-role';
      roleBtn.textContent = `Make ${newRole}`;
      roleBtn.onclick = () => updateMemberRole(member.email, newRole);
      actionsDiv.appendChild(roleBtn);

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-sm btn-danger';
      removeBtn.textContent = 'Remove';
      removeBtn.onclick = () => removeMember(member.email);
      actionsDiv.appendChild(removeBtn);
    }
  });
}

async function updateMemberRole(email, newRole) {
  if (!confirm(`Change ${email} to ${newRole}?`)) return;

  try {
    const response = await fetch(`${API_BASE}/api/portal/team/member/role`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_email: email, role: newRole }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update role');
    }

    // Reload team data
    await loadTeamInfo();
    alert(`Successfully changed ${email} to ${newRole}`);
  } catch (error) {
    alert('Error updating role: ' + error.message);
  }
}

async function removeMember(email) {
  if (!confirm(`Remove ${email} from the team?`)) return;

  try {
    const response = await fetch(`${API_BASE}/api/portal/team/member/remove`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_email: email }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to remove member');
    }

    // Reload team data
    await loadTeamInfo();
    alert(`Successfully removed ${email} from the team`);
  } catch (error) {
    alert('Error removing member: ' + error.message);
  }
}

// Add member handler
document.getElementById('addMemberBtn').addEventListener('click', async () => {
  const email = document.getElementById('newMemberEmail').value.trim();
  const role = document.getElementById('newMemberRole').value;
  const statusDiv = document.getElementById('addMemberStatus');
  const btn = document.getElementById('addMemberBtn');

  if (!email) {
    statusDiv.className = 'error-message';
    statusDiv.style.display = 'block';
    statusDiv.textContent = 'Please enter an email address';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Adding...';
  statusDiv.style.display = 'none';

  try {
    const response = await fetch(`${API_BASE}/api/portal/team/member/add`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_email: email, role: role }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add member');
    }

    // Clear form
    document.getElementById('newMemberEmail').value = '';
    document.getElementById('newMemberRole').value = 'member';

    // Show success
    statusDiv.className = 'success-message';
    statusDiv.style.display = 'block';
    statusDiv.textContent = `Successfully added ${email} as ${role}`;

    // Reload team data
    await loadTeamInfo();

    // Hide success message after 3 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  } catch (error) {
    statusDiv.className = 'error-message';
    statusDiv.style.display = 'block';
    statusDiv.textContent = 'Error: ' + error.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add';
  }
});

// Add-on management functions
let availableAddons = [];
let selectedAddons = new Set();

async function loadAddons(plan) {
  // Only show add-ons for paid M365 tiers
  const eligiblePlans = ['personal_v2', 'team_v2', 'business_v2', 'enterprise_v2', 'foundation', 'native', 'foundation-annual', 'native-annual'];
  if (!eligiblePlans.some(p => plan.toLowerCase().includes(p))) {
    return; // Not an eligible paid-plan user
  }

  // Show add-ons card
  document.getElementById('addonsCard').style.display = 'block';

  try {
    const response = await fetch(`${API_BASE}/api/portal/addons/available`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load add-ons');
    }

    const data = await response.json();
    availableAddons = data.available_addons || [];

    // Hide loading, show content
    document.getElementById('addonsLoading').style.display = 'none';

    if (availableAddons.length === 0) {
      document.getElementById('addonsContent').style.display = 'none';
      document.getElementById('addonsError').style.display = 'block';
      document.querySelector('#addonsError p').textContent = 'All add-on apps are already included in your license!';
      document.querySelector('#addonsError p').style.color = 'var(--accent)';
      return;
    }

    document.getElementById('addonsContent').style.display = 'block';
    renderAddons();
  } catch (error) {
    console.error('Error loading add-ons:', error);
    document.getElementById('addonsLoading').style.display = 'none';
    document.getElementById('addonsError').style.display = 'block';
  }
}

function renderAddons() {
  const addonsList = document.getElementById('addonsList');
  addonsList.innerHTML = '';

  availableAddons.forEach(addon => {
    const card = document.createElement('div');
    card.style.cssText = 'padding: 1rem; border: 2px solid rgba(255, 107, 53, 0.2); border-radius: 8px; margin-bottom: 1rem; display: flex; align-items: flex-start; gap: 1rem;';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `addon-${addon.id}`;
    checkbox.value = addon.id;
    checkbox.style.cssText = 'width: 20px; height: 20px; margin-top: 0.25rem; cursor: pointer;';
    checkbox.addEventListener('change', handleAddonToggle);

    const label = document.createElement('label');
    label.htmlFor = `addon-${addon.id}`;
    label.style.cssText = 'flex: 1; cursor: pointer;';

    // Show device breakdown if more than 1 device
    const priceDisplay = addon.devices_included > 1
      ? `$${addon.prorated_price_total.toFixed(2)} <span style="font-size: 0.85rem; color: var(--muted);">(${addon.devices_included} devices × $${addon.prorated_price_per_device.toFixed(2)})</span>`
      : `$${addon.prorated_price_total.toFixed(2)}`;

    label.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
        <span style="font-size: 1.5rem;">${addon.icon}</span>
        <span style="font-size: 1.1rem; font-weight: 600; color: var(--accent);">${addon.name}</span>
        <span style="font-size: 1rem; color: var(--accent); font-weight: 600; margin-left: auto;">
          ${priceDisplay}
        </span>
      </div>
      <div style="color: var(--muted); font-size: 0.9rem;">${addon.description}</div>
    `;

    card.appendChild(checkbox);
    card.appendChild(label);
    addonsList.appendChild(card);
  });
}

function handleAddonToggle(event) {
  const addonId = event.target.value;

  if (event.target.checked) {
    selectedAddons.add(addonId);
  } else {
    selectedAddons.delete(addonId);
  }

  updateAddonSummary();
}

function updateAddonSummary() {
  const selectedCount = selectedAddons.size;
  const totalPrice = availableAddons
    .filter(addon => selectedAddons.has(addon.id))
    .reduce((sum, addon) => sum + addon.prorated_price_total, 0);

  document.getElementById('selectedCount').textContent = selectedCount;
  document.getElementById('totalPrice').textContent = totalPrice.toFixed(2);

  const purchaseBtn = document.getElementById('purchaseAddonsBtn');
  purchaseBtn.disabled = selectedCount === 0;
}

// Purchase add-ons handler
document.getElementById('purchaseAddonsBtn').addEventListener('click', async () => {
  if (selectedAddons.size === 0) {
    alert('Please select at least one add-on to purchase');
    return;
  }

  const btn = document.getElementById('purchaseAddonsBtn');
  btn.disabled = true;
  btn.textContent = 'Creating checkout...';

  try {
    const response = await fetch(`${API_BASE}/api/portal/addons/checkout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addon_ids: Array.from(selectedAddons),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create checkout session');
    }

    const data = await response.json();

    // Redirect to Stripe checkout
    window.location.href = data.checkout_url;

  } catch (error) {
    console.error('Checkout error:', error);
    alert('Failed to create checkout session: ' + error.message);
    btn.disabled = false;
    btn.textContent = '💳 Purchase Add-ons';
  }
});

// Load dashboard on page load
loadDashboard().then(() => {
  // After loading license info, check if we should load add-ons
  const plan = document.getElementById('licensePlan').textContent;
  if (plan && plan !== '-') {
    loadAddons(plan);
  }
});
loadTeamInfo();
