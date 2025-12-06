// API base URL - use api.ytech.tools for production, or same domain for local/direct access
const API_BASE = window.location.hostname === 'ytech.tools' ? 'https://api.ytech.tools' : '';

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
      // Free trial user: can upgrade to Pro, Team, or Enterprise
      upgradeBtn.href = `mailto:support@ytech.tools?subject=Upgrade from Free Trial&body=Hi,%0D%0A%0D%0AI would like to upgrade my M365 WebApps free trial to a paid plan.%0D%0A%0D%0ACurrent License Email: ${encodeURIComponent(data.email)}%0D%0ACurrent Plan: Free Trial%0D%0A%0D%0AInterested in:%0D%0A[ ] Pro ($18/year - 1 device)%0D%0A[ ] Team ($150/year - 10 devices)%0D%0A[ ] Enterprise (Contact for pricing - unlimited devices)%0D%0A%0D%0AThank you!`;
      upgradeBtn.textContent = '⬆️ Upgrade to Pro/Team/Enterprise';
      upgradeBtn.style.display = 'block';
    } else if (plan.includes('pro') && !plan.includes('enterprise')) {
      // Pro user: can upgrade to Team or Enterprise
      upgradeBtn.href = `mailto:support@ytech.tools?subject=License Upgrade Request - Current Plan: Pro&body=Hi,%0D%0A%0D%0AI would like to upgrade my M365 WebApps license from Pro to a higher tier.%0D%0A%0D%0ACurrent License Email: ${encodeURIComponent(data.email)}%0D%0ACurrent Plan: Pro%0D%0A%0D%0AInterested in:%0D%0A[ ] Team (up to 10 devices)%0D%0A[ ] Enterprise (unlimited devices)%0D%0A%0D%0AThank you!`;
      upgradeBtn.textContent = '⬆️ Upgrade to Team/Enterprise';
      upgradeBtn.style.display = 'block';
    } else if (plan.includes('team')) {
      // Team user: can upgrade to Enterprise
      upgradeBtn.href = `mailto:support@ytech.tools?subject=License Upgrade Request - Current Plan: Team&body=Hi,%0D%0A%0D%0AI would like to upgrade my M365 WebApps license from Team to Enterprise.%0D%0A%0D%0ACurrent License Email: ${encodeURIComponent(data.email)}%0D%0ACurrent Plan: Team%0D%0A%0D%0AThank you!`;
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
        <div class="member-email">${member.email}${roleBadge}</div>
        <div class="member-meta">Added by ${member.added_by} on ${addedDate}</div>
        <div class="member-meta">Last login: ${lastLogin}</div>
      </div>
      <div class="member-actions" id="actions-${member.email.replace('@', '-').replace('.', '-')}"></div>
    `;

    membersList.appendChild(card);

    // Add action buttons for admins
    if (currentTeamData.is_admin && member.email !== currentTeamData.primary_admin) {
      const actionsDiv = document.getElementById(`actions-${member.email.replace('@', '-').replace('.', '-')}`);

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

// Load dashboard on page load
loadDashboard();
loadTeamInfo();
