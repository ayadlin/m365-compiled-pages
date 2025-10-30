// API base URL - use api.ytech.tools for production, or same domain for local/direct access
const API_BASE = window.location.hostname === 'ytech.tools' ? 'https://api.ytech.tools' : '';

// Load brand logo
fetch('/brand.json').then(r => r.json()).then(b => {
  document.getElementById('logo').src = '/' + (b.logo || 'branding/logo.svg');

  // Apply brand colors
  if (b.colors) {
    document.documentElement.style.setProperty('--card-bg', b.colors.card);
    document.documentElement.style.setProperty('--accent', b.colors.accent);
    document.documentElement.style.setProperty('--muted', b.colors.muted);
  }
});

// Load license information
async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE}/api/portal/license-info`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
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

    // Hide loading, show content
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';

  } catch (error) {
    console.error('Dashboard load error:', error);
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
  }
}

// Download license files
document.getElementById('downloadBtn').addEventListener('click', async () => {
  try {
    const response = await fetch(`${API_BASE}/api/portal/download-license`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to download license');
    }

    const data = await response.json();

    // Create license.json file
    const licenseBlob = new Blob([data.license_json], { type: 'application/json' });
    const licenseUrl = URL.createObjectURL(licenseBlob);
    const licenseLink = document.createElement('a');
    licenseLink.href = licenseUrl;
    licenseLink.download = 'license.json';
    licenseLink.click();
    URL.revokeObjectURL(licenseUrl);

    // Create license.sig file
    const sigBlob = new Blob([data.signature], { type: 'text/plain' });
    const sigUrl = URL.createObjectURL(sigBlob);
    const sigLink = document.createElement('a');
    sigLink.href = sigUrl;
    sigLink.download = 'license.sig';
    sigLink.click();
    URL.revokeObjectURL(sigUrl);

    alert('License files downloaded! Check your Downloads folder for license.json and license.sig');

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
